import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { ConfirmDialog, EmptyState, Modal, formatFecha } from '../ui';
import { inputCls, nombreCompleto } from './constantes';
import { Campo } from './comunes';

function EncuentroModal({ encuentro, d, run, onClose }) {
  const aceptados = d.participantes.filter((x) => x.invitacion === 'aceptado');
  const titulos = [...new Set(aceptados.flatMap((x) => x.contenidos.map((c) => c.titulo)))];
  const [f, setF] = useState({
    fecha: encuentro?.fecha || '', horas: encuentro?.horas || 1, titulo: encuentro?.titulo || '', actividades: encuentro?.actividades || '',
    evidencia: encuentro?.evidencia || ''
  });
  const [docs, setDocs] = useState(encuentro?.docentes || []);
  const [conts, setConts] = useState(encuentro?.contenidos || []);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const alternar = (lista, setL, v) => setL(lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]);

  const guardar = async (e) => {
    e.preventDefault();
    const r = await run('encuentro_save', { ...(encuentro ? { id: encuentro.id } : {}), ...f, horas: Number(f.horas), docentes: docs, contenidos: conts }, 'Encuentro guardado.');
    if (r) onClose();
  };
  return (
    <Modal open onClose={onClose} title={encuentro ? 'Editar encuentro' : 'Nuevo encuentro'} size="max-w-2xl">
      <form onSubmit={guardar} className="space-y-3 text-xs">
        <Campo label="Título" htmlFor="enc-tit"><input id="enc-tit" required maxLength={200} value={f.titulo} onChange={set('titulo')} className={inputCls} /></Campo>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Fecha" htmlFor="enc-fecha"><input id="enc-fecha" type="date" value={f.fecha} onChange={set('fecha')} className={inputCls} /></Campo>
          <Campo label="Horas cátedra" htmlFor="enc-horas"><input id="enc-horas" type="number" min="1" max="12" value={f.horas} onChange={set('horas')} className={inputCls} /></Campo>
        </div>
        <Campo label="Actividades" htmlFor="enc-act"><textarea id="enc-act" rows={3} value={f.actividades} onChange={set('actividades')} className={inputCls} /></Campo>
        <fieldset>
          <legend className="text-[11px] font-semibold text-slate-700 mb-1">Docentes a cargo</legend>
          <div className="flex flex-wrap gap-3">
            {aceptados.map((x) => (
              <label key={x.id} className="flex items-center gap-1.5">
                <input type="checkbox" checked={docs.includes(x.docente_id)} onChange={() => alternar(docs, setDocs, x.docente_id)} />
                {nombreCompleto(x)} ({x.espacio_nombre})
              </label>
            ))}
          </div>
        </fieldset>
        {titulos.length > 0 && (
          <fieldset>
            <legend className="text-[11px] font-semibold text-slate-700 mb-1">Contenidos que se trabajan</legend>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {titulos.map((t) => (
                <label key={t} className="flex items-start gap-1.5">
                  <input type="checkbox" className="mt-0.5" checked={conts.includes(t)} onChange={() => alternar(conts, setConts, t)} /> {t}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <Campo label="Evidencia (producciones, registros, fotos)" htmlFor="enc-ev"><textarea id="enc-ev" rows={2} value={f.evidencia} onChange={set('evidencia')} className={inputCls} /></Campo>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-3 py-2 font-semibold text-slate-600">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-lg">Guardar</button>
        </div>
      </form>
    </Modal>
  );
}

export default function TabPlan({ d, run }) {
  const [modal, setModal] = useState(null); // { encuentro } | null
  const [borrar, setBorrar] = useState(null);
  const { proyecto: p, encuentros, calculo, participantes, permisos } = d;
  const esParticipante = permisos.es_creador || permisos.mis_espacios.some((m) => m.invitacion === 'aceptado');
  const edita = esParticipante && ['borrador', 'en_acuerdo', 'conformado', 'observado', 'autorizado', 'en_ejecucion'].includes(p.estado);
  const horasPlan = encuentros.reduce((s, e) => s + e.horas, 0);
  const nombres = (ids) => ids.map((i) => participantes.find((x) => x.docente_id === i)).filter(Boolean).map(nombreCompleto).join(', ');

  return (
    <div className="space-y-4">
      {calculo.por_espacio.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-xs space-y-2">
          <h2 className="text-sm font-bold text-slate-900">Horas semanales</h2>
          <p className="text-slate-700">
            Horas compartidas: <strong>{calculo.horas_compartidas}</strong>
            {p.modalidad === 'tiempo_compartido' ? ' (las que cede el espacio que menos cede)' : ''}. Cada espacio incorpora el proyecto en su planificación.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <caption className="sr-only">Horas de cada espacio</caption>
              <thead><tr className="text-left text-slate-600">
                <th scope="col" className="py-1 pr-4">Espacio</th><th scope="col" className="pr-4">Horas semanales</th>
                <th scope="col" className="pr-4">Hasta puede ceder</th><th scope="col">Horas propias que le quedan</th>
              </tr></thead>
              <tbody>
                {calculo.por_espacio.map((e) => (
                  <tr key={e.espacio_id} className="border-t border-slate-100">
                    <th scope="row" className="py-1 pr-4 text-left font-semibold">{e.espacio_nombre}</th>
                    <td className="pr-4">{e.horas_catedra}</td><td className="pr-4">{e.cede}</td><td>{e.horas_propias}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {calculo.tope.aplica && (
            <p className="text-slate-600">
              Con los proyectos de tiempo compartido ya presentados de este curso: {calculo.tope.horas_total} de {calculo.tope.horas_max} hs semanales máximas
              y {calculo.tope.propuestas_total} de {calculo.tope.propuestas_max} propuestas máximas (Orientada, Res. SE 88/2025, Anexo VI).
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-slate-900">Encuentros ({encuentros.length}) · {horasPlan} hs cátedra</h2>
        {edita && (
          <button type="button" onClick={() => setModal({ encuentro: null })} className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5">
            <Plus className="w-4 h-4" aria-hidden="true" /> Agregar encuentro
          </button>
        )}
      </div>
      {encuentros.length === 0 && <EmptyState title="Sin encuentros" message="Planifique las clases o jornadas del proyecto con fecha, horas, docentes a cargo y contenidos." />}
      <ol className="space-y-3">
        {encuentros.map((e, i) => (
          <li key={e.id} className="bg-white rounded-2xl border border-slate-200 p-4 text-xs space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900">{i + 1}. {e.titulo}</h3>
              <div className="flex items-center gap-2">
                {p.estado === 'en_ejecucion' && esParticipante && (
                  <label className="flex items-center gap-1.5 font-semibold">
                    <input type="checkbox" checked={e.realizado} onChange={(ev) => run('encuentro_realizado', { id: e.id, realizado: ev.target.checked }, 'Encuentro actualizado.')} />
                    Realizado
                  </label>
                )}
                {p.estado !== 'en_ejecucion' && e.realizado && <span className="font-bold text-emerald-700">Realizado</span>}
                {edita && (
                  <>
                    <button type="button" aria-label={`Editar encuentro ${e.titulo}`} onClick={() => setModal({ encuentro: e })} className="p-1.5 rounded hover:bg-slate-100"><Pencil className="w-4 h-4" aria-hidden="true" /></button>
                    <button type="button" aria-label={`Eliminar encuentro ${e.titulo}`} onClick={() => setBorrar(e)} className="p-1.5 rounded hover:bg-rose-50 text-rose-700"><Trash2 className="w-4 h-4" aria-hidden="true" /></button>
                  </>
                )}
              </div>
            </div>
            <p className="text-slate-600">{formatFecha(e.fecha) || 'Sin fecha'} · {e.horas} {e.horas === 1 ? 'hora' : 'horas'}{e.docentes.length ? ` · A cargo: ${nombres(e.docentes)}` : ''}</p>
            {e.actividades && <p className="whitespace-pre-line text-slate-800">{e.actividades}</p>}
            {e.contenidos.length > 0 && <p className="text-slate-600">Contenidos: {e.contenidos.join('; ')}</p>}
            {e.evidencia && <p className="text-slate-600 whitespace-pre-line">Evidencia: {e.evidencia}</p>}
          </li>
        ))}
      </ol>

      {modal && <EncuentroModal encuentro={modal.encuentro} d={d} run={run} onClose={() => setModal(null)} />}
      <ConfirmDialog
        open={borrar !== null}
        title="Eliminar encuentro"
        message={`Se eliminará «${borrar?.titulo}» del plan de trabajo.`}
        confirmLabel="Eliminar"
        onCancel={() => setBorrar(null)}
        onConfirm={async () => {
          await run('encuentro_delete', { id: borrar.id }, 'Encuentro eliminado.');
          setBorrar(null);
        }}
      />
    </div>
  );
}
