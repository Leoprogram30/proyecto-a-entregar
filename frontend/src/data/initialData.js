/**
 * Datos semilla y Malla Curricular Oficial de Córdoba
 * IPEM N° 349 "Giovanni Bosco" - Colonia Caroya
 * Orientación: Agro y Ambiente
 */

export const INITIAL_ESPACIOS = [
  // 1° AÑO (Ciclo Básico)
  { id: 1, ciclo: 'basico', anio: 1, nombre: 'Lengua y Literatura', area: 'Formación General', orientacion: 'General', horas_catedra: 5, icono: 'BookOpen', descripcion: 'Comprensión y producción de textos orales y escritos, lectura literaria.' },
  { id: 2, ciclo: 'basico', anio: 1, nombre: 'Matemática', area: 'Formación General', orientacion: 'General', horas_catedra: 5, icono: 'Calculator', descripcion: 'Números naturales y enteros, geometría en el plano, resolución de problemas.' },
  { id: 3, ciclo: 'basico', anio: 1, nombre: 'Ciencias Naturales - Biología', area: 'Ciencias Naturales', orientacion: 'General', horas_catedra: 4, icono: 'Leaf', descripcion: 'Los seres vivos: diversidad, unidad, interrelaciones y cambios.' },
  { id: 4, ciclo: 'basico', anio: 1, nombre: 'Ciencias Sociales - Geografía', area: 'Ciencias Sociales', orientacion: 'General', horas_catedra: 3, icono: 'Globe', descripcion: 'El espacio geográfico mundial y de Argentina, recursos naturales.' },
  { id: 5, ciclo: 'basico', anio: 1, nombre: 'Ciencias Sociales - Historia', area: 'Ciencias Sociales', orientacion: 'General', horas_catedra: 3, icono: 'Clock', descripcion: 'De las primeras sociedades humanas a las sociedades del mundo antiguo.' },
  { id: 6, ciclo: 'basico', anio: 1, nombre: 'Educación Tecnológica', area: 'Tecnología', orientacion: 'General', horas_catedra: 3, icono: 'Cpu', descripcion: 'Procesos tecnológicos, materiales, herramientas y transformación productiva.' },
  { id: 7, ciclo: 'basico', anio: 1, nombre: 'Lengua Extranjera - Inglés', area: 'Lenguas', orientacion: 'General', horas_catedra: 3, icono: 'Languages', descripcion: 'Comunicación básica contextualizada, comprensión auditiva y escrita.' },
  { id: 8, ciclo: 'basico', anio: 1, nombre: 'Educación Artística: Artes Visuales', area: 'Artes', orientacion: 'General', horas_catedra: 3, icono: 'Palette', descripcion: 'Lenguaje visual, técnicas plásticas y apreciación estética contextual.' },
  { id: 9, ciclo: 'basico', anio: 1, nombre: 'Formación Ética y Ciudadana', area: 'Humanidades', orientacion: 'General', horas_catedra: 3, icono: 'Shield', descripcion: 'Derechos humanos, convivencia democrática, valores y normas sociales.' },

  // 2° AÑO (Ciclo Básico)
  { id: 10, ciclo: 'basico', anio: 2, nombre: 'Lengua y Literatura', area: 'Formación General', orientacion: 'General', horas_catedra: 5, icono: 'BookOpen', descripcion: 'Tipologías textuales, análisis de obras literarias argentinas y universales.' },
  { id: 11, ciclo: 'basico', anio: 2, nombre: 'Matemática', area: 'Formación General', orientacion: 'General', horas_catedra: 5, icono: 'Calculator', descripcion: 'Números racionales, álgebra básica, ecuaciones, proporcionalidad y estadística.' },
  { id: 12, ciclo: 'basico', anio: 2, nombre: 'Ciencias Naturales - Física', area: 'Ciencias Naturales', orientacion: 'General', horas_catedra: 4, icono: 'Zap', descripcion: 'Movimiento, fuerzas, energía, calor y transformaciones mecánicas.' },
  { id: 13, ciclo: 'basico', anio: 2, nombre: 'Ciencias Naturales - Química', area: 'Ciencias Naturales', orientacion: 'General', horas_catedra: 4, icono: 'FlaskConical', descripcion: 'Estructura de la materia, tabla periódica, sustancias y soluciones.' },
  { id: 14, ciclo: 'basico', anio: 2, nombre: 'Geografía', area: 'Ciencias Sociales', orientacion: 'General', horas_catedra: 3, icono: 'Globe', descripcion: 'Geografía de América: ambientes, recursos y procesos socioproductivos.' },
  { id: 15, ciclo: 'basico', anio: 2, nombre: 'Historia', area: 'Ciencias Sociales', orientacion: 'General', horas_catedra: 3, icono: 'Clock', descripcion: 'América colonial y transformaciones sociopolíticas hacia la modernidad.' },
  { id: 16, ciclo: 'basico', anio: 2, nombre: 'Educación Tecnológica', area: 'Tecnología', orientacion: 'General', horas_catedra: 3, icono: 'Cpu', descripcion: 'Sistemas técnicos, automatismos y tecnología para el desarrollo regional.' },
  { id: 17, ciclo: 'basico', anio: 2, nombre: 'Inglés', area: 'Lenguas', orientacion: 'General', horas_catedra: 3, icono: 'Languages', descripcion: 'Producción comunicativa intermedia y vocabulario funcional.' },
  { id: 18, ciclo: 'basico', anio: 2, nombre: 'Educación Artística: Música', area: 'Artes', orientacion: 'General', horas_catedra: 3, icono: 'Music', descripcion: 'Ritmo, melodía, expresiones sonoras y patrimonio musical folklórico.' },

  // 3° AÑO (Ciclo Básico)
  { id: 19, ciclo: 'basico', anio: 3, nombre: 'Lengua y Literatura', area: 'Formación General', orientacion: 'General', horas_catedra: 5, icono: 'BookOpen', descripcion: 'Ensayos breves, argumentación, análisis crítico del discurso mediático.' },
  { id: 20, ciclo: 'basico', anio: 3, nombre: 'Matemática', area: 'Formación General', orientacion: 'General', horas_catedra: 5, icono: 'Calculator', descripcion: 'Funciones lineales y cuadráticas, trigonometría básica y probabilidad.' },
  { id: 21, ciclo: 'basico', anio: 3, nombre: 'Biología', area: 'Ciencias Naturales', orientacion: 'General', horas_catedra: 4, icono: 'Leaf', descripcion: 'Genética básica, evolución de las especies y ecología de poblaciones.' },
  { id: 22, ciclo: 'basico', anio: 3, nombre: 'Física y Química', area: 'Ciencias Naturales', orientacion: 'General', horas_catedra: 4, icono: 'Atom', descripcion: 'Reacciones químicas, leyes de los gases, trabajo y potencia.' },
  { id: 23, ciclo: 'basico', anio: 3, nombre: 'Geografía de Argentina y Córdoba', area: 'Ciencias Sociales', orientacion: 'General', horas_catedra: 3, icono: 'MapPin', descripcion: 'Circuitos productivos provinciales, relieve, clima y ordenamiento territorial.' },
  { id: 24, ciclo: 'basico', anio: 3, nombre: 'Historia Argentina', area: 'Ciencias Sociales', orientacion: 'General', horas_catedra: 3, icono: 'Clock', descripcion: 'Construcción del Estado nacional argentino y modelos agroexportadores.' },
  { id: 25, ciclo: 'basico', anio: 3, nombre: 'Ciudadanía y Participación', area: 'Humanidades', orientacion: 'General', horas_catedra: 3, icono: 'Users', descripcion: 'Proyectos sociocomunitarios, participación juvenil y ecociudadanía.' },

  // 4° AÑO (Ciclo Orientado en Agro y Ambiente)
  { id: 26, ciclo: 'orientado', anio: 4, nombre: 'Producción Vegetal I (Cultivos de la Región y Horticultura)', area: 'Formación Específica', orientacion: 'Agro y Ambiente', horas_catedra: 5, icono: 'Sprout', descripcion: 'Morfología y fisiología vegetal, preparación de camas de siembra, cultivos hortícolas del cinturón verde y frutales tradicionales de Colonia Caroya.' },
  { id: 27, ciclo: 'orientado', anio: 4, nombre: 'Ecología y Recursos Naturales', area: 'Formación Específica', orientacion: 'Agro y Ambiente', horas_catedra: 4, icono: 'Trees', descripcion: 'Dinámica de ecosistemas pampeanos y chaqueños, ciclos biogeoquímicos, biodiversidad y problemáticas de degradación ambiental.' },
  { id: 28, ciclo: 'orientado', anio: 4, nombre: 'Química Aplicada y Bioquímica', area: 'Formación Específica', orientacion: 'Agro y Ambiente', horas_catedra: 4, icono: 'FlaskConical', descripcion: 'Compuestos orgánicos, biomoléculas en la producción agropecuaria, fitosanitarios y biopreparados.' },
  { id: 29, ciclo: 'orientado', anio: 4, nombre: 'Física Ambiental y Meteorología', area: 'Formación Específica', orientacion: 'Agro y Ambiente', horas_catedra: 3, icono: 'Sun', descripcion: 'Fenómenos climáticos, radiación solar, humedad relativa, instrumental meteorológico y su impacto en cultivos.' },
  { id: 30, ciclo: 'orientado', anio: 4, nombre: 'Geografía Ambiental de Córdoba', area: 'Formación General', orientacion: 'Agro y Ambiente', horas_catedra: 3, icono: 'Globe', descripcion: 'Transformaciones territoriales por avance de la frontera agropecuaria en Córdoba y ordenamiento ambiental.' },
  { id: 31, ciclo: 'orientado', anio: 4, nombre: 'Taller de Práctica Agropecuaria I (Entorno Huerta)', area: 'Práctica de Campo', orientacion: 'Agro y Ambiente', horas_catedra: 4, icono: 'Trowel', descripcion: 'Labores prácticas en la huerta escolar, compostaje, siembra escalonada y manejo de herramientas agrícolas.' },

  // 5° AÑO (Ciclo Orientado en Agro y Ambiente)
  { id: 32, ciclo: 'orientado', anio: 5, nombre: 'Producción Vegetal II (Fruticultura y Vitivinicultura)', area: 'Formación Específica', orientacion: 'Agro y Ambiente', horas_catedra: 5, icono: 'Grape', descripcion: 'Sistemas de conducción de vid (espaldero caroyense), poda, variedades vitivinícolas locales (Frambua, Malbec), frutales de carozo y pepita.' },
  { id: 33, ciclo: 'orientado', anio: 5, nombre: 'Producción Animal I (Sistemas Pecuarios)', area: 'Formación Específica', orientacion: 'Agro y Ambiente', horas_catedra: 4, icono: 'PiggyBank', descripcion: 'Anatomía y fisiología animal, producción porcina, avícola y rumiantes menores adaptados a la zona centro-norte.' },
  { id: 34, ciclo: 'orientado', anio: 5, nombre: 'Suelos, Climatología y Sistemas de Riego', area: 'Formación Específica', orientacion: 'Agro y Ambiente', horas_catedra: 4, icono: 'Droplets', descripcion: 'Propiedades físicas y químicas del suelo, hidrología, riego por goteo y canales de riego tradicionales de Colonia Caroya.' },
  { id: 35, ciclo: 'orientado', anio: 5, nombre: 'Agroecología y Desarrollo Sustentable', area: 'Formación Específica', orientacion: 'Agro y Ambiente', horas_catedra: 4, icono: 'Flower2', descripcion: 'Principios agroecológicos, control biológico de plagas, corredores biológicos, soberanía alimentaria y circuitos cortos de comercialización.' },
  { id: 36, ciclo: 'orientado', anio: 5, nombre: 'Taller de Práctica Agropecuaria II (Granja y Vivero)', area: 'Práctica de Campo', orientacion: 'Agro y Ambiente', horas_catedra: 4, icono: 'Wrench', descripcion: 'Multiplicación agámica de plantas, injertos en vid, manejo sanitario de aves de corral y monitoreo de colmenas.' },

  // 6° AÑO (Ciclo Orientado en Agro y Ambiente)
  { id: 37, ciclo: 'orientado', anio: 6, nombre: 'Producción Animal II (Ganadería Sostenible)', area: 'Formación Específica', orientacion: 'Agro y Ambiente', horas_catedra: 4, icono: 'Tractor', descripcion: 'Manejo holístico de pastizales, bienestar animal, producción mixta y normativas sanitarias SENASA.' },
  { id: 38, ciclo: 'orientado', anio: 6, nombre: 'Procesos Agroindustriales (Conservas y Embutidos)', area: 'Formación Específica', orientacion: 'Agro y Ambiente', horas_catedra: 5, icono: 'Wheat', descripcion: 'Tecnología de alimentos: elaboración de salames caroyenses con Indicación Geográfica (IG), conservas de hortalizas y vinos artesanales.' },
  { id: 39, ciclo: 'orientado', anio: 6, nombre: 'Gestión y Legislación Ambiental', area: 'Formación Específica', orientacion: 'Agro y Ambiente', horas_catedra: 4, icono: 'FileText', descripcion: 'Ley Provincial 10.208 de Política Ambiental, evaluación de impacto ambiental (EIA), gestión de residuos y huella hídrica/carbono.' },
  { id: 40, ciclo: 'orientado', anio: 6, nombre: 'Formulación de Proyectos Agroambientales', area: 'Formación Específica', orientacion: 'Agro y Ambiente', horas_catedra: 4, icono: 'BarChart3', descripcion: 'Metodología de proyectos de inversión socioproductiva, estudio de mercado, análisis de costos y factibilidad técnica.' },
  { id: 41, ciclo: 'orientado', anio: 6, nombre: 'Economía Social y Cooperativismo', area: 'Formación General', orientacion: 'Agro y Ambiente', horas_catedra: 3, icono: 'HeartHandshake', descripcion: 'Doctrina cooperativa, mutualismo y el rol de las cooperativas agrícolas en la historia de Colonia Caroya.' },
  { id: 42, ciclo: 'orientado', anio: 6, nombre: 'Prácticas Profesionalizantes en Entorno Formativo', area: 'Práctica Profesionalizante', orientacion: 'Agro y Ambiente', horas_catedra: 6, icono: 'GraduationCap', descripcion: 'Integración en entornos socioproductivos reales: chacras locales, bodegas, viveros cooperativos y laboratorios ambientales.' },
];

