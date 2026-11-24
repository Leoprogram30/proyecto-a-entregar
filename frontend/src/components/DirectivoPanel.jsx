import React, { useState, useRef, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { useToast, EstadoBadge, Loading, EmptyState, ErrorState, Modal, formatFecha } from './ui';
import PrintablePlanning from './PrintablePlanning';
import PrintableSecuencia from './PrintableSecuencia';
import { fuenteLabel, MOMENTOS_CLASE } from '../config/catalogos';
import { Eye, FileText, Layers, Printer, Search, Send, MessageSquare } from 'lucide-react';

const ESTADOS_REVISION = [
  { value: 'aprobada', label: 'Aprobar' },
  { value: 'requiere_ajustes', label: 'Requiere ajustes' },
];

const CICLOS = [
  { value: 'basico', label: 'Ciclo Básico' },
  { value: 'orientado', label: 'Ciclo Orientado' },
];

const ESTADOS_FILTRO = [
  { value: 'pendiente_revision', label: 'Pendientes de revisión' },
  { value: 'aprobada', label: 'Aprobadas' },
  { value: 'requiere_ajustes', label: 'Requieren ajustes' },
  { value: 'borrador', label: 'Borradores' },
];

const CURSOS = [1, 2, 3, 4, 5, 6];

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

const nombreDocente = (r) => [r?.docente_nombre, r?.docente_apellido].filter(Boolean).join(' ') || '—';
const cicloLabel = (c) => CICLOS.find((x) => x.value === c)?.label ?? '—';
const cursoLabel = (r) => `${r?.espacio_anio ?? '—'}°${r?.division ? ` "${r.division}"` : ''}`;
const lista = (v) => (Array.isArray(v) ? v : v ? [v] : []);

function ContenidosDetalle({ items }) {
  return (
    <ul className="space-y-2">
      {lista(items).map((c, i) => {
        const it = typeof c === 'string' ? { texto: c, indicadores: [] } : c;
        const inds = lista(it.indicadores);
        return (
          <li key={i} className="leading-relaxed">
            <div>
              <span className="font-semibold text-slate-900">{it.texto}</span>
              {it.prioridad && <span className="ml-2 text-[10px] uppercase font-bold text-slate-500">[{it.prioridad === 'complementario' ? 'Complementario' : 'Esencial'}]</span>}
            </div>
            {it.meta && <div className="text-[11px] text-slate-500">Meta: {it.meta}</div>}
            {it.fuente && <div className="text-[10px] text-slate-400">Fuente: {fuenteLabel(it.fuente)}</div>}
            {inds.length > 0 && (
              <ul className="list-disc list-inside text-[11px] text-slate-600 mt-0.5">
                {inds.map((ind, j) => (
                  <li key={j}>{ind}</li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function ClasesDetalle({ items }) {
  return (
    <ol className="space-y-2">
      {lista(items).map((c, i) => (
        <li key={i} className="border border-slate-200 rounded-lg p-2.5 bg-white">
          <div className="font-semibold text-slate-900">
            Clase {i + 1}{c.titulo ? ': ' + c.titulo : ''}{' '}
            <span className="text-[10px] uppercase text-slate-500">{MOMENTOS_CLASE.find((m) => m.value === c.momento)?.label || c.momento}</span>
            {c.duracion ? <span className="text-[11px] text-slate-500"> · {c.duracion}</span> : null}
            {c.evaluativa ? <span className="ml-2 text-[10px] font-bold uppercase text-amber-800">Instancia evaluativa</span> : null}
          </div>
          <p className="whitespace-pre-line leading-relaxed">{c.actividades}</p>
          {c.recursos && <p className="text-[11px] text-slate-500">Recursos: {c.recursos}</p>}
        </li>
      ))}
    </ol>
  );
}

function Secciones({ secciones }) {
  return secciones.map((s) => {
    const vacia = s.nodo ? lista(s.items).length === 0 : s.lista ? s.lista.length === 0 : !s.contenido;
    return (
      <section key={s.titulo} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-1">{s.titulo}</h4>
        {vacia ? (
          <p className="text-slate-400">Sin completar.</p>
        ) : s.nodo ? (
          s.nodo
        ) : s.lista ? (
          <ul className="list-disc list-inside space-y-1">
            {s.lista.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="leading-relaxed whitespace-pre-line">{s.contenido}</p>
        )}
      </section>
    );
  });
}
const sinVacios = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== '' && v != null));

function contarEstados(filas) {
  const c = { total: filas.length, pendiente_revision: 0, aprobada: 0, requiere_ajustes: 0, borrador: 0 };
  filas.forEach((f) => {
    if (c[f.estado] !== undefined) c[f.estado] += 1;
  });
  return c;
}

function Metricas({ c }) {
  const tiles = [
    { label: 'Total', value: c.total, tone: 'text-slate-900' },
    { label: 'Pendientes', value: c.pendiente_revision, tone: 'text-sky-800' },
    { label: 'Aprobadas', value: c.aprobada, tone: 'text-emerald-800' },
    { label: 'Requieren ajustes', value: c.requiere_ajustes, tone: 'text-amber-800' },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {tiles.map((t) => (
        <div key={t.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{t.label}</div>
          <div className={`text-2xl font-black ${t.tone}`}>{t.value}</div>
        </div>
      ))}
    </div>
  );
}

export default function DirectivoPanel() {
  const [tab, setTab] = useState('planificaciones');

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-md">
        <div className="inline-flex items-center gap-2 bg-sky-800/80 px-3 py-1 rounded-full text-xs text-sky-100 font-semibold mb-3 border border-sky-700">
          <Eye className="w-4 h-4 text-sky-300" aria-hidden="true" />
          Supervisión curricular y acompañamiento pedagógico
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Supervisión del equipo directivo</h2>
        <p className="text-xs sm:text-sm text-sky-100 mt-2 max-w-3xl leading-relaxed">
          Revisá las planificaciones anuales y las secuencias didácticas de los docentes. Podés aprobarlas o pedir ajustes con una devolución pedagógica.
        </p>
      </div>

      <div role="tablist" aria-label="Tipo de documento a supervisar" className="grid grid-cols-2 gap-1 bg-white rounded-xl border border-slate-200 p-1 shadow-xs max-w-md">
        {[
          { id: 'planificaciones', label: 'Planificaciones anuales', icon: FileText },
          { id: 'secuencias', label: 'Secuencias didácticas', icon: Layers },
        ].map((t) => {
          const Icono = t.icon;
          const activa = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activa}
              onClick={() => setTab(t.id)}
              className={`py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-2 ${
                activa ? 'bg-sky-50 text-sky-900 ring-1 ring-sky-300' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icono className="w-4 h-4" aria-hidden="true" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'planificaciones' ? <PlanificacionesTab /> : <SecuenciasTab />}
    </div>
  );
}

function PlanificacionesTab() {
  const [ciclo, setCiclo] = useState('');
  const [anio, setAnio] = useState('');
  const [estado, setEstado] = useState('');
  const [buscar, setBuscar] = useState('');
  const [seleccionada, setSeleccionada] = useState(null);

  const { data, loading, error, reload } = useAsync(
    () => api.getAllPlanificaciones(sinVacios({ ciclo, anio, estado })),
    [ciclo, anio, estado].join('|')
  );

  const filas = useMemo(() => lista(data), [data]);
  const visibles = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    if (!q) return filas;
    return filas.filter((p) =>
      [nombreDocente(p), p?.espacio_nombre].some((txt) => String(txt ?? '').toLowerCase().includes(q))
    );
  }, [filas, buscar]);
  const conteo = useMemo(() => contarEstados(filas), [filas]);

  return (
    <div className="space-y-5">
      <Metricas c={conteo} />

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label htmlFor="pl-ciclo" className="block text-[11px] font-semibold text-slate-600 mb-1">Ciclo</label>
          <select id="pl-ciclo" value={ciclo} onChange={(e) => setCiclo(e.target.value)} className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white">
            <option value="">Todos los ciclos</option>
            {CICLOS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pl-anio" className="block text-[11px] font-semibold text-slate-600 mb-1">Curso</label>
          <select id="pl-anio" value={anio} onChange={(e) => setAnio(e.target.value)} className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white">
            <option value="">Todos los cursos</option>
            {CURSOS.map((n) => (
              <option key={n} value={n}>{n}° año</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pl-estado" className="block text-[11px] font-semibold text-slate-600 mb-1">Estado</label>
          <select id="pl-estado" value={estado} onChange={(e) => setEstado(e.target.value)} className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white">
            <option value="">Todos los estados</option>
            {ESTADOS_FILTRO.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pl-buscar" className="block text-[11px] font-semibold text-slate-600 mb-1">Buscar docente o espacio</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" aria-hidden="true" />
            <input id="pl-buscar" type="search" value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Nombre o espacio..." className="w-full pl-8 pr-2 py-2 text-xs border border-slate-300 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : visibles.length === 0 ? (
          <EmptyState title="Sin planificaciones" message="No hay planificaciones que coincidan con los filtros." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Espacio curricular</th>
                  <th className="py-3 px-4">Curso</th>
                  <th className="py-3 px-4">Docente</th>
                  <th className="py-3 px-4">Ciclo</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {visibles.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{p.espacio_nombre ?? '—'}</td>
                    <td className="py-3.5 px-4">{cursoLabel(p)}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{nombreDocente(p)}</td>
                    <td className="py-3.5 px-4">{cicloLabel(p.espacio_ciclo)}</td>
                    <td className="py-3.5 px-4"><EstadoBadge estado={p.estado} /></td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        aria-label={`Supervisar planificación de ${p.espacio_nombre ?? ''} de ${nombreDocente(p)}`}
                        onClick={() => setSeleccionada(p)}
                        className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" /> Supervisar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={!!seleccionada}
        onClose={() => setSeleccionada(null)}
        title={seleccionada ? `${seleccionada.espacio_nombre ?? 'Planificación'} · ${cursoLabel(seleccionada)}` : ''}
      >
        {seleccionada && (
          <RevisionPlanificacion
            plan={seleccionada}
            onSaved={() => {
              setSeleccionada(null);
              reload();
            }}
          />
        )}
      </Modal>
    </div>
  );
}

function RevisionPlanificacion({ plan, onSaved }) {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => api.getPlanificacionDetail(plan.id), plan.id);
  const [estado, setEstado] = useState(null);
  const [comentario, setComentario] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [imprimir, setImprimir] = useState(false);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const det = data?.planificacion ?? plan;
  const comentarios = data?.comentarios ?? [];

  const guardar = async () => {
    if (!estado) {
      toast.error('Elegí si la planificación se aprueba o requiere ajustes.');
      return;
    }
    if (estado === 'requiere_ajustes' && !comentario.trim()) {
      toast.error('Para pedir ajustes escribí una devolución.');
      return;
    }
    setGuardando(true);
    try {
      await api.reviewPlanificacion({ planificacion_id: plan.id, estado, comentario: comentario.trim() });
      toast.success('Devolución guardada.');
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const unidades = lista(det.unidades).map(
    (u, i) => (i + 1) + '. ' + u.titulo + (u.periodo ? ' (' + u.periodo + ')' : '') + (u.horas ? ' - ' + u.horas + ' h' : '') + (u.contenidos ? ': ' + u.contenidos : '')
  );
  const transversales = lista(det.transversales).map((t) => t.tema + (t.como ? ': ' + t.como : ''));
  const secciones = [
    { titulo: 'Diagnóstico del grupo', contenido: det.diagnostico },
    { titulo: 'Fundamentación', contenido: det.fundamentacion },
    { titulo: 'Metas por ciclo', lista: lista(det.metas) },
    { titulo: 'Aprendizajes y contenidos, con indicadores de logro', nodo: <ContenidosDetalle items={det.contenidos} />, items: det.contenidos },
    { titulo: 'Objetivos de aprendizaje', lista: lista(det.objetivos) },
    { titulo: 'Capacidades fundamentales', lista: lista(det.capacidades) },
    { titulo: 'Unidades y tiempos', lista: unidades },
    { titulo: 'Formatos pedagógicos', contenido: lista(det.formatos_pedagogicos).join(', ') },
    { titulo: 'Estrategias', contenido: det.estrategias },
    { titulo: 'Recursos', contenido: det.recursos },
    { titulo: 'Temas transversales', lista: transversales },
    { titulo: 'Articulación con otros espacios', contenido: det.articulacion },
    { titulo: 'Criterios de evaluación', contenido: det.evaluacion_criterios },
    { titulo: 'Instrumentos de evaluación', contenido: det.evaluacion_instrumentos },
    { titulo: 'Momentos, autoevaluación y coevaluación', contenido: det.evaluacion_momentos },
    { titulo: 'Bibliografía', contenido: det.bibliografia },
  ];

  return (
    <div className="space-y-5 text-xs text-slate-700">
      <div className="text-slate-600">
        Docente: <strong>{nombreDocente(det)}</strong> · {cicloLabel(det.espacio_ciclo)}
        {det.espacio_area ? ' · ' + det.espacio_area : ''}
      </div>

      <Secciones secciones={secciones} />

      <section>
        <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-2 flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4 text-sky-700" aria-hidden="true" /> Historial de devoluciones
        </h4>
        {comentarios.length === 0 ? (
          <p className="text-slate-400">Todavía no hay devoluciones.</p>
        ) : (
          <ul className="space-y-2">
            {comentarios.map((c) => (
              <li key={c.id} className="border border-slate-200 rounded-lg p-3">
                <div className="text-[11px] text-slate-500">
                  <strong className="text-slate-700">{[c.nombre, c.apellido].filter(Boolean).join(' ') || '—'}</strong>
                  {c.created_at ? ` · ${formatFecha(String(c.created_at).slice(0, 10))}` : ''}
                </div>
                <p className="mt-1 whitespace-pre-line">{c.comentario}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-sky-50 border border-sky-300 rounded-xl p-4 space-y-3">
        <h4 className="font-bold text-sky-950 uppercase text-[11px]">Tu resolución</h4>
        <div role="group" aria-label="Resolución" className="flex flex-col sm:flex-row gap-2">
          {ESTADOS_REVISION.map((op) => (
            <button
              key={op.value}
              type="button"
              aria-pressed={estado === op.value}
              onClick={() => setEstado(op.value)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border ${
                estado === op.value ? 'bg-sky-700 text-white border-sky-700' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {op.label}
            </button>
          ))}
        </div>
        <div>
          <label htmlFor="rev-comentario" className="block text-[11px] font-semibold text-slate-700 mb-1">
            Devolución pedagógica{estado === 'requiere_ajustes' ? ' *' : ' (opcional)'}
          </label>
          <textarea
            id="rev-comentario"
            rows={3}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            className="w-full p-2.5 text-xs border border-sky-200 rounded-lg bg-white"
          />
        </div>
      </section>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200">
        <button type="button" onClick={() => setImprimir(true)} className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 inline-flex items-center gap-1.5">
          <Printer className="w-4 h-4" aria-hidden="true" /> Imprimir / PDF
        </button>
        <button
          type="button"
          disabled={guardando || !estado}
          onClick={guardar}
          className="px-4 py-2 bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl inline-flex items-center justify-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" aria-hidden="true" /> {guardando ? 'Guardando...' : 'Guardar devolución'}
        </button>
      </div>

      {imprimir && (
        <PrintablePlanning
          plan={det}
          espacio={{ nombre: det.espacio_nombre, anio: det.espacio_anio }}
          onClose={() => setImprimir(false)}
        />
      )}
    </div>
  );
}

function SecuenciasTab() {
  const [estado, setEstado] = useState('');
  const [buscar, setBuscar] = useState('');
  const [seleccionada, setSeleccionada] = useState(null);

  const { data, loading, error, reload } = useAsync(() => api.getSecuencias(), 'secuencias');
  const filas = useMemo(() => lista(data), [data]);
  const visibles = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    return filas.filter((s) => {
      if (estado && s?.estado !== estado) return false;
      if (!q) return true;
      return [nombreDocente(s), s?.espacio_nombre, s?.titulo].some((txt) => String(txt ?? '').toLowerCase().includes(q));
    });
  }, [filas, estado, buscar]);
  const conteo = useMemo(() => contarEstados(filas), [filas]);

  return (
    <div className="space-y-5">
      <Metricas c={conteo} />

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="sec-estado" className="block text-[11px] font-semibold text-slate-600 mb-1">Estado</label>
          <select id="sec-estado" value={estado} onChange={(e) => setEstado(e.target.value)} className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white">
            <option value="">Todos los estados</option>
            {ESTADOS_FILTRO.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sec-buscar" className="block text-[11px] font-semibold text-slate-600 mb-1">Buscar docente, espacio o título</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" aria-hidden="true" />
            <input id="sec-buscar" type="search" value={buscar} onChange={(e) => setBuscar(e.target.value)} className="w-full pl-8 pr-2 py-2 text-xs border border-slate-300 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : visibles.length === 0 ? (
          <EmptyState title="Sin secuencias" message="No hay secuencias didácticas que coincidan con los filtros." />
        ) : (
          <ul className="divide-y divide-slate-200">
            {visibles.map((s) => (
              <li key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900">{s.titulo ?? s.espacio_nombre ?? 'Secuencia sin título'}</div>
                  <div className="text-[11px] text-slate-500">{nombreDocente(s)}{s.espacio_nombre ? ` · ${s.espacio_nombre}` : ''}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <EstadoBadge estado={s.estado} />
                  <button
                    type="button"
                    aria-label={`Revisar secuencia ${s.titulo ?? s.espacio_nombre ?? ''}`}
                    onClick={() => setSeleccionada(s)}
                    className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" aria-hidden="true" /> Revisar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal open={!!seleccionada} onClose={() => setSeleccionada(null)} title="Devolución de secuencia didáctica">
        {seleccionada && (
          <RevisionSecuencia
            secuencia={seleccionada}
            onSaved={() => {
              setSeleccionada(null);
              reload();
            }}
          />
        )}
      </Modal>
    </div>
  );
}

function RevisionSecuencia({ secuencia, onSaved }) {
  const toast = useToast();
  const [imprimir, setImprimir] = useState(false);
  const [estado, setEstado] = useState(null);
  const [devolucion, setDevolucion] = useState(secuencia.devolucion_directivo ?? '');
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    if (!estado) {
      toast.error('Elegí si la secuencia se aprueba o requiere ajustes.');
      return;
    }
    if (estado === 'requiere_ajustes' && !devolucion.trim()) {
      toast.error('Para pedir ajustes escribí una devolución.');
      return;
    }
    setGuardando(true);
    try {
      await api.reviewSecuencia({ secuencia_id: secuencia.id, estado, devolucion: devolucion.trim() });
      toast.success('Devolución guardada.');
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-4 text-xs text-slate-700">
      <div className="text-slate-600">
        Docente: <strong>{nombreDocente(secuencia)}</strong>
        {secuencia.espacio_nombre ? ` · ${secuencia.espacio_nombre}` : ''}
      </div>
      <Secciones
        secciones={[
          { titulo: 'Fundamentación', contenido: secuencia.fundamentacion },
          { titulo: 'Objetivos', contenido: secuencia.objetivos },
          { titulo: 'Capacidades fundamentales', lista: lista(secuencia.capacidades) },
          { titulo: 'Aprendizajes y contenidos, con indicadores de logro', nodo: <ContenidosDetalle items={secuencia.contenidos} />, items: secuencia.contenidos },
          {
            titulo: 'Formato, tiempo, agrupamientos y ambiente',
            contenido: [
              secuencia.formato && 'Formato: ' + secuencia.formato,
              secuencia.tiempo_estimado && 'Tiempo: ' + secuencia.tiempo_estimado,
              secuencia.agrupamientos && 'Agrupamientos: ' + secuencia.agrupamientos,
              secuencia.ambiente && 'Ambiente: ' + secuencia.ambiente,
            ]
              .filter(Boolean)
              .join('\n'),
          },
          { titulo: 'Clases', nodo: <ClasesDetalle items={secuencia.clases} />, items: secuencia.clases },
          { titulo: 'Producto o evidencia', contenido: secuencia.producto },
          { titulo: 'Criterios de evaluación', contenido: secuencia.evaluacion_criterios },
          { titulo: 'Instrumentos de evaluación', contenido: secuencia.evaluacion_instrumentos },
          { titulo: 'Recursos', contenido: secuencia.recursos },
          { titulo: 'Bibliografía', contenido: secuencia.bibliografia },
          {
            titulo: 'Articulación',
            contenido:
              secuencia.tipo_articulacion && secuencia.tipo_articulacion !== 'ninguna'
                ? [secuencia.tipo_articulacion, secuencia.articulacion_materias && 'con ' + secuencia.articulacion_materias, secuencia.articulacion_eje && 'eje: ' + secuencia.articulacion_eje].filter(Boolean).join(' · ')
                : '',
          },
        ]}
      />
      <div role="group" aria-label="Resolución" className="flex flex-col sm:flex-row gap-2">
        {ESTADOS_REVISION.map((op) => (
          <button
            key={op.value}
            type="button"
            aria-pressed={estado === op.value}
            onClick={() => setEstado(op.value)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border ${
              estado === op.value ? 'bg-sky-700 text-white border-sky-700' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {op.label}
          </button>
        ))}
      </div>
      <div>
        <label htmlFor="sec-devolucion" className="block text-[11px] font-semibold text-slate-700 mb-1">
          Devolución{estado === 'requiere_ajustes' ? ' *' : ' (opcional)'}
        </label>
        <textarea id="sec-devolucion" rows={4} value={devolucion} onChange={(e) => setDevolucion(e.target.value)} className="w-full p-2.5 text-xs border border-slate-300 rounded-lg" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={() => setImprimir(true)} className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 inline-flex items-center gap-1.5">
          <Printer className="w-4 h-4" aria-hidden="true" /> Imprimir / PDF
        </button>
        <button type="button" disabled={guardando || !estado} onClick={guardar} className="px-4 py-2 bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl">
          {guardando ? 'Guardando...' : 'Guardar devolución'}
        </button>
      </div>
      {imprimir && <PrintableSecuencia secuencia={secuencia} onClose={() => setImprimir(false)} />}
    </div>
  );
}
