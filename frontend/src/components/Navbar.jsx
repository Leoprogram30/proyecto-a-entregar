import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Sprout,
  Shield,
  Eye,
  LogOut,
  UserCheck,
  Calendar,
  FileText,
  Layers,
  Sparkles,
  ChevronDown
} from 'lucide-react';

export default function Navbar({ currentView, onNavigate }) {
  const { user, logout, switchDemoRole } = useAuth();
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const getRoleBadge = (rol) => {
    switch (rol) {
      case 'admin':
        return { label: 'Administrador', bg: 'bg-amber-100 text-amber-800 border-amber-300', icon: Shield };
      case 'director':
        return { label: 'Equipo Directivo', bg: 'bg-sky-100 text-sky-800 border-sky-300', icon: Eye };
      case 'coordinador':
        return { label: 'Coordinador de Área', bg: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: Eye };
      case 'docente':
      default:
        return { label: 'Docente Titular', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: Sprout };
    }
  };

  const badge = user ? getRoleBadge(user.rol) : null;
  const RoleIcon = badge ? badge.icon : null;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      {/* Barra superior de identidad institucional */}
      <div className="bg-emerald-900 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-wide">MINISTERIO DE EDUCACIÓN DE CÓRDOBA</span>
            <span className="text-emerald-300">•</span>
            <span className="text-emerald-200">D.G.E.Sec. - Región II</span>
            <span className="text-emerald-300">•</span>
            <span className="text-emerald-100 font-medium">Colonia Caroya</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-emerald-800/80 px-2 py-0.5 rounded text-[11px] text-amber-300 font-medium border border-emerald-700">
              <Sprout className="w-3 h-3 text-emerald-400" />
              Orientación: Agro y Ambiente
            </span>
          </div>
        </div>
      </div>

      {/* Cabecera Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Logotipo y Título del IPEM 349 */}
        <div 
          onClick={() => onNavigate('home')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-700 to-sky-700 p-0.5 shadow-md flex items-center justify-center transform transition group-hover:scale-105">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-9 h-9">
                <path d="M32 4 L56 12 V34 C56 48 32 60 32 60 C32 60 8 48 8 34 V12 Z" fill="#15803d" />
                <path d="M32 18 C38 22 42 28 42 34 C42 40 38 42 32 44 C26 42 22 40 22 34 C22 28 26 22 32 18 Z" fill="#ffffff" />
                <path d="M32 20 V44" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
                <circle cx="32" cy="14" r="3" fill="#f59e0b" />
              </svg>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">
                IPEM N° 349 "Giovanni Bosco"
              </h1>
              <span className="hidden sm:inline-block text-[11px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                Colonia Caroya
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Sistema Institucional de Gestión Curricular y Planificación Agroambiental
            </p>
          </div>
        </div>

        {/* Acciones y Perfil de Usuario */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Selector Rápido de Roles para Demostración */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg px-2.5 py-1.5 transition"
                  title="Cambiar rol para probar funcionalidades"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden md:inline">Simular Rol:</span>
                  <span className="font-bold text-emerald-800 capitalize">{user.rol}</span>
                  <ChevronDown className="w-3 h-3 text-slate-500" />
                </button>

                {showRoleSwitcher && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      Cambiar Perfil de Prueba
                    </div>
                    <button
                      onClick={() => { switchDemoRole('admin'); setShowRoleSwitcher(false); }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-900 flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4 text-amber-600" />
                      <div>
                        <div className="font-semibold">Administrador</div>
                        <div className="text-[10px] text-slate-400">Aprobar usuarios, normativas</div>
                      </div>
                    </button>
                    <button
                      onClick={() => { switchDemoRole('director'); setShowRoleSwitcher(false); }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-sky-50 hover:text-sky-900 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4 text-sky-600" />
                      <div>
                        <div className="font-semibold">Equipo Directivo</div>
                        <div className="text-[10px] text-slate-400">Supervisar planificaciones y devoluciones</div>
                      </div>
                    </button>
                    <button
                      onClick={() => { switchDemoRole('docente'); setShowRoleSwitcher(false); }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center gap-2"
                    >
                      <Sprout className="w-4 h-4 text-emerald-600" />
                      <div>
                        <div className="font-semibold">Docente Titular</div>
                        <div className="text-[10px] text-slate-400">Planificación, secuencias y huerta</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Ficha de Usuario Activo */}
              <div className="flex items-center gap-2 pl-2 sm:border-l border-slate-200">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-slate-800">
                    {user.nombre} {user.apellido}
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.2 rounded border ${badge.bg}`}>
                      {badge.label}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('auth')}
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition"
            >
              <UserCheck className="w-4 h-4" />
              Ingresar al Portal
            </button>
          )}
        </div>
      </div>

      {/* Navegación por Módulos Principales según el Rol */}
      {user && (
        <nav className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
            {/* Si es Admin */}
            {user.rol === 'admin' && (
              <>
                <button
                  onClick={() => onNavigate('admin-users')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition flex items-center gap-1.5 ${
                    currentView === 'admin-users'
                      ? 'bg-amber-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Aprobación de Usuarios
                </button>
                <button
                  onClick={() => onNavigate('normativas')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition flex items-center gap-1.5 ${
                    currentView === 'normativas'
                      ? 'bg-amber-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Normativas & PDFs Curriculares
                </button>
                <button
                  onClick={() => onNavigate('cronograma')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition flex items-center gap-1.5 ${
                    currentView === 'cronograma'
                      ? 'bg-amber-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Cronograma Escolar
                </button>
                <button
                  onClick={() => onNavigate('curriculum')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition flex items-center gap-1.5 ${
                    currentView === 'curriculum'
                      ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Consola Malla de Córdoba
                </button>
              </>
            )}

            {/* Si es Directivo / Coordinador */}
            {(user.rol === 'director' || user.rol === 'coordinador') && (
              <>
                <button
                  onClick={() => onNavigate('directivo-supervision')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition flex items-center gap-1.5 ${
                    currentView === 'directivo-supervision'
                      ? 'bg-sky-700 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Supervisión de Planificaciones
                </button>
                <button
                  onClick={() => onNavigate('curriculum')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition flex items-center gap-1.5 ${
                    currentView === 'curriculum'
                      ? 'bg-sky-700 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Malla Curricular Córdoba
                </button>
                <button
                  onClick={() => onNavigate('normativas')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition flex items-center gap-1.5 ${
                    currentView === 'normativas'
                      ? 'bg-sky-700 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Repositorio Normativo
                </button>
                <button
                  onClick={() => onNavigate('cronograma')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition flex items-center gap-1.5 ${
                    currentView === 'cronograma'
                      ? 'bg-sky-700 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Cronograma Oficial
                </button>
              </>
            )}

            {/* Si es Docente */}
            {user.rol === 'docente' && (
              <>
                <button
                  onClick={() => onNavigate('curriculum')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition flex items-center gap-1.5 ${
                    currentView === 'curriculum' || currentView === 'home'
                      ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  1. Malla Curricular Córdoba
                </button>
                <button
                  onClick={() => onNavigate('planificaciones')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition flex items-center gap-1.5 ${
                    currentView === 'planificaciones' || currentView === 'planning-wizard'
                      ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  2. Planificación Anual (Paso a Paso)
                </button>
                <button
                  onClick={() => onNavigate('secuencias')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition flex items-center gap-1.5 ${
                    currentView === 'secuencias'
                      ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Sprout className="w-3.5 h-3.5" />
                  3. Secuencias & Articulación
                </button>
                <button
                  onClick={() => onNavigate('agenda')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition flex items-center gap-1.5 ${
                    currentView === 'agenda'
                      ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  4. Agenda e Hitos de Campo
                </button>
                <button
                  onClick={() => onNavigate('normativas')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition flex items-center gap-1.5 ${
                    currentView === 'normativas'
                      ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  5. Repositorio Normativo
                </button>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
