'use client';

import { useState, useMemo } from 'react';
import {
  Plus, Pencil, Trash2, Search, ChevronLeft,
  ChevronRight, Check, X, Settings2,
} from 'lucide-react';
import type { Tabla, Fila } from '@/types/dashboard';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const FILAS_POR_PAGINA = 10;
/** Máximo de columnas visibles en la tabla antes de truncar */
const MAX_COLS_VISIBLES = 6;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de renderizado de celda
// ─────────────────────────────────────────────────────────────────────────────

function CeldaValor({
  value,
  inputType,
  isLightMode,
}: {
  value: string | undefined;
  inputType: string;
  isLightMode: boolean;
}) {
  if (value === undefined || value === null || value === '') {
    return (
      <span className={`italic text-xs ${isLightMode ? 'text-gray-400' : 'text-gray-600'}`}>
        —
      </span>
    );
  }

  // Boolean
  if (inputType === 'switch') {
    const isTrue = value === 'true';
    return isTrue ? (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
        <Check className="w-3.5 h-3.5" /> Sí
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500">
        <X className="w-3.5 h-3.5" /> No
      </span>
    );
  }

  // Fecha
  if (inputType === 'date' && value) {
    try {
      return (
        <span>
          {new Date(value + 'T00:00:00').toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      );
    } catch { /* fallback al valor crudo */ }
  }

  // Número con formato
  if ((inputType === 'number') && !isNaN(Number(value))) {
    return <span>{Number(value).toLocaleString('es-MX')}</span>;
  }

  // Texto largo → truncar
  const MAX = 40;
  const display = value.length > MAX ? value.slice(0, MAX) + '…' : value;
  return <span title={value.length > MAX ? value : undefined}>{display}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface DynamicDataGridProps {
  tabla: Tabla;
  isLightMode?: boolean;
  saving?: boolean;
  /** Si true: oculta gestión de campos, botón "Nuevo" y acciones de fila (edit/delete) */
  readonly?: boolean;
  onAddFila: () => void;
  onEditFila: (fila: Fila) => void;
  onDeleteFila: (filaId: string) => void;
  onOpenColumnEditor: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

export default function DynamicDataGrid({
  tabla,
  isLightMode = false,
  saving = false,
  readonly = false,
  onAddFila,
  onEditFila,
  onDeleteFila,
  onOpenColumnEditor,
}: DynamicDataGridProps) {
  const [query, setQuery] = useState('');
  const [pagina, setPagina] = useState(1);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Columnas ordenadas — limitar visibles
  const colsOrdenadas = useMemo(
    () => [...tabla.columnas].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)),
    [tabla.columnas]
  );
  const colsVisibles = colsOrdenadas.slice(0, MAX_COLS_VISIBLES);
  const colsBuscables = colsOrdenadas.filter(c => c.busqueda_habilitada);

  // Filtro de búsqueda
  const filasFiltradas = useMemo(() => {
    if (!query.trim()) return tabla.filas;
    const q = query.toLowerCase();
    return tabla.filas.filter(fila =>
      // Si hay columnas marcadas como buscables, solo buscar en ellas
      (colsBuscables.length > 0 ? colsBuscables : colsOrdenadas).some(col => {
        const v = fila.datos[col.nombre] ?? '';
        return v.toLowerCase().includes(q);
      })
    );
  }, [tabla.filas, query, colsBuscables, colsOrdenadas]);

  // Paginación
  const totalPaginas = Math.max(1, Math.ceil(filasFiltradas.length / FILAS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const filasPagina = filasFiltradas.slice(
    (paginaActual - 1) * FILAS_POR_PAGINA,
    paginaActual * FILAS_POR_PAGINA
  );

  const handleDelete = (filaId: string) => {
    if (confirmDeleteId === filaId) {
      onDeleteFila(filaId);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(filaId);
    }
  };

  // Clases reutilizables
  const thClass = `px-4 py-3 text-left text-xs font-bold uppercase tracking-wider
    ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`;
  const tdClass = `px-4 py-3 text-sm
    ${isLightMode ? 'text-gray-700' : 'text-gray-300'}`;
  const rowClass = `border-t transition-colors
    ${isLightMode
      ? 'border-gray-100 hover:bg-purple-50/30'
      : 'border-purple-500/5 hover:bg-purple-500/5'
    }`;

  return (
    <div className="flex flex-col gap-4">

      {/* ── Barra superior ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

        {/* Búsqueda */}
        {colsOrdenadas.length > 0 && (
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder={
                colsBuscables.length > 0
                  ? `Buscar en ${colsBuscables.map(c => c.etiqueta).join(', ')}…`
                  : 'Buscar…'
              }
              value={query}
              onChange={e => { setQuery(e.target.value); setPagina(1); }}
              className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border transition-colors focus:outline-none focus:border-purple-500
                ${isLightMode
                  ? 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-400'
                  : 'bg-[#18182a]/60 border-purple-500/20 text-white placeholder-gray-500'
                }`}
            />
          </div>
        )}

        {/* Contadores + acciones */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
          <span className={`text-xs ${isLightMode ? 'text-gray-500' : 'text-gray-500'}`}>
            {filasFiltradas.length} registro{filasFiltradas.length !== 1 ? 's' : ''}
            {query && ` de ${tabla.filas.length}`}
          </span>

          {/* Editar campos — oculto en modo readonly */}
          {!readonly && (
            <button
              onClick={onOpenColumnEditor}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all
                ${isLightMode
                  ? 'border-gray-300 text-gray-600 hover:bg-gray-100'
                  : 'border-purple-500/20 text-purple-400 hover:bg-purple-500/10'
                }`}
              title="Administrar campos"
            >
              <Settings2 className="w-3.5 h-3.5" />
              Campos
            </button>
          )}

          {/* Agregar registro — siempre visible (incluso en modo readonly se permite agregar) */}
          <button
            onClick={onAddFila}
            disabled={saving || colsOrdenadas.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold
              bg-gradient-to-r from-purple-600 to-pink-600 text-white
              hover:shadow-lg hover:shadow-purple-500/30 transition-all
              disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo registro
          </button>
        </div>
      </div>

      {/* ── Tabla ──────────────────────────────────────────────────────────── */}
      {colsOrdenadas.length === 0 ? (
        /* Estado vacío: sin columnas */
        <div className={`rounded-2xl border p-10 text-center
          ${isLightMode ? 'border-gray-200 bg-gray-50' : 'border-purple-500/10 bg-[#11111e]/40'}`}>
          <Settings2 className={`w-10 h-10 mx-auto mb-3 ${isLightMode ? 'text-gray-300' : 'text-gray-600'}`} />
          <p className={`font-semibold mb-1 ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
            Esta tabla no tiene campos
          </p>
          <p className={`text-sm mb-4 ${isLightMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Agrega campos para poder registrar datos.
          </p>
          <button
            onClick={onOpenColumnEditor}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
              bg-gradient-to-r from-purple-600 to-pink-600 text-white
              hover:shadow-lg hover:shadow-purple-500/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Agregar campo
          </button>
        </div>
      ) : (
        <div className={`rounded-2xl border overflow-hidden
          ${isLightMode ? 'border-gray-200 bg-white' : 'border-purple-500/10 bg-[#11111e]/60'}`}>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={isLightMode ? 'bg-gray-50' : 'bg-[#1a1a2e]/60'}>
                  {colsVisibles.map(col => (
                    <th key={col.id} className={thClass}>{col.etiqueta}</th>
                  ))}
                  {colsOrdenadas.length > MAX_COLS_VISIBLES && (
                    <th className={`${thClass} text-purple-400`}>
                      +{colsOrdenadas.length - MAX_COLS_VISIBLES} más
                    </th>
                  )}
                  <th className={`${thClass} text-right`}>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {filasPagina.length === 0 ? (
                  <tr>
                    <td
                      colSpan={colsVisibles.length + 2}
                      className={`px-4 py-12 text-center text-sm
                        ${isLightMode ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                      {query
                        ? `Sin resultados para "${query}"`
                        : 'Sin registros. Agrega el primero con el botón de arriba.'
                      }
                    </td>
                  </tr>
                ) : (
                  filasPagina.map(fila => (
                    <tr key={fila.id} className={rowClass}>
                      {colsVisibles.map(col => (
                        <td key={col.id} className={tdClass}>
                          <CeldaValor
                            value={fila.datos[col.nombre]}
                            inputType={col.input_type}
                            isLightMode={isLightMode}
                          />
                        </td>
                      ))}
                      {colsOrdenadas.length > MAX_COLS_VISIBLES && (
                        <td className={tdClass}>
                          <span className={`text-xs ${isLightMode ? 'text-gray-400' : 'text-gray-500'}`}>…</span>
                        </td>
                      )}

                      {/* Acciones por fila */}
                      <td className={`${tdClass} text-right`}>
                        <div className="flex items-center justify-end gap-1">
                          {/* Editar — oculto en modo readonly */}
                          {!readonly && (
                            <button
                              onClick={() => { setConfirmDeleteId(null); onEditFila(fila); }}
                              disabled={saving}
                              className={`p-1.5 rounded-lg transition-colors
                                ${isLightMode
                                  ? 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'
                                  : 'text-gray-500 hover:text-purple-400 hover:bg-purple-500/10'
                                }
                                disabled:opacity-40 disabled:cursor-not-allowed`}
                              title="Editar registro"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Eliminar — oculto en modo readonly */}
                          {!readonly && (confirmDeleteId === fila.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(fila.id)}
                                disabled={saving}
                                className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-40"
                                title="Confirmar eliminación"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className={`p-1.5 rounded-lg transition-colors
                                  ${isLightMode ? 'text-gray-400 hover:bg-gray-100' : 'text-gray-500 hover:bg-white/5'}`}
                                title="Cancelar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(fila.id)}
                              disabled={saving}
                              className={`p-1.5 rounded-lg transition-colors
                                ${isLightMode
                                  ? 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                                  : 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
                                }
                                disabled:opacity-40 disabled:cursor-not-allowed`}
                              title="Eliminar registro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── Paginación ──────────────────────────────────────────────── */}
          {totalPaginas > 1 && (
            <div className={`flex items-center justify-between px-4 py-3 border-t
              ${isLightMode ? 'border-gray-100' : 'border-purple-500/10'}`}>
              <span className={`text-xs ${isLightMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Página {paginaActual} de {totalPaginas}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPagina(p => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                  className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                    ${isLightMode ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/10 text-gray-400'}`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas}
                  className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                    ${isLightMode ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-white/10 text-gray-400'}`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
