/**
 * Cliente de Conexión a la API RESTful PHP y Persistencia Local
 * IPEM N° 349 "Giovanni Bosco" - Colonia Caroya
 */

import {
  INITIAL_ESPACIOS,
  INITIAL_CURRICULUM_CONTENIDOS,
  INITIAL_NORMATIVAS,
  INITIAL_CRONOGRAMA,
  INITIAL_USERS,
  INITIAL_PLANIFICACIONES,
  INITIAL_SECUENCIAS,
  INITIAL_PROYECTOS_ARTICULADOS,
  INITIAL_HITOS
} from '../data/initialData';

// URL base de la API PHP en producción o desarrollo
const API_BASE_URL = import.meta.env.VITE_API_URL || '/backend/api';

// Helper de almacenamiento seguro en localStorage para fallback
const loadStorage = (key, fallback) => {
  try {
    const item = localStorage.getItem(`ipem349_${key}`);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    return fallback;
  }
};

const saveStorage = (key, data) => {
  try {
    localStorage.setItem(`ipem349_${key}`, JSON.stringify(data));
  } catch (e) {
    console.error('Error guardando en almacenamiento local:', e);
  }
};

// Inicializar almacenamiento local si no existe
let localUsers = loadStorage('users', INITIAL_USERS);
let localPlanificaciones = loadStorage('planificaciones', INITIAL_PLANIFICACIONES);
let localSecuencias = loadStorage('secuencias', INITIAL_SECUENCIAS);
let localProyectos = loadStorage('proyectos', INITIAL_PROYECTOS_ARTICULADOS);
let localHitos = loadStorage('hitos', INITIAL_HITOS);
let localCronograma = loadStorage('cronograma', INITIAL_CRONOGRAMA);
let localNormativas = loadStorage('normativas', INITIAL_NORMATIVAS);

// Helper para peticiones HTTP a la API PHP con token
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('ipem349_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
      ...options,
      headers
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Error en la respuesta del servidor');
    }
    return data.data;
  } catch (err) {
    // Si no hay backend PHP corriendo o da error de red, lanzamos para usar el fallback local
    throw err;
  }
};

