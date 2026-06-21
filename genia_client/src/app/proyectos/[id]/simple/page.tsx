'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft, Sun, Moon, LogOut, RefreshCw,
  TrendingUp, Hash, Calendar, ToggleLeft, Plus,
  AlertCircle, Database,
} from 'lucide-react';

import { useDashboard } from '@/hooks/useDashboard';
import DynamicSidebar from '@/components/DynamicSidebar';
import DynamicDataGrid from '@/components/DynamicDataGrid';
import DynamicModal from '@/components/DynamicModal';
import DynamicForm, { type FormData } from '@/components/DynamicForm';
import type { Fila, Columna, Tabla } from '@/types/dashboard';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos de estadísticas
// ─────────────────────────────────────────────────────────────────────────────

interface StatCard {
  label: string;
  value: string;
  subtext?: string;
  color: 'purple' | 'cyan' | 'green' | 'amber' | 'pink';
  icon: React.ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// Motor de estadísticas (calculadas al momento, sin BD)
// ─────────────────────────────────────────────────────────────────────────────

function calcularStats(tabla: Tabla): StatCard[] {
  const { columnas, filas } = tabla;
  const cards: StatCard[] = [];

  // Total de registros siempre
  cards.push({
    label: 'Total de registros',
    value: filas.length.toLocaleString('es-MX'),
    subtext: `en módulo ${tabla.etiqueta}`,
    color: 'purple',
    icon: <Hash className="w-5 h-5" />,
  });

  if (filas.length === 0) return cards;

  for (const col of columnas) {
    const valores = filas
      .map(f => f.datos[col.nombre])
      .filter(v => v !== undefined && v !== null && v !== '');

    if (valores.length === 0) continue;

    // ── Numéricos ─────────────────────────────────────────────────────────
    if (col.tipo_dato === 'integer' || col.tipo_dato === 'decimal') {
      const nums = valores.map(Number).filter(n => !isNaN(n));
      if (nums.length === 0) continue;

      const sum = nums.reduce((a, b) => a + b, 0);
      const avg = sum / nums.length;
      const max = Math.max(...nums);
      const min = Math.min(...nums);

      const fmt = (n: number) =>
        col.tipo_dato === 'decimal'
          ? `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : n.toLocaleString('es-MX');

      cards.push({
        label: `${col.etiqueta} — Total`,
        value: fmt(sum),
        subtext: `Promedio: ${fmt(avg)}`,
        color: 'cyan',
        icon: <TrendingUp className="w-5 h-5" />,
      });
      cards.push({
        label: `${col.etiqueta} — Máximo / Mínimo`,
        value: `${fmt(max)}`,
        subtext: `Mínimo: ${fmt(min)}`,
        color: 'green',
        icon: <TrendingUp className="w-5 h-5" />,
      });
    }

    // ── Booleanos ─────────────────────────────────────────────────────────
    if (col.tipo_dato === 'boolean') {
      const trues = valores.filter(v => v === 'true').length;
      const falses = valores.length - trues;
      const pct = valores.length > 0 ? Math.round((trues / valores.length) * 100) : 0;

      cards.push({
        label: col.etiqueta,
        value: `${trues} Sí`,
        subtext: `${falses} No — ${pct}% activos`,
        color: 'green',
        icon: <ToggleLeft className="w-5 h-5" />,
      });
    }

    // ── Fechas ────────────────────────────────────────────────────────────
    if (col.tipo_dato === 'date') {
      const fechas = valores
        .map(v => new Date(v + 'T00:00:00'))
        .filter(d => !isNaN(d.getTime()))
        .sort((a, b) => a.getTime() - b.getTime());

      if (fechas.length > 0) {
        const fmt = (d: Date) => d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
        cards.push({
          label: `${col.etiqueta} — Rango`,
          value: fmt(fechas[fechas.length - 1]),
          subtext: `Más antiguo: ${fmt(fechas[0])}`,
          color: 'amber',
          icon: <Calendar className="w-5 h-5" />,
        });
      }
    }

    // ── String con valores permitidos (distribución) ───────────────────────
    if (col.tipo_dato === 'string' && col.valores_permitidos && col.valores_permitidos.length > 0) {
      const dist: Record<string, number> = {};
      for (const v of col.valores_permitidos) dist[v] = 0;
      for (const v of valores) { if (dist[v] !== undefined) dist[v]++; }

      const top = Object.entries(dist).sort((a, b) => b[1] - a[1]).slice(0, 3);
      if (top.length > 0) {
        cards.push({
          label: col.etiqueta,
          value: `${top[0][0]}: ${top[0][1]}`,
          subtext: top.slice(1).map(([k, v]) => `${k}: ${v}`).join(' · ') || undefined,
          color: 'pink',
          icon: <Hash className="w-5 h-5" />,
        });
      }
    }
  }

  return cards;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: tarjeta de estadística
// ─────────────────────────────────────────────────────────────────────────────

const COLOR_CLASSES: Record<StatCard['color'], string> = {
  purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/20 text-purple-400',
  cyan:   'from-cyan-500/20 to-cyan-600/10 border-cyan-500/20 text-cyan-400',
  green:  'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20 text-emerald-400',
  amber:  'from-amber-500/20 to-amber-600/10 border-amber-500/20 text-amber-400',
  pink:   'from-pink-500/20 to-pink-600/10 border-pink-500/20 text-pink-400',
};

const COLOR_LIGHT: Record<StatCard['color'], string> = {
  purple: 'bg-purple-50 border-purple-200 text-purple-700',
  cyan:   'bg-cyan-50 border-cyan-200 text-cyan-700',
  green:  'bg-emerald-50 border-emerald-200 text-emerald-700',
  amber:  'bg-amber-50 border-amber-200 text-amber-700',
  pink:   'bg-pink-50 border-pink-200 text-pink-700',
};

function StatCardComponent({ card, isLightMode }: { card: StatCard; isLightMode: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 transition-all hover:scale-[1.01]
      ${isLightMode
        ? `${COLOR_LIGHT[card.color]} shadow-sm`
        : `bg-gradient-to-br ${COLOR_CLASSES[card.color]}`
      }`}>
      <div className="flex items-start justify-between mb-2">
        <span className={`text-xs font-semibold uppercase tracking-wider
          ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
          {card.label}
        </span>
        <span className="opacity-60">{card.icon}</span>
      </div>
      <p className="text-2xl font-bold tracking-tight">{card.value}</p>
      {card.subtext && (
        <p className={`text-xs mt-1 ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
          {card.subtext}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────────

export default function SimpleDashboardPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const dashboardId = params.id;

  const [mounted, setMounted] = useState(false);
  const [usuarioNombre, setUsuarioNombre] = useState('');
  const [isLightMode, setIsLightMode] = useState(false);

  // Modal de nueva fila
  const [filaModalOpen, setFilaModalOpen] = useState(false);

  // ── Auth + tema ─────────────────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') ?? 'dark';
    setIsLightMode(savedTheme === 'light');

    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!userStr || !token) { router.replace('/'); return; }
    try {
      const user = JSON.parse(userStr);
      setUsuarioNombre(
        user.nombre || user.user_metadata?.nombre || user.email?.split('@')[0] || 'Usuario'
      );
    } catch { router.replace('/'); }
  }, [router]);

