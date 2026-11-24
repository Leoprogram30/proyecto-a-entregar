import React, { useState, useRef, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { useToast, Loading, EmptyState, ErrorState } from './ui';
import { ESTADOS_NORMATIVA, estadoNormativa } from '../config/catalogos';
import { Download, ExternalLink, Filter, Search, ShieldCheck } from 'lucide-react';

const TIPOS = [
  { value: 'diseno_curricular', label: 'Diseños curriculares' },
  { value: 'progresion', label: 'Progresiones de aprendizajes' },
  { value: 'orientacion', label: 'Orientaciones' },
  { value: 'planificacion', label: 'Planificación y evaluación' },
  { value: 'regimen_academico', label: 'Régimen académico' },
  { value: 'resolucion', label: 'Resoluciones' },
  { value: 'ley', label: 'Leyes' },
];

const ESTADO_CLS = {
  Vigente: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'En consulta': 'bg-amber-100 text-amber-800 border-amber-300',
  'Histórico': 'bg-slate-100 text-slate-600 border-slate-300',
  'Referencia federal': 'bg-sky-100 text-sky-800 border-sky-300',
};

// Primero lo vigente
const ORDEN_ESTADO = ['Vigente', 'En consulta', 'Referencia federal', 'Histórico'];
const orden = (n) => {
  const i = ORDEN_ESTADO.indexOf(estadoNormativa(n?.descripcion));
  return i < 0 ? 0 : i;
};

const etiquetaTipo = (v) => TIPOS.find((t) => t.value === v)?.label ?? (v ? String(v).replace(/_/g, ' ') : 'Documento');

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

export default function NormativasView({ selectedEspacio }) {
  const toast = useToast();
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [search, setSearch] = useState('');
  const [descargando, setDescargando] = useState(null);
  const espacioId = selectedEspacio?.id ?? null;

  const { data, loading, error, reload } = useAsync(
    () => api.getNormativas({ tipo: filterTipo || undefined, espacio_id: espacioId ?? undefined }),
    `${filterTipo}|${espacioId}`
  );

  const normativas = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const filtradas = useMemo(() => {
    const q = search.trim().toLowerCase();
    return normativas.filter((n) => {
      if (filterEstado && estadoNormativa(n?.descripcion) !== filterEstado) return false;
      if (!q) return true;
      return [n?.titulo, n?.resolucion_numero, n?.descripcion].some((txt) => String(txt ?? '').toLowerCase().includes(q));
    }).sort((a, b) => orden(a) - orden(b));
  }, [normativas, search, filterEstado]);

  const descargar = async (doc) => {
    setDescargando(doc.id);
    try {
      await api.descargarNormativa(doc);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDescargando(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-sky-950 rounded-2xl p-6 sm:p-8 text-white shadow-md">
        <div className="inline-flex items-center gap-1.5 bg-emerald-800/80 px-3 py-1 rounded-full text-xs text-emerald-100 font-semibold mb-2 border border-emerald-700">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" aria-hidden="true" />
          Repositorio normativo
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Normativas y diseños curriculares</h2>
        <p className="text-xs sm:text-sm text-emerald-100 mt-2 max-w-3xl leading-relaxed">
          Consulte y descargue los diseños curriculares, las progresiones de aprendizaje, las orientaciones, las resoluciones y los documentos de planificación y evaluación. Cada documento indica su estado: vigente, en consulta, histórico o referencia federal.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500" aria-hidden="true" />
          <label htmlFor="norm-filtro-tipo" className="sr-only">Filtrar por tipo</label>
          <select id="norm-filtro-tipo" value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} className="p-2 text-xs border border-slate-300 rounded-lg bg-white font-medium w-full sm:w-auto">
            <option value="">Todas las normativas</option>
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <label htmlFor="norm-filtro-estado" className="sr-only">Filtrar por estado</label>
          <select id="norm-filtro-estado" value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className="p-2 text-xs border border-slate-300 rounded-lg bg-white font-medium w-full sm:w-auto">
            <option value="">Todos los estados</option>
            {ESTADOS_NORMATIVA.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" aria-hidden="true" />
          <label htmlFor="norm-buscar" className="sr-only">Buscar normativa</label>
          <input
            id="norm-buscar"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, resolución o descripción..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg"
          />
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : filtradas.length === 0 ? (
        <EmptyState title="Sin documentos" message="No hay normativas que coincidan con los filtros." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtradas.map((doc) => (
            <article key={doc.id} className="bg-white rounded-xl border border-slate-200 hover:border-emerald-400 p-5 shadow-xs flex flex-col justify-between gap-4 transition">
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">{etiquetaTipo(doc.tipo)}</span>
                    {estadoNormativa(doc.descripcion) && (
                      <span className={'text-[10px] font-bold px-2 py-0.5 rounded border ' + ESTADO_CLS[estadoNormativa(doc.descripcion)]}>{estadoNormativa(doc.descripcion)}</span>
                    )}
                  </div>
                  {doc.resolucion_numero && (
                    <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{doc.resolucion_numero}</span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug break-words">{doc.titulo ?? 'Sin título'}</h3>
                {doc.descripcion && <p className="text-xs text-slate-600 mt-2 leading-relaxed">{doc.descripcion}</p>}
                {doc.organismo && <div className="text-[10px] text-slate-400 mt-2 font-medium">{doc.organismo}</div>}
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                {doc.tiene_pdf ? (
                  <button
                    type="button"
                    disabled={descargando === doc.id}
                    aria-label={`Descargar PDF de ${doc.titulo ?? 'documento'}`}
                    onClick={() => descargar(doc)}
                    className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    {descargando === doc.id ? 'Descargando...' : 'Descargar PDF'}
                  </button>
                ) : null}
                {doc.url_oficial && (
                  <a
                    href={doc.url_oficial}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                    Sitio oficial
                  </a>
                )}
                {!doc.tiene_pdf && !doc.url_oficial && <span className="text-xs text-slate-400">Sin archivo</span>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
