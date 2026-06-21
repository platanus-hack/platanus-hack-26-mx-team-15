'use client';

import { useState } from 'react';
import {
  Plus, Pencil, Trash2, Check, X,
  Users, Package, ShoppingCart, Calendar, DollarSign,
  FileText, Truck, Wrench, BarChart2, Layers,
  CreditCard, Bell, Briefcase, Tag, Table2,
  ClipboardList, Star, Settings, Home, Box,
} from 'lucide-react';
import type { Tabla } from '@/types/dashboard';

// ─────────────────────────────────────────────────────────────────────────────
// Mapa de iconos: nombre (string del backend) → componente Lucide
// ─────────────────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  users: Users,
  user: Users,
  clientes: Users,
  package: Package,
  productos: Package,
  box: Box,
  inventario: Package,
  'shopping-cart': ShoppingCart,
  ventas: ShoppingCart,
  calendar: Calendar,
  citas: Calendar,
  reservaciones: Calendar,
  'dollar-sign': DollarSign,
  cobranza: DollarSign,
  facturación: CreditCard,
  facturacion: CreditCard,
  'credit-card': CreditCard,
  truck: Truck,
  proveedores: Truck,
  compras: ShoppingCart,
  wrench: Wrench,
  'bar-chart': BarChart2,
  reportes: BarChart2,
  layers: Layers,
  'file-text': FileText,
  documentos: FileText,
  bell: Bell,
  briefcase: Briefcase,
  empleados: Briefcase,
  nómina: DollarSign,
  nomina: DollarSign,
  tag: Tag,
  table: Table2,
  'clipboard-list': ClipboardList,
  star: Star,
  settings: Settings,
  home: Home,
  membresias: Star,
  membresías: Star,
};

