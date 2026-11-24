-- ==============================================================================
-- SISTEMA DE GESTIÓN CURRICULAR Y PLANIFICACIÓN INSTITUCIONAL
-- IPEM N° 349 "GIOVANNI BOSCO" - COLONIA CAROYA, CÓRDOBA
-- ORIENTACIÓN: AGRO Y AMBIENTE
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `precursora_acciones`;
DROP TABLE IF EXISTS `configuracion_institucional`;
DROP TABLE IF EXISTS `proyecto_historial`;
DROP TABLE IF EXISTS `proyecto_encuentros`;
DROP TABLE IF EXISTS `proyecto_articulado_participantes`;
DROP TABLE IF EXISTS `proyectos_articulados`;
DROP TABLE IF EXISTS `intentos_login`;
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
  `campo` ENUM('general', 'especifica', 'opcion_institucional') NOT NULL DEFAULT 'general',
  `campo_aprendizaje` ENUM('lenguajes_comunicacion', 'artes_movimiento', 'sociales_humanas', 'naturales_exactas') NULL, -- Res. SE 88/2025, Anexo IV
  `orientacion` VARCHAR(100) NOT NULL DEFAULT 'Agro y Ambiente',
  `horas_catedra` INT NOT NULL DEFAULT 4,
  `descripcion` TEXT,
  `icono` VARCHAR(50) DEFAULT 'BookOpen',
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
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
  `fuente` VARCHAR(30) NOT NULL DEFAULT 'institucional', -- pda_2025 | diseno_2011_2015 | institucional
  `vigente` TINYINT(1) NOT NULL DEFAULT 1,
  `meta` TEXT NULL,               -- meta por ciclo (Progresiones)
  `indicadores` LONGTEXT NULL,    -- JSON: indicadores de logro (Progresiones)
  `pagina` VARCHAR(60) NULL,
  INDEX (`espacio_id`, `vigente`),
  FOREIGN KEY (`espacio_id`) REFERENCES `espacios_curriculares`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. TABLA: normativas_documentos (Repositorio Normativo y Diseños Curriculares)
-- ------------------------------------------------------------------------------
CREATE TABLE `normativas_documentos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `titulo` VARCHAR(200) NOT NULL,
  `tipo` ENUM('diseno_curricular', 'resolucion', 'regimen_academico', 'progresion', 'ley', 'orientacion', 'planificacion') NOT NULL,
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
  FOREIGN KEY (`subido_por`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL,
  INDEX (`tipo`),
  INDEX (`fecha_publicacion`)
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
  `fundamentacion` TEXT,
  `metas` LONGTEXT,            -- JSON: lista de metas por ciclo (texto)
  `objetivos` LONGTEXT,        -- JSON: lista de objetivos (texto)
  `contenidos` LONGTEXT,       -- JSON: [{texto, meta?, indicadores:[...], fuente?, contenido_id?, prioridad: esencial|complementario}]
  `capacidades` LONGTEXT,      -- JSON: capacidades fundamentales
  `transversales` LONGTEXT,    -- JSON: [{tema, como}]
  `unidades` LONGTEXT,         -- JSON: [{titulo, periodo, horas, contenidos, actividades}]
  `estrategias` TEXT,
  `formatos_pedagogicos` LONGTEXT, -- JSON: lista de formatos
  `recursos` TEXT,
  `articulacion` TEXT,
  `evaluacion_criterios` TEXT,
  `evaluacion_instrumentos` TEXT,
  `evaluacion_momentos` TEXT,
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
  `planificacion_id` INT NULL,
  `fundamentacion` TEXT,
  `objetivos` TEXT,
  `contenidos` LONGTEXT,       -- JSON: igual que en planificaciones_anuales
  `capacidades` LONGTEXT,      -- JSON
  `formato` VARCHAR(60) NULL,
  `tiempo_estimado` VARCHAR(100) DEFAULT NULL,
  `agrupamientos` TEXT,
  `ambiente` TEXT,
  `clases` LONGTEXT,           -- JSON: [{titulo, momento: inicio|desarrollo|cierre, duracion, actividades, recursos, evaluativa}]
  `producto` TEXT,
  `evaluacion_criterios` TEXT,
  `evaluacion_instrumentos` TEXT,
  `recursos` TEXT,
  `bibliografia` TEXT,
  `tipo_articulacion` ENUM('ninguna', 'declarativa', 'colaborativa') NOT NULL DEFAULT 'ninguna',
  `articulacion_eje` VARCHAR(255) NULL,
  `articulacion_materias` VARCHAR(255) NULL,
  `estado` ENUM('borrador', 'pendiente_revision', 'aprobada', 'requiere_ajustes') NOT NULL DEFAULT 'borrador',
  `devolucion_directivo` TEXT NULL,
  `fecha_creacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`docente_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`espacio_id`) REFERENCES `espacios_curriculares`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`planificacion_id`) REFERENCES `planificaciones_anuales`(`id`) ON DELETE SET NULL,
  INDEX (`docente_id`),
  INDEX (`estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9b. TABLA: intentos_login (límite de intentos fallidos)
