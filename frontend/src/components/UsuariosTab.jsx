/* oxlint-disable react/only-export-components */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast, ConfirmDialog, EstadoBadge, Loading, EmptyState, ErrorState, Modal } from './ui';
import { UserPlus, Pencil, Trash2, KeyRound, UserCheck, UserX, Search } from 'lucide-react';

export const ROLES = [
  { value: 'docente', label: 'Docente' },
  { value: 'coordinador', label: 'Coordinador de área' },
  { value: 'director', label: 'Equipo directivo' },
  { value: 'admin', label: 'Administrador' },
];

export const ESTADOS_USUARIO = [
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'rechazado', label: 'Rechazado' },
];

const FORM_VACIO = {
  nombre: '',
  apellido: '',
  dni: '',
  email: '',
  password: '',
  rol: 'docente',
  cargo_descripcion: 'Docente de Nivel Secundario',
  estado: 'aprobado',
};

const etiqueta = (lista, valor) => lista.find((o) => o.value === valor)?.label ?? valor ?? '—';
const normalizar = (t) => String(t ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const INPUT = 'w-full p-2 text-xs border border-slate-300 rounded-lg bg-white';

/** Carga una lista desde la API con estados de carga/error y recarga manual. */
export function useLista(loader) {
  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  });
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let vigente = true;
    loaderRef.current()
      .then((data) => vigente && setState({ data, error: null, loading: false }))
      .catch((err) => vigente && setState({ data: null, error: err.message, loading: false }));
    return () => {
      vigente = false;
    };
  }, [version]);
  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true }));
    setVersion((v) => v + 1);
  }, []);
  return { ...state, reload };
}

export function Campo({ id, label, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-[11px] font-semibold text-slate-700 mb-1">{label}</label>
      {children}
      {error && <p id={`${id}-error`} role="alert" className="text-[11px] text-red-700 mt-1">{error}</p>}
    </div>
  );
}

function validar(form, esAlta) {
  const e = {};
  if (!form.nombre.trim()) e.nombre = 'Ingresá el nombre.';
  if (!form.apellido.trim()) e.apellido = 'Ingresá el apellido.';
  if (!/^\d{7,8}$/.test(form.dni.replace(/\D/g, ''))) e.dni = 'El DNI debe tener 7 u 8 dígitos.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Ingresá un correo electrónico válido.';
  if (esAlta && form.password.length < 6) e.password = 'La contraseña debe tener al menos 6 caracteres.';
  return e;
}