export const INITIAL_CURRICULUM_CONTENIDOS = {
  26: {
    objetivos: [
      'Comprender los procesos morfofisiológicos esenciales de las plantas cultivadas en la región de Colonia Caroya y su respuesta a factores edafoclimáticos.',
      'Diseñar y ejecutar labores culturales apropiadas para cultivos hortícolas locales, respetando la estructura del suelo y optimizando el recurso hídrico.',
      'Fomentar la responsabilidad comunitaria y el trabajo colaborativo en el entorno formativo huerta escolar.',
      'Reconocer los principios de inocuidad alimentaria en la manipulación y cosecha de hortalizas frescas.'
    ],
    contenidos: [
      'Eje 1: Anatomía y Fisiología Vegetal - Estructura celular, fotosíntesis, transpiración y relaciones hídricas.',
      'Eje 2: Propagación y Almácigos - Sustratos orgánicos, desinfección preventiva, siembra directa y en bandejas.',
      'Eje 3: Manejo Cultural y Sanitario - Acolchados orgánicos (mulch), rotación de cultivos, asociaciones benéficas y monitoreo preventivo de plagas.',
      'Eje 4: Cosecha y Post-cosecha - Madurez comercial vs fisiológica, acondicionamiento y conservación para autoconsumo y feria escolar.'
    ]
  },
  35: {
    objetivos: [
      'Analizar críticamente el modelo agroindustrial convencional y fundamentar el diseño de agroecosistemas sustentables y resilientes.',
      'Diseñar planes de rotación y asociación de cultivos que favorezcan la biodiversidad funcional del suelo.',
      'Valorar las redes de comercio justo, ferias francas y el rescate de semillas nativas y criollas en Colonia Caroya.'
    ],
    contenidos: [
      'Eje 1: Principios y Dimensiones Agroecológicas - Conservación de la biodiversidad y reciclaje de biomasa.',
      'Eje 2: Biopreparados y Control Biológico - Purines fermentados, caldo sulfocálcico y trampas cromáticas.',
      'Eje 3: Agroecosistemas Complejos - Corredores biológicos polinizadores y cortinas rompevientos vegetales.'
    ]
  },
  38: {
    objetivos: [
      'Aplicar rigurosamente las Buenas Prácticas de Manufactura (BPM) y los principios de HACCP en la elaboración de alimentos.',
      'Reconocer el valor patrimonial e identitario del salame típico de Colonia Caroya con Indicación Geográfica protegida.',
      'Dominar técnicas de conservación por acidificación, esterilización térmica y maduración controlada.'
    ],
    contenidos: [
      'Eje 1: Conservación de Alimentos - Métodos térmicos, por salazón, fermentos y control de actividad acuosa (Aw).',
      'Eje 2: Elaboración de Chacinados Tradicionales - Selección de cortes, picado, condimentación caroyense y secado en sótano-cantina.',
      'Eje 3: Conservas Vegetales y Mermeladas - Esterilización en autoclave casero, sellado hermético y rotulado legal.'
    ]
  }
};

