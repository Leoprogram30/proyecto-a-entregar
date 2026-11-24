import { useState, useCallback } from 'react';
import { useAsync } from '../hooks/useAsync';
import { api } from '../services/api';
import { Loading, ErrorState, EmptyState, Modal } from './ui';
import { CAMPOS_APRENDIZAJE, fuenteLabel } from '../config/catalogos';
import { Sprout, BookOpen, Search, Filter, ArrowRight } from 'lucide-react';

const TIPO_LABEL = {
  objetivo: 'Objetivos',
  eje_contenido: 'Aprendizajes y contenidos',
  progresion: 'Progresiones de aprendizaje'
};

const norm = (s) => (s || '').toString().toLowerCase();

function EspacioDetalleModal({ espacio, onClose, onSelectEspacio }) {
  const [verRef, setVerRef] = useState(false);
  const { data: detail, error } = useAsync(
    () => (espacio ? api.getEspacioDetail(espacio.id, { todos: verRef }) : Promise.resolve(null)),
    [espacio?.id ?? null, verRef]
  );

  const grupos = {};
  (detail?.contenidos || []).forEach((c) => {
    (grupos[c.tipo] = grupos[c.tipo] || []).push(c);
  });

  return (
    <Modal open={Boolean(espacio)} onClose={onClose} title={espacio?.nombre || ''}>
      {error && <ErrorState message={error} />}
      {!error && !detail && <Loading />}
      {detail && (
        <div className="space-y-4 text-xs text-slate-700">
          <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
            <input type="checkbox" role="switch" checked={verRef} onChange={(e) => setVerRef(e.target.checked)} className="rounded text-emerald-600" />
            Ver diseño 2011-2015 de referencia
          </label>
          {Object.keys(grupos).length === 0 && <p className="text-slate-500">Este espacio no tiene contenidos cargados.</p>}
          {Object.entries(grupos).map(([tipo, items]) => (
            <section key={tipo}>
              <h3 className="font-bold text-slate-900 mb-1">{TIPO_LABEL[tipo] || tipo}</h3>
              <ul className="list-disc pl-5 space-y-1">
                {items.map((c) => (
                  <li key={c.id}>
                    {c.meta ? (
                      <span className="block text-[11px] text-slate-500">Meta: {c.meta}</span>
                    ) : (
                      <span className="font-semibold">{c.titulo}</span>
                    )}
                    {c.descripcion && <span className={c.meta ? 'text-slate-800' : 'text-slate-500'}>{c.meta ? '' : ' — '}{c.descripcion}</span>}
                    <span className="block text-[10px] text-slate-400">
                      {fuenteLabel(c.fuente)}
                      {!c.vigente ? ' · referencia' : ''}
                      {c.pagina ? ' · ' + c.pagina : ''}
                    </span>
                    {Array.isArray(c.indicadores) && c.indicadores.length > 0 && (
                      <details className="mt-0.5">
                        <summary className="cursor-pointer text-[11px] font-semibold text-emerald-800">Indicadores de logro ({c.indicadores.length})</summary>
                        <ul className="list-disc pl-5 text-[11px] text-slate-600">
                          {c.indicadores.map((ind, i) => (
                            <li key={i}>{ind}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {onSelectEspacio && (
            <div className="pt-2 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => onSelectEspacio(espacio)}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold"
              >
                Ver secuencias de este espacio
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

export default function CurriculumConsole({ onSelectEspacio, onStartPlanning }) {
  const [cicloTab, setCicloTab] = useState('orientado');
  const [selectedAnio, setSelectedAnio] = useState(4);
  const [searchQuery, setSearchQuery] = useState('');
  const [campoFiltro, setCampoFiltro] = useState('');
  const [detalle, setDetalle] = useState(null);
  const { data: espacios, loading, error, reload } = useAsync(
    () => api.getEspacios({ ciclo: cicloTab, anio: selectedAnio }),
    [cicloTab, selectedAnio],
    []
  );

  const handleCicloChange = useCallback((ciclo) => {
    setCicloTab(ciclo);
    setSelectedAnio(ciclo === 'basico' ? 1 : 4);
  }, []);

  const q = norm(searchQuery);
  const filteredEspacios = espacios.filter(
    (e) =>
      (!campoFiltro || (campoFiltro === 'sin_campo' ? !e.campo_aprendizaje : e.campo_aprendizaje === campoFiltro)) &&
      (norm(e.nombre).includes(q) || norm(e.area).includes(q) || norm(e.descripcion).includes(q))
  );

  const cicloBtn = (ciclo) =>
    `flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
      cicloTab === ciclo ? 'bg-emerald-800 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
    }`;
  const anioBtn = (anio) =>
    `px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
      selectedAnio === anio
        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
    }`;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-sky-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-emerald-700/80 px-3 py-1 rounded-full text-xs text-amber-300 font-semibold mb-3 border border-emerald-600/60">
            <Sprout className="w-4 h-4 text-emerald-300" aria-hidden="true" />
            Malla Curricular Oficial de la Provincia de Córdoba
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Consola Curricular: IPEM N° 349 "Giovanni Bosco"
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 mt-2 leading-relaxed">
            Plataforma pedagógica contextualizada en <strong>Colonia Caroya</strong>. Selecciona un espacio curricular para acceder a los <strong>objetivos oficiales, aprendizajes y contenidos prioritarios</strong>, armar la planificación anual y coordinar secuencias articuladas.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-10 translate-y-10">
          <Sprout className="w-72 h-72 text-white" aria-hidden="true" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto">
            <button type="button" aria-pressed={cicloTab === 'orientado'} onClick={() => handleCicloChange('orientado')} className={cicloBtn('orientado')}>
              <Sprout className="w-4 h-4 text-emerald-300" aria-hidden="true" />
              Ciclo Orientado: Agro y Ambiente (4° a 6°)
            </button>
            <button type="button" aria-pressed={cicloTab === 'basico'} onClick={() => handleCicloChange('basico')} className={cicloBtn('basico')}>
              <BookOpen className="w-4 h-4 text-sky-400" aria-hidden="true" />
              Ciclo Básico (1° a 3°)
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" aria-hidden="true" />
            <input
              type="search"
              aria-label="Buscar materia o área"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar materia o área..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        <div className="pt-4 flex items-center gap-2">
          <label htmlFor="filtro-campo" className="text-xs font-bold text-slate-500 whitespace-nowrap">Campo de Aprendizaje:</label>
          <select
            id="filtro-campo"
            value={campoFiltro}
            onChange={(e) => setCampoFiltro(e.target.value)}
            className="min-w-0 p-1.5 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="">Todos</option>
            {Object.entries(CAMPOS_APRENDIZAJE).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
            <option value="sin_campo">Sin campo asignado</option>
          </select>
        </div>

        <div className="pt-4 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1 whitespace-nowrap">
            <Filter className="w-3.5 h-3.5" aria-hidden="true" /> Año:
          </span>
          {(cicloTab === 'basico' ? [1, 2, 3] : [4, 5, 6]).map((anio) => (
            <button key={anio} type="button" aria-pressed={selectedAnio === anio} onClick={() => setSelectedAnio(anio)} className={anioBtn(anio)}>
              {anio}° Año
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Loading message="Cargando malla curricular..." />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : filteredEspacios.length === 0 ? (
        <EmptyState title="Sin resultados" message="No se encontraron espacios curriculares para los criterios seleccionados." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEspacios.map((espacio) => (
            <div
              key={espacio.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition p-5 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm border border-emerald-200">
                    {espacio.anio}°
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {espacio.area}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {espacio.horas_catedra} hs/cátedra
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition line-clamp-2">
                  {espacio.nombre}
                </h3>
                <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">{espacio.descripcion}</p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setDetalle(espacio)}
                  className="text-xs font-semibold text-slate-600 hover:text-emerald-800 flex items-center gap-1 transition"
                >
                  <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                  Ver Contenidos
                </button>
                {onStartPlanning && (
                  <button
                    type="button"
                    onClick={() => onStartPlanning(espacio)}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition"
                  >
                    Planificar
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <EspacioDetalleModal espacio={detalle} onClose={() => setDetalle(null)} onSelectEspacio={onSelectEspacio && ((e) => { setDetalle(null); onSelectEspacio(e); })} />
    </div>
  );
}
