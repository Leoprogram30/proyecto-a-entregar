/**
 * Cliente de la API REST PHP.
 * IPEM N° 349 "Giovanni Bosco" - Colonia Caroya
 *
 * No hay datos simulados: todo error (red, HTTP, formato) se lanza como ApiError.
 * Lo único que se guarda en el navegador es el token de sesión.
 */

// En desarrollo se usa el proxy de Vite ('/backend/api'); en producción una ruta
// relativa al documento, para que funcione también en subcarpetas (XAMPP, cPanel).
const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '/backend/api' : 'backend/api')
).replace(/\/+$/, '');

const TOKEN_KEY = 'ipem349_token';
export const SESSION_EXPIRED_EVENT = 'ipem349:session-expired';

export class ApiError extends Error {
  constructor(message, status = 0, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // almacenamiento no disponible: la sesión dura lo que dure la página
  }
};

const buildUrl = (file, action, params = {}) => {
  const qs = new URLSearchParams({ action });
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, v);
  });
  return `${API_BASE_URL}/${file}?${qs.toString()}`;
};

// Acciones donde un 401 NO significa "sesión vencida"
const isAuthFailureAllowed = (url) =>
  /[?&]action=(login|register|change_password)(&|$)/.test(url);

const parseResponse = async (res) => {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    const msg = res.ok
      ? 'El servidor devolvió una respuesta que no es JSON válido.'
      : `Error del servidor (HTTP ${res.status}). Respuesta no válida.`;
    throw new ApiError(msg, res.status);
  }
};

const request = async (url, { method = 'GET', body, formData } = {}) => {
  const token = getToken();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: formData || (body !== undefined ? JSON.stringify(body) : undefined)
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Verifique su conexión e intente nuevamente.');
  }

  const payload = await parseResponse(res);

  if (res.status === 401 && token && !isAuthFailureAllowed(url)) {
    setToken(null);
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    throw new ApiError(payload.message || 'Su sesión expiró. Ingrese nuevamente.', 401);
  }

  if (!res.ok || !payload.success) {
    throw new ApiError(payload.message || 'Error en la respuesta del servidor.', res.status, payload.details || null);
  }
  return payload.data;
};

const get = (file, action, params) => request(buildUrl(file, action, params));
const post = (file, action, body = {}) => request(buildUrl(file, action), { method: 'POST', body });

