import { useMemo, useState } from 'react';
import { api } from '../services/api';
import { useToast, ConfirmDialog, Loading, EmptyState, ErrorState, Modal } from './ui';
import { Campo, useLista } from './UsuariosTab';
import { CAMPOS, CAMPOS_APRENDIZAJE, fuenteLabel } from '../config/catalogos';
import { BookPlus, Pencil, Trash2, Eye, EyeOff, ListChecks, Search } from 'lucide-react';

const CICLOS = [
  { value: 'basico', label: 'Ciclo básico (1° a 3°)', anios: [1, 2, 3] },
  { value: 'orientado', label: 'Ciclo orientado (4° a 6°)', anios: [4, 5, 6] },
];
const TIPOS_CONTENIDO = [
  { value: 'objetivo', label: 'Objetivo' },
  { value: 'eje_contenido', label: 'Aprendizajes y contenidos' },
];
const INPUT = 'w-full p-2 text-xs border border-slate-300 rounded-lg bg-white';
const normalizar = (t) => String(t ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const etiquetaTipo = (v) => TIPOS_CONTENIDO.find((t) => t.value === v)?.label ?? (v === 'progresion' ? 'Progresión' : v);

const FORM_VACIO = {
  id: null,
  ciclo: 'orientado',
  anio: '4',
  nombre: '',
  area: '',
  orientacion: 'Agro y Ambiente',
  horas_catedra: '4',
  descripcion: '',
  campo: 'general',
  campo_aprendizaje: '',
  activo: true,
};

function MateriaForm({ materia, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(() =>
    materia
      ? {
          id: materia.id,
          ciclo: materia.ciclo,
          anio: String(materia.anio),
          nombre: materia.nombre ?? '',
          area: materia.area ?? '',
          orientacion: materia.orientacion ?? '',
          horas_catedra: String(materia.horas_catedra),
          descripcion: materia.descripcion ?? '',
          campo: materia.campo ?? 'general',
          campo_aprendizaje: materia.campo_aprendizaje ?? '',
          activo: Number(materia.activo) === 1,
        }
      : FORM_VACIO
  );
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState('');
  const [guardando, setGuardando] = useState(false);
  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const aniosCiclo = CICLOS.find((c) => c.value === form.ciclo).anios;

  const cambiarCiclo = (e) => {
    const ciclo = e.target.value;
    const anios = CICLOS.find((c) => c.value === ciclo).anios;
    setForm((f) => ({ ...f, ciclo, anio: anios.includes(Number(f.anio)) ? f.anio : String(anios[0]) }));
  };

  const enviar = async (ev) => {
    ev.preventDefault();
    const errs = {};
    if (!form.nombre.trim()) errs.nombre = 'Ingresá el nombre de la materia.';
    if (!form.area.trim()) errs.area = 'Ingresá el área.';
    const horas = Number(form.horas_catedra);
    if (!Number.isInteger(horas) || horas < 1 || horas > 20) errs.horas_catedra = 'Las horas cátedra deben ser un entero entre 1 y 20.';
    setErrores(errs);
    setErrorServidor('');
    if (Object.keys(errs).length > 0) return;
    setGuardando(true);
    try {
      await api.saveEspacio({
        ...(form.id ? { id: form.id } : {}),
        ciclo: form.ciclo,
        anio: Number(form.anio),
        nombre: form.nombre.trim(),
        area: form.area.trim(),
        orientacion: form.orientacion.trim() || undefined,
        horas_catedra: horas,
        descripcion: form.descripcion.trim() || undefined,
        campo: form.campo,
        campo_aprendizaje: form.campo_aprendizaje || null,
        activo: form.activo,
      });
      toast.success(form.id ? 'Materia actualizada.' : 'Materia creada.');
      onSaved();
    } catch (err) {
      setErrorServidor(err.message);
      if (err.details && typeof err.details === 'object') {
        const det = {};
        ['nombre', 'area', 'horas_catedra', 'anio'].forEach((k) => {
          if (err.details[k]) det[k] = k === 'nombre' && err.details[k] === 'duplicado' ? 'Ya existe una materia con ese nombre en el año.' : String(err.details[k]);
        });
        setErrores(det);
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={enviar} noValidate className="space-y-3" aria-label={form.id ? 'Formulario de edición de materia' : 'Formulario de nueva materia'}>
      {errorServidor && (
        <div role="alert" className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-800">{errorServidor}</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Campo id="mat-ciclo" label="Ciclo">
          <select id="mat-ciclo" value={form.ciclo} onChange={cambiarCiclo} className={INPUT}>
            {CICLOS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </Campo>
        <Campo id="mat-anio" label="Año" error={errores.anio}>
          <select id="mat-anio" value={form.anio} onChange={set('anio')} className={INPUT}>
            {aniosCiclo.map((a) => (
              <option key={a} value={a}>{a}° año</option>
            ))}
          </select>
        </Campo>
        <div className="sm:col-span-2">
          <Campo id="mat-nombre" label="Nombre *" error={errores.nombre}>
            <input id="mat-nombre" type="text" maxLength={150} value={form.nombre} onChange={set('nombre')} aria-invalid={!!errores.nombre} className={INPUT} />
          </Campo>
        </div>
        <Campo id="mat-area" label="Área *" error={errores.area}>
          <input id="mat-area" type="text" maxLength={100} value={form.area} onChange={set('area')} aria-invalid={!!errores.area} className={INPUT} />
        </Campo>
        <Campo id="mat-orientacion" label="Orientación">
          <input id="mat-orientacion" type="text" maxLength={100} value={form.orientacion} onChange={set('orientacion')} className={INPUT} />
        </Campo>
        <Campo id="mat-horas" label="Horas cátedra * (1 a 20)" error={errores.horas_catedra}>
          <input id="mat-horas" type="number" min={1} max={20} value={form.horas_catedra} onChange={set('horas_catedra')} aria-invalid={!!errores.horas_catedra} className={INPUT} />
        </Campo>
        <Campo id="mat-campo" label="Campo formativo">
          <select id="mat-campo" value={form.campo} onChange={set('campo')} className={INPUT}>
            {Object.entries(CAMPOS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </Campo>
        <Campo id="mat-campo-aprendizaje" label="Campo de Aprendizaje (Anexo IV, Res. 88/2025)">
          <select id="mat-campo-aprendizaje" value={form.campo_aprendizaje} onChange={set('campo_aprendizaje')} className={INPUT}>
            <option value="">Sin campo asignado</option>
            {Object.entries(CAMPOS_APRENDIZAJE).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </Campo>
        <div className="flex items-end">
          <label htmlFor="mat-activo" className="flex items-center gap-2 text-xs font-semibold text-slate-700 pb-2">
            <input id="mat-activo" type="checkbox" checked={form.activo} onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))} />
            Materia activa (visible para los docentes)
          </label>
        </div>
        <div className="sm:col-span-2">
          <Campo id="mat-desc" label="Descripción">
            <textarea id="mat-desc" rows={3} maxLength={5000} value={form.descripcion} onChange={set('descripcion')} className={INPUT} />
          </Campo>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700">
          Cancelar
        </button>
        <button type="submit" disabled={guardando} className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white">
          {guardando ? 'Guardando...' : form.id ? 'Guardar cambios' : 'Crear materia'}
        </button>
      </div>
    </form>
  );
}

const CONTENIDO_VACIO = { id: null, tipo: 'objetivo', titulo: '', descripcion: '' };

function ContenidosPanel({ materia }) {
  const toast = useToast();
  const { data, loading, error, reload } = useLista(() => api.getEspacioDetail(materia.id, { todos: true }));
  const [form, setForm] = useState(CONTENIDO_VACIO);
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [aBorrar, setABorrar] = useState(null);
  const [borrando, setBorrando] = useState(false);
  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const guardar = async (ev) => {
    ev.preventDefault();
    const errs = {};
    if (!form.titulo.trim()) errs.titulo = 'Ingresá el título.';
    if (!form.descripcion.trim()) errs.descripcion = 'Ingresá la descripción.';
    setErrores(errs);
    setErrorServidor('');
    if (Object.keys(errs).length > 0) return;
    setGuardando(true);
    try {
      await api.saveContenido({
        ...(form.id ? { id: form.id } : {}),
        espacio_id: materia.id,
        tipo: form.tipo,
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
      });
      toast.success(form.id ? 'Contenido actualizado.' : 'Contenido agregado.');
      setForm(CONTENIDO_VACIO);
      reload();
    } catch (err) {
      setErrorServidor(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const borrar = async () => {
    setBorrando(true);
    try {
      await api.deleteContenido(aBorrar.id);
      toast.success('Contenido eliminado.');
      if (form.id === aBorrar.id) setForm(CONTENIDO_VACIO);
      setABorrar(null);
      reload();
    } catch (err) {
      toast.error(err.message);
      setABorrar(null);
    } finally {
      setBorrando(false);
    }
  };

  const contenidos = data?.contenidos ?? [];

  return (
    <div className="space-y-4">
      {loading && <Loading />}
      {!loading && error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && contenidos.length === 0 && (
        <p className="text-xs text-slate-500 text-center py-3">Esta materia todavía no tiene objetivos ni contenidos.</p>
      )}
      {!loading && !error && contenidos.length > 0 && (
        <ul className="divide-y divide-slate-200 border border-slate-200 rounded-xl max-h-96 overflow-y-auto" aria-label="Objetivos y contenidos">
          {contenidos.map((c) => (
            <li key={c.id} className="p-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">{etiquetaTipo(c.tipo)}</span>
                <span className="ml-1 text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5">{fuenteLabel(c.fuente)}</span>
                {!c.vigente && <span className="ml-1 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">Referencia</span>}
                {c.pagina && <span className="ml-1 text-[10px] text-slate-500">{c.pagina}</span>}
                <p className="text-xs font-bold text-slate-900 mt-1">{c.titulo}</p>
                {c.meta && <p className="text-[11px] text-slate-500 mt-0.5">Meta: {c.meta}</p>}
                <p className="text-[11px] text-slate-600 mt-0.5 whitespace-pre-line">{c.descripcion}</p>
                {Array.isArray(c.indicadores) && c.indicadores.length > 0 && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-[11px] font-semibold text-sky-800">Indicadores de logro ({c.indicadores.length})</summary>
                    <ul className="list-disc pl-5 text-[11px] text-slate-600">
                      {c.indicadores.map((ind, i) => (
                        <li key={i}>{ind}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  aria-label={`Editar contenido ${c.titulo}`}
                  onClick={() => {
                    setForm({ id: c.id, tipo: c.tipo, titulo: c.titulo, descripcion: c.descripcion });
                    setErrores({});
                    setErrorServidor('');
                  }}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Eliminar contenido ${c.titulo}`}
                  onClick={() => setABorrar(c)}
                  className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={guardar} noValidate className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-3" aria-label="Formulario de contenido">
        <h3 className="text-xs font-bold text-slate-800">{form.id ? 'Editar contenido' : 'Agregar objetivo o contenido'}</h3>
        {errorServidor && (
          <div role="alert" className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-800">{errorServidor}</div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Campo id="cont-tipo" label="Tipo">
            <select id="cont-tipo" value={form.tipo} onChange={set('tipo')} className={INPUT}>
              {TIPOS_CONTENIDO.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Campo>
          <div className="sm:col-span-2">
            <Campo id="cont-titulo" label="Título *" error={errores.titulo}>
              <input id="cont-titulo" type="text" maxLength={200} value={form.titulo} onChange={set('titulo')} aria-invalid={!!errores.titulo} className={INPUT} />
            </Campo>
          </div>
        </div>
        <Campo id="cont-desc" label="Descripción *" error={errores.descripcion}>
          <textarea id="cont-desc" rows={3} maxLength={5000} value={form.descripcion} onChange={set('descripcion')} aria-invalid={!!errores.descripcion} className={INPUT} />
        </Campo>
        <div className="flex justify-end gap-2">
          {form.id && (
            <button type="button" onClick={() => setForm(CONTENIDO_VACIO)} className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700">
              Cancelar edición
            </button>
          )}
          <button type="submit" disabled={guardando} className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white">
            {guardando ? 'Guardando...' : form.id ? 'Guardar contenido' : 'Agregar contenido'}
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={!!aBorrar}
        title="Eliminar contenido"
        message={`¿Eliminar "${aBorrar?.titulo ?? ''}" de ${materia.nombre}?`}
        confirmLabel="Eliminar"
        busy={borrando}
        onConfirm={borrar}
        onCancel={() => setABorrar(null)}
      />
    </div>
  );
}

export default function MateriasTab() {
  const toast = useToast();
  const { data, loading, error, reload } = useLista(() => api.getEspacios({ incluir_inactivas: true }));
  const [busqueda, setBusqueda] = useState('');
  const [filtroCiclo, setFiltroCiclo] = useState('');
  const [filtroAnio, setFiltroAnio] = useState('');
  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [contenidosDe, setContenidosDe] = useState(null);
  const [aBorrar, setABorrar] = useState(null);
  const [borrando, setBorrando] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const lista = useMemo(() => data ?? [], [data]);
  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim());
    return lista.filter((m) => {
      if (filtroCiclo && m.ciclo !== filtroCiclo) return false;
      if (filtroAnio && String(m.anio) !== filtroAnio) return false;
      if (!q) return true;
      return normalizar(`${m.nombre} ${m.area}`).includes(q);
    });
  }, [lista, busqueda, filtroCiclo, filtroAnio]);

  const alternarActivo = async (m) => {
    const activar = Number(m.activo) !== 1;
    setBusyId(m.id);
    try {
      await api.saveEspacio({
        id: m.id,
        ciclo: m.ciclo,
        anio: Number(m.anio),
        nombre: m.nombre,
        area: m.area,
        orientacion: m.orientacion || undefined,
        horas_catedra: Number(m.horas_catedra),
        campo: m.campo,
        descripcion: m.descripcion || undefined,
        activo: activar,
      });
      toast.success(activar ? `${m.nombre} fue activada.` : `${m.nombre} fue desactivada: ya no se ofrece para nuevos registros.`);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const eliminar = async () => {
    setBorrando(true);
    try {
      await api.deleteEspacio(aBorrar.id);
      toast.success('Materia eliminada.');
      setABorrar(null);
      reload();
    } catch (err) {
      toast.error(err.message);
      setABorrar(null);
    } finally {
      setBorrando(false);
    }
  };

  const cerrarForm = () => {
    setFormAbierto(false);
    setEditando(null);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Materias ({visibles.length}{visibles.length !== lista.length ? ` de ${lista.length}` : ''})</h3>
          <p className="text-[11px] text-slate-500 mt-1">Espacios curriculares de la malla, con sus objetivos y contenidos. Desactivar una materia conserva el trabajo docente existente.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditando(null);
            setFormAbierto(true);
          }}
          className="px-3 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
        >
          <BookPlus className="w-4 h-4" aria-hidden="true" /> Nueva materia
        </button>
      </div>

      <div className="p-4 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/60">
        <div>
          <label htmlFor="mat-buscar" className="block text-[11px] font-semibold text-slate-700 mb-1">Buscar por nombre o área</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input id="mat-buscar" type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className={`${INPUT} pl-8`} placeholder="Ej: Matemática" />
          </div>
        </div>
        <div>
          <label htmlFor="mat-filtro-ciclo" className="block text-[11px] font-semibold text-slate-700 mb-1">Filtrar por ciclo</label>
          <select id="mat-filtro-ciclo" value={filtroCiclo} onChange={(e) => setFiltroCiclo(e.target.value)} className={INPUT}>
            <option value="">Todos los ciclos</option>
            {CICLOS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="mat-filtro-anio" className="block text-[11px] font-semibold text-slate-700 mb-1">Filtrar por año</label>
          <select id="mat-filtro-anio" value={filtroAnio} onChange={(e) => setFiltroAnio(e.target.value)} className={INPUT}>
            <option value="">Todos los años</option>
            {[1, 2, 3, 4, 5, 6].map((a) => (
              <option key={a} value={a}>{a}° año</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <Loading />}
      {!loading && error && (
        <div className="p-4">
          <ErrorState message={error} onRetry={reload} />
        </div>
      )}
      {!loading && !error && lista.length === 0 && (
        <div className="p-4">
          <EmptyState title="Sin materias" message="Todavía no hay materias cargadas." />
        </div>
      )}
      {!loading && !error && lista.length > 0 && visibles.length === 0 && (
        <div className="p-4">
          <EmptyState title="Sin resultados" message="Ninguna materia coincide con la búsqueda o los filtros." />
        </div>
      )}
      {!loading && !error && visibles.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Materia</th>
                <th className="py-2.5 px-4">Año</th>
                <th className="py-2.5 px-4">Área</th>
                <th className="py-2.5 px-4">Horas</th>
                <th className="py-2.5 px-4">Estado</th>
                <th className="py-2.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {visibles.map((m) => {
                const activa = Number(m.activo) === 1;
                const btn = 'p-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed';
                return (
                  <tr key={m.id} data-testid={`mat-fila-${m.id}`} className={`hover:bg-slate-50 transition ${activa ? '' : 'bg-slate-50/70'}`}>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{m.nombre}</div>
                      <div className="text-[10px] text-slate-500">{m.ciclo === 'basico' ? 'Ciclo básico' : 'Ciclo orientado'}</div>
                    </td>
                    <td className="py-3 px-4">{m.anio}°</td>
                    <td className="py-3 px-4">{m.area}</td>
                    <td className="py-3 px-4">{m.horas_catedra}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${activa ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-600 border-slate-300'}`}>
                        {activa ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap justify-end gap-1">
                        <button type="button" aria-label={`Objetivos y contenidos de ${m.nombre}`} title="Objetivos y contenidos" onClick={() => setContenidosDe(m)} className={`${btn} bg-sky-100 hover:bg-sky-200 text-sky-800`}>
                          <ListChecks className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Editar ${m.nombre}`}
                          title="Editar"
                          onClick={() => {
                            setEditando(m);
                            setFormAbierto(true);
                          }}
                          className={`${btn} bg-slate-100 hover:bg-slate-200 text-slate-700`}
                        >
                          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label={`${activa ? 'Desactivar' : 'Activar'} ${m.nombre}`}
                          title={activa ? 'Desactivar' : 'Activar'}
                          disabled={busyId === m.id}
                          onClick={() => alternarActivo(m)}
                          className={`${btn} ${activa ? 'bg-amber-100 hover:bg-amber-200 text-amber-800' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'}`}
                        >
                          {activa ? <EyeOff className="w-3.5 h-3.5" aria-hidden="true" /> : <Eye className="w-3.5 h-3.5" aria-hidden="true" />}
                        </button>
                        <button type="button" aria-label={`Eliminar ${m.nombre}`} title="Eliminar" onClick={() => setABorrar(m)} className={`${btn} bg-rose-100 hover:bg-rose-200 text-rose-800`}>
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={formAbierto} onClose={cerrarForm} title={editando ? `Editar materia: ${editando.nombre}` : 'Nueva materia'}>
        {formAbierto && (
          <MateriaForm
            materia={editando}
            onClose={cerrarForm}
            onSaved={() => {
              cerrarForm();
              reload();
            }}
          />
        )}
      </Modal>
      <Modal open={!!contenidosDe} onClose={() => setContenidosDe(null)} title={`Objetivos y contenidos: ${contenidosDe?.nombre ?? ''}`} size="max-w-3xl">
        {contenidosDe && <ContenidosPanel materia={contenidosDe} />}
      </Modal>
      <ConfirmDialog
        open={!!aBorrar}
        title="Eliminar materia"
        message={`¿Eliminar definitivamente "${aBorrar?.nombre ?? ''}" junto con sus objetivos y contenidos? Si tiene planificaciones, secuencias o agenda asociadas no se podrá eliminar y conviene desactivarla.`}
        confirmLabel="Eliminar"
        busy={borrando}
        onConfirm={eliminar}
        onCancel={() => setABorrar(null)}
      />
    </div>
  );
}
