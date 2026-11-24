import { useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { useAsync } from '../../hooks/useAsync';
import { api } from '../../services/api';
import { Loading, useToast } from '../ui';
import { FUENTE_LABEL, MODALIDADES, VIGENCIAS, inputCls } from './constantes';
import { AyudaModalidades, Campo } from './comunes';

const PASOS = ['Modalidad', 'Curso y tema', 'Datos del proyecto'];

// Buscador de coincidencias: qué contenidos oficiales tiene cada materia del curso sobre una palabra.
function BuscadorCoincidencias({ curso, onUsar }) {
  const [texto, setTexto] = useState('');
  const [buscado, setBuscado] = useState('');
  const { data, error, loading } = useAsync(
    () => (buscado ? api.getSugerenciasArt(curso, buscado) : Promise.resolve([])),
    [curso, buscado],
    []
  );
  const buscar = () => {
    if (texto.trim().length >= 3) setBuscado(texto.trim());
  };
  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-3 space-y-3">
      <div role="search" className="flex flex-col sm:flex-row gap-2 sm:items-end">
        <div className="flex-1">
          <label htmlFor="asis-buscar" className="block text-[11px] font-semibold text-slate-700 mb-1">
            Buscar coincidencias entre las materias de {curso}.° año
          </label>
          <input
            id="asis-buscar"
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                buscar();
              }
            }}
            placeholder="Ej. cuerpo, función, agua, energía"
            className={inputCls}
          />
        </div>
        <button type="button" onClick={buscar} disabled={texto.trim().length < 3} className="px-3 py-2 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50">
          <Search className="w-4 h-4" aria-hidden="true" /> Buscar
        </button>
      </div>
      <div aria-live="polite">
        {loading && <Loading message="Buscando..." />}
        {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
        {!loading && !error && buscado && data.length === 0 && (
          <p className="text-xs text-slate-600">Ninguna materia de {curso}.° año tiene contenidos vigentes con «{buscado}». Pruebe con otra palabra.</p>
        )}
        {data.length > 0 && (
          <div className="space-y-3">
            <p className="text-[11px] text-slate-600">
              {data.length} {data.length === 1 ? 'materia tiene' : 'materias tienen'} contenidos que mencionan «{buscado}». Cada docente podrá elegir
              los suyos al cargar su aporte.
            </p>
            {data.map((g) => (
              <div key={g.espacio_id} className="bg-white rounded-lg border border-slate-200 p-3">
                <h4 className="text-xs font-bold text-slate-900">
                  {g.espacio_nombre} <span className="font-normal text-slate-500">({g.horas_catedra} hs · {g.total} coincidencias)</span>
                </h4>
                <ul className="mt-1.5 space-y-1.5">
                  {g.contenidos.map((c) => (
                    <li key={c.id} className="text-[11px] text-slate-700">
                      <span className="font-semibold">{c.titulo}.</span> {c.descripcion}
                      <span className="text-slate-400"> ({FUENTE_LABEL[c.fuente] || c.fuente}{c.pagina ? `, ${c.pagina}` : ''})</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <button type="button" onClick={() => onUsar(buscado)} className="text-xs font-bold text-sky-800 underline">
              Usar «{buscado}» como idea para el eje
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AsistenteProyecto({ onCancel, onCreated }) {
  const toast = useToast();
  const [paso, setPaso] = useState(0);
  const [f, setF] = useState(() => ({
    modalidad: '', curso: '', division: '', anio_lectivo: String(new Date().getFullYear()), vigencia: 'anual',
    fecha_inicio: '', fecha_fin: '', titulo: '', eje: '', espacio_id: ''
  }));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const espacios = useAsync(() => (f.curso ? api.getEspacios({ anio: f.curso }) : Promise.resolve([])), [f.curso], []);

  const avanzar = () => {
    setError('');
    if (paso === 0 && !f.modalidad) return setError('Elija una modalidad.');
    if (paso === 1 && !f.curso) return setError('Indique el curso.');
    if (paso === 1 && !f.eje.trim()) return setError('El eje común (tema, problema o pregunta) es obligatorio.');
    setPaso((n) => n + 1);
  };

  const crear = async (e) => {
    e.preventDefault();
    setError('');
    if (!f.titulo.trim()) return setError('El título es obligatorio.');
    if (!f.espacio_id) return setError('Elija el espacio curricular desde el que participa.');
    setBusy(true);
    try {
      const body = { ...f, curso: Number(f.curso), anio_lectivo: Number(f.anio_lectivo), espacio_id: Number(f.espacio_id) };
      const r = await api.createProyectoArticulado(body);
      toast.success('Proyecto creado como borrador.');
      onCreated(r.proyecto_id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl">
      <button type="button" onClick={onCancel} className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Volver al listado
      </button>
      <h1 className="text-xl font-extrabold text-slate-900">Nuevo proyecto de articulación</h1>
      <ol className="flex flex-wrap gap-2 text-[11px] font-semibold" aria-label="Pasos">
        {PASOS.map((n, i) => (
          <li key={n} aria-current={i === paso ? 'step' : undefined} className={`px-3 py-1 rounded-full border ${i === paso ? 'bg-sky-700 text-white border-sky-700' : 'bg-white text-slate-600 border-slate-300'}`}>
            {i + 1}. {n}
          </li>
        ))}
      </ol>

      <form onSubmit={crear} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
        {error && <div role="alert" className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">{error}</div>}

        {paso === 0 && (
          <fieldset className="space-y-3">
            <legend className="text-sm font-bold text-slate-900 mb-1">¿Cómo van a articular?</legend>
            {Object.entries(MODALIDADES).map(([k, m]) => (
              <label key={k} className={`block rounded-xl border p-3 cursor-pointer ${f.modalidad === k ? 'border-sky-500 bg-sky-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <span className="flex items-start gap-2">
                  <input type="radio" name="modalidad" value={k} checked={f.modalidad === k} onChange={set('modalidad')} className="mt-0.5" />
                  <span>
                    <span className="block text-xs font-bold text-slate-900">{m.label}</span>
                    <span className="block text-xs text-slate-700 mt-0.5">{m.detalle}</span>
                    <span className="block text-[10px] text-slate-500 mt-1">Fuente: {m.fuente}</span>
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
        )}

        {paso === 1 && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Campo label="Curso" htmlFor="asis-curso">
                <select id="asis-curso" value={f.curso} onChange={(e) => setF((s) => ({ ...s, curso: e.target.value, espacio_id: '' }))} className={inputCls}>
                  <option value="">Seleccione...</option>
                  {[1, 2, 3, 4, 5, 6].map((c) => (
                    <option key={c} value={c}>{c}.° año</option>
                  ))}
                </select>
              </Campo>
              <Campo label="División" htmlFor="asis-div">
                <input id="asis-div" value={f.division} maxLength={10} onChange={set('division')} placeholder="Ej. A" className={inputCls} />
              </Campo>
              <Campo label="Año lectivo" htmlFor="asis-anio">
                <input id="asis-anio" type="number" min="2020" max="2100" value={f.anio_lectivo} onChange={set('anio_lectivo')} className={inputCls} />
              </Campo>
            </div>
            {f.curso && <BuscadorCoincidencias curso={f.curso} onUsar={(t) => setF((s) => ({ ...s, eje: s.eje || t }))} />}
            <Campo
              label="Eje común: tema, problema, desafío o pregunta"
              htmlFor="asis-eje"
              hint="Puede ser un tema, un desafío, una situación problemática, una salida o un proyecto. Ej.: ¿Cómo responde el cuerpo a la actividad física?"
            >
              <textarea id="asis-eje" rows={3} required value={f.eje} onChange={set('eje')} className={inputCls} />
            </Campo>
          </div>
        )}

        {paso === 2 && (
          <div className="space-y-3">
            <Campo label="Título del proyecto" htmlFor="asis-titulo">
              <input id="asis-titulo" required maxLength={200} value={f.titulo} onChange={set('titulo')} className={inputCls} />
            </Campo>
            <Campo label="Espacio curricular desde el que participa" htmlFor="asis-esp" hint="Después podrá invitar a los docentes de los otros espacios.">
              <select id="asis-esp" required value={f.espacio_id} onChange={set('espacio_id')} className={inputCls}>
                <option value="">Seleccione un espacio...</option>
                {espacios.data.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre} ({e.horas_catedra} hs)</option>
                ))}
              </select>
            </Campo>
            <div className="grid gap-3 sm:grid-cols-3">
              <Campo label="Vigencia" htmlFor="asis-vig">
                <select id="asis-vig" value={f.vigencia} onChange={set('vigencia')} className={inputCls}>
                  {Object.entries(VIGENCIAS).map(([k, l]) => (
                    <option key={k} value={k}>{l}</option>
                  ))}
                </select>
              </Campo>
              {f.vigencia === 'fechas' && (
                <>
                  <Campo label="Desde" htmlFor="asis-fi">
                    <input id="asis-fi" type="date" required value={f.fecha_inicio} onChange={set('fecha_inicio')} className={inputCls} />
                  </Campo>
                  <Campo label="Hasta" htmlFor="asis-ff">
                    <input id="asis-ff" type="date" required value={f.fecha_fin} onChange={set('fecha_fin')} className={inputCls} />
                  </Campo>
                </>
              )}
            </div>
            <AyudaModalidades resaltada={f.modalidad} />
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex justify-between gap-2">
          <button type="button" onClick={paso === 0 ? onCancel : () => setPaso((n) => n - 1)} className="px-4 py-2 text-xs font-semibold text-slate-600">
            {paso === 0 ? 'Cancelar' : 'Atrás'}
          </button>
          {paso < PASOS.length - 1 ? (
            <button type="button" onClick={avanzar} className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-lg">Continuar</button>
          ) : (
            <button type="submit" disabled={busy} className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg disabled:opacity-50">
              {busy ? 'Creando...' : 'Crear borrador'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
