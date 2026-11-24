import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Users,
  Plus,
  Sprout,
  Send,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X
} from 'lucide-react';

export default function ArticulacionColaborativa() {
  const { user } = useAuth();
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Form states for creating proposal
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [problema, setProblema] = useState('');
  const [producto, setProducto] = useState('');
  const [espacioCreadorId, setEspacioCreadorId] = useState(26); // Default 4° Agro
  const [aporteInicial, setAporteInicial] = useState('');

  // Form states for joining proposal
  const [joinEspacioId, setJoinEspacioId] = useState(28); // Default Química
  const [joinAporte, setJoinAporte] = useState('');
  const [joinAprendizajes, setJoinAprendizajes] = useState('');

  useEffect(() => {
    loadProyectos();
  }, []);

  const loadProyectos = async () => {
    setLoading(true);
    const data = await api.getProyectosArticulados();
    setProyectos(data);
    setLoading(false);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!titulo || !descripcion || !problema) return;
    try {
      await api.createProyectoArticulado({
        titulo,
        descripcion,
        problema_contexto: problema,
        producto_final: producto,
        creador_id: user?.id || 4,
        creador_nombre: `${user?.nombre} ${user?.apellido}`,
        espacio_creador_id: espacioCreadorId,
        espacio_creador_nombre: 'Producción Vegetal I (4° Año)',
        aporte_inicial: aporteInicial
      });
      setShowCreateModal(false);
      setTitulo('');
      setDescripcion('');
      setProblema('');
      setProducto('');
      setAporteInicial('');
      await loadProyectos();
    } catch (err) {
      alert('Error creando proyecto: ' + err.message);
    }
  };

  const handleJoinProject = async (e) => {
    e.preventDefault();
    if (!selectedProject || !joinAporte) return;
    try {
      await api.joinProyectoArticulado({
        proyecto_id: selectedProject.id,
        docente_id: user?.id || 5,
        docente_nombre: `${user?.nombre} ${user?.apellido}`,
        espacio_id: joinEspacioId,
        espacio_nombre: 'Química Aplicada y Bioquímica (4° Año)',
        aporte_especifico: joinAporte,
        aprendizajes_articulados: joinAprendizajes
      });
      setShowJoinModal(false);
      setJoinAporte('');
      setJoinAprendizajes('');
      await loadProyectos();
    } catch (err) {
      alert('Error sumándose al proyecto: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Explicación del Funcionamiento Guiado */}
      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5 text-sky-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="font-bold text-sm flex items-center gap-1.5 text-sky-900">
            <Sparkles className="w-4 h-4 text-sky-600" />
            Modalidad: Articulación Colaborativa Guiada
          </div>
          <p className="text-xs text-sky-800 leading-relaxed max-w-2xl">
            Un docente publica una <strong>"Propuesta de Proyecto Articulado"</strong> basada en un problema socioproductivo de Colonia Caroya. Colegas de otras materias (Química, Matemática, Geografía, etc.) se suman aportando contenidos específicos dentro de la misma secuencia compartida.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Publicar Nueva Propuesta
        </button>
      </div>

      {/* Listado de Proyectos Articulados */}
      {loading ? (
        <div className="text-center py-10 text-xs text-slate-500">Cargando proyectos colaborativos...</div>
      ) : proyectos.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          No hay proyectos colaborativos iniciados. ¡Sé el primero en convocar a tus colegas docentes!
        </div>
      ) : (
        <div className="space-y-4">
          {proyectos.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                      {p.estado === 'convocatoria' ? 'Convocatoria Abierta' : 'Proyecto en Desarrollo'}
                    </span>
                    <span className="text-xs text-slate-400">
                      Iniciado por: <strong>{p.creador_nombre}</strong>
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{p.titulo}</h3>
                </div>

                <button
                  type="button"
                  onClick={() => { setSelectedProject(p); setShowJoinModal(true); }}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" /> Sumar mi Materia
                </button>
              </div>

              {/* Contexto y Producto Final */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl text-xs">
                <div>
                  <strong className="text-slate-800 block text-[11px] mb-0.5">Problema en Colonia Caroya:</strong>
                  <p className="text-slate-600 leading-relaxed">{p.problema_contexto}</p>
                </div>
                <div>
                  <strong className="text-slate-800 block text-[11px] mb-0.5">Producto Final Esperado:</strong>
                  <p className="text-slate-600 leading-relaxed">{p.producto_final}</p>
                </div>
              </div>

              {/* Aportes de los Docentes y Materias Participantes */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-700" />
                  Aportes Articulados por Espacio Curricular ({p.participantes?.length || 0})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {p.participantes?.map((part, i) => (
                    <div key={i} className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-emerald-950">
                        <span>{part.espacio_nombre}</span>
                        <span className="text-[10px] text-emerald-700 font-semibold">{part.docente_nombre}</span>
                      </div>
                      <p className="text-slate-700 text-[11px] leading-relaxed">
                        <strong>Aporte:</strong> {part.aporte_especifico}
                      </p>
                      {part.aprendizajes_articulados && (
                        <p className="text-slate-500 text-[10px] italic">
                          Aprendizajes: {part.aprendizajes_articulados}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: PUBLICAR PROPUESTA DE PROYECTO */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Publicar Convocatoria a Proyecto Articulado</h3>
              <button onClick={() => setShowCreateModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Título del Proyecto Integrador</label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej. Huerta Orgánica y Monitoreo del Agua en Caroya"
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Problema de Contexto en Colonia Caroya</label>
                <textarea
                  rows={2}
                  required
                  value={problema}
                  onChange={(e) => setProblema(e.target.value)}
                  placeholder="Qué problemática ambiental o socioproductiva se busca abordar..."
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripción del Proyecto</label>
                <textarea
                  rows={2}
                  required
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Objetivo general y dinámica de trabajo entre áreas..."
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Producto Final Tangible</label>
                <input
                  type="text"
                  required
                  value={producto}
                  onChange={(e) => setProducto(e.target.value)}
                  placeholder="Ej. Informe técnico de calidad hídrica y cantero agroecológico escolar"
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tu Aporte Específico Inicial</label>
                <input
                  type="text"
                  value={aporteInicial}
                  onChange={(e) => setAporteInicial(e.target.value)}
                  placeholder="Desde tu materia, qué contenidos o actividades realizarán los chicos..."
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 font-semibold text-slate-600">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-lg shadow-xs">
                  Publicar Propuesta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUMARSE AL PROYECTO COLABORATIVO */}
      {showJoinModal && selectedProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-700">Sumarse al Proyecto</span>
                <h3 className="text-sm font-bold text-slate-900">{selectedProject.titulo}</h3>
              </div>
              <button onClick={() => setShowJoinModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <form onSubmit={handleJoinProject} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Espacio Curricular desde el que Participas</label>
                <input
                  type="text"
                  readOnly
                  value="Química Aplicada y Bioquímica (4° Año)"
                  className="w-full p-2 border border-slate-300 rounded-lg bg-slate-50 font-medium text-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Aporte Específico de tu Materia</label>
                <textarea
                  rows={3}
                  required
                  value={joinAporte}
                  onChange={(e) => setJoinAporte(e.target.value)}
                  placeholder="Qué actividad o investigación técnica aportará tu curso..."
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Aprendizajes y Contenidos Articulados</label>
                <input
                  type="text"
                  value={joinAprendizajes}
                  onChange={(e) => setJoinAprendizajes(e.target.value)}
                  placeholder="Ej. Soluciones químicas, pH, acidez y conductividad eléctrica"
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button type="button" onClick={() => setShowJoinModal(false)} className="px-4 py-2 font-semibold text-slate-600">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-xs">
                  Confirmar Participación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
