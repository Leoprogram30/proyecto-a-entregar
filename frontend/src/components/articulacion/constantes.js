// Datos compartidos del módulo de articulación.

export const inputCls =
  'w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-500 text-xs bg-white disabled:bg-slate-50';

// Fuentes normativas citadas. Lo que no está verificado no se afirma en la interfaz.
export const FUENTE_TC =
  'Res. SE 88/2025, Anexo VI (antecedentes: Res. SE-SIDPyTE 06/2025, Anexo V; "Alternativas para la enseñanza", 2013)';

export const MODALIDADES = {
  declarativa: {
    label: 'Articulación declarativa',
    corta: 'Acuerdo de enfoque o tema; cada docente enseña en sus propias horas.',
    detalle:
      'Dos o más docentes acuerdan un tema o enfoque común y lo declaran en sus planificaciones. No se reserva tiempo compartido ni cambia la carga horaria de los estudiantes. Cada espacio conserva su calificación.',
    fuente: 'Propuesta de este sistema; no tiene una norma específica.'
  },
  tiempo_compartido: {
    label: 'Trabajo integrado en tiempo compartido',
    corta: 'Dos espacios del mismo curso comparten horas semanales, a modo de cátedra compartida.',
    detalle:
      'Trabajo integrado en tiempo compartido entre espacios curriculares, a modo de cátedra compartida: integración entre dos espacios del mismo curso, a cargo de docentes distintos. Un espacio de 3 hs comparte 1 hs semanal y uno de 4 o más comparte 2; las horas compartidas del proyecto son las que cede el espacio que menos cede. Es anual (puede ser cuatrimestral o por etapa). La calificación del trabajo integrado es la misma en ambos espacios, además de la propia de cada uno. Los máximos por curso son una advertencia: superarlos requiere autorización de la Dirección de Nivel. No es una cátedra compartida plena.',
    fuente: FUENTE_TC
  },
  proyecto_interdisciplinario: {
    label: 'Proyecto interdisciplinario',
    corta: 'Tres o más espacios trabajan un eje común dentro de sus propias horas.',
    detalle:
      'Integración de saberes de varios espacios en torno a un tema, problema, desafío o producto, sin horas reservadas. Puede vincularse con proyectos como CREA, Feria de Ciencias u Olimpíadas. Es la modalidad para tres o más espacios.',
    fuente:
      'Diseño Curricular de Educación Secundaria, orientaciones sobre integración (pp. 75-76). La organización en este módulo es propuesta del sistema.'
  },
  jornada: {
    label: 'Jornada intensiva o de profundización',
    corta: 'Una o pocas jornadas de producción o profundización temática entre espacios.',
    detalle:
      'Jornadas intensivas de producción o de profundización temática, en las que varios espacios trabajan juntos en un tiempo acotado.',
    fuente: '"Alternativas para la enseñanza" (2013), formatos de jornadas intensivas.'
  }
};

export const VIGENCIAS = {
  anual: 'Anual',
  cuatrimestre: 'Cuatrimestre',
  etapa: 'Por etapa',
  fechas: 'Entre fechas'
};

export const ESTADOS_ART = {
  borrador: { label: 'Borrador', cls: 'bg-slate-100 text-slate-700 border-slate-300' },
  en_acuerdo: { label: 'En acuerdo', cls: 'bg-sky-100 text-sky-800 border-sky-300' },
  conformado: { label: 'Conformado', cls: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  presentado: { label: 'Presentado', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
  autorizado: { label: 'Autorizado', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  observado: { label: 'Observado', cls: 'bg-rose-100 text-rose-800 border-rose-300' },
  en_ejecucion: { label: 'En ejecución', cls: 'bg-teal-100 text-teal-800 border-teal-300' },
  cerrado: { label: 'Cerrado', cls: 'bg-slate-200 text-slate-700 border-slate-400' }
};

export const TIPO_CONTENIDO = { objetivo: 'Objetivo', eje_contenido: 'Aprendizaje y contenido', progresion: 'Progresión' };

export const FUENTE_LABEL = {
  pda_2025: 'PdA 2025',
  diseno_2011_2015: 'Diseño 2011-2015',
  institucional: 'Institucional'
};

export const nombreCompleto = (x) => `${x.docente_nombre || ''} ${x.docente_apellido || ''}`.trim();

export const ACCIONES_TEXTO = {
  creado: 'Creó el proyecto',
  crear: 'Creó el proyecto',
  presentar: 'Presentó a la Dirección',
  autorizar: 'Autorizó',
  actualizado: 'Actualizó el proyecto',
  abierto: 'Abrió el proyecto a convocatoria',
  invitacion: 'Invitación',
  invitacion_aceptada: 'Aceptó la invitación',
  invitacion_rechazada: 'Rechazó la invitación',
  postulacion: 'Se postuló',
  aporte: 'Modificó su aporte',
  conformidad: 'Dio su conformidad',
  conformidad_retirada: 'Retiró su conformidad',
  conformado: 'Acuerdo completo',
  presentado: 'Presentó a la Dirección',
  autorizado: 'Autorizó',
  observado: 'Devolvió con observaciones',
  iniciado: 'Inició la ejecución',
  cerrado: 'Cerró el proyecto',
  encuentro: 'Plan de trabajo',
  encuentro_eliminado: 'Eliminó un encuentro',
  encuentro_realizado: 'Marcó un encuentro como realizado',
  encuentro_pendiente: 'Marcó un encuentro como pendiente',
  abandono: 'Dejó el proyecto'
};
