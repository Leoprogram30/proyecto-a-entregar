import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Sprout,
  Leaf,
  BookOpen,
  Calculator,
  FlaskConical,
  Trees,
  Wheat,
  Clock,
  Layers,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  Calendar,
  FileText,
  FileDown
} from 'lucide-react';

export default function CurriculumConsole({ onSelectEspacio, onStartPlanning }) {
  const [cicloTab, setCicloTab] = useState('orientado'); // 'basico' | 'orientado'
  const [selectedAnio, setSelectedAnio] = useState(4); // 1..6
  const [espacios, setEspacios] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEspacios();
  }, [cicloTab, selectedAnio]);

  const loadEspacios = async () => {
    setLoading(true);
    const data = await api.getEspacios(cicloTab, selectedAnio);
    setEspacios(data);
    setLoading(false);
  };

  const handleCicloChange = (ciclo) => {
    setCicloTab(ciclo);
    if (ciclo === 'basico') {
      setSelectedAnio(1);
    } else {
      setSelectedAnio(4);
    }
  };

  const filteredEspacios = espacios.filter(e =>
    e.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.descripcion && e.descripcion.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Banner de Bienvenida y Contexto de la Malla de Córdoba */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-sky-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-emerald-700/80 px-3 py-1 rounded-full text-xs text-amber-300 font-semibold mb-3 border border-emerald-600/60">
            <Sprout className="w-4 h-4 text-emerald-300" />
            Malla Curricular Oficial de la Provincia de Córdoba
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Consola Curricular: IPEM N° 349 "Giovanni Bosco"
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 mt-2 leading-relaxed">
            Plataforma pedagógica contextualizada en <strong>Colonia Caroya</strong>. Selecciona tu espacio curricular para acceder a los <strong>objetivos oficiales, aprendizajes y contenidos prioritarios</strong>, armar tu planificación anual interactiva y coordinar secuencias articuladas.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-10 translate-y-10">
          <Sprout className="w-72 h-72 text-white" />
        </div>
      </div>

      {/* Selector de Ciclo (Básico vs Orientado en Agro y Ambiente) */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleCicloChange('orientado')}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                cicloTab === 'orientado'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Sprout className="w-4 h-4 text-emerald-300" />
              Ciclo Orientado: Agro y Ambiente (4° a 6° Año)
            </button>
            <button
              onClick={() => handleCicloChange('basico')}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                cicloTab === 'basico'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4 text-sky-400" />
              Ciclo Básico (1° a 3° Año)
            </button>
          </div>

          {/* Buscador Rápido */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar materia o área..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Selector de Años */}
        <div className="pt-4 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filtrar por Año:
          </span>
          {cicloTab === 'basico' ? (
            [1, 2, 3].map((anio) => (
              <button
                key={anio}
                onClick={() => setSelectedAnio(anio)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedAnio === anio
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {anio}° Año Ciclo Básico
              </button>
            ))
          ) : (
            [4, 5, 6].map((anio) => (
              <button
                key={anio}
                onClick={() => setSelectedAnio(anio)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  selectedAnio === anio
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {anio}° Año (Agro y Ambiente)
              </button>
            ))
          )}
        </div>
      </div>

      {/* Grilla de Espacios Curriculares */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-xs">Cargando malla curricular...</div>
      ) : filteredEspacios.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
          No se encontraron espacios curriculares para los criterios seleccionados.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEspacios.map((espacio) => (
            <div
              key={espacio.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition p-5 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm border border-emerald-200 group-hover:scale-105 transition">
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
                <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                  {espacio.descripcion}
                </p>
              </div>

              {/* Botones de Acción Rápida para el Espacio Curricular */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onSelectEspacio && onSelectEspacio(espacio)}
                  className="text-xs font-semibold text-slate-600 hover:text-emerald-800 flex items-center gap-1 transition"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Ver Contenidos
                </button>
                <button
                  type="button"
                  onClick={() => onStartPlanning && onStartPlanning(espacio)}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition"
                >
                  Planificar
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

