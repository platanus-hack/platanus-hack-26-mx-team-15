'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft, RefreshCw, Sun, Moon,
  AlertCircle, X, Plus, Database,
} from 'lucide-react';

import { useDashboard } from '@/hooks/useDashboard';
import DynamicSidebar from '@/components/DynamicSidebar';
import DynamicDataGrid from '@/components/DynamicDataGrid';
import DynamicModal from '@/components/DynamicModal';
import DynamicForm, { type FormData } from '@/components/DynamicForm';
import DynamicColumnEditor from '@/components/DynamicColumnEditor';
import type {
  Fila,
  CrearTablaPayload,
  CrearColumnaPayload,
  ActualizarColumnaPayload,
} from '@/types/dashboard';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos locales
// ─────────────────────────────────────────────────────────────────────────────

type FilaModal = 'create' | 'edit' | null;

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: formulario para crear una nueva tabla
// ─────────────────────────────────────────────────────────────────────────────

function NuevaTablaForm({
  isLightMode,
  saving,
  onSubmit,
  onCancel,
}: {
  isLightMode: boolean;
  saving: boolean;
  onSubmit: (payload: CrearTablaPayload) => void;
  onCancel: () => void;
}) {
  const [nombre, setNombre] = useState('');
  const [etiqueta, setEtiqueta] = useState('');
  const [error, setError] = useState('');

  const inputClass = `w-full px-3 py-2.5 text-sm rounded-xl border transition-colors
    focus:outline-none focus:border-purple-500
    ${isLightMode
      ? 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
      : 'bg-[#18182a]/60 border-purple-500/20 text-white placeholder-gray-500'
    }`;

  const labelClass = `block text-xs font-semibold mb-1.5 ${isLightMode ? 'text-gray-600' : 'text-gray-300'}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError('El nombre interno es requerido'); return; }
    setError('');
    onSubmit({
      nombre: nombre.trim().replace(/\s+/g, '_').toLowerCase(),
      etiqueta: etiqueta.trim() || nombre.trim(),
      icono: 'table',
      orden: 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div>
        <label className={labelClass}>
          Nombre interno <span className="text-red-400">*</span>
          <span className={`ml-1 text-[10px] font-normal ${isLightMode ? 'text-gray-400' : 'text-gray-500'}`}>
            (sin espacios, se usará como identificador)
          </span>
        </label>
        <input
          type="text"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          placeholder="ej: productos, clientes, ventas…"
          className={inputClass}
          autoFocus
        />
      </div>

      <div>
        <label className={labelClass}>
          Nombre visible
        </label>
        <input
          type="text"
          value={etiqueta}
          onChange={e => setEtiqueta(e.target.value)}
          placeholder="ej: Productos, Clientes, Ventas…"
          className={inputClass}
        />
        <p className={`mt-1 text-[11px] ${isLightMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Si lo dejas vacío se usará el nombre interno.
        </p>
      </div>

      <div className={`flex gap-3 pt-2 border-t ${isLightMode ? 'border-gray-200' : 'border-purple-500/10'}`}>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold
            bg-gradient-to-r from-purple-600 to-pink-600 text-white
            hover:shadow-lg hover:shadow-purple-500/30 transition-all
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Creando…' : 'Crear módulo'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all
            disabled:opacity-40
            ${isLightMode
              ? 'border-gray-300 text-gray-600 hover:bg-gray-100'
              : 'border-white/10 text-gray-400 hover:bg-white/5'
            }`}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: Toast de error
// ─────────────────────────────────────────────────────────────────────────────

function ErrorToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3
      px-5 py-3 rounded-2xl shadow-2xl border
      bg-red-950/90 border-red-500/30 text-red-300 backdrop-blur-md
      animate-in slide-in-from-bottom-4 duration-300"
    >
      <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
      <span className="text-sm font-medium max-w-sm">{message}</span>
      <button
        onClick={onDismiss}
        className="ml-2 p-0.5 rounded-md hover:bg-red-500/20 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const dashboardId = params.id;

  // ── Auth ───────────────────────────────────────────────────────────────────
  const [mounted, setMounted] = useState(false);
  const [usuarioNombre, setUsuarioNombre] = useState('');
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setIsLightMode(savedTheme === 'light');

    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!userStr || !token) {
      router.replace('/');
      return;
    }
    try {
      const user = JSON.parse(userStr);
      setUsuarioNombre(
        user.nombre || user.user_metadata?.nombre || user.email?.split('@')[0] || 'Usuario'
      );
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

  // ── Dashboard data ─────────────────────────────────────────────────────────
  const {
    dashboard,
    loading,
    saving,
    error,
    tablaActiva,
    seleccionarTabla,
    recargar,
    limpiarError,
    handleUpdateEstilo,
    handleCreateTabla,
    handleUpdateTabla,
    handleDeleteTabla,
    handleCreateColumna,
    handleUpdateColumna,
    handleDeleteColumna,
    handleCreateFila,
    handleUpdateFila,
    handleDeleteFila,
  } = useDashboard(dashboardId);

  // ── Estado de modales ──────────────────────────────────────────────────────
  const [filaModal, setFilaModal] = useState<FilaModal>(null);
  const [filaEditar, setFilaEditar] = useState<Fila | null>(null);
  const [columnaModalOpen, setColumnaModalOpen] = useState(false);
  const [nuevaTablaModalOpen, setNuevaTablaModalOpen] = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────────

  // Filas
  const handleOpenCreateFila = useCallback(() => {
    setFilaEditar(null);
    setFilaModal('create');
  }, []);

  const handleOpenEditFila = useCallback((fila: Fila) => {
    setFilaEditar(fila);
    setFilaModal('edit');
  }, []);

  const handleSubmitFila = useCallback(async (data: FormData) => {
    if (!tablaActiva) return;
    if (filaModal === 'create') {
      const res = await handleCreateFila(tablaActiva.id, { datos: data });
      if (res) setFilaModal(null);
    } else if (filaModal === 'edit' && filaEditar) {
      const res = await handleUpdateFila(tablaActiva.id, filaEditar.id, { datos: data });
      if (res) setFilaModal(null);
    }
  }, [tablaActiva, filaModal, filaEditar, handleCreateFila, handleUpdateFila]);

  const handleDeleteFilaCallback = useCallback(async (filaId: string) => {
    if (!tablaActiva) return;
    await handleDeleteFila(tablaActiva.id, filaId);
  }, [tablaActiva, handleDeleteFila]);

  // Columnas
  const handleAddColumna = useCallback(async (payload: CrearColumnaPayload) => {
    if (!tablaActiva) return;
    await handleCreateColumna(tablaActiva.id, payload);
  }, [tablaActiva, handleCreateColumna]);

  const handleUpdateColumnaCallback = useCallback(async (columnaId: string, payload: ActualizarColumnaPayload) => {
    if (!tablaActiva) return;
    await handleUpdateColumna(tablaActiva.id, columnaId, payload);
  }, [tablaActiva, handleUpdateColumna]);

  const handleDeleteColumnaCallback = useCallback(async (columnaId: string) => {
    if (!tablaActiva) return;
    await handleDeleteColumna(tablaActiva.id, columnaId);
  }, [tablaActiva, handleDeleteColumna]);

  // Tablas
  const handleAddTabla = useCallback(async (payload: CrearTablaPayload) => {
    const res = await handleCreateTabla(payload);
    if (res) setNuevaTablaModalOpen(false);
  }, [handleCreateTabla]);

  const handleRenameTabla = useCallback(async (tablaId: string, nuevaEtiqueta: string) => {
    await handleUpdateTabla(tablaId, { etiqueta: nuevaEtiqueta });
  }, [handleUpdateTabla]);

  const handleDeleteTablaCallback = useCallback(async (tablaId: string) => {
    await handleDeleteTabla(tablaId);
  }, [handleDeleteTabla]);

  // ── Render guard ───────────────────────────────────────────────────────────
  if (!mounted) return null;

  // ── Clases reutilizables ───────────────────────────────────────────────────
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

  const sidebarClass = `w-64 flex-shrink-0 border-r transition-colors duration-300
    ${isLightMode
      ? 'border-gray-200 bg-white/50'
      : 'border-purple-500/10 bg-[#0a0a0a]/40'
    }`;

  return (
    <div className={pageClass}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className={headerClass}>
        <div className="w-full px-6 py-3 flex items-center justify-between gap-4">

          {/* Izquierda: back + logo + nombre dashboard */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push('/proyectos')}
              className={`flex items-center gap-1.5 text-sm transition-colors flex-shrink-0
                ${isLightMode ? 'text-gray-500 hover:text-gray-900' : 'text-gray-400 hover:text-white'}`}
            >
              <ArrowLeft className="w-4 h-4" />
              Panel
            </button>

            <span className={isLightMode ? 'text-gray-300' : 'text-gray-700'}>/</span>

            <div className="flex items-center gap-2 min-w-0">
              <Image
                src="/new_logo.png"
                alt="GenIA"
                width={28}
                height={28}
                className="object-contain flex-shrink-0"
              />
              <span className="text-lg font-bold tracking-wider bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent flex-shrink-0">
                GenIA
              </span>
            </div>

            {dashboard && (
              <>
                <span className={isLightMode ? 'text-gray-300' : 'text-gray-700'}>/</span>
                <span className={`font-semibold truncate
                  ${isLightMode ? 'text-purple-700' : 'text-purple-400'}`}>
                  {dashboard.nombre}
                </span>
              </>
            )}
          </div>

          {/* Derecha: recargar + theme toggle + usuario */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={recargar}
              disabled={loading || saving}
              className={`p-2 rounded-xl border transition-all disabled:opacity-40
                ${isLightMode
                  ? 'border-gray-200 text-gray-500 hover:bg-gray-100'
                  : 'border-purple-500/20 text-gray-400 hover:bg-white/5'
                }`}
              title="Recargar datos"
            >
              <RefreshCw className={`w-4 h-4 ${(loading || saving) ? 'animate-spin' : ''}`} />
            </button>

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

            <div className={`text-sm font-semibold ${isLightMode ? 'text-gray-700' : 'text-gray-300'}`}>
              {usuarioNombre}
            </div>
          </div>
        </div>
      </header>

      {/* ── LOADING ────────────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-t-purple-500 border-purple-500/20 rounded-full animate-spin" />
          <p className={`text-sm font-medium ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Cargando dashboard…
          </p>
        </div>
      )}

      {/* ── ERROR CRÍTICO (sin dashboard) ──────────────────────────────────── */}
      {!loading && !dashboard && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center
            ${isLightMode ? 'bg-red-100' : 'bg-red-500/10'}`}>
            <AlertCircle className={`w-10 h-10 ${isLightMode ? 'text-red-500' : 'text-red-400'}`} />
          </div>
          <div className="text-center space-y-2">
            <h1 className={`text-2xl font-bold ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
              No se pudo cargar el dashboard
            </h1>
            <p className={`text-sm max-w-md ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {error ?? 'No tienes acceso a este dashboard o no existe.'}
            </p>
          </div>
          <button
            onClick={() => router.push('/proyectos')}
            className="px-6 py-3 rounded-xl font-semibold text-sm
              bg-gradient-to-r from-purple-600 to-pink-600 text-white
              hover:shadow-lg hover:shadow-purple-500/30 transition-all"
          >
            Volver a mis proyectos
          </button>
        </div>
      )}

      {/* ── CONTENIDO PRINCIPAL ─────────────────────────────────────────────── */}
      {!loading && dashboard && (
        <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 57px)' }}>

          {/* ── Sidebar ──────────────────────────────────────────────────── */}
          <aside className={`${sidebarClass} overflow-y-auto`}>
            <div className="p-4">
              {/* Estilo activo: muestra los colores del tema */}
              {dashboard.estilos.length > 0 && (() => {
                const estilo = dashboard.estilos.find(e => e.activo) ?? dashboard.estilos[0];
                return (
                  <div className={`mb-4 p-3 rounded-xl border
                    ${isLightMode ? 'border-gray-200 bg-gray-50' : 'border-purple-500/10 bg-[#11111e]/40'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full border border-white/20"
                          style={{ backgroundColor: estilo.color_primario }} />
                        <div className="w-3 h-3 rounded-full border border-white/20"
                          style={{ backgroundColor: estilo.color_secundario }} />
                        <div className="w-3 h-3 rounded-full border border-white/20"
                          style={{ backgroundColor: estilo.color_acento }} />
                      </div>
                      <span className={`text-xs font-medium truncate
                        ${isLightMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {estilo.nombre}
                      </span>
                    </div>
                    <div className={`flex gap-3 text-[11px]
                      ${isLightMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <span>{dashboard.moneda}</span>
                      <span>{dashboard.idioma.toUpperCase()}</span>
                    </div>
                  </div>
                );
              })()}

              <DynamicSidebar
                tablas={dashboard.tablas}
                tablaActivaId={tablaActiva?.id ?? null}
                isLightMode={isLightMode}
                saving={saving}
                onSelectTabla={seleccionarTabla}
                onAddTabla={() => setNuevaTablaModalOpen(true)}
                onRenameTabla={handleRenameTabla}
                onDeleteTabla={handleDeleteTablaCallback}
              />
            </div>
          </aside>

          {/* ── Área de contenido ────────────────────────────────────────── */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-6">

              {/* Sin tablas: empty state */}
              {dashboard.tablas.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-6">
                  <div className={`w-24 h-24 rounded-3xl flex items-center justify-center
                    ${isLightMode
                      ? 'bg-purple-100 border border-purple-200'
                      : 'bg-purple-500/10 border border-purple-500/20'
                    }`}>
                    <Database className={`w-12 h-12 ${isLightMode ? 'text-purple-500' : 'text-purple-400'}`} />
                  </div>
                  <div className="text-center space-y-3 max-w-md">
                    <h2 className={`text-3xl font-bold ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                      Sin módulos todavía
                    </h2>
                    <p className={`${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Este dashboard no tiene ningún módulo. Agrega el primero para comenzar a registrar datos.
                    </p>
                  </div>
                  <button
                    onClick={() => setNuevaTablaModalOpen(true)}
                    className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg
                      bg-gradient-to-r from-purple-600 to-pink-600 text-white
                      hover:shadow-2xl hover:shadow-purple-500/50 transition-all transform hover:scale-105"
                  >
                    <Plus className="w-5 h-5" />
                    Crear primer módulo
                  </button>
                </div>
              )}

              {/* Tabla activa: DataGrid */}
              {tablaActiva && (
                <div className="space-y-4">
                  {/* Encabezado de la tabla */}
                  <div>
                    <h1 className={`text-2xl font-bold tracking-wide
                      ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
                      {tablaActiva.etiqueta}
                    </h1>
                    <p className={`text-sm mt-0.5
                      ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {tablaActiva.columnas.length} campo{tablaActiva.columnas.length !== 1 ? 's' : ''}
                      {' · '}
                      {tablaActiva.filas.length} registro{tablaActiva.filas.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Separador */}
                  <div className={`border-t ${isLightMode ? 'border-gray-200' : 'border-purple-500/10'}`} />

                  <DynamicDataGrid
                    tabla={tablaActiva}
                    isLightMode={isLightMode}
                    saving={saving}
                    onAddFila={handleOpenCreateFila}
                    onEditFila={handleOpenEditFila}
                    onDeleteFila={handleDeleteFilaCallback}
                    onOpenColumnEditor={() => setColumnaModalOpen(true)}
                  />
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {/* ── MODAL: Nuevo registro ─────────────────────────────────────────── */}
      <DynamicModal
        isOpen={filaModal === 'create'}
        onClose={() => setFilaModal(null)}
        title={`Nuevo registro — ${tablaActiva?.etiqueta ?? ''}`}
        maxWidth="xl"
        isLightMode={isLightMode}
        saving={saving}
      >
        {tablaActiva && (
          <DynamicForm
            columnas={tablaActiva.columnas}
            onSubmit={handleSubmitFila}
            onCancel={() => setFilaModal(null)}
            submitLabel="Agregar registro"
            isLightMode={isLightMode}
            saving={saving}
          />
        )}
      </DynamicModal>

      {/* ── MODAL: Editar registro ────────────────────────────────────────── */}
      <DynamicModal
        isOpen={filaModal === 'edit'}
        onClose={() => { setFilaModal(null); setFilaEditar(null); }}
        title={`Editar registro — ${tablaActiva?.etiqueta ?? ''}`}
        maxWidth="xl"
        isLightMode={isLightMode}
        saving={saving}
      >
        {tablaActiva && filaEditar && (
          <DynamicForm
            columnas={tablaActiva.columnas}
            initialData={filaEditar.datos}
            onSubmit={handleSubmitFila}
            onCancel={() => { setFilaModal(null); setFilaEditar(null); }}
            submitLabel="Guardar cambios"
            isLightMode={isLightMode}
            saving={saving}
          />
        )}
      </DynamicModal>

      {/* ── MODAL: Editor de campos ───────────────────────────────────────── */}
      <DynamicModal
        isOpen={columnaModalOpen}
        onClose={() => setColumnaModalOpen(false)}
        title={`Campos — ${tablaActiva?.etiqueta ?? ''}`}
        maxWidth="2xl"
        isLightMode={isLightMode}
        saving={saving}
      >
        {tablaActiva && (
          <DynamicColumnEditor
            columnas={tablaActiva.columnas}
            isLightMode={isLightMode}
            saving={saving}
            onAddColumna={handleAddColumna}
            onUpdateColumna={handleUpdateColumnaCallback}
            onDeleteColumna={handleDeleteColumnaCallback}
          />
        )}
      </DynamicModal>

      {/* ── MODAL: Nueva tabla ───────────────────────────────────────────── */}
      <DynamicModal
        isOpen={nuevaTablaModalOpen}
        onClose={() => setNuevaTablaModalOpen(false)}
        title="Nuevo módulo"
        maxWidth="md"
        isLightMode={isLightMode}
        saving={saving}
      >
        <NuevaTablaForm
          isLightMode={isLightMode}
          saving={saving}
          onSubmit={handleAddTabla}
          onCancel={() => setNuevaTablaModalOpen(false)}
        />
      </DynamicModal>

      {/* ── Toast de errores ─────────────────────────────────────────────── */}
      {error && (
        <ErrorToast message={error} onDismiss={limpiarError} />
      )}
    </div>
  );
}
