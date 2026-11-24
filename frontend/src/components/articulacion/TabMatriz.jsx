import { EmptyState, formatFecha } from '../ui';
import { nombreCompleto } from './constantes';

// Matriz espacios x contenidos x encuentros: marca qué contenido se trabaja en cada encuentro.
export default function TabMatriz({ d }) {
  const aceptados = d.participantes.filter((x) => x.invitacion === 'aceptado');
  const { encuentros } = d;
  if (aceptados.every((x) => x.contenidos.length === 0)) {
    return <EmptyState title="Todavía no hay contenidos" message="Cada docente elige los contenidos de su espacio en la pestaña Aportes." />;
  }
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200">
        <table className="min-w-full text-xs">
          <caption className="sr-only">Contenidos de cada espacio y encuentros en los que se trabajan</caption>
          <thead>
            <tr className="bg-slate-50 text-left">
              <th scope="col" className="p-2 font-bold text-slate-700">Espacio y contenido</th>
              {encuentros.map((e, i) => (
                <th key={e.id} scope="col" className="p-2 font-bold text-slate-700 text-center min-w-20">
                  <span className="block">Enc. {i + 1}</span>
                  <span className="block font-normal text-[10px] text-slate-500">{formatFecha(e.fecha) || 's/f'}</span>
                </th>
              ))}
            </tr>
          </thead>
          {aceptados.map((x) => (
            <tbody key={x.id} className="border-t border-slate-200">
              <tr className="bg-emerald-50/60">
                <th scope="rowgroup" colSpan={encuentros.length + 1} className="p-2 text-left font-bold text-emerald-900">
                  {x.espacio_nombre} · {nombreCompleto(x)}{x.tema ? ` · Tema: ${x.tema}` : ''}
                </th>
              </tr>
              {x.contenidos.length === 0 && (
                <tr><td colSpan={encuentros.length + 1} className="p-2 text-slate-400">Sin contenidos cargados.</td></tr>
              )}
              {x.contenidos.map((c, i) => (
                <tr key={`${c.curriculum_id || 't'}-${i}`} className="border-t border-slate-100">
                  <th scope="row" className="p-2 text-left font-normal text-slate-800">{c.titulo}{c.propio ? ' (propio)' : ''}</th>
                  {encuentros.map((e) => {
                    const hay = e.contenidos.includes(c.titulo);
                    return (
                      <td key={e.id} className="p-2 text-center">
                        <span aria-hidden="true">{hay ? '●' : ''}</span>
                        <span className="sr-only">{hay ? 'Se trabaja' : 'No se trabaja'}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
      {encuentros.length === 0 && <p className="text-[11px] text-slate-500">Todavía no hay encuentros: cárguelos en el Plan de trabajo para completar la matriz.</p>}
    </div>
  );
}
