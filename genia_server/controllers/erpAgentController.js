import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 8000;
const TIMEOUT_MS = 180_000; // 180s de margen total (el streaming evita el corte de conexión)

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------
function construirSystemPrompt() {
  return `Eres un consultor de sistemas especializado en diseñar ERPs a medida para PyMEs. A partir de las respuestas de un formulario que el cliente llenó sobre su negocio, debes generar (1) un análisis del negocio, (2) un diseño de base de datos a alto nivel, y (3) mockups HTML navegables de las pantallas principales del sistema.

Las respuestas del formulario te llegarán en el mensaje del usuario, en formato JSON.

<razonamiento_interno>
Antes de generar el JSON, analiza en silencio:
1. NEGOCIO: ¿Qué tipo de negocio es? ¿Qué módulos necesita (inventario, ventas, citas, clientes, etc.)?
2. ROLES: ¿Qué roles de usuario existen (admin, vendedor, cliente, etc.) y qué puede hacer cada uno?
3. DATOS: ¿Qué entidades/tablas necesita el sistema para funcionar?
4. PANTALLAS: ¿Cuáles son las pantallas clave que el usuario necesita ver (dashboard, listado, formulario, detalle)?
5. UX: ¿Qué tono visual y colores corresponden al giro del negocio?
No escribas este análisis en la respuesta. Solo úsalo internamente.
</razonamiento_interno>

Genera ÚNICAMENTE el siguiente objeto JSON (sin markdown, sin backticks, sin texto antes ni después):

{
  "analisis": {
    "tipo_negocio": "string — giro del negocio, ej: 'Restaurante', 'Tienda de ropa'",
    "resumen": "string — 2-3 oraciones resumiendo el negocio y lo que el sistema resolverá",
    "modulos_detectados": ["string — ej: 'Inventario', 'Ventas', 'Clientes'"],
    "roles": [
      {
        "nombre": "string — ej: 'Administrador'",
        "permisos": ["string — ej: 'Crear productos', 'Ver reportes'"]
      }
    ]
  },

  "base_de_datos": {
    "tablas": [
      {
        "nombre": "string — snake_case, ej: 'productos'",
        "campos": ["string — nombre de cada columna relevante, ej: 'nombre', 'precio', 'stock'"]
      }
    ]
  },

  "pantallas": [
    {
      "nombre": "string — nombre corto de la pantalla, ej: 'Dashboard', 'Listado de productos'",
      "mockup_html": "string — documento HTML COMPLETO y autocontenido (incluye <style> inline, sin dependencias externas) que representa visualmente esa pantalla con datos de ejemplo realistas"
    }
  ],

  "pregunta_confirmacion": "string — una pregunta breve para el cliente confirmando si este diseño refleja lo que necesita"
}

<reglas>
R1. Genera entre 3 y 6 pantallas que cubran el flujo principal del negocio (ej: dashboard, listado, formulario de alta, detalle).
R2. Cada "mockup_html" debe ser HTML válido y autocontenido: incluye su propio <style> con colores, tipografía y layout. No uses CDNs ni imágenes externas (usa SVGs inline o emojis si necesitas iconos).
R3. El diseño visual de los mockups debe reflejar el giro del negocio inferido en "analisis.tipo_negocio" (paleta de colores, tono).
R4. Usa datos de ejemplo realistas y coherentes con el negocio (nombres de productos, precios en MXN, etc.), no placeholders genéricos tipo "Lorem ipsum".
R5. "base_de_datos.tablas" debe reflejar entidades reales necesarias para el negocio, no inventes tablas sin relación con las respuestas del formulario.
R6. No inventes módulos o roles que no tengan respaldo en las respuestas del formulario.
R7. Responde SOLO con el objeto JSON. Cero caracteres antes o después (sin markdown, sin backticks).
R8. El JSON debe ser válido: sin comas finales, sin comillas sin escapar dentro de los strings de "mockup_html" (recuerda escapar comillas dobles internas con \\").
</reglas>

<verificacion_pre_salida>
Antes de responder, confirma en silencio:
□ El JSON tiene las 4 claves de nivel superior: analisis, base_de_datos, pantallas, pregunta_confirmacion
□ Cada pantalla en "pantallas" trae "nombre" y "mockup_html"
□ Cada "mockup_html" es HTML autocontenido y válido, sin dependencias externas
□ El JSON completo es válido (parseable con JSON.parse)
Si algún punto falla, corrígelo antes de responder.
</verificacion_pre_salida>`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extrae el primer bloque JSON válido de un texto, tolerando fences de markdown o texto extra. */
function extraerJson(texto) {
  let limpio = texto.replace(/```json/gi, '').replace(/```/g, '').trim();

  // Si el modelo agregó algo antes/después del objeto, recortamos al primer { y al último }
  const inicio = limpio.indexOf('{');
  const fin = limpio.lastIndexOf('}');
  if (inicio !== -1 && fin !== -1 && fin > inicio) {
    limpio = limpio.slice(inicio, fin + 1);
  }

  return JSON.parse(limpio);
}

function validarResultado(resultado) {
  if (!resultado || typeof resultado !== 'object') throw new Error('La respuesta no es un objeto.');
  if (!resultado.analisis) throw new Error('Falta "analisis" en la respuesta.');
  if (!Array.isArray(resultado.pantallas) || resultado.pantallas.length === 0) {
    throw new Error('Falta "pantallas" o está vacío en la respuesta.');
  }
  resultado.pantallas.forEach((p, i) => {
    if (!p.mockup_html) throw new Error(`La pantalla #${i} ("${p.nombre || 'sin nombre'}") no trae mockup_html.`);
  });
}

function escapeHtml(str = '') {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(str = '') {
  return escapeHtml(str).replace(/"/g, '&quot;');
}

/** Construye un único HTML con sidebar de navegación + todos los mockups en iframes aislados. */
export const construirHtmlUnificado = (resultado) => {
  const { analisis, base_de_datos, pantallas, pregunta_confirmacion } = resultado;

  const navItems = pantallas
    .map((p, i) => `<li class="nav-item${i === 0 ? ' active' : ''}" data-index="${i}">${escapeHtml(p.nombre)}</li>`)
    .join('\n');

  const iframes = pantallas
    .map(
      (p, i) =>
        `<iframe class="mockup-frame${i === 0 ? ' active' : ''}" data-index="${i}" srcdoc="${escapeAttr(p.mockup_html)}"></iframe>`
    )
    .join('\n');

  const modulosBadges = (analisis.modulos_detectados || []).map((m) => `<span class="badge">${escapeHtml(m)}</span>`).join(' ');
  const rolesList = (analisis.roles || [])
    .map((r) => `<li><strong>${escapeHtml(r.nombre)}</strong>: ${escapeHtml((r.permisos || []).join(', '))}</li>`)
    .join('\n');
  const tablasList = (base_de_datos?.tablas || [])
    .map((t) => `<li>${escapeHtml(t.nombre)} <span class="muted">(${(t.campos || []).length} campos)</span></li>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Preview del sistema generado</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, Segoe UI, Roboto, sans-serif; display: flex; height: 100vh; background: #0f172a; }
  #sidebar { width: 280px; background: #111827; color: #e5e7eb; overflow-y: auto; flex-shrink: 0; }
  #sidebar h2 { font-size: 14px; text-transform: uppercase; color: #9ca3af; padding: 16px 16px 4px; margin: 0; }
  #sidebar .resumen { padding: 0 16px 16px; font-size: 13px; line-height: 1.5; border-bottom: 1px solid #1f2937; }
  .badge { display: inline-block; background: #2563eb; color: white; font-size: 11px; padding: 2px 8px; border-radius: 10px; margin: 2px 2px 0 0; }
  #sidebar ul.nav-list { list-style: none; margin: 0; padding: 8px 0; border-bottom: 1px solid #1f2937; }
  .nav-item { padding: 10px 16px; cursor: pointer; font-size: 14px; }
  .nav-item:hover { background: #1f2937; }
  .nav-item.active { background: #2563eb; color: white; }
  .info-block { padding: 12px 16px; font-size: 12px; }
  .info-block h3 { font-size: 12px; color: #9ca3af; margin: 0 0 6px; text-transform: uppercase; }
  .info-block ul { margin: 0; padding-left: 16px; }
  .muted { color: #9ca3af; }
  #main { flex: 1; display: flex; flex-direction: column; background: #f3f4f6; }
  #confirmacion { background: #ecfdf5; border-bottom: 1px solid #a7f3d0; padding: 12px 20px; font-size: 14px; color: #065f46; }
  #viewport { flex: 1; position: relative; }
  .mockup-frame { position: absolute; inset: 0; width: 100%; height: 100%; border: none; display: none; background: white; }
  .mockup-frame.active { display: block; }
</style>
</head>
<body>
  <div id="sidebar">
    <h2>Análisis del negocio</h2>
    <div class="resumen">
      <strong>${escapeHtml(analisis.tipo_negocio || '')}</strong><br/>
      ${escapeHtml(analisis.resumen || '')}
      <div style="margin-top:8px;">${modulosBadges}</div>
    </div>
    <ul class="nav-list">${navItems}</ul>
    <div class="info-block"><h3>Roles (${(analisis.roles || []).length})</h3><ul>${rolesList}</ul></div>
    <div class="info-block"><h3>Tablas (${(base_de_datos?.tablas || []).length})</h3><ul>${tablasList}</ul></div>
  </div>
  <div id="main">
    <div id="confirmacion">${escapeHtml(pregunta_confirmacion || '')}</div>
    <div id="viewport">${iframes}</div>
  </div>
  <script>
    document.querySelectorAll('.nav-item').forEach((item) => {
      item.addEventListener('click', () => {
        const index = item.getAttribute('data-index');
        document.querySelectorAll('.nav-item').forEach((el) => el.classList.remove('active'));
        document.querySelectorAll('.mockup-frame').forEach((el) => el.classList.remove('active'));
        item.classList.add('active');
        document.querySelector('.mockup-frame[data-index="' + index + '"]').classList.add('active');
      });
    });
  </script>
</body>
</html>`;
}

function paginaError(titulo, detalle) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Error</title>
  <style>body{font-family:sans-serif;background:#fef2f2;color:#991b1b;padding:40px;}h1{margin-top:0;}pre{background:#fff;padding:12px;border-radius:6px;white-space:pre-wrap;}</style>
  </head><body><h1>${escapeHtml(titulo)}</h1><pre>${escapeHtml(detalle)}</pre></body></html>`;
}

/** Llama a Claude usando streaming (evita que proxies/conexiones corten respuestas largas),
 *  con reintentos automáticos si la conexión se cae a medio camino (ej. "Premature close",
 *  típico de proxies/firewalls de red que cortan conexiones largas). */
async function llamarClaude(formulario, intento = 1) {
  const MAX_INTENTOS = 3;

  try {
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: construirSystemPrompt(),
      messages: [
        {
          role: 'user',
          content: `Respuestas del formulario:\n\n${JSON.stringify(formulario, null, 2)}\n\nGenera el análisis y los mockups según las instrucciones.`,
        },
      ],
    });

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout: el agente no respondió en ${TIMEOUT_MS / 1000}s.`)), TIMEOUT_MS)
    );

    return await Promise.race([stream.finalMessage(), timeout]);
  } catch (err) {
    const esErrorDeConexion =
      /premature close|fetch failed|ECONNRESET|socket hang up|terminated/i.test(err.message || '');

    if (esErrorDeConexion && intento < MAX_INTENTOS) {
      console.warn(`[llamarClaude] Conexión cortada (intento ${intento}/${MAX_INTENTOS}), reintentando en 2s...`);
      await new Promise((r) => setTimeout(r, 2000));
      return llamarClaude(formulario, intento + 1);
    }
    throw err;
  }
}

