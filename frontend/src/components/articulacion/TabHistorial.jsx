import { EmptyState } from '../ui';
import { ACCIONES_TEXTO } from './constantes';

export default function TabHistorial({ d }) {
  if (d.historial.length === 0) return <EmptyState title="Sin movimientos todavía" />;
  return (
    <ol className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
      {d.historial.map((h) => (
        <li key={h.id} className="p-3 text-xs">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-bold text-slate-900">{ACCIONES_TEXTO[h.accion] || h.accion}</span>
            <span className="text-slate-600">{h.nombre ? `${h.nombre} ${h.apellido}` : 'Usuario eliminado'}</span>
            <time className="text-[10px] text-slate-400" dateTime={h.fecha}>{h.fecha}</time>
          </div>
          {h.detalle && <p className="text-slate-600 mt-0.5 whitespace-pre-line">{h.detalle}</p>}
        </li>
      ))}
    </ol>
  );
}