export const api = {
  // -------------------------------------------------------------
  // AUTENTICACIÓN Y USUARIOS
  // -------------------------------------------------------------
  async login(email, password) {
    try {
      const res = await request('auth.php?action=login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem('ipem349_token', res.token);
      localStorage.setItem('ipem349_current_user', JSON.stringify(res.user));
      return res.user;
    } catch (err) {
      // Fallback local
      const user = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        throw new Error('Credenciales incorrectas o usuario no registrado.');
      }
      if (user.estado === 'pendiente') {
        throw new Error('Su cuenta se encuentra PENDIENTE de aprobación por la Administración del IPEM 349.');
      }
      if (user.estado === 'rechazado') {
        throw new Error('Su solicitud de acceso ha sido rechazada por la administración escolar.');
      }

      // Validar contraseñas estándar de prueba
      const validPass = (user.rol === 'admin' && password === 'admin123') ||
                        (user.rol === 'director' && password === 'director123') ||
                        (user.rol === 'coordinador' && password === 'director123') ||
                        (user.rol === 'docente' && (password === 'docente123' || password === 'admin123'));
      if (!validPass) {
        throw new Error('Contraseña incorrecta.');
      }

      const mockToken = 'mock-jwt-token-' + user.id;
      localStorage.setItem('ipem349_token', mockToken);
      localStorage.setItem('ipem349_current_user', JSON.stringify(user));
      return user;
    }
  },

  async register(formData) {
    try {
      return await request('auth.php?action=register', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
    } catch (err) {
      // Fallback local
      const exists = localUsers.some(u => u.email === formData.email || u.dni === formData.dni);
      if (exists) {
        throw new Error('Ya existe un usuario con este DNI o correo electrónico.');
      }
      const newUser = {
        id: Date.now(),
        nombre: formData.nombre,
        apellido: formData.apellido,
        dni: formData.dni,
        email: formData.email,
        rol: formData.rol || 'docente',
        cargo_descripcion: formData.cargo_descripcion || 'Docente de Nivel Secundario',
        estado: 'pendiente'
      };
      localUsers.push(newUser);
      saveStorage('users', localUsers);
      return {
        message: 'Solicitud enviada con éxito. Su cuenta se encuentra en estado Pendiente de Aprobación por el Administrador.'
      };
    }
  },

  getCurrentUser() {
    try {
      const stored = localStorage.getItem('ipem349_current_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  logout() {
    localStorage.removeItem('ipem349_token');
    localStorage.removeItem('ipem349_current_user');
  },

  async getPendingUsers() {
    try {
      return await request('auth.php?action=pending_users');
    } catch {
      return localUsers.filter(u => u.estado === 'pendiente');
    }
  },

  async updateUserStatus(userId, estado) {
    try {
      return await request('auth.php?action=update_status', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, estado })
      });
    } catch {
      localUsers = localUsers.map(u => u.id === userId ? { ...u, estado } : u);
      saveStorage('users', localUsers);
      return { user_id: userId, estado };
    }
  },

  async getAllUsers() {
    try {
      return await request('auth.php?action=all_users');
    } catch {
      return localUsers;
    }
  },

  // -------------------------------------------------------------
  // ESPACIOS CURRICULARES (Malla de Córdoba)
  // -------------------------------------------------------------
  async getEspacios(ciclo = null, anio = null) {
    try {
      let query = 'espacios.php?action=list';
      if (ciclo) query += `&ciclo=${ciclo}`;
      if (anio) query += `&anio=${anio}`;
      return await request(query);
    } catch {
      return INITIAL_ESPACIOS.filter(e => {
        if (ciclo && e.ciclo !== ciclo) return false;
        if (anio && e.anio !== Number(anio)) return false;
        return true;
      });
    }
  },

  async getEspacioDetail(id) {
    try {
      return await request(`espacios.php?action=detail&id=${id}`);
    } catch {
      const espacio = INITIAL_ESPACIOS.find(e => e.id === Number(id));
      const curr = INITIAL_CURRICULUM_CONTENIDOS[id] || {
        objetivos: [
          `Desarrollar capacidades de análisis crítico y resolución de situaciones problemáticas en ${espacio?.nombre || 'el espacio curricular'}.`,
          'Fomentar el trabajo en equipo, la comunicación oral y escrita y el compromiso institucional.',
          'Vincular los aprendizajes con el contexto socioproductivo y ambiental de Colonia Caroya.'
        ],
        contenidos: [
          'Eje 1: Conceptos Fundamentales y Marco Teórico de la disciplina.',
          'Eje 2: Procedimientos Técnicos y Experimentación Práctica.',
          'Eje 3: Integración de Saberes y Aplicación al Entorno Productivo Local.'
        ]
      };
      const normativas = localNormativas.filter(n => !n.espacio_id || n.espacio_id === Number(id));
      return { espacio, contenidos: curr, normativas };
    }
  },

  // -------------------------------------------------------------
  // PLANIFICACIONES ANUALES
  // -------------------------------------------------------------
  async getMyPlanificaciones(docenteId) {
    try {
      return await request('planificaciones.php?action=my_plans');
    } catch {
      return localPlanificaciones.filter(p => !docenteId || p.docente_id === docenteId);
    }
  },

  async getAllPlanificaciones(filters = {}) {
    try {
      let q = 'planificaciones.php?action=all_plans';
      if (filters.ciclo) q += `&ciclo=${filters.ciclo}`;
      if (filters.anio) q += `&anio=${filters.anio}`;
      if (filters.estado) q += `&estado=${filters.estado}`;
      return await request(q);
    } catch {
      return localPlanificaciones.filter(p => {
        if (filters.ciclo && p.espacio_ciclo !== filters.ciclo) return false;
        if (filters.anio && Number(p.espacio_anio) !== Number(filters.anio)) return false;
        if (filters.estado && p.estado !== filters.estado) return false;
        return true;
      });
    }
  },

  async savePlanificacion(plan) {
    try {
      return await request('planificaciones.php?action=save', {
        method: 'POST',
        body: JSON.stringify(plan)
      });
    } catch {
      if (plan.id) {
        localPlanificaciones = localPlanificaciones.map(p => p.id === plan.id ? { ...p, ...plan, fecha_actualizacion: new Date().toISOString() } : p);
      } else {
        const newPlan = {
          ...plan,
          id: Date.now(),
          fecha_creacion: new Date().toISOString(),
          fecha_actualizacion: new Date().toISOString()
        };
        localPlanificaciones.unshift(newPlan);
      }
      saveStorage('planificaciones', localPlanificaciones);
      return { success: true };
    }
  },

  async reviewPlanificacion(planId, estado, comentario) {
    try {
      return await request('planificaciones.php?action=review', {
        method: 'POST',
        body: JSON.stringify({ planificacion_id: planId, estado, comentario })
      });
    } catch {
      localPlanificaciones = localPlanificaciones.map(p => {
        if (p.id === planId) {
          return {
            ...p,
            estado,
            devolucion_directivo: comentario,
            fecha_revision: new Date().toISOString().split('T')[0]
          };
        }
        return p;
      });
      saveStorage('planificaciones', localPlanificaciones);
      return { success: true };
    }
  },

  // -------------------------------------------------------------
  // SECUENCIAS DIDÁCTICAS
  // -------------------------------------------------------------
  async getSecuencias(espacioId = null) {
    try {
      const q = espacioId ? `secuencias.php?action=list&espacio_id=${espacioId}` : 'secuencias.php?action=list';
      return await request(q);
    } catch {
      return localSecuencias.filter(s => !espacioId || s.espacio_id === Number(espacioId));
    }
  },

  async saveSecuencia(secuencia) {
    try {
      return await request('secuencias.php?action=save', {
        method: 'POST',
        body: JSON.stringify(secuencia)
      });
    } catch {
      if (secuencia.id) {
        localSecuencias = localSecuencias.map(s => s.id === secuencia.id ? { ...s, ...secuencia } : s);
      } else {
        localSecuencias.unshift({ ...secuencia, id: Date.now() });
      }
      saveStorage('secuencias', localSecuencias);
      return { success: true };
    }
  },

  async reviewSecuencia(secuenciaId, estado, devolucion) {
    try {
      return await request('secuencias.php?action=review', {
        method: 'POST',
        body: JSON.stringify({ secuencia_id: secuenciaId, estado, devolucion })
      });
    } catch {
      localSecuencias = localSecuencias.map(s => s.id === secuenciaId ? { ...s, estado, devolucion_directivo: devolucion } : s);
      saveStorage('secuencias', localSecuencias);
      return { success: true };
    }
  },

  // -------------------------------------------------------------
  // PROYECTOS ARTICULADOS INTERDISCIPLINARIOS
  // -------------------------------------------------------------
  async getProyectosArticulados() {
    try {
      return await request('proyectos_articulados.php?action=list');
    } catch {
      return localProyectos;
    }
  },

  async createProyectoArticulado(data) {
    try {
      return await request('proyectos_articulados.php?action=create', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch {
      const newProj = {
        id: Date.now(),
        titulo: data.titulo,
        descripcion: data.descripcion,
        problema_contexto: data.problema_contexto,
        producto_final: data.producto_final,
        creador_id: data.creador_id || 4,
        creador_nombre: data.creador_nombre || 'Docente Caroya',
        estado: 'convocatoria',
        participantes: [
          {
            id: Date.now(),
            docente_id: data.creador_id || 4,
            docente_nombre: data.creador_nombre || 'Docente Caroya',
            espacio_id: data.espacio_creador_id,
            espacio_nombre: data.espacio_creador_nombre || 'Espacio Iniciador',
            aporte_especifico: data.aporte_inicial || 'Marco del proyecto y articulación general.',
            estado_aporte: 'completado'
          }
        ]
      };
      localProyectos.unshift(newProj);
      saveStorage('proyectos', localProyectos);
      return newProj;
    }
  },

  async joinProyectoArticulado(data) {
    try {
      return await request('proyectos_articulados.php?action=join', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch {
      localProyectos = localProyectos.map(p => {
        if (p.id === data.proyecto_id) {
          const participantes = p.participantes || [];
          participantes.push({
            id: Date.now(),
            docente_id: data.docente_id,
            docente_nombre: data.docente_nombre,
            espacio_id: data.espacio_id,
            espacio_nombre: data.espacio_nombre,
            aporte_especifico: data.aporte_especifico,
            aprendizajes_articulados: data.aprendizajes_articulados,
            estado_aporte: 'completado'
          });
          return { ...p, estado: 'en_desarrollo', participantes };
        }
        return p;
      });
      saveStorage('proyectos', localProyectos);
      return { success: true };
    }
  },

  // -------------------------------------------------------------
  // AGENDA E HITOS
  // -------------------------------------------------------------
  async getHitos(espacioId = null, docenteId = null) {
    try {
      let q = 'agenda.php?action=list';
      if (espacioId) q += `&espacio_id=${espacioId}`;
      if (docenteId) q += `&docente_id=${docenteId}`;
      return await request(q);
    } catch {
      const items = localHitos.filter(h => (!espacioId || h.espacio_id === Number(espacioId)) && (!docenteId || h.docente_id === Number(docenteId)));
      const total = items.length;
      const completados = items.filter(h => h.completado).length;
      return {
        hitos: items,
        metricas: {
          total,
          completados,
          pendientes: total - completados,
          porcentaje: total > 0 ? Math.round((completados / total) * 100) : 0
        }
      };
    }
  },

  async createHito(hito) {
    try {
      return await request('agenda.php?action=create', {
        method: 'POST',
        body: JSON.stringify(hito)
      });
    } catch {
      const newHito = { ...hito, id: Date.now(), completado: false };
      localHitos.push(newHito);
      saveStorage('hitos', localHitos);
      return newHito;
    }
  },

  async toggleHito(hitoId) {
    try {
      return await request('agenda.php?action=toggle', {
        method: 'POST',
        body: JSON.stringify({ id: hitoId })
      });
    } catch {
      localHitos = localHitos.map(h => h.id === hitoId ? { ...h, completado: !h.completado } : h);
      saveStorage('hitos', localHitos);
      return { success: true };
    }
  },

  // -------------------------------------------------------------
  // CRONOGRAMA INSTITUCIONAL
  // -------------------------------------------------------------
  async getCronograma(anio = 2026) {
    try {
      return await request(`cronograma.php?action=list&anio=${anio}`);
    } catch {
      return localCronograma;
    }
  },

  async saveCronogramaEvento(evento) {
    try {
      return await request('cronograma.php?action=save', {
        method: 'POST',
        body: JSON.stringify(evento)
      });
    } catch {
      if (evento.id) {
        localCronograma = localCronograma.map(c => c.id === evento.id ? { ...c, ...evento } : c);
      } else {
        localCronograma.push({ ...evento, id: Date.now() });
      }
      saveStorage('cronograma', localCronograma);
      return { success: true };
    }
  },

  // -------------------------------------------------------------
  // REPOSITORIO NORMATIVO
  // -------------------------------------------------------------
  async getNormativas(tipo = null, espacioId = null) {
    try {
      let q = 'normativas.php?action=list';
      if (tipo) q += `&tipo=${tipo}`;
      if (espacioId) q += `&espacio_id=${espacioId}`;
      return await request(q);
    } catch {
      return localNormativas.filter(n => {
        if (tipo && n.tipo !== tipo) return false;
        if (espacioId && n.espacio_id && n.espacio_id !== Number(espacioId)) return false;
        return true;
      });
    }
  },

  async uploadNormativa(formData) {
    try {
      const token = localStorage.getItem('ipem349_token');
      const res = await fetch(`${API_BASE_URL}/normativas.php?action=upload`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      return data.data;
    } catch {
      const newDoc = {
        id: Date.now(),
        titulo: formData.get ? formData.get('titulo') : formData.titulo,
        tipo: formData.get ? formData.get('tipo') : formData.tipo,
        resolucion_numero: formData.get ? formData.get('resolucion_numero') : formData.resolucion_numero,
        organismo: 'Ministerio de Educación de Córdoba - DGESec',
        url_oficial: formData.get ? formData.get('url_oficial') : formData.url_oficial,
        archivo_pdf: 'normativa_cba_reciente.pdf',
        descripcion: formData.get ? formData.get('descripcion') : formData.descripcion
      };
      localNormativas.unshift(newDoc);
      saveStorage('normativas', localNormativas);
      return newDoc;
    }
  }
};