  useEffect(() => {
    document.body.classList.toggle('light-mode', isLightMode);
  }, [isLightMode]);

  const toggleTheme = () => {
    const next = !isLightMode;
    setIsLightMode(next);
    localStorage.setItem('theme', next ? 'light' : 'dark');
  };

  // ── Dashboard data ─────────────────────────────────────────────────────────
  const {
    dashboard, loading, saving, error, tablaActiva,
    seleccionarTabla, recargar, limpiarError,
    handleCreateFila,
  } = useDashboard(dashboardId);

  // Estadísticas calculadas en tiempo real
  const stats = useMemo(() =>
    tablaActiva ? calcularStats(tablaActiva) : [],
    [tablaActiva]
  );

  const handleSubmitFila = useCallback(async (data: FormData) => {
    if (!tablaActiva) return;
    const res = await handleCreateFila(tablaActiva.id, { datos: data });
    if (res) setFilaModalOpen(false);
  }, [tablaActiva, handleCreateFila]);

  if (!mounted) return null;

  // ── Clases ──────────────────────────────────────────────────────────────────
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

  return (
    <div className={pageClass}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className={headerClass}>
        <div className="w-full px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push('/proyectos')}
              className={`flex items-center gap-1.5 text-sm transition-colors flex-shrink-0
                ${isLightMode ? 'text-gray-500 hover:text-gray-900' : 'text-gray-400 hover:text-white'}`}
            >
              <ArrowLeft className="w-4 h-4" />
              Proyectos
            </button>
            <span className={isLightMode ? 'text-gray-300' : 'text-gray-700'}>/</span>
            <div className="flex items-center gap-2 min-w-0">
              <Image src="/new_logo.png" alt="GenIA" width={26} height={26} className="object-contain flex-shrink-0" />
              <span className="text-base font-bold tracking-wide truncate
                bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent">
                {dashboard?.nombre ?? 'Cargando…'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Ir al editor (acceso rápido) */}
            <button
              onClick={() => router.push(`/proyectos/${dashboardId}`)}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
                ${isLightMode
                  ? 'border-gray-300 text-gray-600 hover:bg-gray-100'
                  : 'border-purple-500/20 text-purple-400 hover:bg-purple-500/10'
                }`}
            >
              ✏️ Editor
            </button>

            <button onClick={recargar} disabled={loading || saving}
              className={`p-2 rounded-xl border transition-all disabled:opacity-40
                ${isLightMode ? 'border-gray-200 text-gray-500 hover:bg-gray-100' : 'border-purple-500/20 text-gray-400 hover:bg-white/5'}`}>
              <RefreshCw className={`w-4 h-4 ${(loading || saving) ? 'animate-spin' : ''}`} />
            </button>

            <button onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-all
                ${isLightMode ? 'bg-purple-100 border-purple-200 text-purple-600' : 'bg-purple-500/10 border-purple-500/20 text-purple-400'}`}>
              {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <span className={`text-sm font-semibold hidden md:block
              ${isLightMode ? 'text-gray-700' : 'text-gray-300'}`}>
              {usuarioNombre}
            </span>

            <button
              onClick={() => { localStorage.removeItem('user'); localStorage.removeItem('token'); router.push('/'); }}
              className="p-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── LOADING ─────────────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-t-purple-500 border-purple-500/20 rounded-full animate-spin" />
          <p className={`text-sm ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>Cargando proyecto…</p>
        </div>
      )}

      {/* ── ERROR CRÍTICO ───────────────────────────────────────────────────── */}
      {!loading && !dashboard && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
          <AlertCircle className={`w-12 h-12 ${isLightMode ? 'text-red-500' : 'text-red-400'}`} />
          <div className="text-center">
            <h2 className={`text-xl font-bold mb-2 ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
              No se pudo cargar el proyecto
            </h2>
            <p className={`text-sm ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {error ?? 'Verifica tu conexión e inténtalo de nuevo.'}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={recargar}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              Reintentar
            </button>
            <button onClick={() => router.push('/proyectos')}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold border
                ${isLightMode ? 'border-gray-300 text-gray-700' : 'border-white/10 text-gray-300'}`}>
              Volver
            </button>
          </div>
        </div>
      )}

