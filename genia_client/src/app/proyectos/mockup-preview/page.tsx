'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, X, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

interface Pantalla {
  nombre: string;
  mockup_html: string;
}

interface ERPPreviewData {
  data: {
    analisis: {
      tipo_negocio: string;
      resumen: string;
      modulos_detectados: string[];
    };
    pantallas: Pantalla[];
    pregunta_confirmacion: string;
  };
  preview_html: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

export default function MockupPreviewPage() {
  const router = useRouter();

  const [previewData, setPreviewData] = useState<ERPPreviewData | null>(null);
  const [inyeccionPayload, setInyeccionPayload] = useState<Record<string, unknown> | null>(null);
  const [pantallaActiva, setPantallaActiva] = useState(0);
  const [aprobando, setAprobando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') ?? 'dark';
    setIsLightMode(savedTheme === 'light');

    // Leer datos pendientes desde localStorage
    const previewStr = localStorage.getItem('pendingERPPreview');
    const payloadStr = localStorage.getItem('pendingInyeccionPayload');

    if (!previewStr || !payloadStr) {
      // No hay datos pendientes → redirigir al wizard
      router.replace('/proyectos/nuevo');
      return;
    }

    try {
      setPreviewData(JSON.parse(previewStr));
      setInyeccionPayload(JSON.parse(payloadStr));
    } catch {
      router.replace('/proyectos/nuevo');
    }
  }, [router]);