-- ------------------------------------------------------------------------------
CREATE TABLE `intentos_login` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(150) NOT NULL,
  `ip` VARCHAR(45) NOT NULL,
  `creado_en` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_intentos` (`email`, `ip`, `creado_en`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. TABLA: proyectos_articulados (Articulación colaborativa y trabajo integrado)
-- Fuentes: Res. SE 88/2025 Anexo VI (trabajo integrado en tiempo compartido, rige 2026),
-- Res. SE-SIDPyTE 06/2025 Anexo V y documento "Alternativas para la enseñanza" (2013).
-- ------------------------------------------------------------------------------
CREATE TABLE `proyectos_articulados` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `creador_id` INT NOT NULL,
  `titulo` VARCHAR(200) NOT NULL,
  `modalidad` ENUM('declarativa', 'tiempo_compartido', 'proyecto_interdisciplinario', 'jornada') NOT NULL DEFAULT 'declarativa',
  `anio_lectivo` SMALLINT NOT NULL,
  `curso` TINYINT NOT NULL,
  `division` VARCHAR(10) NULL,
  `vigencia` ENUM('anual', 'cuatrimestre', 'etapa', 'fechas') NOT NULL DEFAULT 'anual',
  `fecha_inicio` DATE NULL,
  `fecha_fin` DATE NULL,
  `eje` TEXT NOT NULL,                       -- tema, desafío, problema o pregunta común
  `fundamentacion` TEXT NULL,
  `marco_integrador` TEXT NULL,
  `objetivos` TEXT NULL,
  `capacidades` LONGTEXT NULL,               -- JSON: lista de textos
  `transversales` LONGTEXT NULL,             -- JSON: lista de textos (EDS, ESI, etc.)
  `producto_final` TEXT NULL,
  `horas_compartidas` INT NOT NULL DEFAULT 0,
  `organizacion` TEXT NULL,                  -- tiempos, espacios, agrupamientos
  `evaluacion_criterios` TEXT NULL,
  `evaluacion_instrumentos` TEXT NULL,
  `evaluacion_momentos` TEXT NULL,
  `evaluacion_instancia` TEXT NULL,          -- evaluación de la instancia (se pide al cerrar)
  `estado` ENUM('borrador', 'en_acuerdo', 'conformado', 'presentado', 'autorizado', 'observado', 'en_ejecucion', 'cerrado') NOT NULL DEFAULT 'borrador',
  `devolucion` TEXT NULL,
  `revisado_por` INT NULL,
  `fecha_presentacion` DATETIME NULL,
  `fecha_revision` DATETIME NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`creador_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`revisado_por`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL,
  INDEX (`estado`),
  INDEX (`creador_id`),
  INDEX (`anio_lectivo`, `curso`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. TABLA: proyecto_articulado_participantes (aporte de cada docente desde su espacio)
-- ------------------------------------------------------------------------------
CREATE TABLE `proyecto_articulado_participantes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `proyecto_id` INT NOT NULL,
  `docente_id` INT NOT NULL,
  `espacio_id` INT NOT NULL,
  `invitacion` ENUM('invitado', 'aceptado', 'rechazado') NOT NULL DEFAULT 'aceptado',
  `invitado_por` INT NULL,
  `tema` VARCHAR(250) NULL,                  -- tema libre (ej. "cuerpo humano", "funciones lineales")
  `contenidos` LONGTEXT NULL,                -- JSON: contenidos del catálogo de su espacio (con indicadores) y propios
  `actividades` TEXT NULL,
  `recursos` TEXT NULL,
  `saberes_propios` TEXT NULL,               -- saberes que garantiza en sus horas no compartidas
  `evaluacion_aporte` TEXT NULL,
  `horas_cede` INT NOT NULL DEFAULT 0,
  `disponibilidad` TEXT NULL,
  `conformidad` TINYINT(1) NOT NULL DEFAULT 0,
  `fecha_conformidad` DATETIME NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`proyecto_id`) REFERENCES `proyectos_articulados`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`docente_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`espacio_id`) REFERENCES `espacios_curriculares`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uq_participante` (`proyecto_id`, `docente_id`, `espacio_id`),
  INDEX (`docente_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 12. TABLA: proyecto_encuentros (plan de trabajo)
