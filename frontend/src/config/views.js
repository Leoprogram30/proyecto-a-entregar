// Vistas disponibles por rol (menú y control de acceso)
export const DIRECTIVOS = ['admin', 'director', 'coordinador'];
export const PLANIFICAN = ['docente', 'coordinador'];

export const VIEWS_BY_ROLE = {
  admin: ['inicio', 'admin-users', 'directivo-supervision', 'secuencias', 'articulacion', 'precursora', 'normativas', 'cronograma', 'curriculum'],
  director: ['inicio', 'directivo-supervision', 'curriculum', 'secuencias', 'articulacion', 'precursora', 'normativas', 'cronograma'],
  coordinador: ['inicio', 'directivo-supervision', 'curriculum', 'planificaciones', 'secuencias', 'articulacion', 'precursora', 'agenda', 'normativas', 'cronograma'],
  docente: ['inicio', 'curriculum', 'planificaciones', 'secuencias', 'articulacion', 'precursora', 'agenda', 'normativas', 'cronograma']
};

// Vistas a las que se llega sin estar en el menú
const EXTRA_VIEWS = { docente: ['planning-wizard'], coordinador: ['planning-wizard'] };

export const homeView = (rol) => VIEWS_BY_ROLE[rol]?.[0] || 'curriculum';

export const canAccess = (rol, view) =>
  Boolean(VIEWS_BY_ROLE[rol]?.includes(view) || EXTRA_VIEWS[rol]?.includes(view));

export const ROLE_LABELS = {
  admin: 'Administrador',
  director: 'Equipo Directivo',
  coordinador: 'Coordinador de Área',
  docente: 'Docente'
};