export const INITIAL_NORMATIVAS = [
  {
    id: 1,
    titulo: 'Diseño Curricular de Educación Secundaria - Ciclo Básico',
    tipo: 'diseno_curricular',
    resolucion_numero: 'Res. Min. 180/10',
    organismo: 'Ministerio de Educación de Córdoba - DGESec',
    url_oficial: 'http://www.igualdadycalidadcba.gov.ar/SIPEC-CBA/publicaciones/DisCurriculares/CicloBasico.php',
    archivo_pdf: 'diseno_curricular_ciclo_basico_cba.pdf',
    descripcion: 'Estructura curricular pedagógica oficial para 1°, 2° y 3° año del nivel secundario de la provincia de Córdoba.'
  },
  {
    id: 2,
    titulo: 'Diseño Curricular Ciclo Orientado - Agro y Ambiente',
    tipo: 'diseno_curricular',
    resolucion_numero: 'Res. Min. 251/14',
    organismo: 'Ministerio de Educación de Córdoba - DGESec',
    url_oficial: 'http://www.igualdadycalidadcba.gov.ar/SIPEC-CBA/publicaciones/DisCurriculares/CicloOrientado/AgroyAmbiente.php',
    archivo_pdf: 'diseno_curricular_agro_ambiente_cba.pdf',
    descripcion: 'Marco formativo pedagógico específico de la orientación Agro y Ambiente (4°, 5° y 6° año) para escuelas de Córdoba.'
  },
  {
    id: 3,
    titulo: 'Régimen Académico de la Educación Secundaria',
    tipo: 'regimen_academico',
    resolucion_numero: 'Res. Min. 732/17 y modif. Res. 555/22',
    organismo: 'Secretaría de Educación de Córdoba',
    url_oficial: 'http://www.igualdadycalidadcba.gov.ar/SIPEC-CBA/PolEstudiantiles/RegimenAcademico.php',
    archivo_pdf: 'regimen_academico_secundaria_cordoba.pdf',
    descripcion: 'Disposiciones normativas sobre ingreso, permanencia, evaluación formativa por capacidades, acreditación y promoción estudiantil.'
  },
  {
    id: 4,
    titulo: 'Progresiones de los Aprendizajes en Educación Secundaria',
    tipo: 'progresion',
    resolucion_numero: 'Documento Técnico 2024',
    organismo: 'Subsecretaría de Promoción de Igualdad y Calidad Educativa',
    url_oficial: 'http://www.igualdadycalidadcba.gov.ar/SIPEC-CBA/PolEstudiantiles/Progresiones.php',
    archivo_pdf: 'progresiones_aprendizajes_cba.pdf',
    descripcion: 'Criterios e indicadores de progresión de aprendizajes por ciclos para el acompañamiento de trayectorias escolares.'
  },
  {
    id: 5,
    titulo: 'Protocolo de Seguridad para Entornos Formativos y Prácticas de Campo',
    tipo: 'resolucion',
    resolucion_numero: 'Disposición DGESec 45/21',
    organismo: 'Dirección General de Educación Secundaria',
    url_oficial: 'http://www.igualdadycalidadcba.gov.ar/protocolos-seguridad.php',
    archivo_pdf: 'protocolo_seguridad_campo_ipem349.pdf',
    descripcion: 'Normas de bioseguridad, uso de indumentaria adecuada y EPP en huerta escolar, vivero y talleres agropecuarios.'
  }
];

