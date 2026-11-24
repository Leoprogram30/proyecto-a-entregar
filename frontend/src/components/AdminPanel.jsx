import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { useToast, ConfirmDialog, Loading, EmptyState, ErrorState, formatFecha } from './ui';
import UsuariosTab, { ROLES } from './UsuariosTab';
import MateriasTab from './MateriasTab';
import InstitucionTab from './InstitucionTab';
import { Shield, UserCheck, UserX, FileText, Calendar, Upload, Plus, ExternalLink, Trash2, Pencil, BookOpen, Flag } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

const ROLES_APROBACION = ROLES.filter((r) => r.value !== 'admin');

const TIPOS_NORMATIVA = [
  { value: 'diseno_curricular', label: 'Diseño curricular provincial' },
  { value: 'resolucion', label: 'Resolución / disposición' },
  { value: 'regimen_academico', label: 'Régimen académico' },
  { value: 'progresion', label: 'Progresión de aprendizajes' },
  { value: 'orientacion', label: 'Orientaciones' },
  { value: 'planificacion', label: 'Planificación y evaluación' },
  { value: 'ley', label: 'Ley' },
];

const TIPOS_EVENTO = [
  { value: 'inicio_clases', label: 'Inicio de clases' },
  { value: 'receso', label: 'Receso escolar' },
  { value: 'evaluacion', label: 'Evaluación / coloquios' },
  { value: 'feriado', label: 'Feriado' },
  { value: 'academico', label: 'Jornada pedagógica' },
  { value: 'cierre', label: 'Cierre de ciclo' },
];

const FORM_NORMATIVA_VACIO = { titulo: '', tipo: 'resolucion', resolucion_numero: '', url_oficial: '', descripcion: '' };
const FORM_EVENTO_VACIO = { id: null, titulo: '', tipo_evento: 'academico', fecha_inicio: '', fecha_fin: '', descripcion: '' };
const MAX_PDF_BYTES = 25 * 1024 * 1024;

const etiqueta = (lista, valor) => lista.find((o) => o.value === valor)?.label ?? valor ?? '—';

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

