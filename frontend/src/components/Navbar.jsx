import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Modal, useToast } from './ui';
import { VIEWS_BY_ROLE, ROLE_LABELS, homeView } from '../config/views';
import {
  House,
  Sprout,
  Shield,
  Eye,
  LogOut,
  Calendar,
  FileText,
  Layers,
  KeyRound,
  UserRound,
  ClipboardCheck,
  ListChecks,
  Users,
  Flag
} from 'lucide-react';

const MENU = {
  inicio: { label: 'Inicio', icon: House },
  'admin-users': { label: 'Administración', icon: Shield },
  'directivo-supervision': { label: 'Supervisión', icon: Eye },
  curriculum: { label: 'Malla Curricular', icon: Layers },
  planificaciones: { label: 'Mis Planificaciones', icon: FileText },
  secuencias: { label: 'Secuencias', icon: Sprout },
  articulacion: { label: 'Articulación', icon: Users },
  precursora: { label: 'Precursora', icon: Flag },
  agenda: { label: 'Agenda', icon: Calendar },
  normativas: { label: 'Repositorio Normativo', icon: ClipboardCheck },
  cronograma: { label: 'Cronograma', icon: ListChecks }
};

const ROLE_BADGE = {
  admin: 'bg-amber-100 text-amber-800 border-amber-300',
  director: 'bg-sky-100 text-sky-800 border-sky-300',
  coordinador: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  docente: 'bg-emerald-100 text-emerald-800 border-emerald-300'
};

const inputCls = 'w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none';