export const INITIAL_CRONOGRAMA = [
  { id: 1, titulo: 'Presentación del Equipo Docente y Directivo', fecha_inicio: '2026-02-16', fecha_fin: '2026-02-20', tipo_evento: 'academico', descripcion: 'Acuerdos pedagógicos institucionales, revisión de planificaciones y bienvenida.' },
  { id: 2, titulo: 'Período de Ambientación para 1° Año', fecha_inicio: '2026-02-23', fecha_fin: '2026-02-25', tipo_evento: 'academico', descripcion: 'Jornadas de integración para estudiantes ingresantes al IPEM 349 Giovanni Bosco.' },
  { id: 3, titulo: 'Inicio de Clases - Ciclo Básico y Orientado', fecha_inicio: '2026-03-02', fecha_fin: '2026-03-02', tipo_evento: 'inicio_clases', descripcion: 'Apertura oficial del Ciclo Lectivo 2026 en todos los turnos y divisiones.' },
  { id: 4, titulo: 'Receso Escolar de Invierno', fecha_inicio: '2026-07-06', fecha_fin: '2026-07-17', tipo_evento: 'receso', descripcion: 'Vacaciones de invierno según calendario oficial del Ministerio de Educación de Córdoba.' },
  { id: 5, titulo: 'Semana de la Juventud y Agroecología Caroyense', fecha_inicio: '2026-09-21', fecha_fin: '2026-09-25', tipo_evento: 'academico', descripcion: 'Feria de semillas, muestra de proyectos agroambientales y actividades culturales de los estudiantes.' },
  { id: 6, titulo: 'Fecha Límite: Carga de Planificaciones Ajustadas', fecha_inicio: '2026-10-16', fecha_fin: '2026-10-16', tipo_evento: 'evaluacion', descripcion: 'Cierre de modificaciones requeridas por Coordinación y Dirección en la plataforma.' },
  { id: 7, titulo: 'Cierre de Clases Regulares', fecha_inicio: '2026-12-04', fecha_fin: '2026-12-04', tipo_evento: 'cierre', descripcion: 'Finalización del período ordinario de dictado de clases.' },
  { id: 8, titulo: 'Período de Coloquios y Exámenes de Diciembre', fecha_inicio: '2026-12-07', fecha_fin: '2026-12-18', tipo_evento: 'evaluacion', descripcion: 'Instancia de fortalecimiento y acreditación de aprendizajes pendientes.' },
  { id: 9, titulo: 'Acto de Colación de Egresados 6° Año', fecha_inicio: '2026-12-21', fecha_fin: '2026-12-21', tipo_evento: 'cierre', descripcion: 'Entrega de certificados y distinciones a la promoción de Técnicos Agro y Ambiente.' }
];