export default function AdminPanel() {
  const [tab, setTab] = useState('solicitudes');
  const pestanas = [
    { id: 'solicitudes', label: 'Solicitudes de acceso', icon: UserCheck },
    { id: 'usuarios', label: 'Usuarios', icon: Shield },
    { id: 'materias', label: 'Materias', icon: BookOpen },
    { id: 'normativas', label: 'Normativas', icon: FileText },
    { id: 'cronograma', label: 'Cronograma', icon: Calendar },
    { id: 'institucion', label: 'Institución', icon: Flag },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-emerald-950 rounded-2xl p-6 sm:p-8 text-white shadow-md">
        <div className="inline-flex items-center gap-2 bg-amber-800/80 px-3 py-1 rounded-full text-xs text-amber-200 font-semibold mb-3 border border-amber-700">
          <Shield className="w-4 h-4 text-amber-300" aria-hidden="true" />
          Consola Central del Administrador
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Gestión Institucional</h2>
        <p className="text-xs sm:text-sm text-amber-100 mt-2 max-w-3xl leading-relaxed">
          Aprueba o rechaza solicitudes de acceso, administra usuarios y materias, carga normativas y mantiene el cronograma del ciclo lectivo.
        </p>
      </div>

      <div role="tablist" aria-label="Secciones de administración" className="grid grid-cols-2 sm:grid-cols-6 gap-1 bg-white rounded-xl border border-slate-200 p-1 shadow-xs">
        {pestanas.map((p) => {
          const Icono = p.icon;
          const activa = tab === p.id;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={activa}
              onClick={() => setTab(p.id)}
              className={`py-2.5 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition ${
                activa ? 'bg-amber-50 text-amber-900 ring-1 ring-amber-300' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icono className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="text-left">{p.label}</span>
            </button>
          );
        })}
      </div>

      {tab === 'solicitudes' && <SolicitudesTab />}
      {tab === 'usuarios' && <UsuariosTab />}
      {tab === 'materias' && <MateriasTab />}
      {tab === 'normativas' && <NormativasTab />}
      {tab === 'cronograma' && <CronogramaTab />}
      {tab === 'institucion' && <InstitucionTab />}
    </div>
  );
}

function SolicitudesTab() {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => api.getPendingUsers(), 'pendientes');
  const [roles, setRoles] = useState({});
  const [busyId, setBusyId] = useState(null);

  const decidir = async (u, estado) => {
    setBusyId(u.id);
    try {
      if (estado === 'aprobado') {
        const rol = roles[u.id] ?? (ROLES_APROBACION.some((r) => r.value === u.rol) ? u.rol : 'docente');
        await api.updateUserStatus(u.id, 'aprobado', rol);
        toast.success(`Solicitud de ${u.nombre} aprobada.`);
      } else {
        await api.updateUserStatus(u.id, 'rechazado');
        toast.success(`Solicitud de ${u.nombre} rechazada.`);
      }
      await reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const lista = data ?? [];
  if (lista.length === 0) {
    return <EmptyState title="Sin solicitudes pendientes" message="Todas las solicitudes de acceso fueron procesadas." />;
  }

  return (
    <div className="bg-white rounded-xl border border-amber-200 shadow-xs overflow-hidden">
      <div className="p-4 bg-amber-50 border-b border-amber-200">
        <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wide">Solicitudes pendientes ({lista.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
            <tr>
              <th className="py-3 px-4">Solicitante</th>
              <th className="py-3 px-4">DNI</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Rol solicitado</th>
              <th className="py-3 px-4">Asignar rol</th>
              <th className="py-3 px-4 text-right">Decisión</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {lista.map((u) => {
              const nombreCompleto = `${u.nombre ?? ''} ${u.apellido ?? ''}`.trim() || '—';
              const rolActual = roles[u.id] ?? (ROLES_APROBACION.some((r) => r.value === u.rol) ? u.rol : 'docente');
              return (
                <tr key={u.id} className="hover:bg-amber-50/40 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{nombreCompleto}</div>
                    <div className="text-[10px] text-slate-500">{u.cargo_descripcion ?? ''}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{u.dni ?? '—'}</td>
                  <td className="py-3.5 px-4 text-slate-600">{u.email ?? '—'}</td>
                  <td className="py-3.5 px-4">{etiqueta(ROLES, u.rol)}</td>
                  <td className="py-3.5 px-4">
                    <label htmlFor={`rol-${u.id}`} className="sr-only">Rol a asignar a {nombreCompleto}</label>
                    <select
                      id={`rol-${u.id}`}
                      value={rolActual}
                      disabled={busyId === u.id}
                      onChange={(e) => setRoles((prev) => ({ ...prev, [u.id]: e.target.value }))}
                      className="p-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      {ROLES_APROBACION.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <button
                        type="button"
                        aria-label={`Aprobar a ${nombreCompleto}`}
                        disabled={busyId === u.id}
                        onClick={() => decidir(u, 'aprobado')}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" aria-hidden="true" /> Aprobar
                      </button>
                      <button
                        type="button"
                        aria-label={`Rechazar a ${nombreCompleto}`}
                        disabled={busyId === u.id}
                        onClick={() => decidir(u, 'rechazado')}
                        className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 disabled:opacity-50 text-rose-800 rounded-lg text-xs font-bold inline-flex items-center gap-1"
                      >
                        <UserX className="w-3.5 h-3.5" aria-hidden="true" /> Rechazar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NormativasTab() {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => api.getNormativas({}), 'normativas');
  const [form, setForm] = useState(FORM_NORMATIVA_VACIO);
  const [pdf, setPdf] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [aBorrar, setABorrar] = useState(null);
  const [borrando, setBorrando] = useState(false);

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) {
      toast.error('Ingresá el título del documento.');
      return;
    }
    if (!pdf && !form.url_oficial.trim()) {
      toast.error('Adjuntá un PDF o cargá el enlace oficial.');
      return;
    }
    if (pdf && pdf.size > MAX_PDF_BYTES) {
      toast.error('El PDF no puede superar los 25 MB.');
      return;
    }
    const fd = new FormData();
    fd.append('titulo', form.titulo.trim());
    fd.append('tipo', form.tipo);
    fd.append('resolucion_numero', form.resolucion_numero.trim());
    fd.append('url_oficial', form.url_oficial.trim());
    fd.append('descripcion', form.descripcion.trim());
    if (pdf) fd.append('pdf', pdf);

    setGuardando(true);
    try {
      await api.uploadNormativa(fd);
      toast.success('Documento cargado en el repositorio.');
      setForm(FORM_NORMATIVA_VACIO);
      setPdf(null);
      setFileKey((k) => k + 1);
      await reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const borrar = async () => {
    setBorrando(true);
    try {
      await api.deleteNormativa(aBorrar.id);
      toast.success('Documento eliminado.');
      setABorrar(null);
      await reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBorrando(false);
    }
  };

  const descargar = async (doc) => {
    try {
      await api.descargarNormativa(doc);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const lista = data ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <form onSubmit={guardar} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs h-fit space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
          <Upload className="w-4 h-4 text-emerald-700" aria-hidden="true" />
          Publicar normativa
        </h3>

        <div>
          <label htmlFor="norm-titulo" className="block text-[11px] font-semibold text-slate-700 mb-1">Título del documento *</label>
          <input id="norm-titulo" type="text" required value={form.titulo} onChange={set('titulo')} className="w-full p-2 text-xs border border-slate-300 rounded-lg" />
        </div>
        <div>
          <label htmlFor="norm-tipo" className="block text-[11px] font-semibold text-slate-700 mb-1">Tipo</label>
          <select id="norm-tipo" value={form.tipo} onChange={set('tipo')} className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white">
            {TIPOS_NORMATIVA.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="norm-resolucion" className="block text-[11px] font-semibold text-slate-700 mb-1">Número de resolución</label>
          <input id="norm-resolucion" type="text" value={form.resolucion_numero} onChange={set('resolucion_numero')} className="w-full p-2 text-xs border border-slate-300 rounded-lg" />
        </div>
        <div>
          <label htmlFor="norm-pdf" className="block text-[11px] font-semibold text-slate-700 mb-1">Archivo PDF</label>
          <input
            key={fileKey}
            id="norm-pdf"
            type="file"
            accept="application/pdf"
            onChange={(e) => setPdf(e.target.files?.[0] ?? null)}
            className="w-full text-xs"
          />
        </div>
        <div>
          <label htmlFor="norm-url" className="block text-[11px] font-semibold text-slate-700 mb-1">Enlace oficial (opcional si subís PDF)</label>
          <input id="norm-url" type="url" value={form.url_oficial} onChange={set('url_oficial')} className="w-full p-2 text-xs border border-slate-300 rounded-lg" />
        </div>
        <div>
          <label htmlFor="norm-desc" className="block text-[11px] font-semibold text-slate-700 mb-1">Descripción breve</label>
          <textarea id="norm-desc" rows={2} value={form.descripcion} onChange={set('descripcion')} className="w-full p-2 text-xs border border-slate-300 rounded-lg" />
        </div>
        <button type="submit" disabled={guardando} className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold">
          {guardando ? 'Guardando...' : 'Guardar documento'}
        </button>
      </form>

      <div className="lg:col-span-2 space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Documentos ({lista.length})</h3>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : lista.length === 0 ? (
          <EmptyState title="Repositorio vacío" message="Todavía no se cargaron normativas." />
        ) : (
          lista.map((n) => (
            <div key={n.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">{etiqueta(TIPOS_NORMATIVA, n.tipo)}</span>
                  {n.resolucion_numero && <span className="text-[10px] font-mono font-semibold text-slate-500">{n.resolucion_numero}</span>}
                </div>
                <h4 className="text-xs font-bold text-slate-900 break-words">{n.titulo ?? '—'}</h4>
                {n.descripcion && <p className="text-[11px] text-slate-500 mt-1">{n.descripcion}</p>}
              </div>
              <div className="flex flex-wrap gap-1.5 shrink-0">
                {n.tiene_pdf && (
                  <button type="button" aria-label={`Descargar PDF de ${n.titulo ?? 'documento'}`} onClick={() => descargar(n)} className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold">
                    Descargar PDF
                  </button>
                )}
                {n.url_oficial && (
                  <a href={n.url_oficial} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" aria-hidden="true" /> Sitio oficial
                  </a>
                )}
                <button type="button" aria-label={`Eliminar ${n.titulo ?? 'documento'}`} onClick={() => setABorrar(n)} className="p-1.5 text-rose-700 hover:bg-rose-50 rounded-lg">
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!aBorrar}
        title="Eliminar documento"
        message={`Se eliminará "${aBorrar?.titulo ?? ''}" del repositorio. Esta acción no se puede deshacer.`}
        confirmLabel={borrando ? 'Eliminando...' : 'Eliminar'}
        onConfirm={borrar}
        onCancel={() => setABorrar(null)}
      />
    </div>
  );
}

function CronogramaTab() {
  const toast = useToast();
  const [anio, setAnio] = useState(CURRENT_YEAR);
  const { data, loading, error, reload } = useAsync(() => api.getCronograma(anio), anio);
  const [form, setForm] = useState(FORM_EVENTO_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [aBorrar, setABorrar] = useState(null);
  const [borrando, setBorrando] = useState(false);

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const editar = (ev) => {
    setForm({
      id: ev.id,
      titulo: ev.titulo ?? '',
      tipo_evento: ev.tipo_evento ?? 'academico',
      fecha_inicio: ev.fecha_inicio ?? '',
      fecha_fin: ev.fecha_fin ?? '',
      descripcion: ev.descripcion ?? '',
    });
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.fecha_inicio) {
      toast.error('El título y la fecha de inicio son obligatorios.');
      return;
    }
    const fin = form.fecha_fin || form.fecha_inicio;
    if (fin < form.fecha_inicio) {
      toast.error('La fecha de fin no puede ser anterior a la de inicio.');
      return;
    }
    setGuardando(true);
    try {
      await api.saveCronogramaEvento({
        ...(form.id ? { id: form.id } : {}),
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        tipo_evento: form.tipo_evento,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: fin,
        anio_lectivo: anio,
        obligatorio: 1,
      });
      toast.success(form.id ? 'Evento actualizado.' : 'Evento agregado al cronograma.');
      setForm(FORM_EVENTO_VACIO);
      await reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const borrar = async () => {
    setBorrando(true);
    try {
      await api.deleteCronogramaEvento(aBorrar.id);
      toast.success('Evento eliminado.');
      setABorrar(null);
      await reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBorrando(false);
    }
  };

  const lista = data ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <form onSubmit={guardar} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs h-fit space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
          <Plus className="w-4 h-4 text-sky-700" aria-hidden="true" />
          {form.id ? 'Editar evento' : 'Nuevo evento'}
        </h3>
        <div>
          <label htmlFor="cron-titulo" className="block text-[11px] font-semibold text-slate-700 mb-1">Título *</label>
          <input id="cron-titulo" type="text" required value={form.titulo} onChange={set('titulo')} className="w-full p-2 text-xs border border-slate-300 rounded-lg" />
        </div>
        <div>
          <label htmlFor="cron-tipo" className="block text-[11px] font-semibold text-slate-700 mb-1">Tipo de evento</label>
          <select id="cron-tipo" value={form.tipo_evento} onChange={set('tipo_evento')} className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white">
            {TIPOS_EVENTO.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label htmlFor="cron-inicio" className="block text-[11px] font-semibold text-slate-700 mb-1">Inicio *</label>
            <input id="cron-inicio" type="date" required value={form.fecha_inicio} onChange={set('fecha_inicio')} className="w-full p-2 text-xs border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label htmlFor="cron-fin" className="block text-[11px] font-semibold text-slate-700 mb-1">Fin</label>
            <input id="cron-fin" type="date" value={form.fecha_fin} onChange={set('fecha_fin')} className="w-full p-2 text-xs border border-slate-300 rounded-lg" />
          </div>
        </div>
        <div>
          <label htmlFor="cron-desc" className="block text-[11px] font-semibold text-slate-700 mb-1">Descripción</label>
          <textarea id="cron-desc" rows={2} value={form.descripcion} onChange={set('descripcion')} className="w-full p-2 text-xs border border-slate-300 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={guardando} className="flex-1 py-2 bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold">
            {guardando ? 'Guardando...' : form.id ? 'Guardar cambios' : 'Agregar al cronograma'}
          </button>
          {form.id && (
            <button type="button" onClick={() => setForm(FORM_EVENTO_VACIO)} className="px-3 py-2 text-xs font-semibold text-slate-600 border border-slate-300 rounded-lg">
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="lg:col-span-2 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Cronograma del ciclo lectivo ({lista.length})</h3>
          <div className="flex items-center gap-2">
            <label htmlFor="cron-anio" className="text-[11px] font-semibold text-slate-600">Año</label>
            <select id="cron-anio" value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="p-1.5 text-xs border border-slate-300 rounded-lg bg-white">
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
        ) : lista.length === 0 ? (
          <EmptyState title="Sin eventos" message={`No hay eventos cargados para ${anio}.`} />
        ) : (
          lista.map((ev) => (
            <div key={ev.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">{etiqueta(TIPOS_EVENTO, ev.tipo_evento)}</span>
                <div className="text-xs font-bold text-slate-900 mt-1">{ev.titulo ?? '—'}</div>
                {ev.descripcion && <p className="text-[11px] text-slate-500">{ev.descripcion}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right text-xs">
                  <div className="font-bold text-emerald-800">{formatFecha(ev.fecha_inicio)}</div>
                  {ev.fecha_fin && ev.fecha_fin !== ev.fecha_inicio && <div className="text-[10px] text-slate-500">al {formatFecha(ev.fecha_fin)}</div>}
                </div>
                <button type="button" aria-label={`Editar ${ev.titulo ?? 'evento'}`} onClick={() => editar(ev)} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg">
                  <Pencil className="w-4 h-4" aria-hidden="true" />
                </button>
                <button type="button" aria-label={`Eliminar ${ev.titulo ?? 'evento'}`} onClick={() => setABorrar(ev)} className="p-1.5 text-rose-700 hover:bg-rose-50 rounded-lg">
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!aBorrar}
        title="Eliminar evento"
        message={`Se eliminará "${aBorrar?.titulo ?? ''}" del cronograma.`}
        confirmLabel={borrando ? 'Eliminando...' : 'Eliminar'}
        onConfirm={borrar}
        onCancel={() => setABorrar(null)}
      />
    </div>
  );
}