function ProfileModal({ open, onClose }) {
  const toast = useToast();
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ nombre: user?.nombre || '', apellido: user?.apellido || '', cargo_descripcion: user?.cargo_descripcion || '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.nombre.trim() || !form.apellido.trim()) return setError('Nombre y apellido son obligatorios.');
    setBusy(true);
    try {
      await updateProfile({ nombre: form.nombre.trim(), apellido: form.apellido.trim(), cargo_descripcion: form.cargo_descripcion.trim() });
      toast.success('Perfil actualizado.');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Modal open={open} onClose={onClose} title="Mi perfil" size="max-w-md">
      <form onSubmit={submit} className="space-y-3">
        {error && (
          <div role="alert" className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
          <div>
            <div className="font-semibold text-slate-700">Correo</div>
            <div className="break-all">{user?.email}</div>
          </div>
          <div>
            <div className="font-semibold text-slate-700">DNI / Rol</div>
            <div>{user?.dni} · {ROLE_LABELS[user?.rol] || user?.rol}</div>
          </div>
        </div>
        <div>
          <label htmlFor="perfil-nombre" className="block text-xs font-semibold text-slate-700 mb-1">Nombre</label>
          <input id="perfil-nombre" type="text" required maxLength={100} value={form.nombre} onChange={set('nombre')} className={inputCls} />
        </div>
        <div>
          <label htmlFor="perfil-apellido" className="block text-xs font-semibold text-slate-700 mb-1">Apellido</label>
          <input id="perfil-apellido" type="text" required maxLength={100} value={form.apellido} onChange={set('apellido')} className={inputCls} />
        </div>
        <div>
          <label htmlFor="perfil-cargo" className="block text-xs font-semibold text-slate-700 mb-1">Cargo o descripción</label>
          <input id="perfil-cargo" type="text" maxLength={150} value={form.cargo_descripcion} onChange={set('cargo_descripcion')} className={inputCls} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700">
            Cancelar
          </button>
          <button type="submit" disabled={busy} className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-60">
            {busy ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ChangePasswordModal({ open, onClose }) {
  const toast = useToast();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repetir, setRepetir] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const close = () => {
    setActual('');
    setNueva('');
    setRepetir('');
    setError('');
    onClose();
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (nueva.length < 6) return setError('La nueva contraseña debe tener al menos 6 caracteres.');
    if (nueva !== repetir) return setError('Las contraseñas nuevas no coinciden.');
    setBusy(true);
    try {
      await api.changePassword(actual, nueva);
      toast.success('Contraseña actualizada correctamente.');
      close();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Cambiar contraseña" size="max-w-md">
      <form onSubmit={submit} className="space-y-3">
        {error && (
          <div role="alert" className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="pw-actual" className="block text-xs font-semibold text-slate-700 mb-1">Contraseña actual</label>
          <input id="pw-actual" type="password" required autoComplete="current-password" value={actual} onChange={(e) => setActual(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="pw-nueva" className="block text-xs font-semibold text-slate-700 mb-1">Nueva contraseña (mínimo 6 caracteres)</label>
          <input id="pw-nueva" type="password" required minLength={6} autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="pw-repetir" className="block text-xs font-semibold text-slate-700 mb-1">Repetir nueva contraseña</label>
          <input id="pw-repetir" type="password" required autoComplete="new-password" value={repetir} onChange={(e) => setRepetir(e.target.value)} className={inputCls} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={close} className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700">
            Cancelar
          </button>
          <button type="submit" disabled={busy} className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-60">
            {busy ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function Navbar({ currentView, onNavigate }) {
  const { user, logout } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const views = user ? VIEWS_BY_ROLE[user.rol] || [] : [];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs print:hidden">
      <div className="bg-emerald-900 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex flex-wrap items-center gap-x-2">
            <span className="font-semibold tracking-wide">MINISTERIO DE EDUCACIÓN DE CÓRDOBA</span>
            <span className="hidden sm:inline text-emerald-300">•</span>
            <span className="hidden sm:inline text-emerald-200">D.G.E.Sec. - Región II</span>
            <span className="hidden md:inline text-emerald-300">•</span>
            <span className="hidden md:inline text-emerald-100 font-medium">Colonia Caroya</span>
          </div>
          <span className="inline-flex items-center gap-1 bg-emerald-800/80 px-2 py-0.5 rounded text-[11px] text-amber-300 font-medium border border-emerald-700">
            <Sprout className="w-3 h-3 text-emerald-400" aria-hidden="true" />
            Orientación: Agro y Ambiente
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => user && onNavigate(homeView(user.rol))}
          className="flex items-center gap-3 group text-left min-w-0"
          aria-label="Ir al inicio"
        >
          <div className="w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br from-emerald-700 to-sky-700 p-0.5 shadow-md flex items-center justify-center transition group-hover:scale-105">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-8 h-8" aria-hidden="true">
                <path d="M32 4 L56 12 V34 C56 48 32 60 32 60 C32 60 8 48 8 34 V12 Z" fill="#15803d" />
                <path d="M32 18 C38 22 42 28 42 34 C42 40 38 42 32 44 C26 42 22 40 22 34 C22 28 26 22 32 18 Z" fill="#ffffff" />
                <path d="M32 20 V44" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
                <circle cx="32" cy="14" r="3" fill="#f59e0b" />
              </svg>
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight truncate">
              IPEM N° 349 "Giovanni Bosco"
            </div>
            <p className="hidden sm:block text-xs text-slate-500 font-medium">
              Sistema Institucional de Gestión Curricular y Planificación Agroambiental
            </p>
          </div>
        </button>

        {user && (
          <div className="flex items-center gap-2 pl-2">
            <div className="hidden sm:block text-right">
              <div className="text-xs font-bold text-slate-800">
                {user.nombre} {user.apellido}
              </div>
              <span className={`inline-block text-[10px] font-semibold px-1.5 rounded border ${ROLE_BADGE[user.rol] || ROLE_BADGE.docente}`}>
                {ROLE_LABELS[user.rol] || user.rol}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowProfile(true)}
              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
              title="Mi perfil"
              aria-label="Mi perfil"
            >
              <UserRound className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setShowPassword(true)}
              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
              title="Cambiar contraseña"
              aria-label="Cambiar contraseña"
            >
              <KeyRound className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={logout}
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {user && (
        <nav aria-label="Secciones" className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-1">
            {views.map((view) => {
              const item = MENU[view];
              if (!item) return null;
              const Icon = item.icon;
              const active = currentView === view || (view === 'planificaciones' && currentView === 'planning-wizard');
              return (
                <button
                  key={view}
                  type="button"
                  onClick={() => onNavigate(view)}
                  aria-current={active ? 'page' : undefined}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition flex items-center gap-1.5 ${
                    active
                      ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {showProfile && <ProfileModal open onClose={() => setShowProfile(false)} />}
      <ChangePasswordModal open={showPassword} onClose={() => setShowPassword(false)} />
    </header>
  );
}