export const INITIAL_USERS = [
  { id: 1, nombre: 'Administrador', apellido: 'General', dni: '11111111', email: 'admin@ipem349.edu.ar', rol: 'admin', cargo_descripcion: 'Administrador de Plataforma', estado: 'aprobado' },
  { id: 2, nombre: 'María Silvina', apellido: 'Rossi', dni: '22222222', email: 'direccion@ipem349.edu.ar', rol: 'director', cargo_descripcion: 'Directora Titular IPEM 349', estado: 'aprobado' },
  { id: 3, nombre: 'Lucas', apellido: 'Fantini', dni: '33333333', email: 'coordinacion.agro@ipem349.edu.ar', rol: 'coordinador', cargo_descripcion: 'Coordinador Ciclo Orientado Agro y Ambiente', estado: 'aprobado' },
  { id: 4, nombre: 'Estela', apellido: 'Copetti', dni: '44444444', email: 'docente.agro@ipem349.edu.ar', rol: 'docente', cargo_descripcion: 'Docente de Producción Vegetal y Huerta', estado: 'aprobado' },
  { id: 5, nombre: 'Carlos', apellido: "D'Olivo", dni: '55555555', email: 'docente.quimica@ipem349.edu.ar', rol: 'docente', cargo_descripcion: 'Docente de Química y Ciencias Naturales', estado: 'aprobado' },
  { id: 6, nombre: 'Luciana', apellido: 'Grión', dni: '66666666', email: 'docente.pendiente@ipem349.edu.ar', rol: 'docente', cargo_descripcion: 'Docente de Biología Aplicada (En espera)', estado: 'pendiente' },
];

