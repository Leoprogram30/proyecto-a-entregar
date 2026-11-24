import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { MODALIDADES, nombreCompleto } from './constantes';
import { Seccion } from './comunes';
import EditorCampos from './EditorCampos';

const CAMPOS = [
  { k: 'evaluacion_criterios', label: 'Criterios de evaluación comunes', tipo: 'area', rows: 4 },
  { k: 'evaluacion_instrumentos', label: 'Instrumentos (rúbrica, portfolio, informe, coloquio, exposición...)', tipo: 'area' },
  { k: 'evaluacion_momentos', label: 'Momentos de evaluación', tipo: 'area' }
];

export default function TabEvaluacion({ d, run, busy }) {
  const [editando, setEditando] = useState(false);
  const { proyecto: p, permisos, participantes } = d;

  if (editando) {
    return <EditorCampos proyecto={p} campos={CAMPOS} run={run} busy={busy} titulo="Editar evaluación" onDone={() => setEditando(false)} />;
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-xs text-slate-700 max-w-3xl">
          {p.modalidad === 'tiempo_compartido'
            ? `En el trabajo integrado en tiempo compartido, la calificación del trabajo integrado es la misma en los dos espacios, y cada espacio conserva la calificación propia de lo que trabaja por separado. Fuente: ${MODALIDADES.tiempo_compartido.fuente}.`
            : 'Defina criterios, instrumentos y momentos comunes de evaluación. Cada docente puede detallar abajo cómo evaluará su parte.'}
        </p>
        {permisos.puede_editar && (
          <button type="button" onClick={() => setEditando(true)} className="px-3 py-1.5 bg-white border border-slate-300 text-xs font-bold rounded-lg flex items-center gap-1.5">
            <Pencil className="w-3.5 h-3.5" aria-hidden="true" /> Editar
          </button>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Seccion titulo="Criterios">{p.evaluacion_criterios}</Seccion>
        <Seccion titulo="Instrumentos">{p.evaluacion_instrumentos}</Seccion>
        <Seccion titulo="Momentos">{p.evaluacion_momentos}</Seccion>
        <Seccion titulo="Evaluación de la instancia (al cerrar)">{p.evaluacion_instancia}</Seccion>
      </div>
      <div className="space-y-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 border-b border-emerald-200 pb-1">Evaluación de cada aporte</h3>
        {participantes.filter((x) => x.invitacion === 'aceptado').map((x) => (
          <p key={x.id} className="text-xs text-slate-800 whitespace-pre-line">
            <span className="font-semibold">{x.espacio_nombre} ({nombreCompleto(x)}):</span> {x.evaluacion_aporte || 'Sin datos consignados.'}
          </p>
        ))}
      </div>
    </div>
  );
}
