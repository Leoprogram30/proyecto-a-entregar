-- ==============================================================================
-- SISTEMA DE GESTIÓN CURRICULAR Y PLANIFICACIÓN INSTITUCIONAL
-- IPEM N° 349 "GIOVANNI BOSCO" - COLONIA CAROYA, CÓRDOBA
-- ORIENTACIÓN: AGRO Y AMBIENTE
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `proyecto_articulado_participantes`;
DROP TABLE IF EXISTS `proyectos_articulados`;
DROP TABLE IF EXISTS `secuencia_articulaciones`;
DROP TABLE IF EXISTS `secuencias_didacticas`;
DROP TABLE IF EXISTS `agenda_hitos`;
DROP TABLE IF EXISTS `planificacion_comentarios`;
DROP TABLE IF EXISTS `planificaciones_anuales`;
DROP TABLE IF EXISTS `cronograma_institucional`;
DROP TABLE IF EXISTS `normativas_documentos`;
DROP TABLE IF EXISTS `curriculum_contenidos`;
DROP TABLE IF EXISTS `espacios_curriculares`;
DROP TABLE IF EXISTS `usuarios`;

-- ------------------------------------------------------------------------------
-- 1. TABLA: usuarios
-- ------------------------------------------------------------------------------
CREATE TABLE `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `apellido` VARCHAR(100) NOT NULL,
  `dni` VARCHAR(20) NOT NULL UNIQUE,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `rol` ENUM('admin', 'director', 'coordinador', 'docente') NOT NULL DEFAULT 'docente',
  `cargo_descripcion` VARCHAR(150) DEFAULT 'Docente de Nivel Secundario',
  `estado` ENUM('pendiente', 'aprobado', 'rechazado') NOT NULL DEFAULT 'pendiente',
  `aprobado_por` INT NULL,
  `fecha_registro` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (`email`),
  INDEX (`dni`),
  INDEX (`estado`),
  INDEX (`rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. TABLA: espacios_curriculares (Malla Curricular Córdoba - Agro y Ambiente)
-- ------------------------------------------------------------------------------
CREATE TABLE `espacios_curriculares` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ciclo` ENUM('basico', 'orientado') NOT NULL,
  `anio` INT NOT NULL, -- 1 al 6
  `nombre` VARCHAR(150) NOT NULL,
  `area` VARCHAR(100) NOT NULL,
  `orientacion` VARCHAR(100) NOT NULL DEFAULT 'Agro y Ambiente',
  `horas_catedra` INT NOT NULL DEFAULT 4,
  `descripcion` TEXT,
  `icono` VARCHAR(50) DEFAULT 'BookOpen',
  INDEX (`ciclo`),
  INDEX (`anio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. TABLA: curriculum_contenidos (Objetivos y Contenidos oficiales de Córdoba)
-- ------------------------------------------------------------------------------
CREATE TABLE `curriculum_contenidos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `espacio_id` INT NOT NULL,
  `tipo` ENUM('objetivo', 'eje_contenido', 'progresion') NOT NULL,
  `titulo` VARCHAR(200) NOT NULL,
  `descripcion` TEXT NOT NULL,
  FOREIGN KEY (`espacio_id`) REFERENCES `espacios_curriculares`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. TABLA: normativas_documentos (Repositorio Normativo y Diseños Curriculares)
-- ------------------------------------------------------------------------------
CREATE TABLE `normativas_documentos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `titulo` VARCHAR(200) NOT NULL,
  `tipo` ENUM('diseno_curricular', 'resolucion', 'regimen_academico', 'progresion') NOT NULL,
  `resolucion_numero` VARCHAR(50) DEFAULT NULL,
  `organismo` VARCHAR(150) DEFAULT 'Ministerio de Educación de Córdoba - DGESec',
  `url_oficial` VARCHAR(300) DEFAULT NULL,
  `archivo_pdf` VARCHAR(255) DEFAULT NULL,
  `espacio_id` INT NULL,
  `descripcion` TEXT,
  `fecha_publicacion` DATE NULL,
  `subido_por` INT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`espacio_id`) REFERENCES `espacios_curriculares`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`subido_por`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. TABLA: cronograma_institucional (Calendario Oficial Ciclo Lectivo Córdoba)
