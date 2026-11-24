import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  FileText,
  ExternalLink,
  Download,
  Filter,
  Search,
  BookOpen,
  Award,
  ShieldCheck,
  Sprout
} from 'lucide-react';

export default function NormativasView({ selectedEspacio }) {
  const [normativas, setNormativas] = useState([]);
  const [filterTipo, setFilterTipo] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNormativas();
  }, [filterTipo, selectedEspacio]);

  const loadNormativas = async () => {
    setLoading(true);
    const data = await api.getNormativas(filterTipo || null, selectedEspacio?.id || null);
    setNormativas(data);
    setLoading(false);
  };

  const filtered = normativas.filter(n =>
    n.titulo.toLowerCase().includes(search.toLowerCase()) ||
    (n.resolucion_numero && n.resolucion_numero.toLowerCase().includes(search.toLowerCase())) ||
    (n.descripcion && n.descripcion.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-sky-950 rounded-2xl p-6 sm:p-8 text-white shadow-md">
        <div className="inline-flex items-center gap-1.5 bg-emerald-800/80 px-3 py-1 rounded-full text-xs text-amber-300 font-semibold mb-2 border border-emerald-700">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Ministerio de Educación de Córdoba - DGESec
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Repositorio Normativo y Curricular Oficial
        </h2>
        <p className="text-xs sm:text-sm text-emerald-100 mt-2 max-w-3xl leading-relaxed">
          Consulta y descarga los <strong>Diseños Curriculares de la Provincia de Córdoba</strong>, resoluciones ministeriales, <strong>Régimen Académico (Res. 732/17 y 555/22)</strong> y progresiones de aprendizaje para fundamentar la planificación pedagógica del <strong>IPEM N° 349 "Giovanni Bosco"</strong>.
        </p>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="p-2 text-xs border border-slate-300 rounded-lg outline-none bg-white font-medium"
          >
            <option value="">Todas las Normativas</option>
            <option value="diseno_curricular">Diseños Curriculares de Córdoba</option>
            <option value="regimen_academico">Régimen Académico</option>
            <option value="progresion">Progresiones de Aprendizajes</option>
            <option value="resolucion">Resoluciones y Protocolos</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por resolución o título..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Listado de Documentos */}
      {loading ? (
        <div className="text-center py-10 text-xs text-slate-500">Cargando repositorio normativo...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          No se encontraron documentos normativos con los filtros seleccionados.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-emerald-400 p-5 shadow-xs flex flex-col justify-between space-y-4 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {doc.tipo.replace('_', ' ')}
                  </span>
                  {doc.resolucion_numero && (
                    <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {doc.resolucion_numero}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {doc.titulo}
                </h3>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {doc.descripcion}
                </p>

                {doc.organismo && (
                  <div className="text-[10px] text-slate-400 mt-2 font-medium">
                    {doc.organismo}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {doc.url_oficial ? (
                  <a
                    href={doc.url_oficial}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    Portal Oficial de Córdoba
                  </a>
                ) : <div />}

                <button
                  type="button"
                  onClick={() => {
                    if (doc.url_oficial) {
                      window.open(doc.url_oficial, '_blank');
                    } else {
                      alert(`Descargando documento PDF oficial: ${doc.archivo_pdf || 'documento.pdf'}`);
                    }
                  }}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