export const INITIAL_PLANIFICACIONES = [
  {
    id: 1,
    docente_id: 4,
    espacio_id: 26,
    anio_lectivo: 2026,
    division: 'A',
    docente_nombre: 'Estela Copetti',
    espacio_nombre: 'Producción Vegetal I (Cultivos de la Región y Horticultura)',
    espacio_anio: 4,
    espacio_ciclo: 'orientado',
    espacio_area: 'Formación Específica',
    diagnostico: 'El grupo de 4° Año "A" está integrado por 26 estudiantes con gran entusiasmo por el trabajo a campo y la huerta agroecológica. Poseen conocimientos previos heterogéneos, por lo que se priorizará el trabajo colaborativo en parejas pedagógicas.',
    objetivos: [
      'Comprender los procesos morfofisiológicos esenciales de las plantas cultivadas en la región de Colonia Caroya y su respuesta a factores edafoclimáticos.',
      'Diseñar y ejecutar labores culturales apropiadas para cultivos hortícolas locales, respetando la estructura del suelo y optimizando el recurso hídrico.',
      'Fomentar la responsabilidad comunitaria y el trabajo colaborativo en el entorno formativo huerta escolar.'
    ],
    contenidos: [
      'Eje 1: Anatomía y Fisiología Vegetal - Fotosíntesis, relaciones hídricas y transpiración.',
      'Eje 2: Propagación y Almácigos - Siembra en bandejas, sustratos con compostaje propio.',
      'Eje 3: Manejo Cultural y Sanitario - Acolchados orgánicos, rotación de cultivos y control preventivo.'
    ],
    estrategias: 'Aprendizaje Basado en Proyectos (ABP), prácticas guiadas en canteros de la institución, bitácoras de campo individuales y registro fotográfico de evolución vegetal.',
    formatos_pedagogicos: 'Asignatura teórica combinada con Taller de Huerta y Prácticas en Entorno Formativo.',
    recursos: 'Canteros experimentales de la escuela, sistema de riego por goteo, compostera comunitaria, microscopios del laboratorio de ciencias, semillas del Programa ProHuerta/INTA Jesús María.',
    evaluacion: 'Evaluación formativa y continua mediante rúbricas de desempeño en campo (60%) e informes técnicos de seguimiento de cultivo (40%). Autoevaluación al cierre de cada ciclo vegetativo.',
    bibliografia: 'Diseño Curricular de Córdoba para Ciclo Orientado en Agro y Ambiente (Res. Min. 251/14); Manual de Horticultura Agroecológica INTA; Guía de Producción Frutihortícola de Colonia Caroya.',
    estado: 'aprobada',
    devolucion_directivo: 'Excelente propuesta Profesora Copetti. Se valora especialmente la articulación entre el marco teórico y la labor concreta en los canteros del IPEM 349, integrando las particularidades de nuestra comunidad de Colonia Caroya.',
    revisado_por: 2,
    fecha_revision: '2026-03-10'
  }
];