async function procesarFormulario(formulario) {
  if (!formulario || typeof formulario !== 'object') {
    throw Object.assign(new Error('El cuerpo de la petición debe ser un JSON.'), { status: 400 });
  }
  if (!formulario.tipo_negocio) {
    throw Object.assign(new Error('El formulario debe incluir al menos "tipo_negocio".'), { status: 400 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    throw Object.assign(new Error('Falta configurar ANTHROPIC_API_KEY en el entorno (.env).'), { status: 500 });
  }

  let message;
  try {
    message = await llamarClaude(formulario);
  } catch (err) {
    throw Object.assign(new Error(`Error al llamar al agente: ${err.message}`), { status: 502 });
  }

  const respuestaTexto = message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');

  let resultado;
  try {
    resultado = extraerJson(respuestaTexto);
    validarResultado(resultado);
  } catch (err) {
    const error = new Error(`El agente no devolvió un JSON válido: ${err.message}`);
    error.status = 502;
    error.raw = respuestaTexto;
    throw error;
  }

  return resultado;
}

// ---------------------------------------------------------------------------
// Controladores (handlers de Express)
// ---------------------------------------------------------------------------

/** Devuelve JSON con analisis + base_de_datos + pantallas + preview_html. */
export const generarERPController = async (req, res) => {
  try {
    const resultado = await procesarFormulario(req.body);
    const previewHtml = construirHtmlUnificado(resultado);
    return res.status(200).json({ success: true, data: resultado, preview_html: previewHtml });
  } catch (error) {
    console.error('[generarERPController]', error);
    return res.status(error.status || 500).json({
      success: false,
      error: error.message,
      raw: error.raw, // solo presente si fue un error de parseo, ayuda a depurar
    });
  }
}

/** Devuelve directamente el HTML (Content-Type text/html), listo para el navegador. */
export const generarERPPreviewController = async (req, res) => {
  try {
    const resultado = await procesarFormulario(req.body);
    const html = construirHtmlUnificado(resultado);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (error) {
    console.error('[generarERPPreviewController]', error);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(error.status || 500).send(paginaError('Error al generar el preview', error.message + (error.raw ? `\n\n--- Respuesta cruda del agente ---\n${error.raw}` : '')));
  }
}