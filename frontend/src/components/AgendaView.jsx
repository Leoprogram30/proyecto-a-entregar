import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useToast, ConfirmDialog, Loading, EmptyState, ErrorState, Modal, formatFecha } from './ui';
import { Calendar, CheckSquare, Square, Plus, Pencil, Trash2, Sprout, Award, BookOpen, CheckCircle2 } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

const ROLES_QUE_CREAN = ['docente', 'coordinador'];

const TIPOS_HITO = [
  { value: 'practica_campo', label: 'Práctica en entorno formativo', icon: Sprout, badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { value: 'hito_evaluativo', label: 'Hito evaluativo', icon: Award, badge: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'entrega_proyecto', label: 'Entrega de informe / proyecto', icon: CheckCircle2, badge: 'bg-sky-100 text-sky-800 border-sky-300' },
  { value: 'clase', label: 'Clase teórico-práctica', icon: BookOpen, badge: 'bg-slate-100 text-slate-700 border-slate-300' },
];

const TIPOS_EVENTO = {
  inicio_clases: 'Inicio de clases',
  receso: 'Receso escolar',
  evaluacion: 'Evaluación / coloquios',
  feriado: 'Feriado',
  academico: 'Jornada pedagógica',
  cierre: 'Cierre de ciclo',
};

const FORM_VACIO = { titulo: '', espacio_id: '', tipo: 'practica_campo', fecha: '', descripcion: '' };

const tipoHito = (v) => TIPOS_HITO.find((t) => t.value === v) ?? TIPOS_HITO[3];
const estaCompletado = (h) => Number(h?.completado) === 1;
const lista = (v) => (Array.isArray(v) ? v : Array.isArray(v?.hitos) ? v.hitos : []);

function useAsync(loader, key) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({ key: null, version: null, data: null, error: null });
  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  });
  useEffect(() => {
    let vigente = true;
    loaderRef.current()
      .then((data) => {
        if (vigente) setState({ key, version, data, error: null });
      })
      .catch((err) => {
        if (vigente) setState({ key, version, data: null, error: err.message });
      });
    return () => {
      vigente = false;
    };
  }, [key, version]);
  const listo = state.key === key && state.version === version;
  return {
    data: listo ? state.data : null,
    error: listo ? state.error : null,
    loading: !listo,
    reload: () => setVersion((v) => v + 1),
  };
}

export default function AgendaView({ selectedEspacio, vista = 'agenda' }) {
  if (vista === 'cronograma') return <CronogramaOficial />;
  return <AgendaDocente selectedEspacio={selectedEspacio} />;
}