      {/* ── CONTENIDO PRINCIPAL ─────────────────────────────────────────────── */}
      {!loading && dashboard && (
        <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 57px)' }}>

          {/* ── Sidebar (readonly) ───────────────────────────────────────── */}
          <aside className={`w-56 flex-shrink-0 border-r overflow-y-auto transition-colors duration-300
            ${isLightMode ? 'border-gray-200 bg-white/50' : 'border-purple-500/10 bg-[#0a0a0a]/40'}`}>
            <div className="p-4">
              <DynamicSidebar
                tablas={dashboard.tablas}
                tablaActivaId={tablaActiva?.id ?? null}
                isLightMode={isLightMode}
                saving={saving}
                readonly={true}
                onSelectTabla={seleccionarTabla}
                onAddTabla={() => {}}
                onRenameTabla={() => {}}
                onDeleteTabla={() => {}}
              />
            </div>
          </aside>

          {/* ── Área principal ───────────────────────────────────────────── */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">

              {/* Sin módulos */}
              {dashboard.tablas.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                  <Database className={`w-14 h-14 ${isLightMode ? 'text-gray-300' : 'text-gray-600'}`} />
                  <p className={`text-lg font-semibold ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                    Este proyecto no tiene módulos todavía
                  </p>
                  <button
                    onClick={() => router.push(`/proyectos/${dashboardId}`)}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold
                      bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                    Ir al Editor para configurar módulos
                  </button>
                </div>
              )}

              {tablaActiva && (
                <>
                  {/* Encabezado del módulo */}
                  <div>
                    <h1 className={`text-2xl font-bold ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                      {tablaActiva.etiqueta}
                    </h1>
                    <p className={`text-sm mt-0.5 ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {tablaActiva.columnas.length} campo{tablaActiva.columnas.length !== 1 ? 's' : ''}
                      {' · '}
                      {tablaActiva.filas.length} registro{tablaActiva.filas.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Estadísticas */}
                  {stats.length > 0 && (
                    <div>
                      <h2 className={`text-xs font-bold uppercase tracking-widest mb-3
                        ${isLightMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Estadísticas en tiempo real
                      </h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {stats.map((card, i) => (
                          <StatCardComponent key={i} card={card} isLightMode={isLightMode} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Separador */}
                  <div className={`border-t ${isLightMode ? 'border-gray-200' : 'border-purple-500/10'}`} />

                  {/* Grid de datos — readonly (sin editar/eliminar registros, sí agregar) */}
                  <DynamicDataGrid
                    tabla={tablaActiva}
                    isLightMode={isLightMode}
                    saving={saving}
                    readonly={true}
                    onAddFila={() => setFilaModalOpen(true)}
                    onEditFila={() => {}}
                    onDeleteFila={() => {}}
                    onOpenColumnEditor={() => {}}
                  />
                </>
              )}
            </div>
          </main>
        </div>
      )}

      {/* ── Toast de error ──────────────────────────────────────────────────── */}
      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3
          px-5 py-3 rounded-2xl shadow-2xl border bg-red-950/90 border-red-500/30 text-red-300 backdrop-blur-md">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span className="text-sm font-medium">{error}</span>
          <button onClick={limpiarError} className="ml-2 p-0.5 rounded hover:bg-red-500/20">
            ✕
          </button>
        </div>
      )}

      {/* ── Modal: Nuevo registro ───────────────────────────────────────────── */}
      <DynamicModal
        isOpen={filaModalOpen}
        onClose={() => setFilaModalOpen(false)}
        title={`Nuevo registro — ${tablaActiva?.etiqueta ?? ''}`}
        maxWidth="xl"
        isLightMode={isLightMode}
        saving={saving}
      >
        {tablaActiva && (
          <DynamicForm
            columnas={tablaActiva.columnas}
            onSubmit={handleSubmitFila}
            onCancel={() => setFilaModalOpen(false)}
            submitLabel="Agregar registro"
            isLightMode={isLightMode}
            saving={saving}
          />
        )}
      </DynamicModal>
    </div>
  );
}
