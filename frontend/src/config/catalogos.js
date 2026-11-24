// Catálogos oficiales para planificar (Currículum Córdoba / Orientaciones Pedagógicas y Didácticas).
// Deben coincidir con backend/helpers/catalogos.php.

export const CAPACIDADES_FUNDAMENTALES = [
  'Oralidad, lectura y escritura',
  'Abordaje y resolución de situaciones problemáticas',
  'Pensamiento crítico',
  'Creatividad',
  'Trabajo colaborativo y cooperativo',
  'Gestión y monitoreo del propio aprendizaje',
  'Ciudadanía local, global y digital'
];

export const FORMATOS_PEDAGOGICOS = [
  'Materia/Asignatura',
  'Seminario',
  'Taller',
  'Proyecto',
  'Laboratorio',
  'Ateneo',
  'Observatorio',
  'Trabajo de campo',
  'Módulo'
];

export const TEMAS_TRANSVERSALES = [
  'ESI',
  'Educación Ambiental Integral',
  'Educación Vial',
  'Educación Económica y Financiera',
  'Cultura Digital y Ciencias de la Computación'
];

export const MOMENTOS_CLASE = [
  { value: 'inicio', label: 'Inicio' },
  { value: 'desarrollo', label: 'Desarrollo' },
  { value: 'cierre', label: 'Cierre' }
];

export const PRIORIDADES = [
  { value: 'esencial', label: 'Esencial' },
  { value: 'complementario', label: 'Complementario' }
];

export const FUENTES = {
  pda_2025: 'Progresiones de Aprendizaje 2025',
  diseno_2011_2015: 'Diseño Curricular 2011-2015',
  institucional: 'Institucional'
};

export const fuenteLabel = (f) => FUENTES[f] || f || '';

// Tipos de documento del repositorio normativo
export const TIPOS_NORMATIVA = {
  diseno_curricular: 'Diseño curricular',
  progresion: 'Progresiones de aprendizaje',
  orientacion: 'Orientaciones',
  planificacion: 'Planificación y evaluación',
  regimen_academico: 'Régimen académico',
  resolucion: 'Resolución',
  ley: 'Ley'
};

// Estado de un documento: la descripción empieza con una de estas etiquetas
export const ESTADOS_NORMATIVA = ['Vigente', 'En consulta', 'Histórico', 'Referencia federal'];

export const estadoNormativa = (descripcion) => {
  const d = String(descripcion || '');
  return ESTADOS_NORMATIVA.find((e) => d.startsWith(`${e}.`)) || '';
};

export const CAMPOS = {
  general: 'Formación general',
  especifica: 'Formación específica',
  opcion_institucional: 'Opción institucional'
};

export const CAMPOS_APRENDIZAJE = {
  lenguajes_comunicacion: 'Lenguajes y Comunicación',
  artes_movimiento: 'Artes y Movimiento',
  sociales_humanas: 'Sociales y Humanas',
  naturales_exactas: 'Naturales y Exactas'
};

export const asArray = (v) => (Array.isArray(v) ? v : []);

// Contenido nuevo (desde el catálogo o propio) con la estructura que guarda la API
export const nuevoContenido = (texto, extra = {}) => ({
  texto,
  indicadores: [],
  prioridad: 'esencial',
  ...extra
});
