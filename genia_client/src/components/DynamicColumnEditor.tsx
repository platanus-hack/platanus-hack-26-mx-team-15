'use client';

import { useState } from 'react';
import {
  Plus, Pencil, Trash2, Check, X,
  AlertCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import type { Columna, CrearColumnaPayload, ActualizarColumnaPayload } from '@/types/dashboard';

// ─────────────────────────────────────────────────────────────────────────────
// Opciones de configuración de columna
// ─────────────────────────────────────────────────────────────────────────────

const TIPO_DATO_OPTS = [
  { value: 'string',   label: 'Texto corto' },
  { value: 'text',     label: 'Texto largo' },
  { value: 'integer',  label: 'Número entero' },
  { value: 'decimal',  label: 'Decimal' },
  { value: 'boolean',  label: 'Verdadero / Falso' },
  { value: 'date',     label: 'Fecha' },
  { value: 'datetime', label: 'Fecha y hora' },
  { value: 'email',    label: 'Correo electrónico' },
  { value: 'phone',    label: 'Teléfono' },
  { value: 'uuid',     label: 'UUID' },
];

const INPUT_TYPE_OPTS: Record<string, string> = {
  string:   'text',
  text:     'textarea',
  integer:  'number',
  decimal:  'number',
  boolean:  'switch',
  date:     'date',
  datetime: 'datetime-local',
  email:    'email',
  phone:    'tel',
  uuid:     'text',
};

const ANCHO_OPTS = [
  { value: 'full',  label: 'Completo (100%)' },
  { value: 'half',  label: 'Mitad (50%)' },
  { value: 'third', label: 'Tercio (33%)' },
];

// Badges de tipo para la lista
const TIPO_COLOR: Record<string, string> = {
  string:   'bg-blue-500/20 text-blue-400',
  text:     'bg-indigo-500/20 text-indigo-400',
  integer:  'bg-emerald-500/20 text-emerald-400',
  decimal:  'bg-teal-500/20 text-teal-400',
  boolean:  'bg-purple-500/20 text-purple-400',
  date:     'bg-orange-500/20 text-orange-400',
  datetime: 'bg-amber-500/20 text-amber-400',
  email:    'bg-pink-500/20 text-pink-400',
  phone:    'bg-rose-500/20 text-rose-400',
  uuid:     'bg-gray-500/20 text-gray-400',
};

// ─────────────────────────────────────────────────────────────────────────────
// Estado del formulario de columna
// ─────────────────────────────────────────────────────────────────────────────

interface ColFormState {
  nombre: string;
  etiqueta: string;
  tipo_dato: string;
  requerido: boolean;
  unico: boolean;
  ancho: string;
  max_length: string;
  placeholder: string;
  valor_defecto: string;
  valores_permitidos: string; // CSV separado por comas → se parsea a array
}

const EMPTY_FORM: ColFormState = {
  nombre: '',
  etiqueta: '',
  tipo_dato: 'string',
  requerido: false,
  unico: false,
  ancho: 'full',
  max_length: '',
  placeholder: '',
  valor_defecto: '',
  valores_permitidos: '',
};

function toPayload(form: ColFormState): CrearColumnaPayload {
  const input_type = INPUT_TYPE_OPTS[form.tipo_dato] ?? 'text';
  return {
    nombre: form.nombre.trim().replace(/\s+/g, '_').toLowerCase(),
    etiqueta: form.etiqueta.trim() || form.nombre.trim(),
    tipo_dato: form.tipo_dato,
    requerido: form.requerido,
    unico: form.unico,
    ancho: form.ancho,
    input_type,
    max_length: form.max_length ? parseInt(form.max_length, 10) : null,
    placeholder: form.placeholder.trim() || null,
    valor_defecto: form.valor_defecto.trim() || null,
    valores_permitidos: form.valores_permitidos
      ? form.valores_permitidos.split(',').map(v => v.trim()).filter(Boolean)
      : null,
    // Defaults seguros para campos no editables en este form
    mascara: null,
    multivalor: false,
    expresion_regular: null,
    condicion_visible: null,
    busqueda_habilitada: ['string', 'email', 'phone'].includes(form.tipo_dato),
    tabla_busqueda: null,
    orden: 0,
    icono: null,
    clase_css: null,
  };
}

function colToForm(col: Columna): ColFormState {
  return {
    nombre: col.nombre,
    etiqueta: col.etiqueta,
    tipo_dato: col.tipo_dato,
    requerido: col.requerido,
    unico: col.unico,
    ancho: col.ancho,
    max_length: col.max_length?.toString() ?? '',
    placeholder: col.placeholder ?? '',
    valor_defecto: col.valor_defecto ?? '',
    valores_permitidos: col.valores_permitidos?.join(', ') ?? '',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: formulario de columna (crear / editar)
// ─────────────────────────────────────────────────────────────────────────────

interface ColFormProps {
  initial?: ColFormState;
  isLightMode: boolean;
  saving: boolean;
  submitLabel: string;
  onSubmit: (form: ColFormState) => void;
  onCancel: () => void;
}

function ColForm({ initial = EMPTY_FORM, isLightMode, saving, submitLabel, onSubmit, onCancel }: ColFormProps) {
  const [form, setForm] = useState<ColFormState>(initial);
  const [error, setError] = useState('');

  const set = (key: keyof ColFormState, value: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) { setError('El nombre interno es requerido'); return; }
    if (!form.etiqueta.trim()) { setError('La etiqueta es requerida'); return; }
    setError('');
    onSubmit(form);
  };

  const inputClass = `w-full px-3 py-2 text-sm rounded-xl border transition-colors
    focus:outline-none focus:border-purple-500
    ${isLightMode
      ? 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
      : 'bg-[#18182a]/60 border-purple-500/20 text-white placeholder-gray-500'
    }`;

  const labelClass = `block text-xs font-semibold mb-1 ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`;

  const selectClass = `${inputClass} cursor-pointer`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Fila 1: nombre + etiqueta */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>
            Nombre interno <span className="text-red-400">*</span>
            <span className={`ml-1 text-[10px] font-normal ${isLightMode ? 'text-gray-400' : 'text-gray-500'}`}>
              (sin espacios)
            </span>
          </label>
          <input
            type="text"
            value={form.nombre}
            onChange={e => set('nombre', e.target.value)}
            placeholder="ej: nombre_completo"
            className={inputClass}
            autoFocus
          />
        </div>
        <div>
          <label className={labelClass}>
            Etiqueta <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.etiqueta}
            onChange={e => set('etiqueta', e.target.value)}
            placeholder="ej: Nombre Completo"
            className={inputClass}
          />
        </div>
      </div>

      {/* Fila 2: tipo + ancho */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Tipo de dato</label>
          <select
            value={form.tipo_dato}
            onChange={e => set('tipo_dato', e.target.value)}
            className={selectClass}
          >
            {TIPO_DATO_OPTS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Ancho en formulario</label>
          <select
            value={form.ancho}
            onChange={e => set('ancho', e.target.value)}
            className={selectClass}
          >
            {ANCHO_OPTS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Fila 3: max_length + placeholder */}
      {!['boolean', 'date', 'datetime'].includes(form.tipo_dato) && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Longitud máxima</label>
            <input
              type="number"
              min={1}
              value={form.max_length}
              onChange={e => set('max_length', e.target.value)}
              placeholder="Sin límite"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Placeholder</label>
            <input
              type="text"
              value={form.placeholder}
              onChange={e => set('placeholder', e.target.value)}
              placeholder="Texto de ejemplo…"
              className={inputClass}
            />
          </div>
        </div>
      )}

      {/* Valores permitidos (para selects) */}
      {form.tipo_dato === 'string' && (
        <div>
          <label className={labelClass}>
            Opciones permitidas
            <span className={`ml-1 text-[10px] font-normal ${isLightMode ? 'text-gray-400' : 'text-gray-500'}`}>
              (separadas por comas → se convierte en lista desplegable)
            </span>
          </label>
          <input
            type="text"
            value={form.valores_permitidos}
            onChange={e => set('valores_permitidos', e.target.value)}
            placeholder="Opción 1, Opción 2, Opción 3"
            className={inputClass}
          />
        </div>
      )}

      {/* Valor por defecto */}
      {!['boolean'].includes(form.tipo_dato) && (
        <div>
          <label className={labelClass}>Valor por defecto</label>
          <input
            type="text"
            value={form.valor_defecto}
            onChange={e => set('valor_defecto', e.target.value)}
            placeholder="Vacío si no aplica"
            className={inputClass}
          />
        </div>
      )}

      {/* Checks: requerido + único */}
      <div className="flex gap-4">
        {[
          { key: 'requerido' as const, label: 'Campo requerido' },
          { key: 'unico' as const, label: 'Valor único' },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => set(key, !form[key])}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all
              ${form[key]
                ? 'bg-purple-600/20 border-purple-500/40 text-purple-300'
                : isLightMode
                  ? 'border-gray-300 text-gray-500 hover:bg-gray-50'
                  : 'border-white/10 text-gray-500 hover:bg-white/5'
              }`}
          >
            <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors
              ${form[key] ? 'bg-purple-500 border-purple-500' : isLightMode ? 'border-gray-400' : 'border-gray-600'}`}>
              {form[key] && <Check className="w-3 h-3 text-white" />}
            </span>
            {label}
          </button>
        ))}
      </div>

      {/* Acciones */}
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold
            bg-gradient-to-r from-purple-600 to-pink-600 text-white
            hover:shadow-lg hover:shadow-purple-500/30 transition-all
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving
            ? <><div className="w-3.5 h-3.5 border-2 border-t-white border-white/30 rounded-full animate-spin" /> Guardando…</>
            : <><Check className="w-3.5 h-3.5" /> {submitLabel}</>
          }
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
// Props del componente principal
// ─────────────────────────────────────────────────────────────────────────────

