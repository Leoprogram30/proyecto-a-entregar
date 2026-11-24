/* oxlint-disable react/only-export-components */
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, X, XCircle } from 'lucide-react';

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
export function formatFecha(value) {
  if (!value) return '';
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(value);
}

export const ESTADOS = {
  borrador: { label: 'Borrador', cls: 'bg-slate-100 text-slate-700 border-slate-300' },
  pendiente_revision: { label: 'Pendiente de revisión', cls: 'bg-sky-100 text-sky-800 border-sky-300' },
  aprobada: { label: 'Aprobada', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  requiere_ajustes: { label: 'Requiere ajustes', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
  convocatoria: { label: 'Convocatoria abierta', cls: 'bg-sky-100 text-sky-800 border-sky-300' },
  en_desarrollo: { label: 'En desarrollo', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  finalizado: { label: 'Finalizado', cls: 'bg-slate-100 text-slate-700 border-slate-300' }
};

export const estadoLabel = (estado) => ESTADOS[estado]?.label || estado || '';

export function EstadoBadge({ estado }) {
  const e = ESTADOS[estado] || { label: estado || 'Sin estado', cls: 'bg-slate-100 text-slate-700 border-slate-300' };
  return (
    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${e.cls}`}>
      {e.label}
    </span>
  );
}

// ---------------------------------------------------------------
// Estados de carga / vacío / error
// ---------------------------------------------------------------
export function Loading({ message = 'Cargando...' }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-12 text-xs font-semibold text-slate-500">
      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      {message}
    </div>
  );
}

export function EmptyState({ title, message, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
      <p className="text-sm font-bold text-slate-800">{title}</p>
      {message && <p className="text-xs text-slate-500">{message}</p>}
      {children}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-3">
      <p className="text-xs font-semibold text-red-800">{message || 'Ocurrió un error inesperado.'}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------
// Modal accesible
// ---------------------------------------------------------------
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, children, size = 'max-w-2xl' }) {
  const ref = useRef(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const node = ref.current;
    (node?.querySelector(FOCUSABLE) || node)?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (e.key === 'Tab' && node) {
        const items = [...node.querySelectorAll(FOCUSABLE)];
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`bg-white rounded-2xl shadow-xl w-full ${size} max-h-[90vh] overflow-y-auto focus:outline-none`}
      >
        <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-slate-100">
          <h2 id={titleId} className="text-base font-extrabold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmar', onConfirm, onCancel, busy = false }) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="max-w-md">
      <p className="text-sm text-slate-600">{message}</p>
      <div className="flex justify-end gap-2 mt-5">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-red-700 hover:bg-red-800 text-white disabled:opacity-60"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------
// Toasts
// ---------------------------------------------------------------
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => setItems((list) => list.filter((t) => t.id !== id)), []);
  const push = useCallback(
    (type, message) => {
      const id = nextId.current++;
      setItems((list) => [...list, { id, type, message }]);
      setTimeout(() => dismiss(id), type === 'error' ? 7000 : 4000);
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m)
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[60] flex flex-col gap-2 sm:w-96 print:hidden" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            className={`flex items-start gap-2 rounded-xl border p-3 text-xs font-semibold shadow-lg ${
              t.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            {t.type === 'error' ? (
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <span className="flex-1">{t.message}</span>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Cerrar aviso">
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de un ToastProvider');
  return ctx;
}

// Mensaje de advertencia reutilizable
export function Notice({ children }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
      <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
