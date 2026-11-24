import { useState } from 'react';
import { Check, Clock, Pencil } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync';
import { api } from '../../services/api';
import { Loading, Modal } from '../ui';
import { FUENTE_LABEL, inputCls, nombreCompleto } from './constantes';
import { Campo } from './comunes';

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function AporteModal({ aporte, run, onClose }) {
  const catalogo = useAsync(() => api.getCatalogoArt(aporte.espacio_id), [aporte.espacio_id], []);
  const [f, setF] = useState({
    tema: aporte.tema || '', actividades: aporte.actividades || '', recursos: aporte.recursos || '',
    saberes_propios: aporte.saberes_propios || '', evaluacion_aporte: aporte.evaluacion_aporte || '', disponibilidad: aporte.disponibilidad || ''
  });
  // Seleccionados del catálogo: curriculum_id -> indicadores elegidos
  const [sel, setSel] = useState(() => Object.fromEntries((aporte.contenidos || []).filter((c) => c.curriculum_id).map((c) => [c.curriculum_id, c.indicadores || []])));
  const [propios, setPropios] = useState(() => (aporte.contenidos || []).filter((c) => !c.curriculum_id).map((c) => ({ titulo: c.titulo, descripcion: c.descripcion || '', indicadores: (c.indicadores || []).join('\n') })));
  const [q, setQ] = useState('');
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const lista = catalogo.data.filter((c) => !q.trim() || norm(`${c.titulo} ${c.descripcion} ${c.meta}`).includes(norm(q)));
  const alternar = (c) =>
    setSel((s) => {
      const n = { ...s };
      if (c.id in n) delete n[c.id];
      else n[c.id] = c.indicadores;
      return n;
    });
  const alternarInd = (c, ind) =>
    setSel((s) => {
      const act = s[c.id] || [];
      return { ...s, [c.id]: act.includes(ind) ? act.filter((x) => x !== ind) : [...act, ind] };
    });

  const guardar = async (e) => {
    e.preventDefault();
    const contenidos = [
      ...Object.entries(sel).map(([id, indicadores]) => ({ curriculum_id: Number(id), indicadores })),
      ...propios.filter((c) => c.titulo.trim()).map((c) => ({ titulo: c.titulo, descripcion: c.descripcion, indicadores: c.indicadores.split('\n').map((x) => x.trim()).filter(Boolean) }))
    ];
    const r = await run('aporte_save', { espacio_id: aporte.espacio_id, ...f, contenidos }, (x) => (x?.anulo_conformidades ? 'Aporte guardado. Las conformidades se anularon.' : 'Aporte guardado.'));
    if (r) onClose();
  };

  return (
    <Modal open onClose={onClose} title={`Mi aporte desde ${aporte.espacio_nombre}`} size="max-w-3xl">
      <form onSubmit={guardar} className="space-y-4 text-xs">
        <Campo label="Tema desde mi espacio" htmlFor="ap-tema" hint='En sus palabras. Ej.: "el cuerpo humano", "funciones lineales".'>
          <input id="ap-tema" maxLength={250} value={f.tema} onChange={set('tema')} className={inputCls} />
        </Campo>

        <fieldset className="space-y-2">
          <legend className="text-[11px] font-semibold text-slate-700">Aprendizajes y contenidos de {aporte.espacio_nombre}</legend>
          <label htmlFor="ap-q" className="sr-only">Filtrar contenidos del espacio</label>
          <input id="ap-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar por palabra..." className={inputCls} />
          {catalogo.loading && <Loading message="Cargando contenidos..." />}
          {catalogo.error && <p role="alert" className="text-rose-700">{catalogo.error}</p>}
          <ul className="max-h-72 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
            {lista.map((c) => (
              <li key={c.id} className="p-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={c.id in sel} onChange={() => alternar(c)} className="mt-0.5" />
                  <span>
                    <span className="font-semibold text-slate-900">{c.titulo}.</span> {c.descripcion}
                    <span className="text-slate-400"> ({FUENTE_LABEL[c.fuente] || c.fuente}{c.pagina ? `, ${c.pagina}` : ''})</span>
                  </span>
                </label>
                {c.id in sel && c.indicadores.length > 0 && (
                  <div className="ml-6 mt-1 space-y-0.5">
                    <p className="text-[10px] font-semibold text-slate-500">Indicadores que evaluaré en el proyecto</p>
                    {c.indicadores.map((ind) => (
                      <label key={ind} className="flex items-start gap-2 text-[11px] text-slate-700 cursor-pointer">
                        <input type="checkbox" checked={sel[c.id].includes(ind)} onChange={() => alternarInd(c, ind)} className="mt-0.5" />
                        <span>{ind}</span>
                      </label>
                    ))}
                  </div>
                )}
              </li>
            ))}
            {!catalogo.loading && lista.length === 0 && <li className="p-3 text-slate-500">No hay contenidos que coincidan.</li>}
          </ul>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-[11px] font-semibold text-slate-700">Contenidos propios (no están en el catálogo)</legend>
          {propios.map((c, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-2 p-2 border border-slate-200 rounded-lg">
              <input aria-label={`Título del contenido propio ${i + 1}`} placeholder="Título" value={c.titulo} onChange={(e) => setPropios((s) => s.map((x, j) => (j === i ? { ...x, titulo: e.target.value } : x)))} className={inputCls} />
              <input aria-label={`Descripción del contenido propio ${i + 1}`} placeholder="Descripción" value={c.descripcion} onChange={(e) => setPropios((s) => s.map((x, j) => (j === i ? { ...x, descripcion: e.target.value } : x)))} className={inputCls} />
              <textarea aria-label={`Indicadores del contenido propio ${i + 1}`} rows={2} placeholder="Indicadores (uno por línea)" value={c.indicadores} onChange={(e) => setPropios((s) => s.map((x, j) => (j === i ? { ...x, indicadores: e.target.value } : x)))} className={`${inputCls} sm:col-span-2`} />
              <button type="button" onClick={() => setPropios((s) => s.filter((_, j) => j !== i))} className="text-rose-700 font-semibold text-left">Quitar</button>
            </div>
          ))}
          <button type="button" onClick={() => setPropios((s) => [...s, { titulo: '', descripcion: '', indicadores: '' }])} className="font-bold text-sky-800 underline">+ Agregar contenido propio</button>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="Actividades a mi cargo" htmlFor="ap-act"><textarea id="ap-act" rows={3} value={f.actividades} onChange={set('actividades')} className={inputCls} /></Campo>
          <Campo label="Recursos" htmlFor="ap-rec"><textarea id="ap-rec" rows={3} value={f.recursos} onChange={set('recursos')} className={inputCls} /></Campo>
          <Campo label="Saberes que garantizo en mis horas no compartidas" htmlFor="ap-sab"><textarea id="ap-sab" rows={3} value={f.saberes_propios} onChange={set('saberes_propios')} className={inputCls} /></Campo>
          <Campo label="Cómo evaluaré mi parte" htmlFor="ap-ev"><textarea id="ap-ev" rows={3} value={f.evaluacion_aporte} onChange={set('evaluacion_aporte')} className={inputCls} /></Campo>
          <Campo label="Disponibilidad (días y horas)" htmlFor="ap-disp"><textarea id="ap-disp" rows={2} value={f.disponibilidad} onChange={set('disponibilidad')} className={inputCls} /></Campo>
        </div>
        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">
          Al guardar cambios en su aporte, las conformidades ya dadas por todos los docentes quedan sin efecto.
        </p>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-3 py-2 font-semibold text-slate-600">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-lg">Guardar aporte</button>
        </div>
      </form>
    </Modal>
  );
}