export const INITIAL_SECUENCIAS = [
  {
    id: 1,
    docente_id: 4,
    espacio_id: 26,
    titulo: 'Técnicas de Compostaje Termofílico y Análisis de Fertilidad Biológica',
    espacio_nombre: 'Producción Vegetal I (Cultivos de la Región)',
    espacio_anio: 4,
    docente_nombre: 'Estela Copetti',
    fundamentacion: 'En el marco del modelo agroecológico caroyense, la gestión de restos de poda y residuos orgánicos permite regenerar la fertilidad del suelo escolar sin recurrir a fertilizantes químicos de síntesis.',
    propositos: 'Promover en los estudiantes el reconocimiento de la microbiota benéfica del suelo y el dominio de los parámetros de temperatura, humedad y relación C/N en pilas de compostaje.',
    tiempo_estimado: '3 semanas (6 clases de 80 min)',
    actividades_inicio: 'Proyección de imágenes de pilas de compostaje en chacras locales. Lluvia de ideas sobre descomposición aeróbica vs anaeróbica y medición inicial de pH de suelo.',
    actividades_desarrollo: 'Armado de pila de compost termófila en el predio del IPEM 349. Monitoreo semanal con termómetro de punzón y control de humedad mediante la prueba del puño. Tomas de muestra para observación microscópica de microorganismos.',
    actividades_cierre: 'Tamizado del abono maduro, cálculo del rendimiento y aplicación en canteros de hortalizas de hoja. Elaboración de infografía digital para concientización comunitaria.',
    evaluacion: 'Rúbrica de trabajo experimental en campo y presentación de bitácora grupal de mediciones.',
    recursos: 'Termómetros de compostaje, restos de poda, guano compostado, agua, tamiz, microscopios del colegio.',
    tipo_articulacion: 'declarativa',
    articulacion_eje: 'Suelo vivo y microbiología aplicada a la agricultura sostenible',
    articulacion_materias: 'Química Aplicada y Bioquímica (4° Año)',
    estado: 'aprobada',
    devolucion_directivo: 'Propuesta sólida, perfectamente contextualizada a las necesidades formativas de nuestro entorno agropecuario.'
  }
];

