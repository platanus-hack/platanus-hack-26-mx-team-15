'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, CheckCircle, XCircle, Loader2, AlertCircle, Sparkles } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

interface PendingPreview {
  preview_html: string | null;
  pregunta_confirmacion: string;
  analisis: {
    tipo_negocio?: string;
    resumen?: string;
    modulos_detectados?: string[];
    roles?: { nombre: string; permisos: string[] }[];
  };
  nombre_negocio: string;
}

interface InyeccionPayload {
  dashboard: {
    nombre: string;
    idioma: string;
    moneda: string;
    zona_horaria: string;
    formato_fecha: string;
  };
  estilos: unknown[];
  tablas: unknown[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────────

export default function MockupPreviewPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [preview, setPreview] = useState<PendingPreview | null>(null);
  const [payload, setPayload] = useState<InyeccionPayload | null>(null);
  const [isLightMode, setIsLightMode] = useState(false);

  // Estados de aprobación
  const [aprobando, setAprobando] = useState(false);
  const [aprobado, setAprobado] = useState(false);
  const [errorAprobacion, setErrorAprobacion] = useState<string | null>(null);

  // ── Mount + cargar datos de localStorage ──────────────────────────────────
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') ?? 'dark';
    setIsLightMode(savedTheme === 'light');

    // Verificar auth
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) {
      router.replace('/');
      return;
    }