interface DynamicColumnEditorProps {
  columnas: Columna[];
  isLightMode?: boolean;
  saving?: boolean;
  onAddColumna: (payload: CrearColumnaPayload) => void;
  onUpdateColumna: (columnaId: string, payload: ActualizarColumnaPayload) => void;
  onDeleteColumna: (columnaId: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

export default function DynamicColumnEditor({
  columnas,
  isLightMode = false,
  saving = false,
  onAddColumna,
  onUpdateColumna,
  onDeleteColumna,
}: DynamicColumnEditorProps) {
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingCol, setEditingCol] = useState<Columna | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const colsOrdenadas = [...columnas].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

  const handleAddSubmit = (form: ColFormState) => {
    onAddColumna(toPayload(form));
    setMode('list');
  };

  const handleEditSubmit = (form: ColFormState) => {
    if (!editingCol) return;
    const payload: ActualizarColumnaPayload = toPayload(form);
    onUpdateColumna(editingCol.id, payload);
    setEditingCol(null);
    setMode('list');
  };

  const handleDelete = (col: Columna) => {
    if (confirmDeleteId === col.id) {
      onDeleteColumna(col.id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(col.id);
    }
  };

  const badgeClass = (tipo: string) =>
    `text-[10px] font-bold px-1.5 py-0.5 rounded-full ${TIPO_COLOR[tipo] ?? 'bg-gray-500/20 text-gray-400'}`;

  if (mode === 'add') {
    return (
      <div>
        <h3 className={`text-sm font-bold mb-4 ${isLightMode ? 'text-gray-700' : 'text-gray-200'}`}>
          Nuevo campo
        </h3>
        <ColForm
          isLightMode={isLightMode}
          saving={saving}
          submitLabel="Agregar campo"
          onSubmit={handleAddSubmit}
          onCancel={() => setMode('list')}
        />
      </div>
    );
  }

  if (mode === 'edit' && editingCol) {
    return (
      <div>
        <h3 className={`text-sm font-bold mb-4 ${isLightMode ? 'text-gray-700' : 'text-gray-200'}`}>
          Editar campo: <span className="text-purple-400">{editingCol.etiqueta}</span>
        </h3>
        <ColForm
          initial={colToForm(editingCol)}
          isLightMode={isLightMode}
          saving={saving}
          submitLabel="Guardar cambios"
          onSubmit={handleEditSubmit}
          onCancel={() => { setEditingCol(null); setMode('list'); }}
        />
      </div>
    );
  }

  // ── Modo lista ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className={`text-sm ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>
          {colsOrdenadas.length} campo{colsOrdenadas.length !== 1 ? 's' : ''} definido{colsOrdenadas.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => setMode('add')}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold
            bg-gradient-to-r from-purple-600 to-pink-600 text-white
            hover:shadow-lg hover:shadow-purple-500/30 transition-all
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar campo
        </button>
      </div>

      {/* Lista vacía */}
      {colsOrdenadas.length === 0 && (
        <div className={`rounded-2xl border p-8 text-center
          ${isLightMode ? 'border-gray-200 bg-gray-50' : 'border-purple-500/10 bg-[#11111e]/30'}`}>
          <p className={`text-sm mb-3 ${isLightMode ? 'text-gray-500' : 'text-gray-500'}`}>
            Esta tabla no tiene campos todavía.
          </p>
          <button
            onClick={() => setMode('add')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold
              bg-gradient-to-r from-purple-600 to-pink-600 text-white transition-all
              hover:shadow-lg hover:shadow-purple-500/30"
          >
            <Plus className="w-4 h-4" />
            Agregar primer campo
          </button>
        </div>
      )}

      {/* Columnas */}
      <div className="space-y-2">
        {colsOrdenadas.map(col => {
          const isExpanded = expandedId === col.id;
          const isConfirming = confirmDeleteId === col.id;

          return (
            <div
              key={col.id}
              className={`rounded-xl border transition-all
                ${isLightMode
                  ? 'border-gray-200 bg-white hover:border-purple-300'
                  : 'border-purple-500/10 bg-[#1a1a2e]/50 hover:border-purple-500/20'
                }`}
            >
              {/* Fila principal */}
              <div className="flex items-center gap-3 px-4 py-3">

                {/* Expand toggle */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : col.id)}
                  className={`flex-shrink-0 transition-colors
                    ${isLightMode ? 'text-gray-400 hover:text-gray-600' : 'text-gray-600 hover:text-gray-400'}`}
                  aria-label={isExpanded ? 'Contraer' : 'Expandir'}
                >
                  {isExpanded
                    ? <ChevronUp className="w-4 h-4" />
                    : <ChevronDown className="w-4 h-4" />
                  }
                </button>

                {/* Etiqueta + nombre interno */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-semibold ${isLightMode ? 'text-gray-800' : 'text-gray-200'}`}>
                      {col.etiqueta}
                    </span>
                    <span className={badgeClass(col.tipo_dato)}>
                      {TIPO_DATO_OPTS.find(o => o.value === col.tipo_dato)?.label ?? col.tipo_dato}
                    </span>
                    {col.requerido && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">
                        requerido
                      </span>
                    )}
                    {col.unico && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                        único
                      </span>
                    )}
                  </div>
                  <span className={`text-[11px] font-mono ${isLightMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {col.nombre}
                  </span>
                </div>

                {/* Acciones */}
                {!isConfirming ? (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => { setEditingCol(col); setMode('edit'); setConfirmDeleteId(null); }}
                      disabled={saving}
                      className={`p-1.5 rounded-lg transition-colors disabled:opacity-40
                        ${isLightMode
                          ? 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'
                          : 'text-gray-600 hover:text-purple-400 hover:bg-purple-500/10'
                        }`}
                      title="Editar campo"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(col)}
                      disabled={saving}
                      className={`p-1.5 rounded-lg transition-colors disabled:opacity-40
                        ${isLightMode
                          ? 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                          : 'text-gray-600 hover:text-red-400 hover:bg-red-500/10'
                        }`}
                      title="Eliminar campo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className={`text-[10px] mr-1 ${isLightMode ? 'text-red-600' : 'text-red-400'}`}>
                      ¿Eliminar?
                    </span>
                    <button
                      onClick={() => handleDelete(col)}
                      disabled={saving}
                      className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-40"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className={`p-1.5 rounded-lg transition-colors
                        ${isLightMode ? 'text-gray-400 hover:bg-gray-100' : 'text-gray-500 hover:bg-white/10'}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Detalle expandido */}
              {isExpanded && (
                <div className={`px-4 pb-3 pt-0 border-t grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]
                  ${isLightMode ? 'border-gray-100' : 'border-purple-500/5'}`}>
                  {[
                    ['Ancho', col.ancho],
                    ['Input', col.input_type],
                    ['Max. chars', col.max_length ?? '—'],
                    ['Placeholder', col.placeholder ?? '—'],
                    ['Valor defecto', col.valor_defecto ?? '—'],
                    ['Buscable', col.busqueda_habilitada ? 'Sí' : 'No'],
                    ...(col.valores_permitidos
                      ? [['Opciones', col.valores_permitidos.join(', ')]]
                      : []
                    ),
                  ].map(([key, val]) => (
                    <div key={String(key)}>
                      <span className={isLightMode ? 'text-gray-400' : 'text-gray-500'}>{key}: </span>
                      <span className={isLightMode ? 'text-gray-700' : 'text-gray-300'}>{String(val)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
