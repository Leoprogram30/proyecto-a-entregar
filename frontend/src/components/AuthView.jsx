import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Sprout,
  Eye,
  Lock,
  Mail,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Users
} from 'lucide-react';

const inputCls =
  'w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition';
const plainInputCls =
  'w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none';

// Accesos de demostración: hacen un login real contra el backend.
// Con VITE_MOSTRAR_DEMO=false al compilar no aparecen ni quedan en el código publicado.
const DEMO_ACCESS = import.meta.env.VITE_MOSTRAR_DEMO === 'false' ? [] : [
  { label: 'Admin', email: 'admin@ipem349.edu.ar', pass: 'admin123', icon: Shield, cls: 'border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900', iconCls: 'text-amber-600' },
  { label: 'Dirección', email: 'direccion@ipem349.edu.ar', pass: 'director123', icon: Eye, cls: 'border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-900', iconCls: 'text-sky-600' },
  { label: 'Coord. Agro', email: 'coordinacion.agro@ipem349.edu.ar', pass: 'director123', icon: Users, cls: 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900', iconCls: 'text-indigo-600' },
  { label: 'Docente Agro', email: 'docente.agro@ipem349.edu.ar', pass: 'docente123', icon: Sprout, cls: 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900', iconCls: 'text-emerald-600' },
  { label: 'Docente Química', email: 'docente.quimica@ipem349.edu.ar', pass: 'docente123', icon: Sprout, cls: 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900', iconCls: 'text-emerald-600' },
  { label: 'Docente Matemática', email: 'docente.matematica@ipem349.edu.ar', pass: 'docente123', icon: Sprout, cls: 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900', iconCls: 'text-emerald-600' },
  { label: 'Docente Ed. Física', email: 'docente.edfisica@ipem349.edu.ar', pass: 'docente123', icon: Sprout, cls: 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900', iconCls: 'text-emerald-600' },
  { label: 'Docente Biología', email: 'docente.biologia@ipem349.edu.ar', pass: 'docente123', icon: Sprout, cls: 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900', iconCls: 'text-emerald-600' }
];

const EMPTY_REG = { nombre: '', apellido: '', dni: '', email: '', password: '', cargo_descripcion: '' };

export default function AuthView({ onAuthSuccess }) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [reg, setReg] = useState(EMPTY_REG);
  const setRegField = (field) => (e) => setReg((r) => ({ ...r, [field]: e.target.value }));

  const doLogin = async (email, password) => {
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const user = await login(email, password);
      onAuthSuccess?.(user);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión.');
      setLoading(false);
    }
  };

  const handleSubmitLogin = (e) => {
    e.preventDefault();
    doLogin(loginEmail.trim(), loginPassword);
  };

  const handleSubmitRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (reg.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await register({
        nombre: reg.nombre.trim(),
        apellido: reg.apellido.trim(),
        dni: reg.dni.trim(),
        email: reg.email.trim(),
        password: reg.password,
        cargo_descripcion: reg.cargo_descripcion.trim()
      });
      setSuccessMsg('Solicitud enviada. Podrá ingresar cuando la Administración la apruebe.');
      setReg(EMPTY_REG);
      setTab('login');
    } catch (err) {
      setError(err.message || 'Error en la solicitud de registro.');
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (t) => {
    setTab(t);
    setError('');
    setSuccessMsg('');
  };

  const tabCls = (t) =>
    `flex-1 py-3 text-xs font-bold text-center border-b-2 transition ${
      tab === t ? 'border-emerald-700 text-emerald-800 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
    }`;

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-br from-emerald-800 to-sky-800 p-6 text-white text-center relative">
          <div className="w-16 h-16 mx-auto bg-white rounded-2xl p-1 shadow-md mb-3 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-12 h-12" aria-hidden="true">
              <path d="M32 4 L56 12 V34 C56 48 32 60 32 60 C32 60 8 48 8 34 V12 Z" fill="#15803d" />
              <path d="M32 18 C38 22 42 28 42 34 C42 40 38 42 32 44 C26 42 22 40 22 34 C22 28 26 22 32 18 Z" fill="#ffffff" />
              <circle cx="32" cy="14" r="3" fill="#f59e0b" />
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight">IPEM N° 349 "Giovanni Bosco"</h2>
          <p className="text-xs text-emerald-100 font-medium mt-1">Colonia Caroya - Orientación Agro y Ambiente</p>
          <div className="mt-3 inline-flex items-center gap-1.5 bg-emerald-900/60 px-3 py-1 rounded-full text-xs text-amber-300 border border-emerald-700/60 font-semibold">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> Portal Institucional Docente
          </div>
        </div>

        <div className="flex border-b border-slate-200 bg-slate-50" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'login'} onClick={() => switchTab('login')} className={tabCls('login')}>
            Iniciar Sesión
          </button>
          <button type="button" role="tab" aria-selected={tab === 'register'} onClick={() => switchTab('register')} className={tabCls('register')}>
            Solicitud de Registro
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {error && (
            <div role="alert" className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>{error}</div>
            </div>
          )}
          {successMsg && (
            <div role="status" className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>{successMsg}</div>
            </div>
          )}

          {tab === 'login' && (
            <div>
              {DEMO_ACCESS.length > 0 && <div className="mb-5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Accesos de demostración (ingresa con 1 clic)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {DEMO_ACCESS.map(({ label, email, pass, icon: Icon, cls, iconCls }) => (
                    <button
                      key={email}
                      type="button"
                      disabled={loading}
                      onClick={() => doLogin(email, pass)}
                      className={`p-1.5 rounded-lg border text-center text-[10px] font-semibold transition disabled:opacity-50 ${cls}`}
                    >
                      <Icon className={`w-3.5 h-3.5 mx-auto mb-0.5 ${iconCls}`} aria-hidden="true" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>}

              <form onSubmit={handleSubmitLogin} className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 mb-1">
                    Correo Electrónico Institucional
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" aria-hidden="true" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      autoComplete="username"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="usuario@ipem349.edu.ar"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-pass" className="block text-xs font-semibold text-slate-700 mb-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" aria-hidden="true" />
                    <input
                      id="login-pass"
                      type="password"
                      required
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className={inputCls}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Validando credenciales...' : 'Ingresar al Sistema'}
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </form>
            </div>
          )}

          {tab === 'register' && (
            <div>
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <strong>Aviso:</strong> las solicitudes quedan en estado <strong>Pendiente de Aprobación</strong>. La Administración verificará su DNI y le asignará el rol correspondiente.
                </div>
              </div>

              <form onSubmit={handleSubmitRegister} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="reg-nombre" className="block text-[11px] font-semibold text-slate-700 mb-1">Nombre</label>
                    <input id="reg-nombre" type="text" required value={reg.nombre} onChange={setRegField('nombre')} className={plainInputCls} />
                  </div>
                  <div>
                    <label htmlFor="reg-apellido" className="block text-[11px] font-semibold text-slate-700 mb-1">Apellido</label>
                    <input id="reg-apellido" type="text" required value={reg.apellido} onChange={setRegField('apellido')} className={plainInputCls} />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-dni" className="block text-[11px] font-semibold text-slate-700 mb-1">DNI (sin puntos)</label>
                  <div className="relative">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" aria-hidden="true" />
                    <input
                      id="reg-dni"
                      type="text"
                      inputMode="numeric"
                      required
                      value={reg.dni}
                      onChange={setRegField('dni')}
                      placeholder="35123456"
                      className="w-full pl-8 pr-2 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-email" className="block text-[11px] font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={reg.email}
                    onChange={setRegField('email')}
                    placeholder="nombre.apellido@ipem349.edu.ar"
                    className={plainInputCls}
                  />
                </div>

                <div>
                  <label htmlFor="reg-cargo" className="block text-[11px] font-semibold text-slate-700 mb-1">Cargo / Especialidad</label>
                  <input
                    id="reg-cargo"
                    type="text"
                    value={reg.cargo_descripcion}
                    onChange={setRegField('cargo_descripcion')}
                    placeholder="Ej. Docente de Producción Vegetal"
                    className={plainInputCls}
                  />
                </div>

                <div>
                  <label htmlFor="reg-pass" className="block text-[11px] font-semibold text-slate-700 mb-1">Contraseña</label>
                  <input
                    id="reg-pass"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={reg.password}
                    onChange={setRegField('password')}
                    placeholder="Mínimo 6 caracteres"
                    className={plainInputCls}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50"
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