-- ------------------------------------------------------------------------------
CREATE TABLE `cronograma_institucional` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `titulo` VARCHAR(150) NOT NULL,
  `descripcion` TEXT,
  `tipo_evento` ENUM('inicio_clases', 'receso', 'evaluacion', 'feriado', 'cierre', 'academico') NOT NULL,
  `fecha_inicio` DATE NOT NULL,
  `fecha_fin` DATE NOT NULL,
  `anio_lectivo` INT NOT NULL DEFAULT 2026,
  `obligatorio` TINYINT(1) DEFAULT 1,
  INDEX (`anio_lectivo`),
  INDEX (`fecha_inicio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. TABLA: planificaciones_anuales (Wizard Paso a Paso)
-- ------------------------------------------------------------------------------
CREATE TABLE `planificaciones_anuales` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `docente_id` INT NOT NULL,
  `espacio_id` INT NOT NULL,
  `anio_lectivo` INT NOT NULL DEFAULT 2026,
  `division` VARCHAR(10) NOT NULL DEFAULT 'A',
  `diagnostico` TEXT,
  `objetivos` LONGTEXT, -- Lista de objetivos seleccionados y personalizados (JSON o texto)
  `contenidos` LONGTEXT, -- Ejes y aprendizajes seleccionados
  `estrategias` TEXT, -- Estrategias metodológicas
  `formatos_pedagogicos` VARCHAR(255) DEFAULT 'Asignatura / Taller / Laboratorio / Entorno Formativo Campo',
  `recursos` TEXT,
  `evaluacion` TEXT, -- Criterios e instrumentos de evaluación
  `bibliografia` TEXT,
  `estado` ENUM('borrador', 'pendiente_revision', 'aprobada', 'requiere_ajustes') NOT NULL DEFAULT 'borrador',
  `devolucion_directivo` TEXT NULL,
  `revisado_por` INT NULL,
  `fecha_revision` DATETIME NULL,
  `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`docente_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`espacio_id`) REFERENCES `espacios_curriculares`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`revisado_por`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL,
  INDEX (`estado`),
  INDEX (`docente_id`),
  INDEX (`espacio_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. TABLA: planificacion_comentarios (Historial de Devoluciones Directivas)
-- ------------------------------------------------------------------------------
CREATE TABLE `planificacion_comentarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `planificacion_id` INT NOT NULL,
  `usuario_id` INT NOT NULL,
  `comentario` TEXT NOT NULL,
  `estado_asociado` ENUM('pendiente_revision', 'aprobada', 'requiere_ajustes') NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`planificacion_id`) REFERENCES `planificaciones_anuales`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. TABLA: agenda_hitos (Agenda Docente e Hitos con Seguimiento Visual)
-- ------------------------------------------------------------------------------
CREATE TABLE `agenda_hitos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `docente_id` INT NOT NULL,
  `espacio_id` INT NOT NULL,
  `titulo` VARCHAR(150) NOT NULL,
  `descripcion` TEXT,
  `tipo` ENUM('clase', 'practica_campo', 'hito_evaluativo', 'entrega_proyecto') NOT NULL DEFAULT 'clase',
  `fecha` DATE NOT NULL,
  `completado` TINYINT(1) NOT NULL DEFAULT 0,
  `fecha_completado` DATETIME NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`docente_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`espacio_id`) REFERENCES `espacios_curriculares`(`id`) ON DELETE CASCADE,
  INDEX (`docente_id`),
  INDEX (`fecha`),
  INDEX (`completado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. TABLA: secuencias_didacticas (Constructor de Secuencias Didácticas)
-- ------------------------------------------------------------------------------
CREATE TABLE `secuencias_didacticas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `docente_id` INT NOT NULL,
  `espacio_id` INT NOT NULL,
  `titulo` VARCHAR(200) NOT NULL,
  `fundamentacion` TEXT,
  `propositos` TEXT,
  `tiempo_estimado` VARCHAR(100) DEFAULT '4 clases (8 horas cátedra)',
  `actividades_inicio` TEXT,
  `actividades_desarrollo` TEXT,
  `actividades_cierre` TEXT,
  `evaluacion` TEXT,
  `recursos` TEXT,
  `tipo_articulacion` ENUM('ninguna', 'declarativa', 'colaborativa') NOT NULL DEFAULT 'ninguna',
  `articulacion_eje` VARCHAR(255) NULL,
  `articulacion_materias` VARCHAR(255) NULL,
  `estado` ENUM('borrador', 'pendiente_revision', 'aprobada', 'requiere_ajustes') NOT NULL DEFAULT 'borrador',
  `devolucion_directivo` TEXT NULL,
  `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`docente_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`espacio_id`) REFERENCES `espacios_curriculares`(`id`) ON DELETE CASCADE,
  INDEX (`docente_id`),
  INDEX (`estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. TABLA: proyectos_articulados (Articulación Colaborativa Guiada)
-- ------------------------------------------------------------------------------
CREATE TABLE `proyectos_articulados` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `creador_id` INT NOT NULL,
  `titulo` VARCHAR(200) NOT NULL,
  `descripcion` TEXT NOT NULL,
  `problema_contexto` TEXT NOT NULL, -- Problema ambiental o socioproductivo de Colonia Caroya
  `producto_final` TEXT NOT NULL,
  `estado` ENUM('convocatoria', 'en_desarrollo', 'finalizado') NOT NULL DEFAULT 'convocatoria',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`creador_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. TABLA: proyecto_articulado_participantes (Aportes específicos por materia)
-- ------------------------------------------------------------------------------
CREATE TABLE `proyecto_articulado_participantes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `proyecto_id` INT NOT NULL,
  `docente_id` INT NOT NULL,
  `espacio_id` INT NOT NULL,
  `aporte_especifico` TEXT,
  `aprendizajes_articulados` TEXT,
  `estado_aporte` ENUM('pendiente', 'completado') NOT NULL DEFAULT 'pendiente',
  `fecha_aporte` DATETIME NULL,
  FOREIGN KEY (`proyecto_id`) REFERENCES `proyectos_articulados`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`docente_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`espacio_id`) REFERENCES `espacios_curriculares`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- DATOS SEMILLA (SEED DATA)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- USUARIOS INICIALES (Password hashes con bcrypt para PHP)
-- admin123     -> $2y$10$p07.S75h3iIkZkLG5HL8duc9vrnOyveMxtQn7Gazv5muf.j5RK976
-- director123  -> $2y$10$GXcZFaN7g4SC9EPNnj2hIe1zuvHWRc6tJHcMPD7RVWOC4YgvJQoFy
-- docente123   -> $2y$10$l5bNG2cAbw/rl8.nKm9Qeek/Zusd1sXNzzGmgw30daznQ08CcYYKG
-- ------------------------------------------------------------------------------
INSERT INTO `usuarios` (`id`, `nombre`, `apellido`, `dni`, `email`, `password_hash`, `rol`, `cargo_descripcion`, `estado`) VALUES
(1, 'Administrador', 'General', '11111111', 'admin@ipem349.edu.ar', '$2y$10$p07.S75h3iIkZkLG5HL8duc9vrnOyveMxtQn7Gazv5muf.j5RK976', 'admin', 'Administrador de Plataforma IPEM 349', 'aprobado'),
(2, 'María Silvina', 'Rossi', '22222222', 'direccion@ipem349.edu.ar', '$2y$10$GXcZFaN7g4SC9EPNnj2hIe1zuvHWRc6tJHcMPD7RVWOC4YgvJQoFy', 'director', 'Directora Titular - IPEM 349', 'aprobado'),
(3, 'Lucas', 'Fantini', '33333333', 'coordinacion.agro@ipem349.edu.ar', '$2y$10$GXcZFaN7g4SC9EPNnj2hIe1zuvHWRc6tJHcMPD7RVWOC4YgvJQoFy', 'coordinador', 'Coordinador Ciclo Orientado Agro y Ambiente', 'aprobado'),
(4, 'Estela', 'Copetti', '44444444', 'docente.agro@ipem349.edu.ar', '$2y$10$l5bNG2cAbw/rl8.nKm9Qeek/Zusd1sXNzzGmgw30daznQ08CcYYKG', 'docente', 'Docente de Producción Vegetal y Agroecología', 'aprobado'),
(5, 'Carlos', 'D\'Olivo', '55555555', 'docente.quimica@ipem349.edu.ar', '$2y$10$l5bNG2cAbw/rl8.nKm9Qeek/Zusd1sXNzzGmgw30daznQ08CcYYKG', 'docente', 'Docente de Química y Ciencias Naturales', 'aprobado'),
(6, 'Luciana', 'Grión', '66666666', 'docente.pendiente@ipem349.edu.ar', '$2y$10$l5bNG2cAbw/rl8.nKm9Qeek/Zusd1sXNzzGmgw30daznQ08CcYYKG', 'docente', 'Docente de Biología Aplicada (Solicitud Pendiente)', 'pendiente');

-- ------------------------------------------------------------------------------
-- MALLA CURRICULAR OFICIAL DE CÓRDOBA - IPEM 349 "GIOVANNI BOSCO"
-- CICLO BÁSICO (1° a 3° Año) + CICLO ORIENTADO EN AGRO Y AMBIENTE (4° a 6° Año)
-- ------------------------------------------------------------------------------
INSERT INTO `espacios_curriculares` (`id`, `ciclo`, `anio`, `nombre`, `area`, `orientacion`, `horas_catedra`, `descripcion`, `icono`) VALUES
-- 1° AÑO (Ciclo Básico)
(1, 'basico', 1, 'Lengua y Literatura', 'Formación General', 'General', 5, 'Comprensión y producción de textos orales y escritos, lectura literaria.', 'BookOpen'),
(2, 'basico', 1, 'Matemática', 'Formación General', 'General', 5, 'Números naturales y enteros, geometría en el plano, resolución de problemas.', 'Calculator'),
(3, 'basico', 1, 'Ciencias Naturales - Biología', 'Ciencias Naturales', 'General', 4, 'Los seres vivos: diversidad, unidad, interrelaciones y cambios.', 'Leaf'),
(4, 'basico', 1, 'Ciencias Sociales - Geografía', 'Ciencias Sociales', 'General', 3, 'El espacio geográfico mundial y de Argentina, recursos naturales.', 'Globe'),
(5, 'basico', 1, 'Ciencias Sociales - Historia', 'Ciencias Sociales', 'General', 3, 'De las primeras sociedades humanas a las sociedades del mundo antiguo.', 'Clock'),
(6, 'basico', 1, 'Educación Tecnológica', 'Tecnología', 'General', 3, 'Procesos tecnológicos, materiales, herramientas y transformación productiva.', 'Cpu'),
(7, 'basico', 1, 'Lengua Extranjera - Inglés', 'Lenguas', 'General', 3, 'Comunicación básica contextualizada, comprensión auditiva y escrita.', 'Languages'),
(8, 'basico', 1, 'Educación Artística: Artes Visuales', 'Artes', 'General', 3, 'Lenguaje visual, técnicas plásticas y apreciación estética contextual.', 'Palette'),
(9, 'basico', 1, 'Formación Ética y Ciudadana', 'Humanidades', 'General', 3, 'Derechos humanos, convivencia democrática, valores y normas sociales.', 'Shield'),

-- 2° AÑO (Ciclo Básico)
(10, 'basico', 2, 'Lengua y Literatura', 'Formación General', 'General', 5, 'Tipologías textuales, análisis de obras literarias argentinas y universales.', 'BookOpen'),
(11, 'basico', 2, 'Matemática', 'Formación General', 'General', 5, 'Números racionales, álgebra básica, ecuaciones, proporcionalidad y estadística.', 'Calculator'),
(12, 'basico', 2, 'Ciencias Naturales - Física', 'Ciencias Naturales', 'General', 4, 'Movimiento, fuerzas, energía, calor y transformaciones mecánicas.', 'Zap'),
(13, 'basico', 2, 'Ciencias Naturales - Química', 'Ciencias Naturales', 'General', 4, 'Estructura de la materia, tabla periódica, sustancias y soluciones.', 'FlaskConical'),
(14, 'basico', 2, 'Geografía', 'Ciencias Sociales', 'General', 3, 'Geografía de América: ambientes, recursos y procesos socioproductivos.', 'Globe'),
(15, 'basico', 2, 'Historia', 'Ciencias Sociales', 'General', 3, 'América colonial y transformaciones sociopolíticas hacia la modernidad.', 'Clock'),
(16, 'basico', 2, 'Educación Tecnológica', 'Tecnología', 'General', 3, 'Sistemas técnicos, automatismos y tecnología para el desarrollo regional.', 'Cpu'),
(17, 'basico', 2, 'Inglés', 'Lenguas', 'General', 3, 'Producción comunicativa intermedia y vocabulario funcional.', 'Languages'),
(18, 'basico', 2, 'Educación Artística: Música', 'Artes', 'General', 3, 'Ritmo, melodía, expresiones sonoras y patrimonio musical folklórico.', 'Music'),

-- 3° AÑO (Ciclo Básico)
(19, 'basico', 3, 'Lengua y Literatura', 'Formación General', 'General', 5, 'Ensayos breves, argumentación, análisis crítico del discurso mediático.', 'BookOpen'),
(20, 'basico', 3, 'Matemática', 'Formación General', 'General', 5, 'Funciones lineales y cuadráticas, trigonometría básica y probabilidad.', 'Calculator'),
(21, 'basico', 3, 'Biología', 'Ciencias Naturales', 'General', 4, 'Genética básica, evolución de las especies y ecología de poblaciones.', 'Leaf'),
(22, 'basico', 3, 'Física y Química', 'Ciencias Naturales', 'General', 4, 'Reacciones químicas, leyes de los gases, trabajo y potencia.', 'Atom'),
(23, 'basico', 3, 'Geografía de Argentina y Córdoba', 'Ciencias Sociales', 'General', 3, 'Circuitos productivos provinciales, relieve, clima y ordenamiento territorial.', 'MapPin'),
(24, 'basico', 3, 'Historia Argentina', 'Ciencias Sociales', 'General', 3, 'Construcción del Estado nacional argentino y modelos agroexportadores.', 'Clock'),
(25, 'basico', 3, 'Ciudadanía y Participación', 'Humanidades', 'General', 3, 'Proyectos sociocomunitarios, participación juvenil y ecociudadanía.', 'Users'),

-- 4° AÑO (Ciclo Orientado en Agro y Ambiente)
(26, 'orientado', 4, 'Producción Vegetal I (Cultivos de la Región y Horticultura)', 'Formación Específica', 'Agro y Ambiente', 5, 'Morfología y fisiología vegetal, preparación de camas de siembra, cultivos hortícolas del cinturón verde y frutales tradicionales de Colonia Caroya.', 'Sprout'),
(27, 'orientado', 4, 'Ecología y Recursos Naturales', 'Formación Específica', 'Agro y Ambiente', 4, 'Dinámica de ecosistemas pampeanos y chaqueños, ciclos biogeoquímicos, biodiversidad y problemáticas de degradación ambiental.', 'Trees'),
(28, 'orientado', 4, 'Química Aplicada y Bioquímica', 'Formación Específica', 'Agro y Ambiente', 4, 'Compuestos orgánicos, biomoléculas en la producción agropecuaria, fitosanitarios y biopreparados.', 'FlaskConical'),
(29, 'orientado', 4, 'Física Ambiental y Meteorología', 'Formación Específica', 'Agro y Ambiente', 3, 'Fenómenos climáticos, radiación solar, humedad relativa, instrumental meteorológico y su impacto en cultivos.', 'Sun'),
(30, 'orientado', 4, 'Geografía Ambiental de Córdoba', 'Formación General', 'Agro y Ambiente', 3, 'Transformaciones territoriales por avance de la frontera agropecuaria en Córdoba y ordenamiento ambiental.', 'Globe'),
(31, 'orientado', 4, 'Taller de Práctica Agropecuaria I (Entorno Huerta)', 'Práctica de Campo', 'Agro y Ambiente', 4, 'Labores prácticas en la huerta escolar, compostaje, siembra escalonada y manejo de herramientas agrícolas.', 'Trowel'),

-- 5° AÑO (Ciclo Orientado en Agro y Ambiente)
(32, 'orientado', 5, 'Producción Vegetal II (Fruticultura y Vitivinicultura)', 'Formación Específica', 'Agro y Ambiente', 5, 'Sistemas de conducción de vid (espaldero caroyense), poda, variedades vitivinícolas locales (Frambua, Malbec), frutales de carozo y pepita.', 'Grape'),
(33, 'orientado', 5, 'Producción Animal I (Sistemas Pecuarios)', 'Formación Específica', 'Agro y Ambiente', 4, 'Anatomía y fisiología animal, producción porcina, avícola y rumiantes menores adaptados a la zona centro-norte.', 'PiggyBank'),
(34, 'orientado', 5, 'Suelos, Climatología y Sistemas de Riego', 'Formación Específica', 'Agro y Ambiente', 4, 'Propiedades físicas y químicas del suelo, hidrología, riego por goteo y canales de riego tradicionales de Colonia Caroya.', 'Droplets'),
(35, 'orientado', 5, 'Agroecología y Desarrollo Sustentable', 'Formación Específica', 'Agro y Ambiente', 4, 'Principios agroecológicos, control biológico de plagas, corredores biológicos, soberanía alimentaria y circuitos cortos de comercialización.', 'Flower2'),
(36, 'orientado', 5, 'Taller de Práctica Agropecuaria II (Entorno Granja y Vivero)', 'Práctica de Campo', 'Agro y Ambiente', 4, 'Multiplicación agámica de plantas, injertos en vid, manejo sanitario de aves de corral y monitoreo de colmenas.', 'Wrench'),

-- 6° AÑO (Ciclo Orientado en Agro y Ambiente)
(37, 'orientado', 6, 'Producción Animal II (Ganadería Sostenible y Bienestar)', 'Formación Específica', 'Agro y Ambiente', 4, 'Manejo holístico de pastizales, bienestar animal, producción mixta y normativas sanitarias SENASA.', 'Tractor'),
(38, 'orientado', 6, 'Procesos Agroindustriales (Conservas y Embutidos Tradicionales)', 'Formación Específica', 'Agro y Ambiente', 5, 'Tecnología de alimentos: elaboración de salames caroyenses con Indicación Geográfica (IG), conservas de hortalizas, dulces artesanales y vinos caseros.', 'Wheat'),
(39, 'orientado', 6, 'Gestión y Legislación Ambiental', 'Formación Específica', 'Agro y Ambiente', 4, 'Ley Provincial 10.208 de Política Ambiental, evaluación de impacto ambiental (EIA), gestión de residuos y huella hídrica/carbono.', 'FileText'),
(40, 'orientado', 6, 'Formulación y Evaluación de Proyectos Agroambientales', 'Formación Específica', 'Agro y Ambiente', 4, 'Metodología de proyectos de inversión socioproductiva, estudio de mercado, análisis de costos y factibilidad técnica.', 'BarChart3'),
(41, 'orientado', 6, 'Economía Social y Cooperativismo Agropecuario', 'Formación General', 'Agro y Ambiente', 3, 'Doctrina cooperativa, mutualismo, rol de las cooperativas agrícolas en la historia y economía de Colonia Caroya.', 'HeartHandshake'),
(42, 'orientado', 6, 'Prácticas Profesionalizantes en Entorno Formativo', 'Práctica Profesionalizante', 'Agro y Ambiente', 6, 'Integración de saberes en entornos socioproductivos reales: chacras locales, bodegas, viveros cooperativos y laboratorios ambientales.', 'GraduationCap');

-- ------------------------------------------------------------------------------
-- OBJETIVOS Y APRENDIZAJES/CONTENIDOS PRECUALIFICADOS (Córdoba)
-- ------------------------------------------------------------------------------
INSERT INTO `curriculum_contenidos` (`espacio_id`, `tipo`, `titulo`, `descripcion`) VALUES
-- Para Producción Vegetal I (ID 26)
(26, 'objetivo', 'Comprensión fisiológica', 'Comprender los procesos morfofisiológicos esenciales de las plantas cultivadas en la región de Colonia Caroya y su respuesta a factores edafoclimáticos.'),
(26, 'objetivo', 'Manejo agronómico sostenible', 'Diseñar y ejecutar labores culturales apropiadas para cultivos hortícolas locales, respetando la estructura del suelo y optimizando el recurso hídrico.'),
(26, 'eje_contenido', 'Eje 1: Anatomía y Fisiología Vegetal', 'Estructura celular, fotosíntesis, transpiración, respiración y relaciones hídricas en especies de interés hortícola.'),
(26, 'eje_contenido', 'Eje 2: Propagación y Almácigos', 'Sustratos, desinfección preventiva, siembra directa y en bandejas de germinación. Cuidado de plantines bajo cubierta.'),
(26, 'eje_contenido', 'Eje 3: Manejo Cultural y Sanitario', 'Sistemas de labranza mínima, aporques, tutorados, mulching orgánico y monitoreo de adversidades fitosanitarias.');

-- Para Agroecología y Desarrollo Sustentable (ID 35)
INSERT INTO `curriculum_contenidos` (`espacio_id`, `tipo`, `titulo`, `descripcion`) VALUES
(35, 'objetivo', 'Transición Agroecológica', 'Analizar críticamente el modelo agroindustrial convencional y fundamentar el diseño de agroecosistemas sustentables resilientes al cambio climático.'),
(35, 'objetivo', 'Soberanía y Vínculo Comunitario', 'Valorar las redes de comercio justo, ferias francas y el rescate de semillas nativas y criollas en la comunidad de Colonia Caroya.'),
(35, 'eje_contenido', 'Eje 1: Principios y Dimensiones Agroecológicas', 'Bases ecológicas, socioeconómicas y culturales. Conservación de la biodiversidad funcional y reciclaje de biomasa.'),
(35, 'eje_contenido', 'Eje 2: Biopreparados y Control Biológico', 'Elaboración de purines, caldos minerales (sulfocálcico, bordelés) y trampas cromáticas para manejo integrado.'),
(35, 'eje_contenido', 'Eje 3: Agroecosistemas Complejos', 'Asociación y rotación de cultivos, policultivos, cortinas rompevientos y corredores biológicos polinizadores.');

-- Para Procesos Agroindustriales (ID 38)
INSERT INTO `curriculum_contenidos` (`espacio_id`, `tipo`, `titulo`, `descripcion`) VALUES
(38, 'objetivo', 'Inocuidad y Buenas Prácticas', 'Aplicar rigurosamente las Buenas Prácticas de Manufactura (BPM) y los principios de Análisis de Peligros y Puntos Críticos de Control (HACCP) en la elaboración de alimentos.'),
(38, 'objetivo', 'Identidad Territorial y Valor Agregado', 'Reconocer el valor patrimonial e identitario del salame típico de Colonia Caroya con Indicación Geográfica protegida.'),
(38, 'eje_contenido', 'Eje 1: Conservación de Alimentos', 'Métodos térmicos, por deshidratación, salazón, acidificación y azucarado. Microbiología industrial de fermentos.'),
(38, 'eje_contenido', 'Eje 2: Elaboración de Chacinados y Embutidos', 'Selección de cortes, picado, condimentación tradicional caroyense, embutido en tripa natural, estufado y maduración en sótano cantina.');

-- ------------------------------------------------------------------------------
-- REPOSITORIO NORMATIVO Y DOCUMENTOS MINISTERIALES (Córdoba)
-- ------------------------------------------------------------------------------
INSERT INTO `normativas_documentos` (`id`, `titulo`, `tipo`, `resolucion_numero`, `organismo`, `url_oficial`, `archivo_pdf`, `espacio_id`, `descripcion`, `fecha_publicacion`) VALUES
(1, 'Diseño Curricular de Educación Secundaria - Ciclo Básico', 'diseno_curricular', 'Res. Min. 180/10', 'Ministerio de Educación de Córdoba - DGESec', 'http://www.igualdadycalidadcba.gov.ar/SIPEC-CBA/publicaciones/DisCurriculares/CicloBasico.php', 'diseno_curricular_ciclo_basico_cba.pdf', NULL, 'Estructura curricular pedagógica oficial para 1°, 2° y 3° año del nivel secundario de la provincia de Córdoba.', '2010-06-15'),
(2, 'Diseño Curricular Ciclo Orientado - Agro y Ambiente', 'diseno_curricular', 'Res. Min. 251/14', 'Ministerio de Educación de Córdoba - DGESec', 'http://www.igualdadycalidadcba.gov.ar/SIPEC-CBA/publicaciones/DisCurriculares/CicloOrientado/AgroyAmbiente.php', 'diseno_curricular_agro_ambiente_cba.pdf', NULL, 'Marco formativo pedagógico específico de la orientación Agro y Ambiente (4°, 5° y 6° año) para escuelas de Córdoba.', '2014-04-22'),
(3, 'Régimen Académico de la Educación Secundaria', 'regimen_academico', 'Res. Min. 732/17 y modif. Res. 555/22', 'Secretaría de Educación de la Provincia de Córdoba', 'http://www.igualdadycalidadcba.gov.ar/SIPEC-CBA/PolEstudiantiles/RegimenAcademico.php', 'regimen_academico_secundaria_cordoba.pdf', NULL, 'Disposiciones normativas sobre ingreso, permanencia, evaluación por capacidades, acreditación y promoción estudiantil.', '2022-03-01'),
(4, 'Progresiones de los Aprendizajes en Educación Secundaria', 'progresion', 'Documento de Trabajo 2024', 'Subsecretaría de Promoción de Igualdad y Calidad Educativa', 'http://www.igualdadycalidadcba.gov.ar/SIPEC-CBA/PolEstudiantiles/Progresiones.php', 'progresiones_aprendizajes_cba.pdf', NULL, 'Criterios de progresión curricular por ciclos formativos para la evaluación formativa y el seguimiento de trayectorias.', '2024-02-15'),
(5, 'Protocolo de Seguridad para Entornos Formativos y Prácticas de Campo', 'resolucion', 'Disposición DGESec 45/21', 'Dirección General de Educación Secundaria Córdoba', 'http://www.igualdadycalidadcba.gov.ar/protocolos-seguridad-talleres.php', 'protocolo_seguridad_campo_ipem349.pdf', 31, 'Normas de bioseguridad, uso de EPP (elementos de protección personal) en huerta, vivero y talleres agropecuarios.', '2021-08-10');

-- ------------------------------------------------------------------------------
-- CRONOGRAMA INSTITUCIONAL DEL CICLO LECTIVO (Córdoba 2026/2027)
-- ------------------------------------------------------------------------------
INSERT INTO `cronograma_institucional` (`id`, `titulo`, `descripcion`, `tipo_evento`, `fecha_inicio`, `fecha_fin`, `anio_lectivo`, `obligatorio`) VALUES
(1, 'Presentación del Equipo Docente y Directivo', 'Reunión de personal, acuerdos pedagógicos institucionales y planificación de bienvenida.', 'academico', '2026-02-16', '2026-02-20', 2026, 1),
(2, 'Período de Ambientación para 1° Año', 'Jornadas de integración para ingresantes al Ciclo Básico del IPEM 349 Giovanni Bosco.', 'academico', '2026-02-23', '2026-02-25', 2026, 1),
(3, 'Inicio de Clases - 1° a 6° Año', 'Apertura formal del Ciclo Lectivo regular para todos los cursos.', 'inicio_clases', '2026-03-02', '2026-03-02', 2026, 1),
(4, 'Receso Escolar de Invierno', 'Vacaciones de invierno para estudiantes y docentes según calendario provincial.', 'receso', '2026-07-06', '2026-07-17', 2026, 1),
(5, 'Semana de la Juventud y la Agroecología Caroyense', 'Exposición de proyectos ambientales, feria de semillas y actividades estudiantiles.', 'academico', '2026-09-21', '2026-09-25', 2026, 0),
(6, 'Entrega de Planificaciones Anuales Ajustadas', 'Fecha límite para cargar modificaciones sugeridas por el Equipo Directivo en la plataforma.', 'evaluacion', '2026-10-16', '2026-10-16', 2026, 1),
(7, 'Cierre de Clases Regulares', 'Finalización formal del dictado de contenidos del Ciclo Lectivo.', 'cierre', '2026-12-04', '2026-12-04', 2026, 1),
(8, 'Coloquios y Exámenes de Diciembre', 'Instancia de fortalecimiento y evaluación final de aprendizajes para estudiantes regulares y previos.', 'evaluacion', '2026-12-07', '2026-12-18', 2026, 1),
(9, 'Acto de Colación de 6° Año y Cierre de Ciclo', 'Entrega de diplomas a los egresados de la Orientación Agro y Ambiente.', 'cierre', '2026-12-21', '2026-12-21', 2026, 1);

-- ------------------------------------------------------------------------------
-- PLANIFICACIÓN ANUAL DE EJEMPLO (Producción Vegetal I - 4° Año)
-- ------------------------------------------------------------------------------
INSERT INTO `planificaciones_anuales` (`id`, `docente_id`, `espacio_id`, `anio_lectivo`, `division`, `diagnostico`, `objetivos`, `contenidos`, `estrategias`, `formatos_pedagogicos`, `recursos`, `evaluacion`, `bibliografia`, `estado`, `devolucion_directivo`, `revisado_por`, `fecha_revision`) VALUES
(1, 4, 26, 2026, 'A', 
'El grupo de 4° Año "A" está conformado por 26 estudiantes que ingresan al Ciclo Orientado. Muestran gran interés por las tareas prácticas en la huerta escolar y la tradición productiva caroyense, aunque se requiere fortalecer el registro metódico en libretas de campo y el manejo seguro de herramientas agrícolas.',
'["Comprender los procesos morfofisiológicos esenciales de las plantas cultivadas en la región de Colonia Caroya y su respuesta a factores edafoclimáticos.","Diseñar y ejecutar labores culturales apropiadas para cultivos hortícolas locales, respetando la estructura del suelo y optimizando el recurso hídrico.","Fomentar la responsabilidad comunitaria y el trabajo colaborativo en el entorno formativo huerta."]',
'["Eje 1: Anatomía y Fisiología Vegetal - Fotosíntesis, relaciones hídricas y transpiración.","Eje 2: Propagación y Almácigos - Siembra en bandejas, sustratos con compostaje propio.","Eje 3: Manejo Cultural y Sanitario - Acolchados orgánicos, rotación de cultivos y control preventivo."]',
'Método de proyectos productivos, aprendizaje basado en problemas de campo (ABP), demostraciones prácticas in situ en la huerta institucional y registro en bitácoras agroambientales.',
'Asignatura teórica combinada con Taller de Huerta y Prácticas en Entorno Formativo.',
'Canteros experimentales de la escuela, sistema de riego por goteo, compostera comunitaria, microscopios del laboratorio de ciencias, semillas del Programa ProHuerta/INTA Jesús María.',
'Evaluación formativa y continua mediante rúbricas de desempeño en campo (60%) e informes técnicos de seguimiento de cultivo (40%). Autoevaluación al cierre de cada ciclo vegetativo.',
'Diseño Curricular de Córdoba para Ciclo Orientado en Agro y Ambiente (Res. Min. 251/14); Manual de Horticultura Agroecológica INTA; Guía de Producción Frutihortícola de Colonia Caroya.',
'aprobada',
'Excelente planificación Profesora Copetti. Se valora especialmente la articulación entre el marco teórico y la labor concreta en los canteros del IPEM 349, integrando las particularidades de nuestra comunidad de Colonia Caroya.',
2, '2026-03-10 14:30:00');

-- ------------------------------------------------------------------------------
-- SECUENCIA DIDÁCTICA DE EJEMPLO
-- ------------------------------------------------------------------------------
INSERT INTO `secuencias_didacticas` (`id`, `docente_id`, `espacio_id`, `titulo`, `fundamentacion`, `propositos`, `tiempo_estimado`, `actividades_inicio`, `actividades_desarrollo`, `actividades_cierre`, `evaluacion`, `recursos`, `tipo_articulacion`, `articulacion_eje`, `articulacion_materias`, `estado`, `devolucion_directivo`) VALUES
(1, 4, 26, 'Técnicas de Compostaje Termofílico y Análisis de Fertilidad Biológica',
'En el marco del modelo agroecológico caroyense, la gestión de restos de poda y residuos orgánicos permite regenerar la fertilidad del suelo escolar sin recurrir a fertilizantes químicos de síntesis.',
'Promover en los estudiantes el reconocimiento de la microbiota benéfica del suelo y el dominio de los parámetros de temperatura, humedad y relación C/N en pilas de compostaje.',
'3 semanas (6 clases de 80 min)',
'Proyección de imágenes de pilas de compostaje en chacras locales. Lluvia de ideas sobre descomposición aeróbica vs anaeróbica y medición inicial de pH de suelo.',
'Armado de pila de compost termófila en el predio del IPEM 349. Monitoreo semanal con termómetro de punzón y control de humedad mediante la prueba del puño. Tomas de muestra para observación microscópica de microorganismos.',
'Tamizado del abono maduro, cálculo del rendimiento y aplicación en canteros de hortalizas de hoja. Elaboración de infografía digital para concientización comunitaria.',
'Rúbrica de trabajo experimental en campo y presentación de bitácora grupal de mediciones.',
'Termómetros de compostaje, restos de poda, guano compostado, agua, tamiz, microscopios del colegio.',
'declarativa',
'Suelo vivo y microbiología aplicada a la agricultura sostenible',
'Química Aplicada y Bioquímica (4° Año)',
'aprobada',
'Propuesta sólida, perfectamente contextualizada a las necesidades formativas de nuestro entorno agropecuario.');

-- ------------------------------------------------------------------------------
-- PROYECTO ARTICULADO COLABORATIVO (Ejemplo de Convocatoria Interdisciplinaria)
-- ------------------------------------------------------------------------------
INSERT INTO `proyectos_articulados` (`id`, `creador_id`, `titulo`, `descripcion`, `problema_contexto`, `producto_final`, `estado`) VALUES
(1, 4, 'Huerta Agroecológica y Análisis Físico-Químico del Suelo Caroyense',
'Proyecto integrador entre Producción Vegetal, Química Aplicada y Matemática para determinar la calidad de los suelos agrícolas de Colonia Caroya y diseñar planes de rotación agroecológica eficientes.',
'Degradación de nutrientes y compactación del suelo por décadas de labranza intensiva y uso reiterado de agroquímicos en quintas periurbanas.',
'Informe edafológico completo con mapa de fertilidad de los canteros escolares y guía de fertilización orgánica para pequeños productores de Colonia Caroya.',
'en_desarrollo');

INSERT INTO `proyecto_articulado_participantes` (`id`, `proyecto_id`, `docente_id`, `espacio_id`, `aporte_especifico`, `aprendizajes_articulados`, `estado_aporte`, `fecha_aporte`) VALUES
(1, 1, 4, 26, 'Siembra de leguminosas fijadoras de nitrógeno (Vicia villosa) y monitoreo de nódulos radiculares con bacterias Rhizobium.', 'Relación simbiótica planta-bacteria y manejo agroecológico de la fertilidad.', 'completado', '2026-03-12 10:00:00'),
(2, 1, 5, 28, 'Toma de muestras edáficas y titulación volumétrica para cuantificación de materia orgánica y pH en el laboratorio escolar.', 'Reacciones ácido-base, soluciones valoradas y reactivos orgánicos en química.', 'completado', '2026-03-15 11:30:00');

-- ------------------------------------------------------------------------------
-- AGENDA E HITOS DE DOCENTE DE EJEMPLO
-- ------------------------------------------------------------------------------
INSERT INTO `agenda_hitos` (`id`, `docente_id`, `espacio_id`, `titulo`, `descripcion`, `tipo`, `fecha`, `completado`, `fecha_completado`) VALUES
(1, 4, 26, 'Muestreo de suelo en parcela hortícola', 'Práctica a campo con barreno en canteros de 4° Año A.', 'practica_campo', '2026-03-16', 1, '2026-03-16 12:00:00'),
(2, 4, 26, 'Taller de siembra de almácigos otoño-invierno', 'Siembra escalonada de lechuga, acelga y espinaca en bandejas de 128 celdas.', 'practica_campo', '2026-03-25', 1, '2026-03-25 10:30:00'),
(3, 4, 26, '1° Hito Evaluativo: Fisiología de la germinación', 'Evaluación escrita y de reconocimiento de plántulas en laboratorio.', 'hito_evaluativo', '2026-04-14', 0, NULL),
(4, 4, 26, 'Visita técnica a vivero cooperativo de vid de Colonia Caroya', 'Observación de pie americano y técnicas de injerto en campo de productor local.', 'practica_campo', '2026-05-18', 0, NULL),
(5, 4, 26, 'Entrega de Informe Final de Cultivo (1° Semestre)', 'Defensa oral grupal de las bitácoras hortícolas frente al grupo.', 'entrega_proyecto', '2026-06-22', 0, NULL);

