'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, Search, Sun, Moon, LogOut, RefreshCw, Database, AlertCircle } from 'lucide-react';
import { listDashboards, type DashboardResumen } from '@/services/dashboard.service';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos locales
// ─────────────────────────────────────────────────────────────────────────────

interface Usuario {
  id?: string;
  nombre?: string;
  appat?: string;
  email?: string;
  user_metadata?: { nombre?: string; appat?: string };
}

/** Proyecto guardado en localStorage (modo offline / fallback) */
interface ProyectoLocal {
  id: string;
  dashboard_id?: string;
  nombre_negocio: string;
  created_at: string;
  erp_data?: unknown;
  configuracion?: {
    tipo_negocio?: string;
    modulos_deseados?: string[];
    tamano?: { num_empleados?: string; num_sucursales?: string };
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: icono de módulo como emoji/símbolo
// ─────────────────────────────────────────────────────────────────────────────

const ICONO_EMOJI: Record<string, string> = {
  users: '👥', briefcase: '💼', 'shopping-cart': '🛒',
  package: '📦', calendar: '📅', 'dollar-sign': '💵',
  'file-text': '📄', truck: '🚚', 'bar-chart': '📊',
  'credit-card': '💳', star: '⭐', table: '🗂️', default: '🔷',
};

function getEmoji(icono: string): string {
  return ICONO_EMOJI[icono] ?? ICONO_EMOJI.default;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: tarjeta de dashboard (datos desde API)
// ─────────────────────────────────────────────────────────────────────────────

function DashboardCard({
  dashboard,
  isLightMode,
  onClick,
}: {
  dashboard: DashboardResumen;
  isLightMode: boolean;
  onClick: () => void;
}) {
  const estilo = dashboard.estilos.find(e => e.activo) ?? dashboard.estilos[0];
  const fecha = new Date(dashboard.created_at).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <div
      className={`
        relative border rounded-3xl p-6 backdrop-blur-md
        hover:shadow-xl transition-all duration-300 flex flex-col justify-between
        group overflow-hidden cursor-pointer
        ${isLightMode
          ? 'bg-white border-purple-500/20 hover:border-purple-500/40 hover:shadow-purple-500/5 text-gray-900'
          : 'bg-[#11111e]/40 border-purple-500/10 hover:border-purple-500/30 hover:shadow-purple-500/10 text-white'
        }
      `}
      onClick={onClick}
    >
      {/* Orbe decorativo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/5 to-transparent
        rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-all duration-700" />

      <div className="space-y-4">
        {/* Header: nombre + puntos de color */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            {/* Puntos del tema */}
            {estilo && (
              <div className="flex items-center gap-1.5 mb-2">
                {[estilo.color_primario, estilo.color_secundario, estilo.color_acento].map((c, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full border border-white/20 flex-shrink-0"
                    style={{ backgroundColor: c }}
                  />
                ))}
                <span className={`text-[11px] ml-1 ${isLightMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {estilo.nombre}
                </span>
              </div>
            )}
            <h3 className={`text-xl font-bold group-hover:text-purple-500 transition-colors truncate
              ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
              {dashboard.nombre}
            </h3>
            <div className={`flex gap-3 text-xs ${isLightMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <span>{dashboard.moneda}</span>
              <span>{dashboard.idioma.toUpperCase()}</span>
              <span>{dashboard.zona_horaria.split('/')[1] ?? dashboard.zona_horaria}</span>
            </div>
          </div>

          {/* Icono */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
            ${isLightMode ? 'bg-purple-50 border border-purple-200' : 'bg-purple-500/10 border border-purple-500/20'}`}>
            <Database className={`w-5 h-5 ${isLightMode ? 'text-purple-600' : 'text-purple-400'}`} />
          </div>
        </div>

        {/* Módulos */}
        {dashboard.tablas.length > 0 && (
          <div className="space-y-1.5">
            <p className={`text-xs font-medium ${isLightMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Módulos ({dashboard.tablas.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {dashboard.tablas.slice(0, 5).map(t => (
                <span
                  key={t.id}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                    ${isLightMode
                      ? 'bg-gray-100 border border-gray-200 text-gray-700'
                      : 'bg-white/5 border border-white/5 text-gray-300'
                    }`}
                >
                  <span>{getEmoji(t.icono)}</span>
                  {t.etiqueta}
                </span>
              ))}
              {dashboard.tablas.length > 5 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold
                  ${isLightMode ? 'bg-purple-100 text-purple-600' : 'text-purple-400 bg-purple-500/10'}`}>
                  +{dashboard.tablas.length - 5}
                </span>
              )}
            </div>
          </div>
        )}

        {dashboard.tablas.length === 0 && (
          <p className={`text-sm italic ${isLightMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Sin módulos definidos
          </p>
        )}
      </div>

      {/* Footer */}
      <div className={`flex items-center justify-between pt-5 mt-4 border-t text-xs
        ${isLightMode ? 'border-gray-100 text-gray-400' : 'border-purple-500/5 text-gray-500'}`}>
        <span>Creado el {fecha}</span>
        <span className="flex items-center gap-1 font-bold text-purple-400
          group-hover:text-purple-300 transition-colors uppercase tracking-wider">
          Gestionar →
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: tarjeta de proyecto local (offline / fallback)
// ─────────────────────────────────────────────────────────────────────────────

function ProyectoLocalCard({
  proyecto,
  isLightMode,
  onClick,
}: {
  proyecto: ProyectoLocal;
  isLightMode: boolean;
  onClick: () => void;
}) {
  const fecha = new Date(proyecto.created_at).toLocaleDateString('es-MX', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
  const config = proyecto.configuracion ?? {};
  const modulos = config.modulos_deseados ?? [];

  return (
    <div
      onClick={onClick}
      className={`
        relative border rounded-3xl p-6 backdrop-blur-md cursor-pointer
        hover:shadow-xl transition-all duration-300 flex flex-col justify-between
        group overflow-hidden
        ${isLightMode
          ? 'bg-white border-amber-400/20 hover:border-amber-400/40 hover:shadow-amber-400/5 text-gray-900'
          : 'bg-[#11111e]/40 border-amber-500/10 hover:border-amber-500/30 text-white'
        }
      `}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/5
        to-transparent rounded-full blur-xl pointer-events-none" />

      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold mb-1
              ${isLightMode ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/20 text-amber-400'}`}>
              Local
            </span>
            <h3 className={`text-xl font-bold truncate group-hover:text-amber-500 transition-colors
              ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
              {proyecto.nombre_negocio}
            </h3>
            {config.tipo_negocio && (
              <p className={`text-xs ${isLightMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {config.tipo_negocio}
              </p>
            )}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
            ${isLightMode ? 'bg-amber-50 border border-amber-200' : 'bg-amber-500/10 border border-amber-500/20'}`}>
            <span className="text-lg">🗂️</span>
          </div>
        </div>

        {modulos.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {modulos.slice(0, 4).map(m => (
              <span key={m} className={`px-2 py-0.5 rounded text-xs font-medium
                ${isLightMode ? 'bg-gray-100 border border-gray-200 text-gray-600' : 'bg-white/5 border border-white/5 text-gray-300'}`}>
                {m}
              </span>
            ))}
            {modulos.length > 4 && (
              <span className={`px-2 py-0.5 rounded text-xs font-bold
                ${isLightMode ? 'text-amber-600 bg-amber-100' : 'text-amber-400 bg-amber-500/10'}`}>
                +{modulos.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      <div className={`flex items-center justify-between pt-5 mt-4 border-t text-xs
        ${isLightMode ? 'border-gray-100 text-gray-400' : 'border-amber-500/5 text-gray-500'}`}>
        <span>Creado el {fecha}</span>
        <span className="font-bold text-amber-400 group-hover:text-amber-300
          uppercase tracking-wider transition-colors">
          Ver preview →
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────────

export default function ProyectosPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);

  // Datos del API
  const [dashboards, setDashboards] = useState<DashboardResumen[]>([]);
  const [proyectosLocales, setProyectosLocales] = useState<ProyectoLocal[]>([]);

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Auth + tema ────────────────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') ?? 'dark';
    setIsLightMode(savedTheme === 'light');

    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!userStr || !token) { router.replace('/'); return; }
    try {
      setUsuario(JSON.parse(userStr));
    } catch {
      router.replace('/');
    }
  }, [router]);

  useEffect(() => {
    document.body.classList.toggle('light-mode', isLightMode);
  }, [isLightMode]);

  const toggleTheme = () => {
    const next = !isLightMode;
    setIsLightMode(next);
    localStorage.setItem('theme', next ? 'light' : 'dark');
  };

  // ── Cargar datos ───────────────────────────────────────────────────────────
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setApiError(null);

    // 1. Siempre leer proyectos locales primero (respuesta inmediata)
    try {
      const localStr = localStorage.getItem('proyectos') ?? '[]';
      const locales: ProyectoLocal[] = JSON.parse(localStr);
      // Solo mostrar como "locales" los que no tienen dashboard_id válido
      setProyectosLocales(
        locales.filter(p => !p.dashboard_id || p.id.startsWith('local-'))
      );
    } catch { /* no hay proyectos locales */ }

    // 2. Intentar cargar dashboards del API
    try {
      const data = await listDashboards();
      setDashboards(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar dashboards';
      setApiError(msg);
      setDashboards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (usuario) cargarDatos();
  }, [usuario, cargarDatos]);

  // ── Filtro de búsqueda ─────────────────────────────────────────────────────
  const q = searchQuery.toLowerCase();

  const dashboardsFiltrados = dashboards.filter(d =>
    d.nombre.toLowerCase().includes(q) ||
    d.tablas.some(t => t.etiqueta.toLowerCase().includes(q))
  );

  const localesFiltrados = proyectosLocales.filter(p =>
    p.nombre_negocio.toLowerCase().includes(q) ||
    (p.configuracion?.tipo_negocio ?? '').toLowerCase().includes(q)
  );

  const hayResultados = dashboardsFiltrados.length > 0 || localesFiltrados.length > 0;
  const hayDatos = dashboards.length > 0 || proyectosLocales.length > 0;

  // ── Handlers de navegación ─────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/');
  };

  const handleNuevoProyecto = () => router.push('/proyectos/nuevo');

  const handleGestionarDashboard = (id: string) => router.push(`/proyectos/${id}`);

  const handleGestionarLocal = (proyecto: ProyectoLocal) => {
    if (proyecto.erp_data) {
      localStorage.setItem('currentERPData', JSON.stringify(proyecto.erp_data));
    }
    router.push('/proyectos/preview');
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!mounted || !usuario) return null;

  const displayName =
    usuario.nombre || usuario.user_metadata?.nombre ||
    usuario.email?.split('@')[0] || 'Usuario';

  const pageClass = `min-h-screen w-full transition-colors duration-300
    ${isLightMode
      ? 'bg-gradient-to-b from-[#f9fafb] via-[#f3f4f6] to-[#f9fafb] text-gray-900'
      : 'bg-gradient-to-b from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a]'
    }`;

  const headerClass = `border-b sticky top-0 z-40 transition-colors duration-300
    ${isLightMode
      ? 'border-gray-200 bg-white/80 backdrop-blur-md'
      : 'border-purple-500/10 bg-[#0a0a0a]/80 backdrop-blur-md'
    }`;

  return (
    <div className={pageClass}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className={headerClass}>
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-6">

            {/* Logo */}
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-shrink-0"
            >
              <Image src="/new_logo.png" alt="GenIA Logo" width={40} height={40} className="object-contain" />
              <span className="text-2xl font-bold tracking-wider bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent">
                GenIA
              </span>
            </button>

            {/* Derecha */}
            <div className="flex items-center gap-3">

              {/* Búsqueda */}
              <div className="relative w-72 hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o módulo…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 text-sm border rounded-xl transition-colors focus:outline-none focus:border-purple-500
                    ${isLightMode
                      ? 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-400'
                      : 'bg-[#1a1a2e] border-purple-500/20 text-white placeholder-gray-500'
                    }`}
                />
              </div>

              {/* Recargar */}
              <button
                onClick={cargarDatos}
                disabled={loading}
                className={`p-2 rounded-xl border transition-all disabled:opacity-40
                  ${isLightMode
                    ? 'border-gray-200 text-gray-500 hover:bg-gray-100'
                    : 'border-purple-500/20 text-gray-400 hover:bg-white/5'
                  }`}
                title="Recargar"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {/* Tema */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-xl border transition-all
                  ${isLightMode
                    ? 'bg-purple-100 border-purple-200 text-purple-600 hover:bg-purple-200'
                    : 'bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20'
                  }`}
                title="Cambiar tema"
              >
                {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>

              {/* Usuario */}
              <span className={`text-sm font-semibold hidden md:block
                ${isLightMode ? 'text-gray-800' : 'text-white'}`}>
                {displayName}
              </span>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 border-2 border-red-500/40 rounded-full
                  text-red-400 text-sm font-semibold tracking-wide hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Contenido principal ─────────────────────────────────────────────── */}
      <main className="w-full max-w-7xl mx-auto px-6 lg:px-8 py-10">

        {/* ── Loading ─────────────────────────────────────────────────────── */}
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-t-purple-500 border-purple-500/20 rounded-full animate-spin" />
            <p className={`text-sm font-medium ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Cargando tus proyectos…
            </p>
          </div>
        )}

        {/* ── Contenido cargado ─────────────────────────────────────────────── */}
        {!loading && (
          <div className="space-y-8 animate-fade-in">

            {/* Banner de error del API (no crítico) */}
            {apiError && (
              <div className={`flex items-start gap-3 p-4 rounded-2xl border
                ${isLightMode
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                }`}>
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">No se pudo conectar al servidor</p>
                  <p className="text-xs mt-0.5 opacity-80">
                    Mostrando solo proyectos guardados localmente. {apiError}
                  </p>
                </div>
              </div>
            )}

            {/* ── Estado vacío total ───────────────────────────────────────── */}
            {!hayDatos && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
                <div className={`w-32 h-32 rounded-3xl flex items-center justify-center border
                  ${isLightMode
                    ? 'bg-purple-50 border-purple-200'
                    : 'bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border-purple-500/30'
                  }`}>
                  <Database className={`w-16 h-16 ${isLightMode ? 'text-purple-500' : 'text-purple-400'}`} />
                </div>

                <div className="text-center space-y-4 max-w-xl">
                  <h1 className={`text-4xl md:text-5xl font-bold tracking-wide
                    ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                    No tienes proyectos aún
                  </h1>
                  <p className={`text-lg leading-relaxed ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                    Crea tu primer sistema ERP personalizado en minutos.
                    <br />
                    GenIA se encarga de toda la estructura por ti.
                  </p>
                </div>

                <button
                  onClick={handleNuevoProyecto}
                  className="flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-purple-600 to-pink-600
                    rounded-2xl text-white font-bold text-xl tracking-wide
                    hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105"
                >
                  <Plus className="w-6 h-6" />
                  Crear primer proyecto
                </button>

                <div className="pt-4 grid grid-cols-3 gap-6 text-center">
                  {[
                    { icon: '⚡', label: 'Rápido y fácil' },
                    { icon: '🎨', label: 'Personalizable' },
                    { icon: '🔒', label: 'Seguro' },
                  ].map(({ icon, label }) => (
                    <div key={label} className="space-y-2">
                      <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-xl
                        ${isLightMode ? 'bg-purple-100' : 'bg-purple-500/10'}`}>
                        {icon}
                      </div>
                      <p className={`text-sm ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Lista de proyectos ─────────────────────────────────────── */}
            {hayDatos && (
              <>
                {/* Header de lista */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className={`text-4xl font-extrabold tracking-wide
                      ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                      Mis Proyectos
                    </h1>
                    <p className={`mt-1 text-sm ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {dashboards.length + proyectosLocales.length} proyecto{dashboards.length + proyectosLocales.length !== 1 ? 's' : ''} en total
                      {searchQuery && ` · ${dashboardsFiltrados.length + localesFiltrados.length} coincidencias`}
                    </p>
                  </div>

                  <button
                    onClick={handleNuevoProyecto}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600
                      rounded-xl text-white font-bold tracking-wide
                      hover:shadow-lg hover:shadow-purple-500/30 transition-all transform hover:scale-[1.02]"
                  >
                    <Plus className="w-5 h-5" />
                    Nuevo Proyecto
                  </button>
                </div>

                {/* Sin resultados de búsqueda */}
                {!hayResultados && searchQuery && (
                  <div className={`text-center py-16 rounded-3xl border
                    ${isLightMode ? 'border-gray-200 bg-gray-50' : 'border-purple-500/10 bg-[#11111e]/30'}`}>
                    <Search className={`w-10 h-10 mx-auto mb-3 ${isLightMode ? 'text-gray-300' : 'text-gray-600'}`} />
                    <p className={`font-semibold ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                      Sin resultados para &ldquo;{searchQuery}&rdquo;
                    </p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-3 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Limpiar búsqueda
                    </button>
                  </div>
                )}

                {/* Grid de dashboards (API) */}
                {dashboardsFiltrados.length > 0 && (
                  <div>
                    {proyectosLocales.length > 0 && (
                      <h2 className={`text-xs font-bold uppercase tracking-widest mb-4
                        ${isLightMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        En la nube
                      </h2>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {dashboardsFiltrados.map(d => (
                        <DashboardCard
                          key={d.id}
                          dashboard={d}
                          isLightMode={isLightMode}
                          onClick={() => handleGestionarDashboard(d.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Grid de proyectos locales (fallback) */}
                {localesFiltrados.length > 0 && (
                  <div>
                    {dashboards.length > 0 && (
                      <h2 className={`text-xs font-bold uppercase tracking-widest mb-4
                        ${isLightMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Guardados localmente
                      </h2>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {localesFiltrados.map(p => (
                        <ProyectoLocalCard
                          key={p.id}
                          proyecto={p}
                          isLightMode={isLightMode}
                          onClick={() => handleGestionarLocal(p)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
