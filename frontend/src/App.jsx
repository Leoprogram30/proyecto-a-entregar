import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuthView from './components/AuthView';
import CurriculumConsole from './components/CurriculumConsole';
import PlanningWizard from './components/PlanningWizard';
import PlanificacionesList from './components/PlanificacionesList';
import DirectivoPanel from './components/DirectivoPanel';
import AdminPanel from './components/AdminPanel';
import SecuenciasView from './components/SecuenciasView';
import ArticulacionColaborativa from './components/ArticulacionColaborativa';
import PrecursoraView from './components/PrecursoraView';
import InicioView from './components/InicioView';
import AgendaView from './components/AgendaView';
import NormativasView from './components/NormativasView';
import ErrorBoundary from './components/ErrorBoundary';
import { Loading } from './components/ui';
import { PLANIFICAN, canAccess, homeView } from './config/views';
import { Sprout } from 'lucide-react';

// Se monta con key={user.id}: al cambiar de usuario arranca en su vista inicial
function Shell({ user }) {
  const [requestedView, setCurrentView] = useState(() => homeView(user.rol));
  const [selectedEspacio, setSelectedEspacio] = useState(null);
  const [activePlan, setActivePlan] = useState(null);

  // Si el rol no tiene acceso a la vista pedida, se muestra su vista inicial
  const currentView = canAccess(user.rol, requestedView) ? requestedView : homeView(user.rol);
  const canPlan = PLANIFICAN.includes(user.rol);

  const navigate = (view) => {
    setCurrentView(view);
    window.scrollTo?.({ top: 0 });
  };

  const startPlanning = (espacio = null, plan = null) => {
    setSelectedEspacio(espacio);
    setActivePlan(plan);
    navigate('planning-wizard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar currentView={currentView} onNavigate={navigate} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 print:hidden">
        <ErrorBoundary resetKey={currentView}>
          {currentView === 'inicio' && <InicioView onNavigate={navigate} />}

          {currentView === 'admin-users' && <AdminPanel />}

          {currentView === 'directivo-supervision' && <DirectivoPanel />}

          {currentView === 'curriculum' && (
            <CurriculumConsole
              onSelectEspacio={(esp) => {
                setSelectedEspacio(esp);
                navigate('secuencias');
              }}
              onStartPlanning={canPlan ? (esp) => startPlanning(esp) : undefined}
            />
          )}

          {currentView === 'planning-wizard' && (
            <PlanningWizard
              key={activePlan?.id ?? `nuevo-${selectedEspacio?.id ?? ''}`}
              espacio={selectedEspacio}
              initialPlan={activePlan}
              onSaved={() => navigate('planificaciones')}
              onCancel={() => navigate('planificaciones')}
            />
          )}

          {currentView === 'planificaciones' && (
            <PlanificacionesList onNew={() => startPlanning(null, null)} onOpen={(plan) => startPlanning(null, plan)} />
          )}

          {currentView === 'secuencias' && <SecuenciasView selectedEspacio={selectedEspacio} />}

          {currentView === 'articulacion' && <ArticulacionColaborativa />}

          {currentView === 'precursora' && <PrecursoraView />}

          {currentView === 'agenda' && <AgendaView vista="agenda" selectedEspacio={selectedEspacio} />}
          {currentView === 'cronograma' && <AgendaView vista="cronograma" />}

          {currentView === 'normativas' && <NormativasView selectedEspacio={selectedEspacio} />}
        </ErrorBoundary>
      </main>

      <footer className="bg-slate-900 text-slate-400 text-xs py-8 px-4 sm:px-6 border-t border-slate-800 mt-12 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-white">
              <Sprout className="w-5 h-5" aria-hidden="true" />
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

function MainApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loading message='Iniciando Sistema IPEM 349 "Giovanni Bosco"...' />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 sm:px-6">
        <main className="max-w-7xl mx-auto">
          <AuthView />
        </main>
      </div>
    );
  }

  return <Shell key={user.id} user={user} />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}