    // Leer datos pendientes generados por el wizard
    try {
      const previewStr = localStorage.getItem('pendingERPPreview');
      const payloadStr = localStorage.getItem('pendingInyeccionPayload');

      if (!previewStr || !payloadStr) {
        // Si no hay datos pendientes, volver al wizard
        router.replace('/proyectos/nuevo');
        return;
      }

      setPreview(JSON.parse(previewStr));
      setPayload(JSON.parse(payloadStr));
    } catch {
      router.replace('/proyectos/nuevo');
    }
  }, [router]);

  useEffect(() => {
    document.body.classList.toggle('light-mode', isLightMode);
  }, [isLightMode]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleRechazar = () => {
    // Limpiar datos pendientes y volver al wizard
    localStorage.removeItem('pendingERPPreview');
    localStorage.removeItem('pendingInyeccionPayload');
    router.push('/proyectos/nuevo');
  };

  const handleAprobar = async () => {
    if (!payload) return;
    setAprobando(true);
    setErrorAprobacion(null);

    try {
      const token = localStorage.getItem('token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      // Subir el JSON a Supabase via /inyeccion/crear-dashboard
      const res = await fetch(`${backendUrl}/inyeccion/crear-dashboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.ok && data.resumen?.dashboard_id) {
        const dashboardId = data.resumen.dashboard_id;

        // Guardar en el historial local de proyectos
        const nombreNegocio = preview?.nombre_negocio || payload.dashboard.nombre;
        const localStr = localStorage.getItem('proyectos') || '[]';
        const locales = JSON.parse(localStr);
        locales.push({
          id: dashboardId,
          dashboard_id: dashboardId,
          nombre_negocio: nombreNegocio,
          created_at: new Date().toISOString(),
        });
        localStorage.setItem('proyectos', JSON.stringify(locales));

        // Limpiar datos pendientes
        localStorage.removeItem('pendingERPPreview');
        localStorage.removeItem('pendingInyeccionPayload');

        setAprobado(true);

        // Redirigir al dashboard operativo
        setTimeout(() => router.push(`/proyectos/${dashboardId}`), 1200);
      } else {
        throw new Error(data.error || 'El servidor no devolvió un dashboard_id');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido al crear el ERP';
      setErrorAprobacion(msg);

      // Fallback: guardar localmente y redirigir al preview estático
      if (payload) {
        localStorage.setItem('currentERPData', JSON.stringify(payload));
        const nombreNegocio = preview?.nombre_negocio || payload.dashboard.nombre;
        const localStr = localStorage.getItem('proyectos') || '[]';
        const locales = JSON.parse(localStr);
        const localId = 'local-' + Math.random().toString(36).substring(2, 9);
        locales.push({
          id: localId,
          nombre_negocio: nombreNegocio,
          erp_data: payload,
          created_at: new Date().toISOString(),
        });
        localStorage.setItem('proyectos', JSON.stringify(locales));
        localStorage.removeItem('pendingERPPreview');
        localStorage.removeItem('pendingInyeccionPayload');
        setTimeout(() => router.push('/proyectos/preview'), 2000);
      }
    } finally {
      setAprobando(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!mounted || !preview || !payload) return null;

  const pageClass = `min-h-screen w-full flex flex-col transition-colors duration-300
    ${isLightMode
      ? 'bg-gradient-to-b from-[#f9fafb] via-[#f3f4f6] to-[#f9fafb] text-gray-900'
      : 'bg-gradient-to-b from-[#0a0a0a] via-[#121224] to-[#0a0a0a] text-white'
    }`;

  const headerClass = `border-b sticky top-0 z-40 transition-colors duration-300
    ${isLightMode
      ? 'border-gray-200 bg-white/80 backdrop-blur-md'
      : 'border-purple-500/10 bg-[#0a0a0a]/80 backdrop-blur-md'
    }`;

  // Estado de éxito
  if (aprobado) {
    return (
      <div className={`${pageClass} items-center justify-center`}>
        <div className="text-center space-y-6 animate-pulse">
          <CheckCircle className="w-20 h-20 text-emerald-400 mx-auto" />
          <h1 className="text-3xl font-bold text-white">¡ERP creado exitosamente!</h1>
          <p className="text-gray-400">Redirigiendo a tu tablón de control…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={pageClass}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className={headerClass}>
        <div className="w-full max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">

          <div className="flex items-center gap-3">
            <button
              onClick={handleRechazar}
              disabled={aprobando}
              className={`flex items-center gap-1.5 text-sm transition-colors
                ${isLightMode ? 'text-gray-500 hover:text-gray-900' : 'text-gray-400 hover:text-white'}
                disabled:opacity-40`}
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al wizard
            </button>

            <span className={isLightMode ? 'text-gray-300' : 'text-gray-700'}>/</span>

            <div className="flex items-center gap-2">
              <Image src="/new_logo.png" alt="GenIA" width={28} height={28} className="object-contain" />
              <span className="text-lg font-bold tracking-wider bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent">
                GenIA
              </span>
            </div>

            <span className={isLightMode ? 'text-gray-300' : 'text-gray-700'}>/</span>

            <div className="flex items-center gap-2">
              <Sparkles className={`w-4 h-4 ${isLightMode ? 'text-purple-600' : 'text-purple-400'}`} />
              <span className={`font-semibold ${isLightMode ? 'text-purple-700' : 'text-purple-400'}`}>
                Vista previa del diseño
              </span>
            </div>
          </div>

          {/* Info del proyecto */}
          <span className={`text-sm font-medium hidden md:block
            ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {preview.nombre_negocio}
          </span>
        </div>
      </header>

      {/* ── Módulos detectados ─────────────────────────────────────────────── */}
      {preview.analisis.modulos_detectados && preview.analisis.modulos_detectados.length > 0 && (
        <div className={`border-b px-6 py-2 flex items-center gap-3 flex-wrap
          ${isLightMode ? 'border-gray-200 bg-white/50' : 'border-purple-500/10 bg-[#0a0a0a]/30'}`}>
          <span className={`text-xs font-bold uppercase tracking-widest
            ${isLightMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Módulos detectados:
          </span>
          {preview.analisis.modulos_detectados.map(m => (
            <span key={m} className={`px-2 py-0.5 rounded-full text-xs font-semibold
              ${isLightMode
                ? 'bg-purple-100 text-purple-700'
                : 'bg-purple-500/20 text-purple-300'
              }`}>
              {m}
            </span>
          ))}
        </div>
      )}

      {/* ── Contenido principal: iframe ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col" style={{ minHeight: 0 }}>
        {preview.preview_html ? (
          /* Mockup generado por IA */
          <iframe
            srcDoc={preview.preview_html}
            className="flex-1 w-full border-0"
            style={{ minHeight: 'calc(100vh - 200px)' }}
            title="Vista previa del ERP generado"
            sandbox="allow-same-origin allow-scripts"
          />
        ) : (
          /* Fallback: sin preview HTML (la IA falló) */
          <div className={`flex-1 flex flex-col items-center justify-center gap-6 px-6 py-16
            ${isLightMode ? 'bg-gray-50' : 'bg-[#0f0f1e]/50'}`}>
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center
              ${isLightMode ? 'bg-amber-100' : 'bg-amber-500/10'}`}>
              <AlertCircle className={`w-10 h-10 ${isLightMode ? 'text-amber-500' : 'text-amber-400'}`} />
            </div>
            <div className="text-center space-y-2 max-w-md">
              <h2 className={`text-xl font-bold ${isLightMode ? 'text-gray-800' : 'text-white'}`}>
                No se pudo generar la vista previa
              </h2>
              <p className={`text-sm ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                El agente de diseño no estuvo disponible, pero tu ERP se puede crear con los
                módulos y campos predefinidos para tu tipo de negocio.
              </p>
            </div>
            <div className={`p-5 rounded-2xl border max-w-sm w-full
              ${isLightMode ? 'border-gray-200 bg-white' : 'border-purple-500/10 bg-[#11111e]/60'}`}>
              <p className={`text-sm font-semibold mb-3 ${isLightMode ? 'text-gray-700' : 'text-gray-300'}`}>
                Se crearán los siguientes módulos:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(payload.tablas as { etiqueta?: string; nombre?: string }[]).map((t, i) => (
                  <span key={i} className={`px-2 py-1 rounded-lg text-xs font-medium
                    ${isLightMode ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/20 text-purple-300'}`}>
                    {t.etiqueta || t.nombre}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer: pregunta + botones ──────────────────────────────────────── */}
      <div className={`border-t px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4
        ${isLightMode
          ? 'border-gray-200 bg-white/90 backdrop-blur-md'
          : 'border-purple-500/10 bg-[#0a0a0a]/90 backdrop-blur-md'
        }`}>

        {/* Pregunta de confirmación */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${isLightMode ? 'text-gray-700' : 'text-gray-200'}`}>
            {preview.pregunta_confirmacion}
          </p>
          {errorAprobacion && (
            <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              {errorAprobacion} — guardando localmente…
            </p>
          )}
        </div>

        {/* Botones */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Rechazar */}
          <button
            onClick={handleRechazar}
            disabled={aprobando}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm border transition-all
              disabled:opacity-40 disabled:cursor-not-allowed
              ${isLightMode
                ? 'border-gray-300 text-gray-600 hover:bg-gray-100'
                : 'border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
          >
            <XCircle className="w-4 h-4" />
            Rechazar — volver al wizard
          </button>

          {/* Aprobar */}
          <button
            onClick={handleAprobar}
            disabled={aprobando}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm
              bg-gradient-to-r from-purple-600 to-pink-600 text-white
              hover:shadow-lg hover:shadow-purple-500/30 transition-all
              disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {aprobando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creando ERP…
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Aprobar — crear ERP
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
