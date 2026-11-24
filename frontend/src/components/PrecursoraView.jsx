import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Flag, Printer } from 'lucide-react';
import { useAsync } from '../hooks/useAsync';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ErrorState, Loading, Notice, formatFecha, useToast } from './ui';
import { RUTA_LABEL } from './InstitucionTab';

const ANIO_ACTUAL = new Date().getFullYear();
const ANIOS = [ANIO_ACTUAL - 1, ANIO_ACTUAL, ANIO_ACTUAL + 1, ANIO_ACTUAL + 2];
const ESTADO_LINEA = {
  pendiente: { label: 'Pendiente', cls: 'bg-slate-100 text-slate-700 border-slate-300' },
  en_curso: { label: 'En curso', cls: 'bg-sky-100 text-sky-800 border-sky-300' },
  implementada: { label: 'Implementada', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  no_aplica: { label: 'No aplica', cls: 'bg-amber-100 text-amber-800 border-amber-300' }
};
const INPUT = 'w-full p-2 text-xs border border-slate-300 rounded-lg bg-white';
const CICLO_LABEL = { basico: 'Ciclo Básico (1° a 3°)', orientado: 'Ciclo Orientado (4° a 6°)' };

const EstadoLinea = ({ estado }) => (
  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ESTADO_LINEA[estado]?.cls}`}>{ESTADO_LINEA[estado]?.label}</span>
);

function LineaEditable({ linea, anio, editable, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState({
    estado: linea.estado,
    responsable: linea.responsable ?? '',
    evidencia: linea.evidencia ?? '',
    fecha_prevista: linea.fecha_prevista ?? ''
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const id = `lin-${linea.linea}`;

  const guardar = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.saveAccionPrecursora({
        anio_lectivo: anio,
        linea: linea.linea,
        estado: f.estado,
        responsable: f.responsable.trim() || null,
        evidencia: f.evidencia.trim() || null,
        fecha_prevista: f.fecha_prevista || null
      });
      toast.success('Línea actualizada.');
      onSaved();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-slate-900">{linea.texto}</h4>
          <p className="text-[11px] text-slate-500">Fuente: {linea.fuente}</p>
        </div>
        <EstadoLinea estado={linea.estado} />
      </div>
      {editable ? (
        <details className="group">
          <summary className="cursor-pointer text-xs font-semibold text-emerald-700">
            Actualizar seguimiento{linea.responsable ? ` (responsable: ${linea.responsable})` : ''}
          </summary>
        <form onSubmit={guardar} aria-label={`Seguimiento: ${linea.texto}`} className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor={`${id}-estado`} className="block text-[11px] font-semibold text-slate-700 mb-1">Estado</label>
            <select id={`${id}-estado`} value={f.estado} onChange={set('estado')} className={INPUT}>
              {Object.entries(ESTADO_LINEA).map(([v, e]) => (
                <option key={v} value={v}>{e.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${id}-resp`} className="block text-[11px] font-semibold text-slate-700 mb-1">Responsable</label>
            <input id={`${id}-resp`} type="text" maxLength={150} value={f.responsable} onChange={set('responsable')} className={INPUT} />
          </div>
          <div>
            <label htmlFor={`${id}-fecha`} className="block text-[11px] font-semibold text-slate-700 mb-1">Fecha prevista</label>
            <input id={`${id}-fecha`} type="date" value={f.fecha_prevista} onChange={set('fecha_prevista')} className={INPUT} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor={`${id}-evid`} className="block text-[11px] font-semibold text-slate-700 mb-1">Evidencia / avance</label>
            <textarea id={`${id}-evid`} rows={2} maxLength={5000} value={f.evidencia} onChange={set('evidencia')} className={INPUT} />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button type="submit" disabled={busy} className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white rounded-lg text-xs font-bold">
              {busy ? 'Guardando...' : 'Guardar línea'}
            </button>
          </div>
        </form>
        </details>
      ) : (
        <dl className="text-xs text-slate-700 grid gap-1 sm:grid-cols-2">
          <div><dt className="inline font-semibold">Responsable: </dt><dd className="inline">{linea.responsable || 'Sin asignar'}</dd></div>
          <div><dt className="inline font-semibold">Fecha prevista: </dt><dd className="inline">{linea.fecha_prevista ? formatFecha(linea.fecha_prevista) : 'Sin fecha'}</dd></div>
          {linea.evidencia && <div className="sm:col-span-2"><dt className="inline font-semibold">Evidencia: </dt><dd className="inline">{linea.evidencia}</dd></div>}
        </dl>
      )}
    </li>
  );
}