function CronogramaOficial() {
  const [anio, setAnio] = useState(CURRENT_YEAR);
  const { data, loading, error, reload } = useAsync(() => api.getCronograma(anio), anio);
  const eventos = lista(data);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-sky-900 to-indigo-900 rounded-2xl p-6 text-white shadow-md">
        <h2 className="text-2xl font-extrabold tracking-tight">Cronograma oficial del ciclo lectivo</h2>
        <p className="text-xs text-sky-100 mt-1">Períodos académicos, recesos e instancias de evaluación establecidos para la institución.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <h3 className="text-sm font-bold text-slate-900">Eventos del {anio}</h3>
          <div className="flex items-center gap-2">
            <label htmlFor="crono-anio" className="text-[11px] font-semibold text-slate-600">Año</label>
            <select id="crono-anio" value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="p-1.5 text-xs border border-slate-300 rounded-lg bg-white">
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : eventos.length === 0 ? (
          <EmptyState title="Sin eventos" message={`Todavía no hay eventos cargados para ${anio}.`} />
        ) : (
          <ul className="space-y-3">
            {eventos.map((ev) => (
              <li key={ev.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 uppercase">
                    {TIPOS_EVENTO[ev.tipo_evento] ?? ev.tipo_evento ?? 'Evento'}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 mt-1">{ev.titulo ?? '—'}</h4>
                  {ev.descripcion && <p className="text-[11px] text-slate-600">{ev.descripcion}</p>}
                </div>
                <div className="text-right shrink-0 text-xs">
                  <div className="font-bold text-emerald-800">{formatFecha(ev.fecha_inicio)}</div>
                  {ev.fecha_fin && ev.fecha_fin !== ev.fecha_inicio && <div className="text-[10px] text-slate-500">al {formatFecha(ev.fecha_fin)}</div>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AgendaDocente({ selectedEspacio }) {
  const { user } = useAuth();
  const toast = useToast();
  const puedeCrear = ROLES_QUE_CREAN.includes(user?.rol);
  const espacioId = selectedEspacio?.id ?? null;

  const hitosQ = useAsync(() => api.getHitos({ espacio_id: espacioId ?? undefined }), espacioId);
  const espaciosQ = useAsync(() => api.getEspacios(), 'espacios');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [aBorrar, setABorrar] = useState(null);
  const [borrando, setBorrando] = useState(false);

  const hitos = useMemo(() => lista(hitosQ.data), [hitosQ.data]);
  const metricas = useMemo(() => {
    const total = hitos.length;
    const completados = hitos.filter(estaCompletado).length;
    return { total, completados, porcentaje: total ? Math.round((completados / total) * 100) : 0 };
  }, [hitos]);
  const espacios = lista(espaciosQ.data);

  const abrirNuevo = () => {
    setEditando(null);
    setForm({ ...FORM_VACIO, espacio_id: espacioId ? String(espacioId) : '' });
    setModalAbierto(true);
  };

  const abrirEditar = (h) => {
    setEditando(h);
    setForm({
      titulo: h.titulo ?? '',
      espacio_id: h.espacio_id != null ? String(h.espacio_id) : '',
      tipo: h.tipo ?? 'clase',
      fecha: h.fecha ?? '',
      descripcion: h.descripcion ?? '',
    });
    setModalAbierto(true);
  };

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const alternar = async (h) => {
    setBusyId(h.id);
    try {
      await api.toggleHito(h.id);
      await hitosQ.reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.fecha || !form.espacio_id) {
      toast.error('Completá espacio, título y fecha.');
      return;
    }
    const payload = {
      espacio_id: Number(form.espacio_id),
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim(),
      tipo: form.tipo,
      fecha: form.fecha,
    };
    setGuardando(true);
    try {
      if (editando) {
        await api.updateHito({ id: editando.id, ...payload });
        toast.success('Actividad actualizada.');
      } else {
        await api.createHito(payload);
        toast.success('Actividad agendada.');
      }
      setModalAbierto(false);
      await hitosQ.reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const borrar = async () => {
    setBorrando(true);
    try {
      await api.deleteHito(aBorrar.id);
      toast.success('Actividad eliminada.');
      setABorrar(null);
      await hitosQ.reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBorrando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-800/80 px-3 py-1 rounded-full text-xs text-emerald-100 font-semibold mb-2 border border-emerald-700">
            <Calendar className="w-3.5 h-3.5 text-emerald-300" aria-hidden="true" />
            Agenda de entornos formativos
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Agenda de hitos y prácticas</h2>
          <p className="text-xs text-emerald-100 mt-1 max-w-2xl leading-relaxed">
            {selectedEspacio?.nombre ? `Actividades de ${selectedEspacio.nombre}.` : 'Actividades de todos tus espacios curriculares.'}
          </p>
        </div>
        {puedeCrear && (
          <button type="button" onClick={abrirNuevo} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm inline-flex items-center gap-2 shrink-0">
            <Plus className="w-4 h-4" aria-hidden="true" />
            Agendar práctica / hito
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Avance</span>
            <div className="text-sm font-extrabold text-slate-800">
              {metricas.completados} de {metricas.total} actividades cumplidas
            </div>
          </div>
          <span className="text-2xl font-black text-emerald-700">{metricas.porcentaje}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={metricas.porcentaje} aria-label="Avance de actividades">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full rounded-full transition-all duration-500" style={{ width: `${metricas.porcentaje}%` }} />
        </div>
      </div>

      {hitosQ.loading ? (
        <Loading />
      ) : hitosQ.error ? (
        <ErrorState message={hitosQ.error} onRetry={hitosQ.reload} />
      ) : hitos.length === 0 ? (
        <EmptyState
          title="Sin actividades"
          message={puedeCrear ? 'Todavía no agendaste actividades. Usá "Agendar práctica / hito" para planificarlas.' : 'Tu rol no carga actividades de agenda.'}
        />
      ) : (
        <ul className="space-y-3">
          {hitos.map((h) => {
            const t = tipoHito(h.tipo);
            const Icono = t.icon;
            const hecho = estaCompletado(h);
            return (
              <li key={h.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${hecho ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-slate-200 shadow-2xs'}`}>
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    type="button"
                    disabled={busyId === h.id}
                    onClick={() => alternar(h)}
                    aria-label={hecho ? `Desmarcar como cumplida: ${h.titulo}` : `Marcar como cumplida: ${h.titulo}`}
                    className="mt-0.5 text-emerald-700 disabled:opacity-50 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    {hecho ? <CheckSquare className="w-5 h-5" aria-hidden="true" /> : <Square className="w-5 h-5 text-slate-400" aria-hidden="true" />}
                  </button>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${t.badge}`}>
                        <Icono className="w-3 h-3" aria-hidden="true" />
                        {t.label}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500">{formatFecha(h.fecha)}</span>
                    </div>
                    <h4 className={`text-xs font-bold break-words ${hecho ? 'line-through text-slate-500' : 'text-slate-900'}`}>{h.titulo ?? '—'}</h4>
                    {h.espacio_nombre && <div className="text-[11px] text-slate-500">{h.espacio_nombre}</div>}
                    {h.descripcion && <p className="text-[11px] text-slate-500 mt-0.5">{h.descripcion}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${hecho ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-600'}`}>
                    {hecho ? 'Cumplida' : 'Pendiente'}
                  </span>
                  {puedeCrear && (
                    <>
                      <button type="button" aria-label={`Editar ${h.titulo ?? 'actividad'}`} onClick={() => abrirEditar(h)} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg">
                        <Pencil className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button type="button" aria-label={`Eliminar ${h.titulo ?? 'actividad'}`} onClick={() => setABorrar(h)} className="p-1.5 text-rose-700 hover:bg-rose-50 rounded-lg">
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal open={modalAbierto} onClose={() => setModalAbierto(false)} title={editando ? 'Editar actividad' : 'Agendar actividad o hito'}>
        <form onSubmit={guardar} className="space-y-3 text-xs">
          <div>
            <label htmlFor="ag-espacio" className="block font-semibold text-slate-700 mb-1">Espacio curricular *</label>
            {espaciosQ.error ? (
              <ErrorState message={espaciosQ.error} onRetry={espaciosQ.reload} />
            ) : (
              <select id="ag-espacio" required value={form.espacio_id} onChange={set('espacio_id')} disabled={espaciosQ.loading} className="w-full p-2 border border-slate-300 rounded-lg bg-white">
                <option value="">{espaciosQ.loading ? 'Cargando espacios...' : 'Elegí un espacio'}</option>
                {espacios.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label htmlFor="ag-titulo" className="block font-semibold text-slate-700 mb-1">Título *</label>
            <input id="ag-titulo" type="text" required value={form.titulo} onChange={set('titulo')} className="w-full p-2 border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label htmlFor="ag-tipo" className="block font-semibold text-slate-700 mb-1">Tipo de actividad</label>
            <select id="ag-tipo" value={form.tipo} onChange={set('tipo')} className="w-full p-2 border border-slate-300 rounded-lg bg-white">
              {TIPOS_HITO.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ag-fecha" className="block font-semibold text-slate-700 mb-1">Fecha *</label>
            <input id="ag-fecha" type="date" required value={form.fecha} onChange={set('fecha')} className="w-full p-2 border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label htmlFor="ag-desc" className="block font-semibold text-slate-700 mb-1">Descripción / objetivos</label>
            <textarea id="ag-desc" rows={2} value={form.descripcion} onChange={set('descripcion')} className="w-full p-2 border border-slate-300 rounded-lg" />
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button type="button" onClick={() => setModalAbierto(false)} className="px-4 py-2 font-semibold text-slate-600">
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-lg">
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!aBorrar}
        title="Eliminar actividad"
        message={`Se eliminará "${aBorrar?.titulo ?? ''}" de tu agenda.`}
        confirmLabel={borrando ? 'Eliminando...' : 'Eliminar'}
        onConfirm={borrar}
        onCancel={() => setABorrar(null)}
      />
    </div>
  );
}
