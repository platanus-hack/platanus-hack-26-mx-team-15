'use client';

import { useState, useEffect } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import type { Columna } from '@/types/dashboard';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────

export type FormData = Record<string, string>;

interface FieldError {
  [campo: string]: string;
}

interface DynamicFormProps {
  columnas: Columna[];
  /** Datos iniciales para modo edición */
  initialData?: FormData;
  onSubmit: (data: FormData) => void | Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  isLightMode?: boolean;
  saving?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de estilo
// ─────────────────────────────────────────────────────────────────────────────

const inputBase = (isLight: boolean, hasError: boolean) =>
  `w-full px-3 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none
   ${hasError
     ? 'border-red-500/60 focus:border-red-500'
     : isLight
       ? 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500'
       : 'bg-[#18182a]/60 border-purple-500/20 text-white placeholder-gray-500 focus:border-purple-500'
   }`;

// Mapeo de ancho de columna → clases de grid
const anchoClass: Record<string, string> = {
  full: 'col-span-12',
  half: 'col-span-12 sm:col-span-6',
  third: 'col-span-12 sm:col-span-4',
};

// ─────────────────────────────────────────────────────────────────────────────
// Validación
// ─────────────────────────────────────────────────────────────────────────────

function validarCampo(col: Columna, value: string): string | null {
  if (col.requerido && (!value || value.trim() === '')) {
    return `${col.etiqueta} es requerido`;
  }
  if (value && col.max_length && value.length > col.max_length) {
    return `Máximo ${col.max_length} caracteres`;
  }
  if (value && col.expresion_regular) {
    try {
      const re = new RegExp(col.expresion_regular);
      if (!re.test(value)) return `Formato inválido para ${col.etiqueta}`;
    } catch { /* regex inválida — ignorar */ }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: Switch (boolean)
// ─────────────────────────────────────────────────────────────────────────────

function SwitchField({
  checked,
  onChange,
  isLightMode,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  isLightMode: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-7 w-12 items-center rounded-full transition-colors
        focus:outline-none focus:ring-2 focus:ring-purple-500/50
        ${checked ? 'bg-purple-600' : isLightMode ? 'bg-gray-300' : 'bg-gray-600'}
      `}
    >
      <span
        className={`
          inline-block h-5 w-5 rounded-full bg-white shadow transition-transform
          ${checked ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

export default function DynamicForm({
  columnas,
  initialData = {},
  onSubmit,
  onCancel,
  submitLabel = 'Guardar',
  isLightMode = false,
  saving = false,
}: DynamicFormProps) {
  const [formData, setFormData] = useState<FormData>(() => {
    const init: FormData = {};
    for (const col of columnas) {
      init[col.nombre] = initialData[col.nombre] ?? col.valor_defecto ?? '';
    }
    return init;
  });
  const [errors, setErrors] = useState<FieldError>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Si cambian las columnas (por ejemplo al abrir otra tabla), reiniciar
  useEffect(() => {
    const init: FormData = {};
    for (const col of columnas) {
      init[col.nombre] = initialData[col.nombre] ?? col.valor_defecto ?? '';
    }
    setFormData(init);
    setErrors({});
    setTouched({});
  }, [columnas]); // eslint-disable-line react-hooks/exhaustive-deps

  const setValue = (nombre: string, value: string) => {
    setFormData(prev => ({ ...prev, [nombre]: value }));
    if (touched[nombre]) {
      const col = columnas.find(c => c.nombre === nombre);
      if (col) {
        const err = validarCampo(col, value);
        setErrors(prev => ({ ...prev, [nombre]: err ?? '' }));
      }
    }
  };

  const markTouched = (nombre: string) => {
    setTouched(prev => ({ ...prev, [nombre]: true }));
    const col = columnas.find(c => c.nombre === nombre);
    if (col) {
      const err = validarCampo(col, formData[nombre] ?? '');
      setErrors(prev => ({ ...prev, [nombre]: err ?? '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar todos los campos
    const allErrors: FieldError = {};
    const allTouched: Record<string, boolean> = {};
    for (const col of columnas) {
      allTouched[col.nombre] = true;
      const err = validarCampo(col, formData[col.nombre] ?? '');
      if (err) allErrors[col.nombre] = err;
    }

    setTouched(allTouched);
    setErrors(allErrors);

    if (Object.keys(allErrors).length > 0) return;

    await onSubmit(formData);
  };

  // Columnas ordenadas por su campo `orden`
  const colsOrdenadas = [...columnas].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

  const labelClass = `block text-xs font-semibold mb-1.5 tracking-wide
    ${isLightMode ? 'text-gray-600' : 'text-gray-300'}`;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-12 gap-4">
        {colsOrdenadas.map(col => {
          const value = formData[col.nombre] ?? '';
          const error = touched[col.nombre] ? errors[col.nombre] : '';
          const hasError = !!error;

          return (
            <div key={col.nombre} className={anchoClass[col.ancho] ?? 'col-span-12'}>
              {/* Etiqueta */}
              {col.input_type !== 'switch' && (
                <label htmlFor={`field-${col.nombre}`} className={labelClass}>
                  {col.etiqueta}
                  {col.requerido && (
                    <span className="text-red-400 ml-1">*</span>
                  )}
                  {col.unico && (
                    <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${
                      isLightMode ? 'bg-blue-100 text-blue-600' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      único
                    </span>
                  )}
                </label>
              )}

              {/* ── Switch / Boolean ─────────────────────────────────────── */}
              {col.input_type === 'switch' && (
                <div className="flex items-center gap-3">
                  <SwitchField
                    checked={value === 'true'}
                    onChange={v => setValue(col.nombre, String(v))}
                    isLightMode={isLightMode}
                  />
                  <span className={`text-sm font-medium ${isLightMode ? 'text-gray-700' : 'text-gray-300'}`}>
                    {col.etiqueta}
                    {col.requerido && <span className="text-red-400 ml-1">*</span>}
                  </span>
                </div>
              )}

              {/* ── Select ───────────────────────────────────────────────── */}
              {col.input_type === 'select' && col.valores_permitidos && (
                <select
                  id={`field-${col.nombre}`}
                  value={value}
                  onChange={e => setValue(col.nombre, e.target.value)}
                  onBlur={() => markTouched(col.nombre)}
                  className={inputBase(isLightMode, hasError)}
                >
                  <option value="">— Selecciona —</option>
                  {col.valores_permitidos.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              )}

              {/* ── Textarea ─────────────────────────────────────────────── */}
              {col.input_type === 'textarea' && (
                <textarea
                  id={`field-${col.nombre}`}
                  value={value}
                  onChange={e => setValue(col.nombre, e.target.value)}
                  onBlur={() => markTouched(col.nombre)}
                  placeholder={col.placeholder ?? ''}
                  rows={3}
                  maxLength={col.max_length ?? undefined}
                  className={`${inputBase(isLightMode, hasError)} resize-none`}
                />
              )}

              {/* ── Inputs estándar ──────────────────────────────────────── */}
              {col.input_type !== 'switch' &&
                col.input_type !== 'select' &&
                col.input_type !== 'textarea' && (
                  <input
                    id={`field-${col.nombre}`}
                    type={col.input_type}
                    value={value}
                    onChange={e => setValue(col.nombre, e.target.value)}
                    onBlur={() => markTouched(col.nombre)}
                    placeholder={col.placeholder ?? ''}
                    maxLength={col.max_length ?? undefined}
                    className={inputBase(isLightMode, hasError)}
                  />
                )}

              {/* Error */}
              {hasError && (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  {error}
                </p>
              )}

              {/* Contador de caracteres */}
              {col.max_length && col.input_type !== 'switch' && value && (
                <p className={`mt-0.5 text-right text-[11px] ${
                  value.length > col.max_length * 0.9
                    ? 'text-yellow-400'
                    : isLightMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {value.length}/{col.max_length}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Acciones */}
      <div className={`flex items-center justify-end gap-3 mt-6 pt-4 border-t
        ${isLightMode ? 'border-gray-200' : 'border-purple-500/10'}`}>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all
            disabled:opacity-40 disabled:cursor-not-allowed
            ${isLightMode
              ? 'border-gray-300 text-gray-700 hover:bg-gray-100'
              : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
            }`}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
            bg-gradient-to-r from-purple-600 to-pink-600 text-white
            hover:shadow-lg hover:shadow-purple-500/30 transition-all
            disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none`}
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-t-white border-white/30 rounded-full animate-spin" />
              Guardando…
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              {submitLabel}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
