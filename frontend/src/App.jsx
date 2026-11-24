import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthView from './components/AuthView';
import CurriculumConsole from './components/CurriculumConsole';
import PlanningWizard from './components/PlanningWizard';
import DirectivoPanel from './components/DirectivoPanel';
import AdminPanel from './components/AdminPanel';
import SecuenciasView from './components/SecuenciasView';
import AgendaView from './components/AgendaView';
import NormativasView from './components/NormativasView';
import { api } from './services/api';
import {
  FileText,
  Plus,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Printer,
  Sprout,
  ArrowRight
} from 'lucide-react';
import PrintablePlanning from './components/PrintablePlanning';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('curriculum');
  const [selectedEspacio, setSelectedEspacio] = useState({
    id: 26,
    ciclo: 'orientado',
    anio: 4,
    nombre: 'Producción Vegetal I (Cultivos de la Región y Horticultura)',
    area: 'Formación Específica',
    orientacion: 'Agro y Ambiente',
    horas_catedra: 5
  });

  const [activePlanForWizard, setActivePlanForWizard] = useState(null);
  const [myPlanificaciones, setMyPlanificaciones] = useState([]);
  const [printPlanModal, setPrintPlanModal] = useState(null);

  useEffect(() => {
    if (user) {
      if (user.rol === 'admin') {
        setCurrentView('admin-users');
      } else if (user.rol === 'director' || user.rol === 'coordinador') {
        setCurrentView('directivo-supervision');
      } else {
        setCurrentView('curriculum');
      }
      loadTeacherPlans();
    }
  }, [user]);

  const loadTeacherPlans = async () => {
    if (!user) return;
    const plans = await api.getMyPlanificaciones(user.id);
    setMyPlanificaciones(plans);
  };

  const handleStartPlanning = (espacio, plan = null) => {
    setSelectedEspacio(espacio);
    setActivePlanForWizard(plan);
    setCurrentView('planning-wizard');
  };

  const handlePlanningSaved = async () => {
    await loadTeacherPlans();
    setCurrentView('planificaciones');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs font-semibold text-slate-500">
        Iniciando Sistema IPEM 349 "Giovanni Bosco"...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar currentView={currentView} onNavigate={setCurrentView} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* PORTAL DE AUTENTICACIÓN */}
        {(!user || currentView === 'auth') && (
          <AuthView onAuthSuccess={() => setCurrentView('curriculum')} />
        )}

        {/* VISTAS EXCLUSIVAS DE ADMINISTRACIÓN */}
        {user && currentView === 'admin-users' && user.rol === 'admin' && (
          <AdminPanel />
        )}

        {/* VISTAS DE EQUIPO DIRECTIVO */}
        {user && currentView === 'directivo-supervision' && (user.rol === 'director' || user.rol === 'coordinador' || user.rol === 'admin') && (
          <DirectivoPanel />
        )}

        {/* CONSOLA CURRICULAR (MALLA DE CÓRDOBA) */}
        {user && (currentView === 'curriculum' || currentView === 'home') && (
          <CurriculumConsole
            onSelectEspacio={(esp) => {
              setSelectedEspacio(esp);
              setCurrentView('secuencias');
            }}
            onStartPlanning={(esp) => handleStartPlanning(esp)}
          />
        )}

        {/* ASISTENTE INTERACTIVO DE PLANIFICACIÓN ANUAL (WIZARD) */}
        {user && currentView === 'planning-wizard' && (
          <PlanningWizard
            espacio={selectedEspacio}
            initialPlan={activePlanForWizard}
            onSaved={handlePlanningSaved}
            onCancel={() => setCurrentView('planificaciones')}
          />
        )}

        {/* LISTADO DE PLANIFICACIONES DEL DOCENTE */}
        {user && currentView === 'planificaciones' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  Espacio de Trabajo Docente
                </span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                  Mis Planificaciones Curriculares Anuales
                </h2>
                <p className="text-xs text-slate-500">
                  Planificaciones registradas para el ciclo lectivo en el IPEM 349.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleStartPlanning(selectedEspacio)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Nueva Planificación Anual
              </button>
            </div>

            {myPlanificaciones.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500 space-y-3">
                <p>No tienes planificaciones creadas todavía.</p>
                <button
                  type="button"
                  onClick={() => handleStartPlanning(selectedEspacio)}
                  className="px-4 py-2 bg-emerald-700 text-white rounded-xl font-bold"
                >
                  Comenzar con el Asistente Paso a Paso
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myPlanificaciones.map((plan) => (
                  <div
                    key={plan.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {plan.espacio_anio}° Año "{plan.division || 'A'}"
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          plan.estado === 'aprobada'
                            ? 'bg-emerald-100 text-emerald-800'
                            : plan.estado === 'requiere_ajustes'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}>
                          {plan.estado}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {plan.espacio_nombre}
                      </h3>

                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                        {plan.diagnostico || 'Sin diagnóstico cargado.'}
                      </p>

                      {plan.devolucion_directivo && (
                        <div className="mt-3 p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900 italic">
                          "{plan.devolucion_directivo}"
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setPrintPlanModal(plan)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        Imprimir / PDF
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartPlanning({ id: plan.espacio_id, nombre: plan.espacio_nombre, anio: plan.espacio_anio }, plan)}
                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Abrir Asistente
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECUENCIAS DIDÁCTICAS Y ARTICULACIÓN */}
        {user && currentView === 'secuencias' && (
          <SecuenciasView selectedEspacio={selectedEspacio} />
        )}

        {/* AGENDA E HITOS DE CAMPO / CRONOGRAMA */}
        {user && (currentView === 'agenda' || currentView === 'cronograma') && (
          <AgendaView selectedEspacio={selectedEspacio} />
        )}

        {/* REPOSITORIO NORMATIVO */}
        {user && currentView === 'normativas' && (
          <NormativasView selectedEspacio={selectedEspacio} />
        )}
      </main>

      {/* Modal de Impresión */}
      {printPlanModal && (
        <PrintablePlanning
          plan={printPlanModal}
          espacio={{ nombre: printPlanModal.espacio_nombre, anio: printPlanModal.espacio_anio }}
          onClose={() => setPrintPlanModal(null)}
        />
      )}

      {/* Pie de Página Institucional */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 px-4 sm:px-6 border-t border-slate-800 mt-12 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-white">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <div className="text-white font-bold">IPEM N° 349 "Giovanni Bosco"</div>
              <div className="text-[11px] text-slate-400">Colonia Caroya, Provincia de Córdoba • Orientación: Agro y Ambiente</div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 space-y-0.5">
            <div>Ministerio de Educación de la Provincia de Córdoba • DGESec</div>
            <div>Sistema Web de Gestión Curricular y Planificación Pedagógica</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
