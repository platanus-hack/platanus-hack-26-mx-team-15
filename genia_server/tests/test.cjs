/**
 * test.cjs — Prueba local del endpoint POST /inyeccion/crear-dashboard
 *
 * Uso desde la terminal:
 *   set API_URL=http://localhost:3000
 *   set TEST_EMAIL=tu@correo.com
 *   set TEST_PASSWORD=tu_password
 *   node tests/test.cjs tests/payload-gimnasio.json
 *
 * O en una sola línea (PowerShell):
 *   $env:API_URL="http://localhost:3000"; $env:TEST_EMAIL="tu@correo.com"; $env:TEST_PASSWORD="tu_password"; node tests/test.cjs tests/payload-gimnasio.json
 */

const fs = require("fs");

// ── Configuración ────────────────────────────────────────────────────────────
const API_URL = process.env.API_URL || "http://localhost:3000";
const EMAIL   = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;

// ── Colores ANSI para terminal ───────────────────────────────────────────────
const c = {
    reset:   "\x1b[0m",
    bold:    "\x1b[1m",
    dim:     "\x1b[2m",
    red:     "\x1b[31m",
    green:   "\x1b[32m",
    yellow:  "\x1b[33m",
    blue:    "\x1b[34m",
    magenta: "\x1b[35m",
    cyan:    "\x1b[36m",
    gray:    "\x1b[90m"
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function log(tag, msg) {
    console.log(`${c.dim}[${tag}]${c.reset} ${msg}`);
}

function ok(msg) {
    console.log(`${c.green}✓${c.reset} ${msg}`);
}

function fail(msg) {
    console.log(`${c.red}✗${c.reset} ${msg}`);
}

function warn(msg) {
    console.log(`${c.yellow}⚠${c.reset} ${msg}`);
}

function hr() {
    console.log(c.dim + "─".repeat(60) + c.reset);
}

// ── HTTP helpers (fetch nativo de Node 18+) ──────────────────────────────────
async function login(email, password) {
    const url = `${API_URL}/usuario/login`;
    log("REQ", `POST ${url}`);
    log("BODY", JSON.stringify({ email, password: "***" }));

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
        const body = await res.json();
        throw new Error(`Login falló (${res.status}): ${body.message || body.error || JSON.stringify(body)}`);
    }

    const json = await res.json();
    const token = json.session?.access_token;

    if (!token) {
        throw new Error("Login exitoso pero no se recibió access_token en la respuesta");
    }

    ok(`Login exitoso — usuario: ${json.user?.email || email}`);
    return token;
}