-- ------------------------------------------------------------------------------
CREATE TABLE `proyecto_encuentros` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `proyecto_id` INT NOT NULL,
  `fecha` DATE NULL,
  `horas` INT NOT NULL DEFAULT 1,
  `titulo` VARCHAR(200) NOT NULL,
  `actividades` TEXT NULL,
  `docentes` LONGTEXT NULL,                  -- JSON: ids de docentes a cargo
  `contenidos` LONGTEXT NULL,                -- JSON: contenidos que se trabajan
  `realizado` TINYINT(1) NOT NULL DEFAULT 0,
  `evidencia` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`proyecto_id`) REFERENCES `proyectos_articulados`(`id`) ON DELETE CASCADE,
  INDEX (`proyecto_id`, `fecha`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 13. TABLA: proyecto_historial (registro de acciones)
-- ------------------------------------------------------------------------------
CREATE TABLE `proyecto_historial` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `proyecto_id` INT NOT NULL,
  `usuario_id` INT NULL,
  `accion` VARCHAR(40) NOT NULL,
  `detalle` TEXT NULL,
  `fecha` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`proyecto_id`) REFERENCES `proyectos_articulados`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL,
  INDEX (`proyecto_id`, `fecha`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 14. TABLA: configuracion_institucional (ruta TransFORMAR@Cba por ciclo lectivo)
-- ------------------------------------------------------------------------------
CREATE TABLE `configuracion_institucional` (
  `anio_lectivo` SMALLINT PRIMARY KEY,
  `ruta` ENUM('ruta_1', 'ruta_2') NOT NULL DEFAULT 'ruta_1', -- ruta_2 = institución precursora
  `observaciones` TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 15. TABLA: precursora_acciones (seguimiento de las líneas de la Ruta 2)
-- ------------------------------------------------------------------------------
CREATE TABLE `precursora_acciones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `anio_lectivo` SMALLINT NOT NULL,
  `linea` VARCHAR(40) NOT NULL,
  `estado` ENUM('pendiente', 'en_curso', 'implementada', 'no_aplica') NOT NULL DEFAULT 'pendiente',
  `responsable` VARCHAR(150) NULL,
  `evidencia` TEXT NULL,
  `fecha_prevista` DATE NULL,
  `actualizado_por` INT NULL,
  `actualizado_en` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_linea` (`anio_lectivo`, `linea`),
  FOREIGN KEY (`actualizado_por`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL
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
-- ------------------------------------------------------------------------------
-- MALLA CURRICULAR OFICIAL DE CÓRDOBA - IPEM 349 "GIOVANNI BOSCO"
-- CICLO BÁSICO (1° a 3° Año) + CICLO ORIENTADO EN AGRO Y AMBIENTE (4° a 6° Año)
-- ------------------------------------------------------------------------------
-- ------------------------------------------------------------------------------
-- OBJETIVOS Y APRENDIZAJES/CONTENIDOS PRECUALIFICADOS (Córdoba)
-- ------------------------------------------------------------------------------
-- Para Agroecología y Desarrollo Sustentable (ID 35)
-- Para Procesos Agroindustriales (ID 38)
-- ------------------------------------------------------------------------------
-- REPOSITORIO NORMATIVO Y DOCUMENTOS MINISTERIALES (Córdoba)
-- ------------------------------------------------------------------------------
-- ------------------------------------------------------------------------------
-- CRONOGRAMA INSTITUCIONAL DEL CICLO LECTIVO (Córdoba 2026/2027)
-- ------------------------------------------------------------------------------
-- ------------------------------------------------------------------------------
-- PLANIFICACIÓN ANUAL DE EJEMPLO (Producción Vegetal I - 4° Año)
-- ------------------------------------------------------------------------------
-- ------------------------------------------------------------------------------
-- SECUENCIA DIDÁCTICA DE EJEMPLO
-- ------------------------------------------------------------------------------
-- ------------------------------------------------------------------------------
-- PROYECTO ARTICULADO COLABORATIVO (Ejemplo de Convocatoria Interdisciplinaria)
-- ------------------------------------------------------------------------------
-- ------------------------------------------------------------------------------
-- AGENDA E HITOS DE DOCENTE DE EJEMPLO
-- ------------------------------------------------------------------------------