  useEffect(() => {
    document.body.classList.toggle('light-mode', isLightMode);
  }, [isLightMode]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAprobar = async () => {
    if (!inyeccionPayload) return;
    setAprobando(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

      const res = await fetch(`${backendUrl}/inyeccion/crear-dashboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(inyeccionPayload),
      });

      const data = await res.json();

      if (data.ok && data.resumen?.dashboard_id) {
        const dashboardId = data.resumen.dashboard_id;

        // Limpiar datos temporales
        localStorage.removeItem('pendingERPPreview');
        localStorage.removeItem('pendingInyeccionPayload');

        // Guardar referencia en proyectos locales
        const dash = inyeccionPayload.dashboard as Record<string, string> | undefined;
        const localProyectosStr = localStorage.getItem('proyectos') || '[]';
        const localProyectos = JSON.parse(localProyectosStr);
        localProyectos.push({
          id: dashboardId,
          dashboard_id: dashboardId,
          nombre_negocio: dash?.nombre ?? 'Mi Proyecto',
          created_at: new Date().toISOString(),
        });
        localStorage.setItem('proyectos', JSON.stringify(localProyectos));

        // Redirigir al editor del dashboard
        router.push(`/proyectos/${dashboardId}`);
      } else {
        throw new Error(data.error || 'El servidor no devolvió un dashboard_id');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el proyecto');
      setAprobando(false);
    }
  };

  const handleRechazar = () => {
    // Limpiar datos temporales y volver al wizard
    localStorage.removeItem('pendingERPPreview');
    localStorage.removeItem('pendingInyeccionPayload');
    router.push('/proyectos/nuevo');
  };

  // ── Render guards ────────────────────────────────────────────────────────────

  if (!previewData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  const pantallas = previewData.data.pantallas ?? [];
  const pantalla = pantallas[pantallaActiva];
  const analisis = previewData.data.analisis;
  const pregunta = previewData.data.pregunta_confirmacion;

  const pageClass = `min-h-screen flex flex-col transition-colors duration-300
    ${isLightMode
      ? 'bg-gradient-to-b from-[#f9fafb] via-[#f3f4f6] to-[#f9fafb] text-gray-900'
      : 'bg-gradient-to-b from-[#0a0a0a] via-[#121224] to-[#0a0a0a] text-white'
    }`;

  const cardClass = `border rounded-2xl backdrop-blur-md transition-colors
    ${isLightMode
      ? 'bg-white border-purple-500/20 shadow-md'
      : 'bg-[#11111e]/60 border-purple-500/10'
    }`;

  return (
    <div className={pageClass}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className={`border-b sticky top-0 z-40
        ${isLightMode
          ? 'border-gray-200 bg-white/80 backdrop-blur-md'
          : 'border-purple-500/10 bg-[#0a0a0a]/80 backdrop-blur-md'
        }`}>
        <div className="w-full max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
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
              <Image src="/new_logo.png" alt="GenIA" width={24} height={24} className="object-contain" />
              <span className="text-sm font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Vista previa del diseño
              </span>
            </div>
          </div>

          {/* Tipo de negocio */}
          <span className={`text-xs px-3 py-1 rounded-full font-semibold
            ${isLightMode ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/20 text-purple-300'}`}>
            {analisis.tipo_negocio}
          </span>
        </div>
      </header>

      {/* ── Contenido ──────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-4 py-6 gap-4">

        {/* Resumen del análisis */}
        <div className={`${cardClass} p-4`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <p className={`text-sm ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {analisis.resumen}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {analisis.modulos_detectados.map(m => (
                  <span key={m} className={`text-xs px-2 py-0.5 rounded-full
                    ${isLightMode ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-400'}`}>
                    {m}
                  </span>
                ))}
              </div>
            </div>

            {/* Navegación de pantallas */}
            {pantallas.length > 1 && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setPantallaActiva(p => Math.max(0, p - 1))}
                  disabled={pantallaActiva === 0}
                  className={`p-1.5 rounded-lg transition-colors disabled:opacity-30
                    ${isLightMode ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/10 text-gray-400'}`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className={`text-sm font-semibold min-w-[80px] text-center
                  ${isLightMode ? 'text-gray-700' : 'text-gray-300'}`}>
                  {pantalla?.nombre ?? `Pantalla ${pantallaActiva + 1}`}
                </span>
                <button
                  onClick={() => setPantallaActiva(p => Math.min(pantallas.length - 1, p + 1))}
                  disabled={pantallaActiva === pantallas.length - 1}
                  className={`p-1.5 rounded-lg transition-colors disabled:opacity-30
                    ${isLightMode ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/10 text-gray-400'}`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className={`text-xs ml-1 ${isLightMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {pantallaActiva + 1} / {pantallas.length}
                </span>
              </div>
            )}
          </div>

          {/* Tabs de pantallas */}
          {pantallas.length > 1 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-purple-500/10">
              {pantallas.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setPantallaActiva(i)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all
                    ${pantallaActiva === i
                      ? isLightMode
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-500 text-white'
                      : isLightMode
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                >
                  {p.nombre}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mockup iframe */}
        <div className={`${cardClass} flex-1 overflow-hidden`} style={{ minHeight: '55vh' }}>
          {pantalla ? (
            <iframe
              srcDoc={pantalla.mockup_html}
              className="w-full h-full border-0"
              style={{ minHeight: '55vh' }}
              title={pantalla.nombre}
              sandbox="allow-scripts"
            />
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className={`text-sm ${isLightMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No hay pantallas disponibles
              </p>
            </div>
          )}
        </div>

        {/* Barra de aprobación */}
        <div className={`${cardClass} p-5`}>
          {/* Pregunta de confirmación */}
          <p className={`text-sm font-medium mb-4 text-center
            ${isLightMode ? 'text-gray-700' : 'text-gray-300'}`}>
            {pregunta || '¿Este diseño refleja lo que necesitas?'}
          </p>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 p-3 rounded-xl
              bg-red-500/10 border border-red-500/20 mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {/* Rechazar */}
            <button
              onClick={handleRechazar}
              disabled={aprobando}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                text-sm font-semibold border transition-all
                disabled:opacity-40 disabled:cursor-not-allowed
                ${isLightMode
                  ? 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  : 'border-white/10 text-gray-300 hover:bg-white/5'
                }`}
            >
              <X className="w-4 h-4" />
              Rechazar — volver al wizard
            </button>

            {/* Aprobar */}
            <button
              onClick={handleAprobar}
              disabled={aprobando}
              className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl
                text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white
                hover:shadow-xl hover:shadow-purple-500/40 transition-all transform hover:scale-105
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {aprobando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando en Supabase…
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Aprobar diseño y crear proyecto
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