export const api = {
  // ---- Sesión y usuarios ----
  hasToken: () => Boolean(getToken()),
  logout: () => setToken(null),

  async login(email, password) {
    const res = await post('auth.php', 'login', { email, password });
    setToken(res.token);
    return res.user;
  },
  register: (data) => post('auth.php', 'register', data),
  getMe: () => get('auth.php', 'me'),
  changePassword: (actual, nueva) => post('auth.php', 'change_password', { actual, nueva }),
  updateProfile: (d) => post('auth.php', 'update_profile', d),
  getPendingUsers: () => get('auth.php', 'pending_users'),
  getAllUsers: () => get('auth.php', 'all_users'),
  updateUserStatus: (userId, estado, rol) =>
    post('auth.php', 'update_status', { user_id: userId, estado, ...(rol ? { rol } : {}) }),
  createUser: (d) => post('auth.php', 'create_user', d),
  updateUser: (userId, d) => post('auth.php', 'update_user', { ...d, user_id: userId }),
  resetUserPassword: (userId, nueva) => post('auth.php', 'reset_password', { user_id: userId, nueva }),
  deleteUser: (userId) => post('auth.php', 'delete_user', { user_id: userId }),

  // ---- Espacios curriculares ----
  getEspacios: ({ ciclo, anio, incluir_inactivas } = {}) =>
    get('espacios.php', 'list', { ciclo, anio, incluir_inactivas: incluir_inactivas ? 1 : undefined }),
  getEspacioDetail: (id, { todos } = {}) => get('espacios.php', 'detail', { id, todos: todos ? 1 : undefined }),
  saveEspacio: (d) => post('espacios.php', 'save', d),
  deleteEspacio: (id) => post('espacios.php', 'delete', { id }),
  saveContenido: (d) => post('espacios.php', 'contenido_save', d),
  deleteContenido: (id) => post('espacios.php', 'contenido_delete', { id }),

  // ---- Cronograma ----
  getCronograma: (anio) => get('cronograma.php', 'list', { anio }),
  saveCronogramaEvento: (d) => post('cronograma.php', 'save', d),
  deleteCronogramaEvento: (id) => post('cronograma.php', 'delete', { id }),

  // ---- Normativas ----
  getNormativas: ({ tipo, espacio_id } = {}) => get('normativas.php', 'list', { tipo, espacio_id }),
  uploadNormativa: (formData) =>
    request(buildUrl('normativas.php', 'upload'), { method: 'POST', formData }),
  deleteNormativa: (id) => post('normativas.php', 'delete', { id }),

  async descargarNormativa(doc) {
    const token = getToken();
    let res;
    try {
      res = await fetch(buildUrl('normativas.php', 'download', { id: doc.id }), {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
    } catch {
      throw new ApiError('No se pudo conectar con el servidor.');
    }
    if (!res.ok) {
      if (res.status === 401 && token) {
        setToken(null);
        window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
      }
      let msg = res.status === 404 ? 'El documento no tiene un archivo PDF disponible.' : 'No se pudo descargar el documento.';
      try {
        const p = JSON.parse(await res.text());
        if (p.message) msg = p.message;
      } catch {
        // se mantiene el mensaje por defecto
      }
      throw new ApiError(msg, res.status);
    }
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = `${(doc.titulo || 'normativa').replace(/[^\p{L}\p{N} -]+/gu, '').trim() || 'normativa'}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  },

  // ---- Planificaciones ----
  getMyPlanificaciones: () => get('planificaciones.php', 'my_plans'),
  getAllPlanificaciones: (filtros = {}) => get('planificaciones.php', 'all_plans', filtros),
  getPlanificacionDetail: (id) => get('planificaciones.php', 'detail', { id }),
  savePlanificacion: (d) => post('planificaciones.php', 'save', d),
  reviewPlanificacion: (d) => post('planificaciones.php', 'review', d),
  deletePlanificacion: (id) => post('planificaciones.php', 'delete', { id }),
  duplicatePlanificacion: (d) => post('planificaciones.php', 'duplicate', d),

  // ---- Secuencias ----
  getSecuencias: (espacioId) => get('secuencias.php', 'list', { espacio_id: espacioId }),
  saveSecuencia: (d) => post('secuencias.php', 'save', d),
  reviewSecuencia: (d) => post('secuencias.php', 'review', d),
  deleteSecuencia: (id) => post('secuencias.php', 'delete', { id }),
  duplicateSecuencia: (id) => post('secuencias.php', 'duplicate', { id }),

  // ---- Proyectos articulados ----
  getProyectosArticulados: () => get('proyectos_articulados.php', 'list'),
  getProyectoArt: (id) => get('proyectos_articulados.php', 'detail', { id }),
  createProyectoArticulado: (d) => post('proyectos_articulados.php', 'create', d),
  updateProyectoArt: (d) => post('proyectos_articulados.php', 'update', d),
  proyectoArtAccion: (accion, d) => post('proyectos_articulados.php', accion, d),
  getDocentesDisponibles: () => get('proyectos_articulados.php', 'docentes_disponibles'),
  getSugerenciasArt: (curso, texto) => get('proyectos_articulados.php', 'sugerencias', { curso, texto }),
  getCatalogoArt: (espacio_id, q) => get('proyectos_articulados.php', 'catalogo', { espacio_id, q }),

  // ---- Institución / precursora ----
  getRutas: () => get('institucion.php', 'rutas'),
  saveRuta: (d) => post('institucion.php', 'ruta_save', d),
  getPrecursora: (anio) => get('institucion.php', 'precursora', { anio }),
  saveAccionPrecursora: (d) => post('institucion.php', 'accion_save', d),

  // ---- Agenda ----
  getInicio: () => get('inicio.php', 'resumen'),

  getHitos: ({ espacio_id, docente_id } = {}) => get('agenda.php', 'list', { espacio_id, docente_id }),
  createHito: (d) => post('agenda.php', 'create', d),
  updateHito: (d) => post('agenda.php', 'update', d),
  toggleHito: (id) => post('agenda.php', 'toggle', { id }),
  deleteHito: (id) => post('agenda.php', 'delete', { id })
};