async function inyectarDashboard(token, payload) {
    const url = `${API_URL}/inyeccion/crear-dashboard`;
    const body = JSON.stringify(payload);

    log("REQ", `POST ${url}`);
    log("SIZE", `${(Buffer.byteLength(body) / 1024).toFixed(1)} KB`);

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body
    });

    const json = await res.json();

    if (!res.ok) {
        throw new Error(`Inyección falló (${res.status}): ${json.error || json.message || JSON.stringify(json)}`);
    }

    return json;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log();
    console.log(`${c.cyan}${c.bold}🧪 Test — Inyección de Dashboard vía IA${c.reset}`);
    console.log(`${c.dim}API: ${API_URL}${c.reset}`);
    hr();

    // Validar argumentos
    const payloadFile = process.argv[2];
    if (!payloadFile) {
        console.log(`${c.red}Uso: node test.cjs <payload.json>${c.reset}`);
        console.log(`Ejemplo: node tests/test.cjs tests/payload-gimnasio.json`);
        process.exit(1);
    }

    if (!EMAIL || !PASSWORD) {
        console.log(`${c.red}Faltan variables de entorno:${c.reset}`);
        console.log(`  ${c.yellow}TEST_EMAIL${c.reset}    — email de la cuenta de prueba`);
        console.log(`  ${c.yellow}TEST_PASSWORD${c.reset} — contraseña de la cuenta de prueba`);
        console.log();
        process.exit(1);
    }

    // Leer payload
    log("FILE", payloadFile);
    let payload;
    try {
        const raw = fs.readFileSync(payloadFile, "utf8");
        payload = JSON.parse(raw);
    } catch (err) {
        fail(`No se pudo leer/parsear ${payloadFile}: ${err.message}`);
        process.exit(1);
    }

    const tablasCount = payload.tablas?.length || 0;
    const columnasCount = payload.tablas?.reduce((s, t) => s + (t.columnas?.length || 0), 0) || 0;
    const filasCount = payload.tablas?.reduce((s, t) => s + (t.filas?.length || 0), 0) || 0;
    const relCount = payload.tablas?.reduce((s, t) => s + (t.relaciones?.length || 0), 0) || 0;
    const estilosCount = payload.estilos?.length || 0;

    console.log();
    console.log(`${c.bold}Payload cargado:${c.reset}`);
    console.log(`  Dashboard : ${c.cyan}${payload.dashboard?.nombre || "?"}${c.reset}`);
    console.log(`  Estilos   : ${estilosCount}`);
    console.log(`  Tablas    : ${tablasCount}`);
    console.log(`  Columnas  : ${columnasCount}`);
    console.log(`  Filas     : ${filasCount}`);
    console.log(`  Relaciones: ${relCount}`);
    hr();

    try {
        // 1. Login
        console.log(`${c.bold}Fase 1/2 — Autenticación${c.reset}`);
        const token = await login(EMAIL, PASSWORD);
        hr();

        // 2. Inyectar
        console.log(`${c.bold}Fase 2/2 — Inyección del Dashboard${c.reset}`);
        const resultado = await inyectarDashboard(token, payload);
        hr();

        // Mostrar resultado
        console.log(`${c.bold}Respuesta del servidor:${c.reset}`);
        console.log(JSON.stringify(resultado, null, 2));
        hr();

        // Resumen
        const r = resultado.resumen || {};
        console.log();
        if (resultado.ok) {
            ok("Dashboard creado exitosamente");
            console.log();
            console.log(`${c.bold}Resumen de inserción:${c.reset}`);
            console.log(`  Dashboard        : ${c.green}${r.dashboard_id || "?"}${c.reset}`);
            console.log(`  Estilos          : ${c.green}${r.estilos_insertados || 0}${c.reset}`);
            console.log(`  Tablas           : ${c.green}${r.tablas_insertadas || 0}${c.reset}`);
            console.log(`  Columnas         : ${c.green}${r.columnas_insertadas || 0}${c.reset}`);
            console.log(`  Filas            : ${c.green}${r.filas_insertadas || 0}${c.reset}`);
            console.log(`  Relaciones       : ${c.green}${r.relaciones_insertadas || 0}${c.reset}`);

            const totalEsperado = estilosCount + tablasCount + columnasCount + filasCount + relCount;
            const totalInsertado =
                (r.estilos_insertados || 0) +
                (r.tablas_insertadas || 0) +
                (r.columnas_insertadas || 0) +
                (r.filas_insertadas || 0) +
                (r.relaciones_insertadas || 0);

            console.log();
            console.log(`  Total insertado  : ${c.cyan}${totalInsertado}${c.reset} / ${c.dim}${totalEsperado} esperados${c.reset}`);

            if (resultado.errores?.length) {
                console.log();
                warn(`${resultado.errores.length} advertencia(s):`);
                for (const e of resultado.errores) {
                    console.log(`  ${c.yellow}⚠${c.reset} [${e.entidad}] ${e.nombre}: ${e.error}`);
                }
            }
        } else {
            fail(`La API respondió ok=false: ${resultado.error || "error desconocido"}`);
        }
        console.log();

    } catch (err) {
        fail(err.message);
        console.log();
        process.exit(1);
    }
}

main();