export default function TabAportes({ d, run }) {
  const [editando, setEditando] = useState(null);
  const { participantes, permisos, proyecto: p } = d;
  const completo = permisos.nivel === 'completo';
  const editable = ['borrador', 'en_acuerdo', 'conformado', 'observado'].includes(p.estado);
  const esMio = (x) => permisos.mis_espacios.some((m) => m.espacio_id === x.espacio_id);
  const aceptados = participantes.filter((x) => x.invitacion === 'aceptado');
  const otros = participantes.filter((x) => x.invitacion !== 'aceptado');

  return (
    <div className="space-y-4">
      <ul className="grid gap-3 md:grid-cols-2">
        {aceptados.map((x) => (
          <li key={x.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2 text-xs">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900">{x.espacio_nombre}</h2>
                <p className="text-slate-600">{nombreCompleto(x)} · {x.espacio_horas} hs semanales</p>
              </div>
              {completo && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${x.conformidad ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-slate-50 text-slate-600 border-slate-300'}`}>
                  {x.conformidad ? <Check className="w-3 h-3" aria-hidden="true" /> : <Clock className="w-3 h-3" aria-hidden="true" />}
                  {x.conformidad ? 'Conforme' : 'Sin conformidad'}
                </span>
              )}
            </div>
            <p><span className="font-semibold">Tema:</span> {x.tema || <span className="text-slate-400">Todavía no cargó su tema.</span>}</p>
            {completo && (
              <>
                {x.contenidos.length > 0 && (
                  <div>
                    <p className="font-semibold">Contenidos de su espacio</p>
                    <ul className="space-y-1 mt-1">
                      {x.contenidos.map((c, i) => (
                        <li key={`${c.curriculum_id || 't'}-${i}`}>
                          <details>
                            <summary className="cursor-pointer text-slate-800">
                              {c.titulo}{c.propio ? ' (propio)' : c.fuente ? ` · ${FUENTE_LABEL[c.fuente] || c.fuente}` : ''}
                            </summary>
                            {c.descripcion && <p className="text-slate-600 ml-4">{c.descripcion}</p>}
                            {c.indicadores?.length > 0 && (
                              <ul className="list-disc ml-8 text-slate-600">
                                {c.indicadores.map((ind) => <li key={ind}>{ind}</li>)}
                              </ul>
                            )}
                          </details>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {[['Actividades', x.actividades], ['Recursos', x.recursos], ['Saberes que garantiza en sus horas propias', x.saberes_propios], ['Disponibilidad', x.disponibilidad]].map(([l, v]) =>
                  v ? <p key={l} className="whitespace-pre-line"><span className="font-semibold">{l}:</span> {v}</p> : null
                )}
              </>
            )}
            {esMio(x) && editable && (
              <button type="button" onClick={() => setEditando(x)} className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-lg flex items-center gap-1.5">
                <Pencil className="w-3.5 h-3.5" aria-hidden="true" /> Editar mi aporte
              </button>
            )}
          </li>
        ))}
      </ul>
      {otros.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-3 text-xs">
          <h2 className="font-bold text-slate-900 mb-1">Invitaciones</h2>
          <ul className="space-y-0.5 text-slate-700">
            {otros.map((x) => (
              <li key={x.id}>{nombreCompleto(x)} · {x.espacio_nombre}: {x.invitacion === 'invitado' ? 'sin responder' : 'rechazada'}</li>
            ))}
          </ul>
        </div>
      )}
      {editando && <AporteModal aporte={editando} run={run} onClose={() => setEditando(null)} />}
    </div>
  );
}
