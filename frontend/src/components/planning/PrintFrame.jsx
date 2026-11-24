import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import { estadoLabel } from '../ui';
import { asArray, fuenteLabel } from '../../config/catalogos';

export function Section({ title, children }) {
  return (
    <section className="mb-6 print-avoid-break">
      <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-b border-emerald-200 pb-1 mb-2">{title}</h2>
      {children}
    </section>
  );
}

export const Text = ({ children }) => (
  <span className="whitespace-pre-line">{children && String(children).trim() ? children : 'Sin datos consignados.'}</span>
);

export function Fila({ label, children }) {
  return (
    <p>
      <strong>{label}:</strong> <Text>{children}</Text>
    </p>
  );
}

export function Bullets({ items }) {
  const list = asArray(items);
  if (list.length === 0) {
    return (
      <p className="text-xs text-slate-700">
        <Text />
      </p>
    );
  }
  return (
    <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700">
      {list.map((t, i) => (
        <li key={i} className="leading-relaxed">
          {t}
        </li>
      ))}
    </ul>
  );
}

/** Contenidos con su meta, indicadores, fuente y prioridad. */
export function ContenidosPrint({ contenidos }) {
  const list = asArray(contenidos);
  if (list.length === 0) {
    return (
      <p className="text-xs text-slate-700">
        <Text />
      </p>
    );
  }
  return (
    <ul className="space-y-3 text-xs text-slate-700">
      {list.map((c, i) => {
        const item = typeof c === 'string' ? { texto: c, indicadores: [] } : c;
        const inds = asArray(item.indicadores);
        return (
          <li key={i} className="leading-relaxed print-avoid-break">
            <div>
              <span className="font-semibold text-slate-900">{i + 1}. {item.texto}</span>
              {item.prioridad && (
                <span className="ml-2 text-[10px] uppercase font-bold text-slate-600">
                  [{item.prioridad === 'complementario' ? 'Complementario' : 'Esencial'}]
                </span>
              )}
            </div>
            {item.meta && <div className="text-[11px] text-slate-600 pl-4">Meta: {item.meta}</div>}
            {item.fuente && <div className="text-[10px] text-slate-500 pl-4">Fuente: {fuenteLabel(item.fuente)}</div>}
            {inds.length > 0 && (
              <div className="pl-4 mt-0.5">
                <span className="text-[11px] font-semibold">Indicadores de logro:</span>
                <ul className="list-disc pl-5">
                  {inds.map((ind, j) => (
                    <li key={j}>{ind}</li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// Se monta en document.body: el CSS de impresión (index.css) oculta el resto de la
// aplicación y deja fluir este contenido en varias páginas.
export default function PrintFrame({ titulo, ariaLabel, estado, anioLectivo, onClose, datos, children }) {
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const previous = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current?.();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, []);

  return createPortal(
    <div className="print-overlay fixed inset-0 bg-slate-900/60 z-50 overflow-y-auto p-2 sm:p-4">
      <div role="dialog" aria-modal="true" aria-label={ariaLabel} className="print-sheet bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-auto border border-slate-300">
        <div className="no-print bg-slate-800 text-white p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2 rounded-t-2xl sticky top-0">
          <div className="flex items-center gap-2">
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Volver
            </button>
            <span className="hidden sm:inline text-xs text-slate-300">Vista previa para imprimir o guardar como PDF</span>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            Imprimir / Guardar como PDF
          </button>
        </div>

        <div className="p-5 sm:p-12 text-slate-900 font-sans">
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex flex-wrap print:flex-nowrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 border-2 border-emerald-800 rounded-xl p-1 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-12 h-12" aria-hidden="true">
                    <path d="M32 4 L56 12 V34 C56 48 32 60 32 60 C32 60 8 48 8 34 V12 Z" fill="#15803d" />
                    <path d="M32 18 C38 22 42 28 42 34 C42 40 38 42 32 44 C26 42 22 40 22 34 C22 28 26 22 32 18 Z" fill="#ffffff" />
                    <circle cx="32" cy="14" r="3" fill="#f59e0b" />
                  </svg>
                </div>
                <div>
                  <div className="text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                    Gobierno de la Provincia de Córdoba • Ministerio de Educación
                  </div>
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">IPEM N° 349 "GIOVANNI BOSCO"</h1>
                  <div className="text-xs font-semibold text-emerald-800">Colonia Caroya - Orientación: Agro y Ambiente</div>
                </div>
              </div>
              <div className="sm:text-right print:text-right print:shrink-0">
                <div className="text-xs font-bold text-slate-800">{titulo}</div>
                {anioLectivo && <div className="text-xs text-slate-600">Ciclo Lectivo {anioLectivo}</div>}
                <div className="mt-1">
                  <span className="inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-emerald-700 bg-emerald-50 text-emerald-800">
                    Estado: {estadoLabel(estado || 'borrador')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs mb-6 print-avoid-break">
            {datos.map(([label, value]) => (
              <div key={label}>
                <span className="font-bold text-slate-600 block text-[10px] uppercase">{label}</span>
                <span className="font-semibold text-slate-900">{value || 'No consignado'}</span>
              </div>
            ))}
          </div>

          {children}

          <div className="pt-8 mt-12 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs print-avoid-break">
            <div>
              <div className="h-14"></div>
              <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">Firma y Aclaración del Docente</div>
              <div className="text-[10px] text-slate-500">IPEM N° 349 "Giovanni Bosco"</div>
            </div>
            <div>
              <div className="h-14"></div>
              <div className="border-t border-slate-400 pt-1 font-semibold text-slate-800">V° B° Equipo Directivo / Coordinación</div>
              <div className="text-[10px] text-slate-500">Supervisión Pedagógica y Acreditación</div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
