import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import PrintablePlanning from './PrintablePlanning';
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Save,
  Send,
  Printer,
  Sparkles,
  BookOpen,
  Plus,
  Trash2,
  MessageSquare
} from 'lucide-react';

export default function PlanningWizard({ espacio, initialPlan = null, onSaved, onCancel }) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Malla Curricular Oficial de Córdoba para el espacio curricular
  const [curriculumOfficial, setCurriculumOfficial] = useState({
    objetivos: [],
    contenidos: []
  });

  // Datos del Formulario de Planificación Anual
  const [formData, setFormData] = useState({
    id: initialPlan?.id || null,
    espacio_id: espacio?.id || initialPlan?.espacio_id,
    espacio_nombre: espacio?.nombre || initialPlan?.espacio_nombre || '',
    espacio_anio: espacio?.anio || initialPlan?.espacio_anio || 4,
    anio_lectivo: initialPlan?.anio_lectivo || 2026,
    division: initialPlan?.division || 'A',
    docente_id: user?.id || 4,
    docente_nombre: initialPlan?.docente_nombre || `${user?.nombre || ''} ${user?.apellido || ''}`,
    diagnostico: initialPlan?.diagnostico || '',
    objetivos: initialPlan?.objetivos || [],
    contenidos: initialPlan?.contenidos || [],
    estrategias: initialPlan?.estrategias || '',
    formatos_pedagogicos: initialPlan?.formatos_pedagogicos || 'Asignatura teórica combinada con Taller de Huerta y Prácticas en Entorno Formativo.',
    recursos: initialPlan?.recursos || 'Canteros experimentales de la escuela, sistema de riego por goteo, compostera comunitaria, semillas INTA Jesús María y microscopios de laboratorio.',
    evaluacion: initialPlan?.evaluacion || 'Evaluación formativa continua según Régimen Académico Res. 732/17. Rúbricas de desempeño en campo (60%) e informes técnicos de seguimiento de cultivo (40%).',
    bibliografia: initialPlan?.bibliografia || 'Diseño Curricular de Córdoba para Educación Secundaria (Res. Min. 251/14); Guías Técnicas de INTA Jesús María; Manual de Agroecología.',
    estado: initialPlan?.estado || 'borrador',
    devolucion_directivo: initialPlan?.devolucion_directivo || ''
  });

  const [customObjetivo, setCustomObjetivo] = useState('');
  const [customContenido, setCustomContenido] = useState('');

  useEffect(() => {
    loadCurriculumData();
  }, [espacio]);

  const loadCurriculumData = async () => {
    if (!espacio?.id) return;
    const detail = await api.getEspacioDetail(espacio.id);
    if (detail?.contenidos) {
      setCurriculumOfficial(detail.contenidos);
      // Si la planificación está vacía, preseleccionar los objetivos y contenidos oficiales
      if (!initialPlan && (!formData.objetivos || formData.objetivos.length === 0)) {
        setFormData(prev => ({
          ...prev,
          objetivos: detail.contenidos.objetivos || [],
          contenidos: detail.contenidos.contenidos || []
        }));
      }
    }
  };

  const handleToggleObjetivo = (obj) => {
    setFormData(prev => {
      const exists = prev.objetivos.includes(obj);
      return {
        ...prev,
        objetivos: exists ? prev.objetivos.filter(o => o !== obj) : [...prev.objetivos, obj]
      };
    });
  };

  const handleToggleContenido = (cnt) => {
    setFormData(prev => {
      const exists = prev.contenidos.includes(cnt);
      return {
        ...prev,
        contenidos: exists ? prev.contenidos.filter(c => c !== cnt) : [...prev.contenidos, cnt]
      };
    });
  };

  const handleAddCustomObjetivo = () => {
    if (!customObjetivo.trim()) return;
    setFormData(prev => ({
      ...prev,
      objetivos: [...prev.objetivos, customObjetivo.trim()]
    }));
    setCustomObjetivo('');
  };

  const handleAddCustomContenido = () => {
    if (!customContenido.trim()) return;
    setFormData(prev => ({
      ...prev,
      contenidos: [...prev.contenidos, customContenido.trim()]
    }));
    setCustomContenido('');
  };

  const handleSave = async (submitToDirectivo = false) => {
    setError('');
    setSuccess('');
    setLoading(true);

    const targetEstado = submitToDirectivo ? 'pendiente_revision' : (formData.estado || 'borrador');
    const payload = {
      ...formData,
      estado: targetEstado
    };

    try {
      await api.savePlanificacion(payload);
      setFormData(prev => ({ ...prev, estado: targetEstado }));
      setSuccess(
        submitToDirectivo
          ? '¡Planificación enviada al Equipo Directivo para su supervisión pedagógica!'
          : 'Planificación guardada correctamente como borrador.'
      );
      if (onSaved) onSaved(payload);
    } catch (err) {
      setError(err.message || 'Error al guardar la planificación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Encabezado del Wizard */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
              Asistente Paso a Paso
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {espacio?.anio || formData.espacio_anio}° Año "{formData.division}"
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">
            Planificación Anual: {espacio?.nombre || formData.espacio_nombre}
          </h2>
          <p className="text-xs text-slate-500">
            IPEM N° 349 "Giovanni Bosco" - Ciclo Lectivo {formData.anio_lectivo}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            Exportar / Imprimir
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-2 text-slate-600 hover:text-slate-900 text-xs font-bold transition"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>

      {/* Alerta de Devolución del Equipo Directivo */}
      {formData.devolucion_directivo && (
        <div className="bg-sky-50 border border-sky-300 rounded-2xl p-4 text-sky-900 text-xs flex items-start gap-3 shadow-xs">
          <MessageSquare className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold flex items-center gap-2">
              <span>Devolución del Equipo Directivo</span>
              <span className="px-2 py-0.5 rounded bg-sky-200 text-sky-800 text-[10px] font-bold uppercase">
                {formData.estado}
              </span>
            </div>
            <p className="leading-relaxed text-slate-700 italic">
              "{formData.devolucion_directivo}"
            </p>
          </div>
        </div>
      )}

      {/* Indicador de Pasos del Wizard */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="grid grid-cols-4 gap-2">
          {[
            { step: 1, title: '1. Datos Generales', desc: 'Diagnóstico del grupo' },
            { step: 2, title: '2. Objetivos y Contenidos', desc: 'Malla de Córdoba' },
            { step: 3, title: '3. Metodología', desc: 'Formatos y huerta' },
            { step: 4, title: '4. Evaluación', desc: 'Criterios y bibliografía' }
          ].map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={() => setCurrentStep(item.step)}
              className={`p-2.5 rounded-xl text-left border transition ${
                currentStep === item.step
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                  : currentStep > item.step
                  ? 'border-emerald-200 bg-slate-50 text-slate-700'
                  : 'border-slate-200 text-slate-400'
              }`}
            >
              <div className="text-xs font-bold flex items-center justify-between">
                <span>{item.title}</span>
                {currentStep > item.step && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              </div>
              <div className="text-[10px] text-slate-500 hidden sm:block mt-0.5">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Mensajes de Notificación */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {success}
        </div>
      )}

      {/* CUERPO DEL PASO ACTIVO */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        {/* PASO 1: DATOS GENERALES */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Año Lectivo</label>
                <input
                  type="number"
                  value={formData.anio_lectivo}
                  onChange={(e) => setFormData({ ...formData, anio_lectivo: Number(e.target.value) })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">División</label>
                <select
                  value={formData.division}
                  onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="A">División "A"</option>
                  <option value="B">División "B"</option>
                  <option value="C">División "C"</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Docente Responsable</label>
                <input
                  type="text"
                  value={formData.docente_nombre}
                  onChange={(e) => setFormData({ ...formData, docente_nombre: e.target.value })}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Diagnóstico del Grupo y Contexto Socioproductivo de Colonia Caroya
              </label>
              <textarea
                rows={5}
                value={formData.diagnostico}
                onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
                placeholder="Describa las características pedagógicas del curso, conocimientos previos, intereses por el entorno formativo huerta/campo y necesidades pedagógicas específicas..."
                className="w-full p-3 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* PASO 2: OBJETIVOS Y APRENDIZAJES / CONTENIDOS (MALLA CÓRDOBA) */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Selección de Objetivos Oficiales */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Objetivos Oficiales de la Provincia de Córdoba
                </label>
                <span className="text-[11px] text-slate-500">
                  {formData.objetivos.length} seleccionados
                </span>
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {curriculumOfficial.objetivos.map((obj, i) => (
                  <label
                    key={i}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                      formData.objetivos.includes(obj)
                        ? 'border-emerald-500 bg-emerald-50/70 text-slate-900 font-medium'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.objetivos.includes(obj)}
                      onChange={() => handleToggleObjetivo(obj)}
                      className="mt-0.5 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className="leading-relaxed">{obj}</span>
                  </label>
                ))}
              </div>

              {/* Agregar Objetivo Personalizado */}
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={customObjetivo}
                  onChange={(e) => setCustomObjetivo(e.target.value)}
                  placeholder="Agregar otro objetivo específico..."
                  className="flex-1 p-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomObjetivo}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar
                </button>
              </div>
            </div>

            {/* Selección de Ejes y Contenidos Oficiales */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                  Ejes de Aprendizajes y Contenidos Fundamentales
                </label>
                <span className="text-[11px] text-slate-500">
                  {formData.contenidos.length} seleccionados
                </span>
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {curriculumOfficial.contenidos.map((cnt, i) => (
                  <label
                    key={i}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                      formData.contenidos.includes(cnt)
                        ? 'border-emerald-500 bg-emerald-50/70 text-slate-900 font-medium'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.contenidos.includes(cnt)}
                      onChange={() => handleToggleContenido(cnt)}
                      className="mt-0.5 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className="leading-relaxed">{cnt}</span>
                  </label>
                ))}
              </div>

              {/* Agregar Contenido Personalizado */}
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={customContenido}
                  onChange={(e) => setCustomContenido(e.target.value)}
                  placeholder="Agregar otro contenido contextual de Caroya..."
                  className="flex-1 p-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomContenido}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PASO 3: METODOLOGÍA, FORMATOS Y RECURSOS */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Formatos Pedagógicos (Según Régimen Académico Córdoba)
              </label>
              <input
                type="text"
                value={formData.formatos_pedagogicos}
                onChange={(e) => setFormData({ ...formData, formatos_pedagogicos: e.target.value })}
                placeholder="Ej. Taller, Laboratorio, Proyecto, Prácticas en Entorno Formativo de Campo..."
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estrategias Metodológicas
              </label>
              <textarea
                rows={4}
                value={formData.estrategias}
                onChange={(e) => setFormData({ ...formData, estrategias: e.target.value })}
                placeholder="Aprendizaje Basado en Proyectos (ABP), estudio de casos agronómicos locales, demostraciones prácticas en huerta, bitácora de campo..."
                className="w-full p-3 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Recursos Didácticos y Entorno Formativo
              </label>
              <textarea
                rows={3}
                value={formData.recursos}
                onChange={(e) => setFormData({ ...formData, recursos: e.target.value })}
                placeholder="Canteros de la escuela, sistema de riego, compostera, semillas INTA, herramientas, microscopios de laboratorio..."
                className="w-full p-3 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* PASO 4: EVALUACIÓN Y BIBLIOGRAFÍA */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Criterios e Instrumentos de Evaluación (Régimen Académico Res. 732/17)
              </label>
              <textarea
                rows={4}
                value={formData.evaluacion}
                onChange={(e) => setFormData({ ...formData, evaluacion: e.target.value })}
                placeholder="Evaluación formativa, rúbricas de desempeño en entorno productivo huerta, informes de laboratorio, autoevaluación grupal..."
                className="w-full p-3 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bibliografía Docente y del Estudiante
              </label>
              <textarea
                rows={3}
                value={formData.bibliografia}
                onChange={(e) => setFormData({ ...formData, bibliografia: e.target.value })}
                placeholder="Diseño Curricular Agro y Ambiente Córdoba (Res. Min. 251/14), manuales técnicos de INTA, guías del cinturón verde..."
                className="w-full p-3 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* Barra Inferior de Navegación del Wizard */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-300 flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Anterior
              </button>
            )}
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 transition shadow-xs"
              >
                Siguiente <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSave(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" /> Guardar Borrador
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSave(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" /> Enviar a Revisión Directiva
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Impresión / Exportación Oficial en PDF */}
      {showPrintModal && (
        <PrintablePlanning
          plan={formData}
          espacio={espacio}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}