export const INITIAL_PROYECTOS_ARTICULADOS = [
  {
    id: 1,
    creador_id: 4,
    creador_nombre: 'Estela Copetti',
    titulo: 'Huerta Agroecológica y Análisis Físico-Químico del Suelo Caroyense',
    descripcion: 'Proyecto integrador entre Producción Vegetal, Química Aplicada y Matemática para determinar la calidad de los suelos agrícolas de Colonia Caroya y diseñar planes de rotación agroecológica eficientes.',
    problema_contexto: 'Degradación de nutrientes y compactación del suelo por décadas de labranza intensiva y uso reiterado de agroquímicos en quintas periurbanas.',
    producto_final: 'Informe edafológico completo con mapa de fertilidad de los canteros escolares y guía de fertilización orgánica para pequeños productores de Colonia Caroya.',
    estado: 'en_desarrollo',
    participantes: [
      {
        id: 1,
        docente_id: 4,
        docente_nombre: 'Estela Copetti',
        espacio_id: 26,
        espacio_nombre: 'Producción Vegetal I (4° Año)',
        aporte_especifico: 'Siembra de leguminosas fijadoras de nitrógeno (Vicia villosa) y monitoreo de nódulos radiculares con bacterias Rhizobium.',
        aprendizajes_articulados: 'Relación simbiótica planta-bacteria y manejo agroecológico de la fertilidad.',
        estado_aporte: 'completado'
      },
      {
        id: 2,
        docente_id: 5,
        docente_nombre: "Carlos D'Olivo",
        espacio_id: 28,
        espacio_nombre: 'Química Aplicada y Bioquímica (4° Año)',
        aporte_especifico: 'Toma de muestras edáficas y titulación volumétrica para cuantificación de materia orgánica y pH en el laboratorio escolar.',
        aprendizajes_articulados: 'Reacciones ácido-base, soluciones valoradas y reactivos orgánicos en química.',
        estado_aporte: 'completado'
      }
    ]
  }
];

export const INITIAL_HITOS = [
  { id: 1, docente_id: 4, espacio_id: 26, espacio_nombre: 'Producción Vegetal I', titulo: 'Muestreo de suelo en parcela hortícola', descripcion: 'Práctica a campo con barreno en canteros de 4° Año A.', tipo: 'practica_campo', fecha: '2026-03-16', completado: true },
  { id: 2, docente_id: 4, espacio_id: 26, espacio_nombre: 'Producción Vegetal I', titulo: 'Taller de siembra de almácigos otoño-invierno', descripcion: 'Siembra escalonada de lechuga, acelga y espinaca en bandejas de 128 celdas.', tipo: 'practica_campo', fecha: '2026-03-25', completado: true },
  { id: 3, docente_id: 4, espacio_id: 26, espacio_nombre: 'Producción Vegetal I', titulo: '1° Hito Evaluativo: Fisiología de la germinación', descripcion: 'Evaluación escrita y de reconocimiento de plántulas en laboratorio.', tipo: 'hito_evaluativo', fecha: '2026-04-14', completado: false },
  { id: 4, docente_id: 4, espacio_id: 26, espacio_nombre: 'Producción Vegetal I', titulo: 'Visita técnica a vivero cooperativo de vid de Colonia Caroya', descripcion: 'Observación de pie americano y técnicas de injerto en campo de productor local.', tipo: 'practica_campo', fecha: '2026-05-18', completado: false },
  { id: 5, docente_id: 4, espacio_id: 26, espacio_nombre: 'Producción Vegetal I', titulo: 'Entrega de Informe Final de Cultivo (1° Semestre)', descripcion: 'Defensa oral grupal de las bitácoras hortícolas frente al grupo.', tipo: 'entrega_proyecto', fecha: '2026-06-22', completado: false }
];
