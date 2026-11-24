import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Sprout,
  Plus,
  BookOpen,
  Sparkles,
  Link2,
  Users,
  CheckCircle2,
  Clock,
  Send,
  MessageSquare,
  ArrowRight,
  Eye,
  X
} from 'lucide-react';
import ArticulacionColaborativa from './ArticulacionColaborativa';

export default function SecuenciasView({ selectedEspacio }) {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('propias'); // 'propias' | 'colaborativas'
  const [secuencias, setSecuencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSecuencia, setEditingSecuencia] = useState(null);

  // Form states
  const [titulo, setTitulo] = useState('');
  const [fundamentacion, setFundamentacion] = useState('');
  const [propositos, setPropositos] = useState('');
  const [tiempo, setTiempo] = useState('4 clases (8 horas cátedra)');
  const [actInicio, setActInicio] = useState('');
  const [actDesarrollo, setActDesarrollo] = useState('');
  const [actCierre, setActCierre] = useState('');
  const [evaluacion, setEvaluacion] = useState('');
  const [recursos, setRecursos] = useState('');
  const [tipoArticulacion, setTipoArticulacion] = useState('declarativa');
  const [articulacionEje, setArticulacionEje] = useState('Suelo vivo y fertilidad agroecológica');
  const [articulacionMaterias, setArticulacionMaterias] = useState('Química Aplicada y Bioquímica (4° Año)');

  useEffect(() => {
    loadSecuencias();
  }, [selectedEspacio]);

  const loadSecuencias = async () => {
    setLoading(true);
    const data = await api.getSecuencias(selectedEspacio?.id);
    setSecuencias(data);
    setLoading(false);
  };

  const handleOpenModal = (sec = null) => {
    if (sec) {
      setEditingSecuencia(sec);
      setTitulo(sec.titulo);
      setFundamentacion(sec.fundamentacion);
      setPropositos(sec.propositos);
      setTiempo(sec.tiempo_estimado);
      setActInicio(sec.actividades_inicio);
      setActDesarrollo(sec.actividades_desarrollo);
      setActCierre(sec.actividades_cierre);
      setEvaluacion(sec.evaluacion);
      setRecursos(sec.recursos);
      setTipoArticulacion(sec.tipo_articulacion || 'declarativa');
      setArticulacionEje(sec.articulacion_eje || '');
      setArticulacionMaterias(sec.articulacion_materias || '');
    } else {
      setEditingSecuencia(null);
      setTitulo('');
      setFundamentacion('');
      setPropositos('');
      setTiempo('4 clases (8 horas cátedra)');
      setActInicio('');
      setActDesarrollo('');
      setActCierre('');
      setEvaluacion('');
      setRecursos('');
      setTipoArticulacion('declarativa');
      setArticulacionEje('');
      setArticulacionMaterias('');
    }
    setShowModal(true);
  };

  // Cargar Plantilla Modelo para Agro y Ambiente
  const handleLoadTemplate = (tipo) => {
    if (tipo === 'compost') {
      setTitulo('Manejo de Sustratos Orgánicos y Compostaje Termofílico');
      setFundamentacion('En el contexto productivo de Colonia Caroya, la valorización de restos de poda vitícola y residuos orgánicos permite regenerar la microbiología del suelo escolar.');
      setPropositos('Reconocer la importancia de la relación Carbono/Nitrógeno (C/N), monitorear la curva térmica y valorar el abono maduro en canteros hortícolas.');
      setTiempo('3 semanas (6 clases)');
      setActInicio('Indagación de saberes previos con fotos de chacras locales. Medición de temperatura inicial con termómetro de punzón.');
      setActDesarrollo('Armado de la pila con capas alternadas de material seco y verde. Control de humedad con la prueba del puño y volteos periódicos.');
      setActCierre('Tamizado del compost, prueba de germinación en semillas de rábano y registro en bitácora.');
      setEvaluacion('Rúbrica de trabajo práctico colaborativo en huerta y ficha de seguimiento térmico.');
      setRecursos('Termómetro de punzón, tamiz, restos de poda, guano, agua, palas.');
      setTipoArticulacion('declarativa');
      setArticulacionEje('Ciclos biogeoquímicos y materia orgánica del suelo');
      setArticulacionMaterias('Química Aplicada y Bioquímica (4° Año)');
    } else if (tipo === 'injerto') {
      setTitulo('Multiplicación Agámica: Técnicas de Injerto en Vid Caroyense');
      setFundamentacion('La vitivinicultura tradicional de Colonia Caroya requiere dominar la técnica de injerto sobre pie americano para prevenir la filoxera.');
      setPropositos('Desarrollar destrezas manuales para realizar cortes limpios y asegurar el contacto cambial entre patrón e injerto.');
      setTiempo('2 semanas (4 clases)');
      setActInicio('Muestra de sarmientos y pie americano en el vivero escolar. Video demostrativo de productor caroyense.');
      setActDesarrollo('Práctica de corte en taller de herramientas. Ejecución de injerto inglés de lengüeta y atado con cinta biodegradable.');
      setActCierre('Estratificación en arena húmeda y evaluación del porcentaje de prendimiento.');
      setEvaluacion('Observación directa con lista de cotejo de destreza técnica y seguridad en el uso de navaja de injertar.');
      setRecursos('Navajas de injertar, tijeras de podar, sarmientos de vid Frambua, cinta de atar, alcohol.');
      setTipoArticulacion('declarativa');
      setArticulacionEje('Anatomía vegetal y tejidos meristemáticos');
      setArticulacionMaterias('Biología / Fisiología Vegetal');
    }
  };

  const handleSaveSecuencia = async (e) => {
    e.preventDefault();
    if (!titulo) return;

    const payload = {
      id: editingSecuencia?.id || null,
      espacio_id: selectedEspacio?.id || 26,
      espacio_nombre: selectedEspacio?.nombre || 'Producción Vegetal I',
      espacio_anio: selectedEspacio?.anio || 4,
      docente_id: user?.id || 4,
      docente_nombre: `${user?.nombre} ${user?.apellido}`,
      titulo,
      fundamentacion,
      propositos,
      tiempo_estimado: tiempo,
      actividades_inicio: actInicio,
      actividades_desarrollo: actDesarrollo,
      actividades_cierre: actCierre,
      evaluacion,
      recursos,
      tipo_articulacion: tipoArticulacion,
      articulacion_eje: articulacionEje,
      articulacion_materias: articulacionMaterias,
      estado: 'pendiente_revision'
    };

    try {
      await api.saveSecuencia(payload);
      setShowModal(false);
      await loadSecuencias();
    } catch (err) {
      alert('Error guardando secuencia: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-gradient-to-r from-emerald-900 to-sky-900 rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-800/80 px-3 py-1 rounded-full text-xs text-amber-300 font-semibold mb-2 border border-emerald-700">
            <Sprout className="w-3.5 h-3.5 text-emerald-400" />
            Módulo Pedagógico: Secuencias Didácticas & Articulación
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            Secuencias Didácticas e Integración Interdisciplinaria
          </h2>
          <p className="text-xs text-emerald-100 mt-1 max-w-2xl leading-relaxed">
            Diseña secuencias paso a paso (Inicio, Desarrollo y Cierre) con plantillas agroambientales de Colonia Caroya y coordina proyectos articulados entre múltiples materias.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nueva Secuencia Didáctica
        </button>
      </div>

      {/* Selector de Pestañas: Secuencias Propias vs Proyectos Colaborativos Guiados */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl shadow-xs overflow-hidden">
        <button
          onClick={() => setActiveSubTab('propias')}
          className={`flex-1 py-3 px-4 text-xs font-bold text-center border-b-2 transition flex items-center justify-center gap-2 ${
            activeSubTab === 'propias'
              ? 'border-emerald-600 text-emerald-900 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-600" />
          Secuencias del Espacio Curricular ({secuencias.length})
        </button>
        <button
          onClick={() => setActiveSubTab('colaborativas')}
          className={`flex-1 py-3 px-4 text-xs font-bold text-center border-b-2 transition flex items-center justify-center gap-2 ${
            activeSubTab === 'colaborativas'
              ? 'border-emerald-600 text-emerald-900 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4 text-sky-600" />
          Articulación Colaborativa Guiada (Proyectos Interdisciplinarios)
        </button>
      </div>

      {/* SUB-PESTAÑA 1: SECUENCIAS PROPIAS Y DECLARATIVAS */}
      {activeSubTab === 'propias' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-10 text-xs text-slate-500">Cargando secuencias...</div>
          ) : secuencias.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
              No hay secuencias didácticas creadas para este espacio curricular. Haz clic en "Nueva Secuencia Didáctica" para redactar una o utilizar una plantilla modelo.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {secuencias.map((sec) => (
                <div
                  key={sec.id}
                  className="bg-white rounded-xl border border-slate-200 hover:border-emerald-300 p-5 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {sec.espacio_nombre || 'Agro y Ambiente'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        sec.estado === 'aprobada'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}>
                        {sec.estado}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 line-clamp-2">
                      {sec.titulo}
                    </h3>

                    <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                      {sec.fundamentacion}
                    </p>

                    {/* Badge de Articulación Declarativa */}
                    {sec.tipo_articulacion === 'declarativa' && sec.articulacion_materias && (
                      <div className="mt-3 p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2">
                        <Link2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-[11px]">Articula con: {sec.articulacion_materias}</div>
                          <div className="text-[10px] text-emerald-800 italic">Eje: {sec.articulacion_eje}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {sec.tiempo_estimado}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenModal(sec)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1 transition"
                    >
                      <Eye className="w-3.5 h-3.5" /> Ver / Editar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-PESTAÑA 2: ARTICULACIÓN COLABORATIVA GUIADA */}
      {activeSubTab === 'colaborativas' && (
        <ArticulacionColaborativa />
      )}

      {/* MODAL DE CONSTRUCCIÓN DE SECUENCIA DIDÁCTICA */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Header del Modal */}
            <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  Constructor Pedagógico
                </span>
                <h3 className="text-base font-bold">
                  {editingSecuencia ? 'Editar Secuencia Didáctica' : 'Nueva Secuencia Didáctica'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Plantillas Rápidas para Agro y Ambiente */}
            <div className="bg-amber-50 p-3 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-amber-900 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Cargar Plantilla Modelo:
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleLoadTemplate('compost')}
                  className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 rounded-md border border-amber-300 font-semibold text-[11px] transition"
                >
                  🌱 Compostaje y Abono
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadTemplate('injerto')}
                  className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 rounded-md border border-amber-300 font-semibold text-[11px] transition"
                >
                  🍇 Injerto en Vid Caroyense
                </button>
              </div>
            </div>

            {/* Formulario de la Secuencia */}
            <form onSubmit={handleSaveSecuencia} className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Título de la Secuencia</label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej. Manejo Agroecológico de Suelos y Compostaje Termófilo"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tiempo Estimado</label>
                  <input
                    type="text"
                    value={tiempo}
                    onChange={(e) => setTiempo(e.target.value)}
                    placeholder="Ej. 4 clases (8 horas cátedra)"
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tipo de Articulación</label>
                  <select
                    value={tipoArticulacion}
                    onChange={(e) => setTipoArticulacion(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none bg-white font-medium"
                  >
                    <option value="declarativa">Articulación Declarativa con otra materia</option>
                    <option value="ninguna">Sin articulación transversal</option>
                  </select>
                </div>
              </div>

              {/* Si es articulación declarativa */}
              {tipoArticulacion === 'declarativa' && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                  <div className="font-bold text-emerald-950 text-[11px] flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-emerald-700" />
                    Articulación Declarativa entre Espacios Curriculares
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Espacio con el que articula</label>
                      <input
                        type="text"
                        value={articulacionMaterias}
                        onChange={(e) => setArticulacionMaterias(e.target.value)}
                        placeholder="Ej. Química Aplicada / Biología / Matemática"
                        className="w-full p-2 text-xs border border-emerald-200 rounded-lg bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Eje Transversal Integrador</label>
                      <input
                        type="text"
                        value={articulacionEje}
                        onChange={(e) => setArticulacionEje(e.target.value)}
                        placeholder="Ej. Suelo vivo, química orgánica y microbiología"
                        className="w-full p-2 text-xs border border-emerald-200 rounded-lg bg-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Fundamentación Pedagógica</label>
                <textarea
                  rows={2}
                  value={fundamentacion}
                  onChange={(e) => setFundamentacion(e.target.value)}
                  placeholder="Por qué es importante este aprendizaje en el contexto formativo y regional..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Propósitos de la Secuencia</label>
                <textarea
                  rows={2}
                  value={propositos}
                  onChange={(e) => setPropositos(e.target.value)}
                  placeholder="Qué capacidades se esperan desarrollar en los estudiantes..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Fases: Inicio, Desarrollo y Cierre */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="font-bold text-slate-800 text-[11px] uppercase">
                  Desarrollo de Actividades
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-emerald-800 mb-1">
                    1. Actividades de Inicio (Apertura y disparador)
                  </label>
                  <textarea
                    rows={2}
                    value={actInicio}
                    onChange={(e) => setActInicio(e.target.value)}
                    placeholder="Recuperación de saberes previos, video motivador, preguntas guía..."
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-sky-800 mb-1">
                    2. Actividades de Desarrollo (Labor de campo / taller / experimentación)
                  </label>
                  <textarea
                    rows={3}
                    value={actDesarrollo}
                    onChange={(e) => setActDesarrollo(e.target.value)}
                    placeholder="Práctica en canteros de huerta, tomas de muestras, cálculos en laboratorio..."
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-amber-800 mb-1">
                    3. Actividades de Cierre (Sistematización y metacognición)
                  </label>
                  <textarea
                    rows={2}
                    value={actCierre}
                    onChange={(e) => setActCierre(e.target.value)}
                    placeholder="Puesta en común, confección de informe técnico, divulgación comunitaria..."
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Evaluación e Instrumentos</label>
                <textarea
                  rows={2}
                  value={evaluacion}
                  onChange={(e) => setEvaluacion(e.target.value)}
                  placeholder="Rúbrica de trabajo práctico, bitácora de campo..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Botones de acción */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Guardar Secuencia Didáctica
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