function TablaIcon({ nombre, className }: { nombre: string; className?: string }) {
  const key = nombre.toLowerCase().replace(/\s+/g, '-');
  const Icon = ICON_MAP[key] ?? Table2;
  return <Icon className={className ?? 'w-4 h-4'} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal de edición de tabla (nombre + etiqueta)
// ─────────────────────────────────────────────────────────────────────────────

interface EditTablaFormProps {
  tabla: Tabla;
  isLightMode: boolean;
  onSave: (etiqueta: string) => void;
  onCancel: () => void;
  saving: boolean;
}

function EditTablaForm({ tabla, isLightMode, onSave, onCancel, saving }: EditTablaFormProps) {
  const [etiqueta, setEtiqueta] = useState(tabla.etiqueta);

  const inputClass = `w-full px-3 py-2 text-sm rounded-xl border transition-colors
    focus:outline-none focus:border-purple-500
    ${isLightMode
      ? 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
      : 'bg-[#18182a]/60 border-purple-500/20 text-white placeholder-gray-500'
    }`;

  return (
    <div className={`mx-2 mb-1 p-3 rounded-xl border
      ${isLightMode ? 'bg-purple-50 border-purple-200' : 'bg-purple-500/10 border-purple-500/20'}`}>
      <p className={`text-xs font-semibold mb-2 ${isLightMode ? 'text-purple-700' : 'text-purple-300'}`}>
        Renombrar módulo
      </p>
      <input
        type="text"
        value={etiqueta}
        onChange={e => setEtiqueta(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') onSave(etiqueta);
          if (e.key === 'Escape') onCancel();
        }}
        className={inputClass}
        autoFocus
      />
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => onSave(etiqueta)}
          disabled={saving || !etiqueta.trim()}
          className="flex-1 py-1.5 text-xs font-semibold rounded-lg
            bg-purple-600 text-white hover:bg-purple-700 transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? '…' : 'Guardar'}
        </button>
        <button
          onClick={onCancel}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors
            ${isLightMode
              ? 'border-gray-300 text-gray-600 hover:bg-gray-100'
              : 'border-white/10 text-gray-400 hover:bg-white/5'
            }`}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Props del componente principal
// ─────────────────────────────────────────────────────────────────────────────

interface DynamicSidebarProps {
  tablas: Tabla[];
  tablaActivaId: string | null;
  isLightMode?: boolean;
  saving?: boolean;
  /** Si true: oculta botones de agregar, renombrar y eliminar módulos */
  readonly?: boolean;
  onSelectTabla: (tablaId: string) => void;
  onAddTabla: () => void;
  onRenameTabla: (tablaId: string, nuevaEtiqueta: string) => void;
  onDeleteTabla: (tablaId: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

export default function DynamicSidebar({
  tablas,
  tablaActivaId,
  isLightMode = false,
  saving = false,
  readonly = false,
  onSelectTabla,
  onAddTabla,
  onRenameTabla,
  onDeleteTabla,
}: DynamicSidebarProps) {
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleRename = (tablaId: string, etiqueta: string) => {
    if (!etiqueta.trim()) return;
    onRenameTabla(tablaId, etiqueta.trim());
    setEditandoId(null);
  };

  const handleDelete = (tablaId: string) => {
    if (confirmDeleteId === tablaId) {
      onDeleteTabla(tablaId);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(tablaId);
      setEditandoId(null);
    }
  };

  return (
    <nav className="flex flex-col gap-1">
      {/* Header */}
      <div className={`flex items-center justify-between px-2 pb-2 mb-1 border-b
        ${isLightMode ? 'border-gray-200' : 'border-purple-500/10'}`}>
        <span className={`text-xs font-bold uppercase tracking-widest
          ${isLightMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Módulos
        </span>
        {!readonly && <button
          onClick={onAddTabla}
          disabled={saving}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold
            transition-all disabled:opacity-40 disabled:cursor-not-allowed
            ${isLightMode
              ? 'text-purple-600 hover:bg-purple-50 border border-purple-200'
              : 'text-purple-400 hover:bg-purple-500/10 border border-purple-500/20'
            }`}
          title="Agregar módulo"
        >
          <Plus className="w-3.5 h-3.5" />
          Nuevo
        </button>}
      </div>

      {/* Lista de tablas */}
      {tablas.length === 0 ? (
        <div className={`px-2 py-6 text-center text-xs
          ${isLightMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <Table2 className="w-6 h-6 mx-auto mb-2 opacity-40" />
          <p>No hay módulos</p>
          <p className="mt-1">Agrega el primero</p>
        </div>
      ) : (
        tablas.map(tabla => {
          const isActive = tabla.id === tablaActivaId;
          const isEditing = editandoId === tabla.id;
          const isConfirmingDelete = confirmDeleteId === tabla.id;

          return (
            <div key={tabla.id}>
              {/* Ítem principal */}
              <div
                className={`
                  group relative flex items-center gap-2 px-3 py-2.5 rounded-xl
                  cursor-pointer transition-all duration-200 select-none
                  ${isActive
                    ? isLightMode
                      ? 'bg-purple-100 border border-purple-300 text-purple-700 shadow-sm'
                      : 'bg-purple-600/20 border border-purple-500/30 text-white'
                    : isLightMode
                      ? 'text-gray-600 hover:bg-gray-100 border border-transparent'
                      : 'text-gray-400 hover:bg-white/5 border border-transparent'
                  }
                `}
                onClick={() => {
                  setEditandoId(null);
                  setConfirmDeleteId(null);
                  onSelectTabla(tabla.id);
                }}
              >
                {/* Icono */}
                <TablaIcon
                  nombre={tabla.icono || tabla.nombre}
                  className={`w-4 h-4 flex-shrink-0
                    ${isActive
                      ? isLightMode ? 'text-purple-600' : 'text-purple-400'
                      : isLightMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                />

                {/* Nombre */}
                <span className="flex-1 text-sm font-semibold tracking-wide truncate">
                  {tabla.etiqueta}
                </span>

                {/* Badge: número de registros */}
                {tabla.filas.length > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0
                    ${isActive
                      ? isLightMode ? 'bg-purple-200 text-purple-700' : 'bg-purple-500/30 text-purple-300'
                      : isLightMode ? 'bg-gray-200 text-gray-500' : 'bg-white/10 text-gray-500'
                    }`}>
                    {tabla.filas.length}
                  </span>
                )}

                {/* Acciones: visibles sólo con hover — ocultas en modo readonly */}
                {!readonly && !isConfirmingDelete && (
                  <div className={`flex items-center gap-0.5 flex-shrink-0 transition-opacity
                    ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Renombrar */}
                    <button
                      onClick={() => {
                        setEditandoId(editandoId === tabla.id ? null : tabla.id);
                        setConfirmDeleteId(null);
                      }}
                      disabled={saving}
                      className={`p-1 rounded-md transition-colors disabled:opacity-40
                        ${isLightMode
                          ? 'text-gray-400 hover:text-purple-600 hover:bg-purple-100'
                          : 'text-gray-600 hover:text-purple-400 hover:bg-purple-500/10'
                        }`}
                      title="Renombrar"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>

                    {/* Eliminar */}
                    <button
                      onClick={() => handleDelete(tabla.id)}
                      disabled={saving}
                      className={`p-1 rounded-md transition-colors disabled:opacity-40
                        ${isLightMode
                          ? 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                          : 'text-gray-600 hover:text-red-400 hover:bg-red-500/10'
                        }`}
                      title="Eliminar módulo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Confirmación de eliminación — oculta en modo readonly */}
                {!readonly && isConfirmingDelete && (
                  <div
                    className="flex items-center gap-0.5 flex-shrink-0"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleDelete(tabla.id)}
                      disabled={saving}
                      className="p-1 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-40"
                      title="Confirmar eliminación"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className={`p-1 rounded-md transition-colors
                        ${isLightMode ? 'text-gray-400 hover:bg-gray-100' : 'text-gray-500 hover:bg-white/10'}`}
                      title="Cancelar"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Panel de edición inline */}
              {isEditing && (
                <EditTablaForm
                  tabla={tabla}
                  isLightMode={isLightMode}
                  saving={saving}
                  onSave={etiqueta => handleRename(tabla.id, etiqueta)}
                  onCancel={() => setEditandoId(null)}
                />
              )}
            </div>
          );
        })
      )}
    </nav>
  );
}