function UsuarioForm({ usuario, esYo, onClose, onSaved }) {
  const toast = useToast();
  const esAlta = !usuario;
  const [form, setForm] = useState(() =>
    usuario
      ? {
          nombre: usuario.nombre ?? '',
          apellido: usuario.apellido ?? '',
          dni: usuario.dni ?? '',
          email: usuario.email ?? '',
          password: '',
          rol: usuario.rol,
          cargo_descripcion: usuario.cargo_descripcion ?? '',
          estado: usuario.estado,
        }
      : FORM_VACIO
  );
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState('');
  const [guardando, setGuardando] = useState(false);
  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const enviar = async (ev) => {
    ev.preventDefault();
    const errs = validar(form, esAlta);
    setErrores(errs);
    setErrorServidor('');
    if (Object.keys(errs).length > 0) return;
    setGuardando(true);
    const payload = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      dni: form.dni.replace(/\D/g, ''),
      email: form.email.trim(),
      rol: form.rol,
      estado: form.estado,
      cargo_descripcion: form.cargo_descripcion.trim() || undefined,
    };
    try {
      if (esAlta) {
        await api.createUser({ ...payload, password: form.password });
        toast.success(`Usuario ${payload.nombre} ${payload.apellido} creado.`);
      } else {
        await api.updateUser(usuario.id, payload);
        toast.success('Usuario actualizado.');
      }
      onSaved();
    } catch (err) {
      setErrorServidor(err.message);
      if (err.details && typeof err.details === 'object') {
        const det = {};
        ['nombre', 'apellido', 'dni', 'email', 'password'].forEach((k) => {
          if (err.details[k] && err.details[k] !== 'duplicado') det[k] = String(err.details[k]);
        });
        setErrores(det);
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={enviar} noValidate className="space-y-3" aria-label={esAlta ? 'Formulario de nuevo usuario' : 'Formulario de edición de usuario'}>
      {errorServidor && (
        <div role="alert" className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-800">{errorServidor}</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Campo id="usr-nombre" label="Nombre *" error={errores.nombre}>
          <input id="usr-nombre" type="text" maxLength={100} value={form.nombre} onChange={set('nombre')} aria-invalid={!!errores.nombre} className={INPUT} />
        </Campo>
        <Campo id="usr-apellido" label="Apellido *" error={errores.apellido}>
          <input id="usr-apellido" type="text" maxLength={100} value={form.apellido} onChange={set('apellido')} aria-invalid={!!errores.apellido} className={INPUT} />
        </Campo>
        <Campo id="usr-dni" label="DNI * (7 u 8 dígitos)" error={errores.dni}>
          <input id="usr-dni" type="text" inputMode="numeric" maxLength={12} value={form.dni} onChange={set('dni')} aria-invalid={!!errores.dni} className={INPUT} />
        </Campo>
        <Campo id="usr-email" label="Correo electrónico *" error={errores.email}>
          <input id="usr-email" type="email" maxLength={150} value={form.email} onChange={set('email')} aria-invalid={!!errores.email} className={INPUT} />
        </Campo>
        {esAlta && (
          <Campo id="usr-password" label="Contraseña inicial * (mín. 6)" error={errores.password}>
            <input id="usr-password" type="password" autoComplete="new-password" maxLength={72} value={form.password} onChange={set('password')} aria-invalid={!!errores.password} className={INPUT} />
          </Campo>
        )}
        <Campo id="usr-cargo" label="Cargo / descripción">
          <input id="usr-cargo" type="text" maxLength={150} value={form.cargo_descripcion} onChange={set('cargo_descripcion')} className={INPUT} />
        </Campo>
        <Campo id="usr-form-rol" label="Rol">
          <select id="usr-form-rol" value={form.rol} onChange={set('rol')} disabled={esYo} className={`${INPUT} disabled:opacity-50`}>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </Campo>
        <Campo id="usr-form-estado" label="Estado">
          <select id="usr-form-estado" value={form.estado} onChange={set('estado')} disabled={esYo} className={`${INPUT} disabled:opacity-50`}>
            {ESTADOS_USUARIO.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </Campo>
      </div>
      {esYo && <p className="text-[11px] text-slate-500">Es tu propia cuenta: no podés cambiar tu rol ni tu estado.</p>}
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700">
          Cancelar
        </button>
        <button type="submit" disabled={guardando} className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white">
          {guardando ? 'Guardando...' : esAlta ? 'Crear usuario' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}

function ResetPasswordForm({ usuario, onClose }) {
  const toast = useToast();
  const [nueva, setNueva] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const enviar = async (ev) => {
    ev.preventDefault();
    if (nueva.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await api.resetUserPassword(usuario.id, nueva);
      toast.success('Contraseña restablecida.');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={enviar} noValidate className="space-y-3">
      <p className="text-xs text-slate-600">
        Definí una nueva contraseña para <strong>{usuario.nombre} {usuario.apellido}</strong>. Deberás comunicársela por un canal seguro.
      </p>
      <Campo id="usr-reset-pass" label="Nueva contraseña * (mín. 6)" error={error}>
        <input
          id="usr-reset-pass"
          type="password"
          autoComplete="new-password"
          maxLength={72}
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          aria-invalid={!!error}
          className={INPUT}
        />
      </Campo>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700">
          Cancelar
        </button>
        <button type="submit" disabled={guardando} className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white">
          {guardando ? 'Guardando...' : 'Restablecer contraseña'}
        </button>
      </div>
    </form>
  );
}

export default function UsuariosTab() {
  const { user: yo } = useAuth();
  const toast = useToast();
  const { data, loading, error, reload } = useLista(() => api.getAllUsers());
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [reseteando, setReseteando] = useState(null);
  const [aBorrar, setABorrar] = useState(null);
  const [borrando, setBorrando] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const lista = useMemo(() => data ?? [], [data]);
  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim());
    return lista.filter((u) => {
      if (filtroRol && u.rol !== filtroRol) return false;
      if (filtroEstado && u.estado !== filtroEstado) return false;
      if (!q) return true;
      return normalizar(`${u.nombre} ${u.apellido} ${u.email} ${u.dni}`).includes(q);
    });
  }, [lista, busqueda, filtroRol, filtroEstado]);

  const completo = (u, cambios) => ({
    nombre: u.nombre,
    apellido: u.apellido,
    dni: u.dni,
    email: u.email,
    rol: u.rol,
    estado: u.estado,
    cargo_descripcion: u.cargo_descripcion || undefined,
    ...cambios,
  });

  const alternarEstado = async (u) => {
    const nuevo = u.estado === 'aprobado' ? 'rechazado' : 'aprobado';
    setBusyId(u.id);
    try {
      await api.updateUser(u.id, completo(u, { estado: nuevo }));
      toast.success(nuevo === 'aprobado' ? `${u.nombre} fue activado.` : `${u.nombre} fue desactivado y ya no puede ingresar.`);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const eliminar = async () => {
    if (!aBorrar) return;
    setBorrando(true);
    try {
      await api.deleteUser(aBorrar.id);
      toast.success('Usuario eliminado.');
      setABorrar(null);
      reload();
    } catch (err) {
      toast.error(err.message);
      setABorrar(null);
    } finally {
      setBorrando(false);
    }
  };

  const cerrarForm = () => {
    setFormAbierto(false);
    setEditando(null);
  };
  const guardado = () => {
    cerrarForm();
    reload();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Usuarios ({visibles.length}{visibles.length !== lista.length ? ` de ${lista.length}` : ''})</h3>
          <p className="text-[11px] text-slate-500 mt-1">Alta, edición, activación, restablecimiento de contraseña y baja de cuentas.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditando(null);
            setFormAbierto(true);
          }}
          className="px-3 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
        >
          <UserPlus className="w-4 h-4" aria-hidden="true" /> Nuevo usuario
        </button>
      </div>

      <div className="p-4 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/60">
        <div>
          <label htmlFor="usr-buscar" className="block text-[11px] font-semibold text-slate-700 mb-1">Buscar por nombre, email o DNI</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input id="usr-buscar" type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className={`${INPUT} pl-8`} placeholder="Ej: Copetti, 4444 o @ipem" />
          </div>
        </div>
        <div>
          <label htmlFor="usr-filtro-rol" className="block text-[11px] font-semibold text-slate-700 mb-1">Filtrar por rol</label>
          <select id="usr-filtro-rol" value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)} className={INPUT}>
            <option value="">Todos los roles</option>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="usr-filtro-estado" className="block text-[11px] font-semibold text-slate-700 mb-1">Filtrar por estado</label>
          <select id="usr-filtro-estado" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className={INPUT}>
            <option value="">Todos los estados</option>
            {ESTADOS_USUARIO.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <Loading />}
      {!loading && error && (
        <div className="p-4">
          <ErrorState message={error} onRetry={reload} />
        </div>
      )}
      {!loading && !error && lista.length === 0 && (
        <div className="p-4">
          <EmptyState title="Sin usuarios" message="Todavía no hay usuarios registrados." />
        </div>
      )}
      {!loading && !error && lista.length > 0 && visibles.length === 0 && (
        <div className="p-4">
          <EmptyState title="Sin resultados" message="Ningún usuario coincide con la búsqueda o los filtros." />
        </div>
      )}
      {!loading && !error && visibles.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Usuario</th>
                <th className="py-2.5 px-4">DNI</th>
                <th className="py-2.5 px-4">Email</th>
                <th className="py-2.5 px-4">Rol</th>
                <th className="py-2.5 px-4">Estado</th>
                <th className="py-2.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {visibles.map((u) => {
                const esYo = yo?.id === u.id;
                const nombre = `${u.nombre ?? ''} ${u.apellido ?? ''}`.trim() || '—';
                const activo = u.estado === 'aprobado';
                const btn = 'p-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed';
                return (
                  <tr key={u.id} data-testid={`usr-fila-${u.id}`} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{nombre}</div>
                      <div className="text-[10px] text-slate-500">{esYo ? 'Tu cuenta' : u.cargo_descripcion ?? ''}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{u.dni ?? '—'}</td>
                    <td className="py-3 px-4 text-slate-600 break-all">{u.email ?? '—'}</td>
                    <td className="py-3 px-4">{etiqueta(ROLES, u.rol)}</td>
                    <td className="py-3 px-4"><EstadoBadge estado={u.estado} /></td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap justify-end gap-1">
                        <button
                          type="button"
                          aria-label={`Editar a ${nombre}`}
                          title="Editar"
                          onClick={() => {
                            setEditando(u);
                            setFormAbierto(true);
                          }}
                          className={`${btn} bg-slate-100 hover:bg-slate-200 text-slate-700`}
                        >
                          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label={`${activo ? 'Desactivar' : 'Activar'} a ${nombre}`}
                          title={esYo ? 'No podés desactivar tu propia cuenta' : activo ? 'Desactivar' : 'Activar'}
                          disabled={esYo || busyId === u.id}
                          onClick={() => alternarEstado(u)}
                          className={`${btn} ${activo ? 'bg-amber-100 hover:bg-amber-200 text-amber-800' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'}`}
                        >
                          {activo ? <UserX className="w-3.5 h-3.5" aria-hidden="true" /> : <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />}
                        </button>
                        <button
                          type="button"
                          aria-label={`Restablecer contraseña de ${nombre}`}
                          title="Restablecer contraseña"
                          onClick={() => setReseteando(u)}
                          className={`${btn} bg-sky-100 hover:bg-sky-200 text-sky-800`}
                        >
                          <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Eliminar a ${nombre}`}
                          title={esYo ? 'No podés eliminar tu propia cuenta' : 'Eliminar'}
                          disabled={esYo}
                          onClick={() => setABorrar(u)}
                          className={`${btn} bg-rose-100 hover:bg-rose-200 text-rose-800`}
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={formAbierto} onClose={cerrarForm} title={editando ? `Editar usuario: ${editando.nombre} ${editando.apellido}` : 'Nuevo usuario'}>
        {formAbierto && (
          <UsuarioForm usuario={editando} esYo={!!editando && yo?.id === editando.id} onClose={cerrarForm} onSaved={guardado} />
        )}
      </Modal>
      <Modal open={!!reseteando} onClose={() => setReseteando(null)} title="Restablecer contraseña" size="max-w-md">
        {reseteando && <ResetPasswordForm usuario={reseteando} onClose={() => setReseteando(null)} />}
      </Modal>
      <ConfirmDialog
        open={!!aBorrar}
        title="Eliminar usuario"
        message={`¿Eliminar definitivamente a ${aBorrar?.nombre ?? ''} ${aBorrar?.apellido ?? ''}? Si tiene trabajo registrado (planificaciones, secuencias, proyectos) no se podrá eliminar y conviene desactivarlo.`}
        confirmLabel="Eliminar"
        busy={borrando}
        onConfirm={eliminar}
        onCancel={() => setABorrar(null)}
      />
    </div>
  );
}
