import { useId, useState } from 'react';
import { CircleHelp } from 'lucide-react';
import { ESTADOS_ART, MODALIDADES } from './constantes';

export function EstadoArt({ estado }) {
  const e = ESTADOS_ART[estado] || { label: estado, cls: 'bg-slate-100 text-slate-700 border-slate-300' };
  return <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${e.cls}`}>{e.label}</span>;
}

export function Campo({ label, hint, children, htmlFor }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-[11px] font-semibold text-slate-700 mb-1">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-slate-500 mt-0.5">{hint}</p>}
    </div>
  );
}

export function Seccion({ titulo, children }) {
  const vacio = !children || !String(children).trim();
  return (
    <section className="print-avoid-break">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 border-b border-emerald-200 pb-1 mb-1.5">{titulo}</h3>
      <div className="text-xs text-slate-800 whitespace-pre-line">{vacio ? <span className="text-slate-400">Sin datos consignados.</span> : children}</div>
    </section>
  );
}

// Ayuda contextual breve: explica las cuatro modalidades y cita la fuente.
export function AyudaModalidades({ resaltada }) {
  const [abierta, setAbierta] = useState(false);
  const id = useId();
  return (
    <div className="text-xs">
      <button
        type="button"
        aria-expanded={abierta}
        aria-controls={id}
        onClick={() => setAbierta((v) => !v)}
        className="inline-flex items-center gap-1.5 font-semibold text-sky-800 hover:text-sky-900 underline-offset-2 hover:underline"
      >
        <CircleHelp className="w-4 h-4" aria-hidden="true" />
        {abierta ? 'Ocultar ayuda' : '¿En qué se diferencian las modalidades?'}
      </button>
      {abierta && (
        <dl id={id} className="mt-2 grid gap-2 sm:grid-cols-2">
          {Object.entries(MODALIDADES).map(([k, m]) => (
            <div key={k} className={`rounded-xl border p-3 ${resaltada === k ? 'border-sky-400 bg-sky-50' : 'border-slate-200 bg-white'}`}>
              <dt className="font-bold text-slate-900">{m.label}</dt>
              <dd className="text-slate-700 mt-1">{m.detalle}</dd>
              <dd className="text-[10px] text-slate-500 mt-1">Fuente: {m.fuente}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