function Cobertura({ cobertura }) {
  const { por_curso: cursos, por_ciclo: ciclos, por_modalidad: mod } = cobertura;
  return (
    <section aria-labelledby="h-cobertura" className="space-y-3">
      <h3 id="h-cobertura" className="text-sm font-bold text-slate-900">Cobertura desde Articulación</h3>
      <p className="text-xs text-slate-600">
        Cuenta los proyectos del año en estado presentado, autorizado, en ejecución o cerrado. Mínimo de referencia: una propuesta de tiempo compartido por curso; tope de propuestas por curso según el Anexo VI.
      </p>
      <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200">
        <table className="w-full text-left text-xs text-slate-700">
          <caption className="sr-only">Propuestas de articulación por curso</caption>
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th scope="col" className="p-2">Curso</th>
              <th scope="col" className="p-2">Tiempo compartido</th>
              <th scope="col" className="p-2">Proyecto interdisciplinario</th>
              <th scope="col" className="p-2">Total / tope</th>
              <th scope="col" className="p-2">Situación</th>
            </tr>
          </thead>
          <tbody>
            {cursos.map((c) => (
              <tr key={c.curso} className="border-t border-slate-100">
                <th scope="row" className="p-2 font-bold">{c.curso}° año</th>
                <td className="p-2">{c.tiempo_compartido}</td>
                <td className="p-2">{c.proyecto_interdisciplinario}</td>
                <td className="p-2">{c.total} / {c.tope}</td>
                <td className="p-2">
                  {c.supera_tope ? 'Supera el tope' : c.cumple_minimo ? 'Cubierto' : 'Falta tiempo compartido'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {Object.entries(ciclos).map(([k, c]) => (
          <div key={k} className="bg-white rounded-2xl border border-slate-200 p-4 text-xs space-y-1">
            <h4 className="font-bold text-slate-900">{CICLO_LABEL[k]}</h4>
            <p>Tiempo compartido: <strong>{c.tiempo_compartido}</strong> {c.cumple_minimo ? '(cumple al menos una propuesta)' : '(falta al menos una propuesta)'}</p>
            <p>Proyectos interdisciplinarios: <strong>{c.proyecto_interdisciplinario}</strong>
              {k === 'orientado' && (c.proyecto_integracion_cumple ? ' (hay al menos un proyecto de integración)' : ' (falta un proyecto de integración)')}
            </p>
            <p>Total de propuestas: <strong>{c.total}</strong></p>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-700">
        Por modalidad en toda la escuela: tiempo compartido <strong>{mod.tiempo_compartido}</strong>, proyecto interdisciplinario <strong>{mod.proyecto_interdisciplinario}</strong>.
      </p>
    </section>
  );
}

function Campos({ campos }) {
  return (
    <section aria-labelledby="h-campos" className="space-y-3">
      <h3 id="h-campos" className="text-sm font-bold text-slate-900">Espacios por Campo de Aprendizaje</h3>
      <p className="text-xs text-slate-600">Anexo IV: los espacios de formación específica se integran a un campo. La asignación se edita en el ABM de materias.</p>
      <div className="grid gap-3 md:grid-cols-2">
        {campos.map((c) => (
          <div key={c.campo ?? 'sin'} className="bg-white rounded-2xl border border-slate-200 p-4">
            <h4 className="text-xs font-bold text-slate-900 mb-2">{c.label} <span className="font-normal text-slate-500">({c.espacios.length})</span></h4>
            {c.espacios.length === 0 ? (
              <p className="text-xs text-slate-500">Sin espacios.</p>
            ) : (
              <ul className="text-xs text-slate-700 space-y-0.5 max-h-56 overflow-y-auto">
                {c.espacios.map((e) => (
                  <li key={e.id}>{e.nombre} <span className="text-slate-500">({e.anio}° año)</span></li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function Impresion({ d, onClose }) {
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });
  useEffect(() => {
    const previous = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onCloseRef.current?.();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, []);

  return createPortal(
    <div className="print-overlay fixed inset-0 bg-slate-900/60 z-50 overflow-y-auto p-2 sm:p-4">
      <div role="dialog" aria-modal="true" aria-label="Vista previa de impresión del seguimiento de institución precursora" className="print-sheet bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-auto border border-slate-300">
        <div className="no-print bg-slate-800 text-white p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2 rounded-t-2xl sticky top-0">
          <button ref={closeRef} type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Volver
          </button>
          <button type="button" onClick={() => window.print()} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-2">
            <Printer className="w-4 h-4" aria-hidden="true" /> Imprimir / Guardar como PDF
          </button>
        </div>
        <div className="p-6 sm:p-8 space-y-4 text-xs text-slate-800">
          <header className="border-b border-slate-300 pb-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">IPEM N° 349 "Giovanni Bosco" · Colonia Caroya</p>
            <h1 className="text-lg font-extrabold">Seguimiento de institución precursora, ciclo lectivo {d.anio}</h1>
            <p>{RUTA_LABEL[d.ruta]}. {d.referencia}</p>
          </header>
          <section>
            <h2 className="font-bold text-sm mb-1">Líneas de acción</h2>
            <table className="w-full text-left border border-slate-300">
              <thead className="bg-slate-100">
                <tr><th className="p-1.5">Línea</th><th className="p-1.5">Estado</th><th className="p-1.5">Responsable</th><th className="p-1.5">Fecha prevista</th><th className="p-1.5">Evidencia</th></tr>
              </thead>
              <tbody>
                {d.lineas.map((l) => (
                  <tr key={l.linea} className="border-t border-slate-300 align-top print-avoid-break">
                    <td className="p-1.5">{l.texto}<br /><span className="text-[10px] text-slate-500">{l.caracter === 'opcional' ? 'Opcional' : 'Se implementa'} · {l.fuente}</span></td>
                    <td className="p-1.5">{ESTADO_LINEA[l.estado]?.label}</td>
                    <td className="p-1.5">{l.responsable}</td>
                    <td className="p-1.5">{l.fecha_prevista ? formatFecha(l.fecha_prevista) : ''}</td>
                    <td className="p-1.5">{l.evidencia}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="print-avoid-break">
            <h2 className="font-bold text-sm mb-1">Cobertura desde Articulación</h2>
            <table className="w-full text-left border border-slate-300">
              <thead className="bg-slate-100">
                <tr><th className="p-1.5">Curso</th><th className="p-1.5">Tiempo compartido</th><th className="p-1.5">Proy. interdisciplinario</th><th className="p-1.5">Total / tope</th></tr>
              </thead>
              <tbody>
                {d.cobertura.por_curso.map((c) => (
                  <tr key={c.curso} className="border-t border-slate-300">
                    <td className="p-1.5">{c.curso}° año</td><td className="p-1.5">{c.tiempo_compartido}</td>
                    <td className="p-1.5">{c.proyecto_interdisciplinario}</td><td className="p-1.5">{c.total} / {c.tope}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section>
            <h2 className="font-bold text-sm mb-1">Espacios por Campo de Aprendizaje</h2>
            {d.campos.map((c) => (
              <p key={c.campo ?? 'sin'} className="print-avoid-break"><strong>{c.label}:</strong> {c.espacios.map((e) => `${e.nombre} (${e.anio}°)`).join(', ') || 'sin espacios'}</p>
            ))}
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function PrecursoraView() {
  const { user } = useAuth();
  const [anio, setAnio] = useState(ANIO_ACTUAL + 1);
  const [imprimiendo, setImprimiendo] = useState(false);
  const { data, loading, error, reload } = useAsync(() => api.getPrecursora(anio), [anio, user.id]);

  const lineasDe = (caracter) => data.lineas.filter((l) => l.caracter === caracter);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-sky-900 to-emerald-800 text-white p-6 sm:p-8 shadow-md">
        <div className="inline-flex items-center gap-2 bg-sky-800/80 px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-sky-700">
          <Flag className="w-4 h-4" aria-hidden="true" /> TransFORMAR@Cba · Ruta 2
        </div>
        <h2 className="text-2xl font-extrabold">Institución precursora</h2>
        <p className="text-xs sm:text-sm text-sky-100 mt-2 max-w-3xl">
          Seguimiento de las líneas de acción de la Res. SE 88/2025 (art. 8) y cobertura automática desde Articulación.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="prec-anio" className="block text-[11px] font-semibold text-slate-700 mb-1">Ciclo lectivo</label>
          <select id="prec-anio" value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="p-2 text-xs border border-slate-300 rounded-lg bg-white">
            {ANIOS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        {data && (
          <>
            <span className="text-xs font-bold px-3 py-2 rounded-lg bg-white border border-slate-200">Ruta vigente: {RUTA_LABEL[data.ruta]}</span>
            <button type="button" onClick={() => setImprimiendo(true)} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-2">
              <Printer className="w-4 h-4" aria-hidden="true" /> Imprimir
            </button>
          </>
        )}
      </div>

      {loading && <Loading message="Cargando seguimiento..." />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <>
          <Notice>{data.referencia}</Notice>
          {data.ruta !== 'ruta_2' && (
            <p className="text-xs text-slate-700 bg-slate-100 border border-slate-200 rounded-xl p-3">
              El ciclo lectivo {anio} figura en Ruta 1. Puede cargar el seguimiento igualmente; el administrador cambia la ruta en Administración, pestaña Institución.
            </p>
          )}
          {!data.puede_editar && <p className="text-xs text-slate-600">Vista de solo lectura: el seguimiento lo actualizan el equipo directivo y coordinación.</p>}

          <Cobertura cobertura={data.cobertura} />
          <section aria-labelledby="h-impl" className="space-y-3">
            <h3 id="h-impl" className="text-sm font-bold text-slate-900">Líneas que se implementan</h3>
            <ul className="space-y-3">
              {lineasDe('implementa').map((l) => (
                <LineaEditable key={`${anio}-${l.linea}-${l.actualizado_en}`} linea={l} anio={anio} editable={data.puede_editar} onSaved={reload} />
              ))}
            </ul>
          </section>
          <section aria-labelledby="h-opc" className="space-y-3">
            <h3 id="h-opc" className="text-sm font-bold text-slate-900">Líneas opcionales</h3>
            <ul className="space-y-3">
              {lineasDe('opcional').map((l) => (
                <LineaEditable key={`${anio}-${l.linea}-${l.actualizado_en}`} linea={l} anio={anio} editable={data.puede_editar} onSaved={reload} />
              ))}
            </ul>
          </section>

          <Campos campos={data.campos} />
          {imprimiendo && <Impresion d={data} onClose={() => setImprimiendo(false)} />}
        </>
      )}
    </div>
  );
}
