import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  Search,
  MessageSquare,
  FileText,
  User,
  Send,
  Calendar,
  X,
  Printer
} from 'lucide-react';
import PrintablePlanning from './PrintablePlanning';

export default function DirectivoPanel() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Review states
  const [reviewStatus, setReviewStatus] = useState('aprobada');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Filters
  const [filterCiclo, setFilterCiclo] = useState('');
  const [filterAnio, setFilterAnio] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [searchDocente, setSearchDocente] = useState('');

  useEffect(() => {
    loadPlans();
  }, [filterCiclo, filterAnio, filterEstado]);

  const loadPlans = async () => {
    setLoading(true);
    const data = await api.getAllPlanificaciones({
      ciclo: filterCiclo,
      anio: filterAnio,
      estado: filterEstado
    });
    setPlans(data);
    setLoading(false);
  };

  const handleOpenReview = (plan) => {
    setSelectedPlan(plan);
    setReviewStatus(plan.estado === 'requiere_ajustes' ? 'requiere_ajustes' : 'aprobada');
    setReviewComment(plan.devolucion_directivo || '');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedPlan) return;
    setSubmittingReview(true);
    try {
      await api.reviewPlanificacion(selectedPlan.id, reviewStatus, reviewComment);
      setShowReviewModal(false);
      await loadPlans();
    } catch (err) {
      alert('Error guardando devolución: ' + err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const filteredPlans = plans.filter(p => {
    const docName = (p.docente_nombre || '').toLowerCase();
    const espName = (p.espacio_nombre || '').toLowerCase();
    const query = searchDocente.toLowerCase();
    return docName.includes(query) || espName.includes(query);
  });

  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'aprobada':
        return { label: 'Aprobada', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle2 };
      case 'requiere_ajustes':
        return { label: 'Requiere Ajustes', bg: 'bg-amber-100 text-amber-800 border-amber-300', icon: AlertTriangle };
      case 'pendiente_revision':
        return { label: 'Pendiente de Revisión', bg: 'bg-sky-100 text-sky-800 border-sky-300', icon: Clock };
      case 'borrador':
      default:
        return { label: 'Borrador', bg: 'bg-slate-100 text-slate-700 border-slate-300', icon: Clock };
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner de Supervisión Directiva */}
      <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 rounded-2xl p-6 sm:p-8 text-white shadow-md">
        <div className="inline-flex items-center gap-2 bg-sky-800/80 px-3 py-1 rounded-full text-xs text-amber-300 font-semibold mb-3 border border-sky-700">
          <Eye className="w-4 h-4 text-sky-300" />
          Módulo de Supervisión Curricular y Acompañamiento Pedagógico
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Supervisión del Equipo Directivo y Coordinación
        </h2>
        <p className="text-xs sm:text-sm text-sky-100 mt-2 max-w-3xl leading-relaxed">
          Revisa las planificaciones anuales y secuencias didácticas cargadas por los docentes del <strong>IPEM N° 349 "Giovanni Bosco"</strong>. Puedes realizar observaciones pedagógicas, aprobar o solicitar ajustes contextualizados a la orientación <strong>Agro y Ambiente</strong>.
        </p>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Filtrar por Ciclo</label>
            <select
              value={filterCiclo}
              onChange={(e) => setFilterCiclo(e.target.value)}
              className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none bg-white font-medium"
            >
              <option value="">Todos los Ciclos</option>
              <option value="basico">Ciclo Básico (1° a 3°)</option>
              <option value="orientado">Ciclo Orientado (4° a 6° Agro)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Filtrar por Año</label>
            <select
              value={filterAnio}
              onChange={(e) => setFilterAnio(e.target.value)}
              className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none bg-white font-medium"
            >
              <option value="">Todos los Años</option>
              <option value="1">1° Año</option>
              <option value="2">2° Año</option>
              <option value="3">3° Año</option>
              <option value="4">4° Año</option>
              <option value="5">5° Año</option>
              <option value="6">6° Año</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Estado de Revisión</label>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none bg-white font-medium"
            >
              <option value="">Todos los Estados</option>
              <option value="pendiente_revision">Pendientes de Revisión</option>
              <option value="aprobada">Aprobadas</option>
              <option value="requiere_ajustes">Requieren Ajustes</option>
              <option value="borrador">En Borrador</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Buscar Docente o Materia</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchDocente}
                onChange={(e) => setSearchDocente(e.target.value)}
                placeholder="Nombre o asignatura..."
                className="w-full pl-8 pr-2 py-2 text-xs border border-slate-300 rounded-lg outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Planificaciones para Supervisión */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-700" />
            Planificaciones Curriculares Registradas ({filteredPlans.length})
          </h3>
        </div>

        {loading ? (
          <div className="text-center py-10 text-xs text-slate-500">Cargando planificaciones...</div>
        ) : filteredPlans.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-500">
            No se encontraron planificaciones que coincidan con los filtros.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Espacio Curricular</th>
                  <th className="py-3 px-4">Curso / Div.</th>
                  <th className="py-3 px-4">Docente</th>
                  <th className="py-3 px-4">Ciclo / Área</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPlans.map((plan) => {
                  const status = getStatusBadge(plan.estado);
                  const StatusIcon = status.icon;
                  return (
                    <tr key={plan.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {plan.espacio_nombre}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {plan.espacio_anio}° "{plan.division || 'A'}"
                      </td>
                      <td className="py-3.5 px-4 text-slate-800">
                        <div className="font-semibold">{plan.docente_nombre || 'Docente Caroya'}</div>
                        <div className="text-[10px] text-slate-400">{plan.docente_email || ''}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {plan.espacio_ciclo === 'orientado' ? 'Agro y Ambiente' : 'Ciclo Básico'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${status.bg}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenReview(plan)}
                          className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Supervisar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Supervisión y Devolución Directiva */}
      {showReviewModal && selectedPlan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Cabecera del Modal */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                  Supervisión Curricular
                </span>
                <h3 className="text-base font-bold">
                  {selectedPlan.espacio_nombre} - {selectedPlan.espacio_anio}° Año "{selectedPlan.division}"
                </h3>
                <div className="text-xs text-slate-300">
                  Docente: {selectedPlan.docente_nombre} • IPEM N° 349 "Giovanni Bosco"
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido de la Planificación */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              {/* Diagnóstico */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-1">
                  1. Diagnóstico del Grupo
                </h4>
                <p className="leading-relaxed">{selectedPlan.diagnostico || 'Sin diagnóstico detallado.'}</p>
              </div>

              {/* Objetivos */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-1">
                  2. Objetivos de Aprendizaje
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {Array.isArray(selectedPlan.objetivos) ? (
                    selectedPlan.objetivos.map((obj, i) => <li key={i}>{obj}</li>)
                  ) : (
                    <li>{selectedPlan.objetivos}</li>
                  )}
                </ul>
              </div>

              {/* Contenidos */}
              <div>
                <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-1">
                  3. Aprendizajes y Contenidos Seleccionados
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {Array.isArray(selectedPlan.contenidos) ? (
                    selectedPlan.contenidos.map((cnt, i) => <li key={i}>{cnt}</li>)
                  ) : (
                    <li>{selectedPlan.contenidos}</li>
                  )}
                </ul>
              </div>

              {/* Metodología y Evaluación */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[10px] mb-1">Estrategias y Formatos</h4>
                  <p className="leading-relaxed">{selectedPlan.estrategias}</p>
                  <p className="mt-2 text-slate-500 text-[11px]"><strong>Formatos:</strong> {selectedPlan.formatos_pedagogicos}</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[10px] mb-1">Criterios de Evaluación</h4>
                  <p className="leading-relaxed">{selectedPlan.evaluacion}</p>
                </div>
              </div>

              {/* FORMULARIO DE DEVOLUCIÓN DIRECTIVA */}
              <div className="bg-sky-50 border border-sky-300 rounded-xl p-4 space-y-3">
                <h4 className="font-bold text-sky-950 uppercase text-[11px] flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-sky-700" />
                  Devolución Pedagógica del Equipo Directivo
                </h4>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Resolución / Estado
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewStatus('aprobada')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                        reviewStatus === 'aprobada'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Aprobar Planificación
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewStatus('requiere_ajustes')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                        reviewStatus === 'requiere_ajustes'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Requiere Ajustes Pedagógicos
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Comentarios y Sugerencias de Mejora (Se visualizarán en el panel del docente)
                  </label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Escriba aquí las orientaciones pedagógicas, vinculación con el entorno formativo o recomendaciones..."
                    className="w-full p-2.5 text-xs border border-sky-200 rounded-lg outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Barra Inferior del Modal */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Imprimir / PDF
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={submittingReview}
                  onClick={handleSubmitReview}
                  className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  Guardar Devolución Directiva
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Impresión */}
      {showPrintModal && selectedPlan && (
        <PrintablePlanning
          plan={selectedPlan}
          espacio={{ nombre: selectedPlan.espacio_nombre, anio: selectedPlan.espacio_anio }}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}

