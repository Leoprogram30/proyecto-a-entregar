import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Sprout,
  Eye,
  Lock,
  Mail,
  User,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function AuthView({ onAuthSuccess }) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [loginEmail, setLoginEmail] = useState('docente.agro@ipem349.edu.ar');
  const [loginPassword, setLoginPassword] = useState('docente123');

  const [regNombre, setRegNombre] = useState('');
  const [regApellido, setRegApellido] = useState('');
  const [regDni, setRegDni] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRol, setRegRol] = useState('docente');
  const [regCargo, setRegCargo] = useState('Docente de Nivel Secundario');

  const handleQuickFill = (email, pass) => {
    setLoginEmail(email);
    setLoginPassword(pass);
    setError('');
  };

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      if (onAuthSuccess) onAuthSuccess();
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await register({
        nombre: regNombre,
        apellido: regApellido,
        dni: regDni,
        email: regEmail,
        password: regPassword,
        rol: regRol,
        cargo_descripcion: regCargo
      });
      setSuccessMsg(res.message || 'Solicitud enviada correctamente.');
      setTab('login');
    } catch (err) {
      setError(err.message || 'Error en la solicitud de registro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Cabecera del Portal */}
        <div className="bg-gradient-to-br from-emerald-800 to-sky-800 p-6 text-white text-center relative">
          <div className="w-16 h-16 mx-auto bg-white rounded-2xl p-1 shadow-md mb-3 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-12 h-12">
              <path d="M32 4 L56 12 V34 C56 48 32 60 32 60 C32 60 8 48 8 34 V12 Z" fill="#15803d" />
              <path d="M32 18 C38 22 42 28 42 34 C42 40 38 42 32 44 C26 42 22 40 22 34 C22 28 26 22 32 18 Z" fill="#ffffff" />
              <circle cx="32" cy="14" r="3" fill="#f59e0b" />
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight">IPEM N° 349 "Giovanni Bosco"</h2>
          <p className="text-xs text-emerald-100 font-medium mt-1">Colonia Caroya - Orientación Agro y Ambiente</p>
          <div className="mt-3 inline-flex items-center gap-1.5 bg-emerald-900/60 px-3 py-1 rounded-full text-xs text-amber-300 border border-emerald-700/60 font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Portal Institucional Docente
          </div>
        </div>

        {/* Selector de Pestañas: Login vs Registro */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition ${
              tab === 'login'
                ? 'border-emerald-700 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition ${
              tab === 'register'
                ? 'border-emerald-700 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Solicitud de Registro
          </button>
        </div>

        <div className="p-6">
          {/* Mensajes de Alerta */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>{successMsg}</div>
            </div>
          )}

          {/* TAB 1: INICIAR SESIÓN */}
          {tab === 'login' && (
            <div>
              {/* Acceso Rápido para Demostración */}
              <div className="mb-5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Accesos de Prueba (1 Clic)</span>
                  <span className="text-emerald-700 text-[10px]">Autocompletar</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickFill('admin@ipem349.edu.ar', 'admin123')}
                    className="p-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-center text-[10px] font-semibold transition"
                  >
                    <Shield className="w-3.5 h-3.5 mx-auto text-amber-600 mb-0.5" />
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('direccion@ipem349.edu.ar', 'director123')}
                    className="p-1.5 rounded-lg border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-900 text-center text-[10px] font-semibold transition"
                  >
                    <Eye className="w-3.5 h-3.5 mx-auto text-sky-600 mb-0.5" />
                    Directivo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('docente.agro@ipem349.edu.ar', 'docente123')}
                    className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-center text-[10px] font-semibold transition"
                  >
                    <Sprout className="w-3.5 h-3.5 mx-auto text-emerald-600 mb-0.5" />
                    Docente
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmitLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Correo Electrónico Institucional
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="usuario@ipem349.edu.ar"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Validando credenciales...' : 'Ingresar al Sistema'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: SOLICITUD DE REGISTRO */}
          {tab === 'register' && (
            <div>
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Aviso de Seguridad:</strong> Todas las solicitudes quedan en estado <strong>Pendiente de Aprobación</strong>. El Administrador verificará su DNI y rol antes de habilitar el acceso.
                </div>
              </div>

              <form onSubmit={handleSubmitRegister} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nombre</label>
                    <input
                      type="text"
                      required
                      value={regNombre}
                      onChange={(e) => setRegNombre(e.target.value)}
                      placeholder="Ej. Lucas"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Apellido</label>
                    <input
                      type="text"
                      required
                      value={regApellido}
                      onChange={(e) => setRegApellido(e.target.value)}
                      placeholder="Ej. Copetti"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">DNI (Sin puntos)</label>
                    <div className="relative">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                      <input
                        type="text"
                        required
                        value={regDni}
                        onChange={(e) => setRegDni(e.target.value)}
                        placeholder="35123456"
                        className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Rol Solicitado</label>
                    <select
                      value={regRol}
                      onChange={(e) => setRegRol(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
                    >
                      <option value="docente">Docente</option>
                      <option value="coordinador">Coordinador de Área</option>
                      <option value="director">Equipo Directivo</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email Institucional o Personal</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="nombre.apellido@ipem349.edu.ar"
                      className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Cargo / Especialidad Docente</label>
                  <input
                    type="text"
                    value={regCargo}
                    onChange={(e) => setRegCargo(e.target.value)}
                    placeholder="Ej. Docente de Producción Vegetal y Huerta"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Contraseña</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Enviando solicitud...' : 'Enviar Solicitud de Registro'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

