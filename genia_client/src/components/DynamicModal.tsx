'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const MAX_WIDTH_MAP = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
};

interface DynamicModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: keyof typeof MAX_WIDTH_MAP;
  isLightMode?: boolean;
  /** Muestra un spinner sobre el contenido cuando es true */
  saving?: boolean;
}

export default function DynamicModal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'xl',
  isLightMode = false,
  saving = false,
}: DynamicModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Bloquear scroll del body mientras el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`
          relative w-full ${MAX_WIDTH_MAP[maxWidth]} max-h-[90vh] overflow-hidden
          flex flex-col rounded-3xl border shadow-2xl
          transition-all duration-200
          ${isLightMode
            ? 'bg-white border-purple-500/20 shadow-purple-500/10'
            : 'bg-[#0f0f1e]/95 border-purple-500/20 shadow-purple-500/20'
          }
        `}
      >
        {/* Header */}
        <div className={`
          flex items-center justify-between px-6 py-4 flex-shrink-0
          border-b
          ${isLightMode ? 'border-gray-200' : 'border-purple-500/10'}
        `}>
          <h2
            id="modal-title"
            className={`text-lg font-bold tracking-wide
              ${isLightMode ? 'text-gray-900' : 'text-white'}
            `}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            disabled={saving}
            className={`
              p-1.5 rounded-lg transition-colors
              ${isLightMode
                ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                : 'text-gray-500 hover:text-white hover:bg-white/10'
              }
              disabled:opacity-40 disabled:cursor-not-allowed
            `}
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="relative flex-1 overflow-y-auto px-6 py-5">
          {/* Overlay de guardado */}
          {saving && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 backdrop-blur-[2px] rounded-b-3xl">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-t-purple-500 border-purple-500/20 rounded-full animate-spin" />
                <span className="text-sm text-purple-400 font-medium">Guardando…</span>
              </div>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
