<?php
/**
 * Inicializador automático de SQLite para desarrollo local sin MySQL
 * IPEM N° 349 "Giovanni Bosco"
 */

declare(strict_types=1);

function initSqliteDatabase(PDO $pdo): void {
    $pdo->exec('PRAGMA foreign_keys = ON;');

    $queries = [
        "CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            apellido TEXT NOT NULL,
            dni TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            rol TEXT NOT NULL DEFAULT 'docente',
            cargo_descripcion TEXT DEFAULT 'Docente de Nivel Secundario',
            estado TEXT NOT NULL DEFAULT 'pendiente',
            aprobado_por INTEGER NULL,
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        "CREATE TABLE IF NOT EXISTS espacios_curriculares (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ciclo TEXT NOT NULL,
            anio INTEGER NOT NULL,
            nombre TEXT NOT NULL,
            area TEXT NOT NULL,
            orientacion TEXT NOT NULL DEFAULT 'Agro y Ambiente',
            horas_catedra INTEGER NOT NULL DEFAULT 4,
            descripcion TEXT,
            icono TEXT DEFAULT 'BookOpen'
        )",
        "CREATE TABLE IF NOT EXISTS curriculum_contenidos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            espacio_id INTEGER NOT NULL,
            tipo TEXT NOT NULL,
            titulo TEXT NOT NULL,
            descripcion TEXT NOT NULL,
            FOREIGN KEY (espacio_id) REFERENCES espacios_curriculares(id) ON DELETE CASCADE
        )",
        "CREATE TABLE IF NOT EXISTS normativas_documentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            tipo TEXT NOT NULL,
            resolucion_numero TEXT DEFAULT NULL,
            organismo TEXT DEFAULT 'Ministerio de Educación de Córdoba - DGESec',
            url_oficial TEXT DEFAULT NULL,
            archivo_pdf TEXT DEFAULT NULL,
            espacio_id INTEGER NULL,
            descripcion TEXT,
            fecha_publicacion DATE NULL,
            subido_por INTEGER NULL
        )",
        "CREATE TABLE IF NOT EXISTS cronograma_institucional (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            descripcion TEXT,
            tipo_evento TEXT NOT NULL,
            fecha_inicio DATE NOT NULL,
            fecha_fin DATE NOT NULL,
            anio_lectivo INTEGER NOT NULL DEFAULT 2026,
            obligatorio INTEGER DEFAULT 1
        )",
        "CREATE TABLE IF NOT EXISTS planificaciones_anuales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            docente_id INTEGER NOT NULL,
            espacio_id INTEGER NOT NULL,
            anio_lectivo INTEGER NOT NULL DEFAULT 2026,
            division TEXT NOT NULL DEFAULT 'A',
            diagnostico TEXT,
            objetivos TEXT,
            contenidos TEXT,
            estrategias TEXT,
            formatos_pedagogicos TEXT DEFAULT 'Asignatura / Taller / Laboratorio / Entorno Formativo Campo',
            recursos TEXT,
            evaluacion TEXT,
            bibliografia TEXT,
            estado TEXT NOT NULL DEFAULT 'borrador',
            devolucion_directivo TEXT NULL,
            revisado_por INTEGER NULL,
            fecha_revision DATETIME NULL,
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        "CREATE TABLE IF NOT EXISTS planificacion_comentarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            planificacion_id INTEGER NOT NULL,
            usuario_id INTEGER NOT NULL,
            comentario TEXT NOT NULL,
            estado_asociado TEXT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        "CREATE TABLE IF NOT EXISTS agenda_hitos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            docente_id INTEGER NOT NULL,
            espacio_id INTEGER NOT NULL,
            titulo TEXT NOT NULL,
            descripcion TEXT,
            tipo TEXT NOT NULL DEFAULT 'clase',
            fecha DATE NOT NULL,
            completado INTEGER NOT NULL DEFAULT 0,
            fecha_completado DATETIME NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        "CREATE TABLE IF NOT EXISTS secuencias_didacticas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            docente_id INTEGER NOT NULL,
            espacio_id INTEGER NOT NULL,
            titulo TEXT NOT NULL,
            fundamentacion TEXT,
            propositos TEXT,
            tiempo_estimado TEXT DEFAULT '4 clases (8 horas cátedra)',
            actividades_inicio TEXT,
            actividades_desarrollo TEXT,
            actividades_cierre TEXT,
            evaluacion TEXT,
            recursos TEXT,
            tipo_articulacion TEXT NOT NULL DEFAULT 'ninguna',
            articulacion_eje TEXT NULL,
            articulacion_materias TEXT NULL,
            estado TEXT NOT NULL DEFAULT 'borrador',
            devolucion_directivo TEXT NULL,
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        "CREATE TABLE IF NOT EXISTS proyectos_articulados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            creador_id INTEGER NOT NULL,
            titulo TEXT NOT NULL,
            descripcion TEXT NOT NULL,
            problema_contexto TEXT NOT NULL,
            producto_final TEXT NOT NULL,
            estado TEXT NOT NULL DEFAULT 'convocatoria',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )",
        "CREATE TABLE IF NOT EXISTS proyecto_articulado_participantes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            proyecto_id INTEGER NOT NULL,
            docente_id INTEGER NOT NULL,
            espacio_id INTEGER NOT NULL,
            aporte_especifico TEXT,
            aprendizajes_articulados TEXT,
            estado_aporte TEXT NOT NULL DEFAULT 'pendiente',
            fecha_aporte DATETIME NULL
        )"
    ];

    foreach ($queries as $sql) {
        $pdo->exec($sql);
    }

    // Insertar usuarios semilla
    $userCount = (int)$pdo->query('SELECT COUNT(*) FROM usuarios')->fetchColumn();
    if ($userCount === 0) {
        $passAdmin = '$2y$10$p07.S75h3iIkZkLG5HL8duc9vrnOyveMxtQn7Gazv5muf.j5RK976'; // admin123
        $passDir = '$2y$10$GXcZFaN7g4SC9EPNnj2hIe1zuvHWRc6tJHcMPD7RVWOC4YgvJQoFy';   // director123
        $passDoc = '$2y$10$l5bNG2cAbw/rl8.nKm9Qeek/Zusd1sXNzzGmgw30daznQ08CcYYKG';   // docente123

        $stmt = $pdo->prepare('INSERT INTO usuarios (id, nombre, apellido, dni, email, password_hash, rol, cargo_descripcion, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([1, 'Administrador', 'General', '11111111', 'admin@ipem349.edu.ar', $passAdmin, 'admin', 'Administrador de Plataforma IPEM 349', 'aprobado']);
        $stmt->execute([2, 'María Silvina', 'Rossi', '22222222', 'direccion@ipem349.edu.ar', $passDir, 'director', 'Directora Titular - IPEM 349', 'aprobado']);
        $stmt->execute([3, 'Lucas', 'Fantini', '33333333', 'coordinacion.agro@ipem349.edu.ar', $passDir, 'coordinador', 'Coordinador Ciclo Orientado Agro y Ambiente', 'aprobado']);
        $stmt->execute([4, 'Estela', 'Copetti', '44444444', 'docente.agro@ipem349.edu.ar', $passDoc, 'docente', 'Docente de Producción Vegetal y Agroecología', 'aprobado']);
        $stmt->execute([5, 'Carlos', "D'Olivo", '55555555', 'docente.quimica@ipem349.edu.ar', $passDoc, 'docente', 'Docente de Química y Ciencias Naturales', 'aprobado']);
        $stmt->execute([6, 'Luciana', 'Grión', '66666666', 'docente.pendiente@ipem349.edu.ar', $passDoc, 'docente', 'Docente de Biología Aplicada (Solicitud Pendiente)', 'pendiente']);

        // Insertar espacios curriculares de Córdoba
        $espacios = [
            // Ciclo Básico 1° Año
            [1, 'basico', 1, 'Lengua y Literatura', 'Formación General', 'General', 5, 'Comprensión y producción de textos orales y escritos.'],
            [2, 'basico', 1, 'Matemática', 'Formación General', 'General', 5, 'Números naturales y enteros, geometría en el plano.'],
            [3, 'basico', 1, 'Ciencias Naturales - Biología', 'Ciencias Naturales', 'General', 4, 'Los seres vivos: diversidad, unidad, interrelaciones.'],
            [4, 'basico', 1, 'Ciencias Sociales - Geografía', 'Ciencias Sociales', 'General', 3, 'El espacio geográfico mundial y de Argentina.'],
            [5, 'basico', 1, 'Ciencias Sociales - Historia', 'Ciencias Sociales', 'General', 3, 'De las primeras sociedades humanas al mundo antiguo.'],
            [6, 'basico', 1, 'Educación Tecnológica', 'Tecnología', 'General', 3, 'Procesos tecnológicos y materiales.'],
            [7, 'basico', 1, 'Lengua Extranjera - Inglés', 'Lenguas', 'General', 3, 'Comunicación básica contextualizada.'],
            // Ciclo Orientado Agro y Ambiente (4° a 6° Año)
            [26, 'orientado', 4, 'Producción Vegetal I (Cultivos de la Región y Horticultura)', 'Formación Específica', 'Agro y Ambiente', 5, 'Morfología y fisiología vegetal, preparación de suelo, cultivos hortícolas del cinturón verde y frutales tradicionales de Colonia Caroya.'],
            [27, 'orientado', 4, 'Ecología y Recursos Naturales', 'Formación Específica', 'Agro y Ambiente', 4, 'Dinámica de ecosistemas pampeanos y chaqueños, biodiversidad y problemáticas de degradación ambiental.'],
            [28, 'orientado', 4, 'Química Aplicada y Bioquímica', 'Formación Específica', 'Agro y Ambiente', 4, 'Compuestos orgánicos, biomoléculas en la producción agropecuaria, fitosanitarios y biopreparados.'],
            [29, 'orientado', 4, 'Física Ambiental y Meteorología', 'Formación Específica', 'Agro y Ambiente', 3, 'Fenómenos climáticos, radiación solar, humedad relativa e instrumental meteorológico.'],
            [30, 'orientado', 4, 'Geografía Ambiental de Córdoba', 'Formación General', 'Agro y Ambiente', 3, 'Transformaciones territoriales por avance de la frontera agropecuaria en Córdoba.'],
            [31, 'orientado', 4, 'Taller de Práctica Agropecuaria I (Entorno Huerta)', 'Práctica de Campo', 'Agro y Ambiente', 4, 'Labores prácticas en la huerta escolar, compostaje y herramientas agrícolas.'],
            [32, 'orientado', 5, 'Producción Vegetal II (Fruticultura y Vitivinicultura)', 'Formación Específica', 'Agro y Ambiente', 5, 'Sistemas de conducción de vid (espaldero caroyense), poda, variedades locales (Frambua, Malbec).'],
            [33, 'orientado', 5, 'Producción Animal I (Sistemas Pecuarios)', 'Formación Específica', 'Agro y Ambiente', 4, 'Anatomía y fisiología animal, producción porcina, avícola y rumiantes menores.'],
            [34, 'orientado', 5, 'Suelos, Climatología y Sistemas de Riego', 'Formación Específica', 'Agro y Ambiente', 4, 'Propiedades físicas y químicas del suelo, riego por goteo y canales de riego tradicionales de Caroya.'],
            [35, 'orientado', 5, 'Agroecología y Desarrollo Sustentable', 'Formación Específica', 'Agro y Ambiente', 4, 'Principios agroecológicos, control biológico de plagas, corredores biológicos y soberanía alimentaria.'],
            [38, 'orientado', 6, 'Procesos Agroindustriales (Conservas y Embutidos Tradicionales)', 'Formación Específica', 'Agro y Ambiente', 5, 'Elaboración de salames caroyenses con Indicación Geográfica (IG), conservas de hortalizas y vinos artesanales.'],
            [42, 'orientado', 6, 'Prácticas Profesionalizantes en Entorno Formativo', 'Práctica Profesionalizante', 'Agro y Ambiente', 6, 'Integración de saberes en entornos socioproductivos reales: chacras locales, bodegas, viveros y laboratorios.']
        ];

        $insEsp = $pdo->prepare('INSERT INTO espacios_curriculares (id, ciclo, anio, nombre, area, orientacion, horas_catedra, descripcion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        foreach ($espacios as $esp) {
            $insEsp->execute($esp);
        }

        // Insertar contenidos y objetivos
        $pdo->exec("INSERT INTO curriculum_contenidos (espacio_id, tipo, titulo, descripcion) VALUES
            (26, 'objetivo', 'Comprensión fisiológica', 'Comprender los procesos morfofisiológicos esenciales de las plantas cultivadas en la región de Colonia Caroya y su respuesta a factores edafoclimáticos.'),
            (26, 'objetivo', 'Manejo agronómico sostenible', 'Diseñar y ejecutar labores culturales apropiadas para cultivos hortícolas locales, respetando la estructura del suelo y optimizando el recurso hídrico.'),
            (26, 'eje_contenido', 'Eje 1: Anatomía y Fisiología Vegetal', 'Estructura celular, fotosíntesis, transpiración, respiración y relaciones hídricas.'),
            (26, 'eje_contenido', 'Eje 2: Propagación y Almácigos', 'Sustratos, desinfección preventiva, siembra directa y en bandejas de germinación.'),
            (26, 'eje_contenido', 'Eje 3: Manejo Cultural y Sanitario', 'Sistemas de labranza mínima, aporques, tutorados, mulching orgánico y monitoreo fitosanitario.')
        ");

        // Insertar normativas
        $pdo->exec("INSERT INTO normativas_documentos (id, titulo, tipo, resolucion_numero, organismo, url_oficial, descripcion, fecha_publicacion) VALUES
            (1, 'Diseño Curricular de Educación Secundaria - Ciclo Básico', 'diseno_curricular', 'Res. Min. 180/10', 'Ministerio de Educación de Córdoba - DGESec', 'http://www.igualdadycalidadcba.gov.ar/SIPEC-CBA/publicaciones/DisCurriculares/CicloBasico.php', 'Estructura curricular oficial para 1°, 2° y 3° año de secundaria.', '2010-06-15'),
            (2, 'Diseño Curricular Ciclo Orientado - Agro y Ambiente', 'diseno_curricular', 'Res. Min. 251/14', 'Ministerio de Educación de Córdoba - DGESec', 'http://www.igualdadycalidadcba.gov.ar/SIPEC-CBA/publicaciones/DisCurriculares/CicloOrientado/AgroyAmbiente.php', 'Marco formativo pedagógico específico de Agro y Ambiente (4°, 5° y 6° año).', '2014-04-22'),
            (3, 'Régimen Académico de la Educación Secundaria', 'regimen_academico', 'Res. Min. 732/17 y modif. Res. 555/22', 'Secretaría de Educación de Córdoba', 'http://www.igualdadycalidadcba.gov.ar/SIPEC-CBA/PolEstudiantiles/RegimenAcademico.php', 'Disposiciones normativas sobre ingreso, evaluación formativa por capacidades, acreditación y promoción.', '2022-03-01'),
            (4, 'Progresiones de los Aprendizajes en Educación Secundaria', 'progresion', 'Documento de Trabajo 2024', 'Subsecretaría de Promoción de Igualdad y Calidad Educativa', 'http://www.igualdadycalidadcba.gov.ar/SIPEC-CBA/PolEstudiantiles/Progresiones.php', 'Criterios de progresión curricular para evaluación formativa y trayectorias.', '2024-02-15')
        ");

        // Insertar cronograma escolar
        $pdo->exec("INSERT INTO cronograma_institucional (id, titulo, descripcion, tipo_evento, fecha_inicio, fecha_fin, anio_lectivo) VALUES
            (1, 'Presentación del Equipo Docente y Directivo', 'Reunión de personal y acuerdos pedagógicos.', 'academico', '2026-02-16', '2026-02-20', 2026),
            (2, 'Inicio de Clases - 1° a 6° Año', 'Apertura formal del Ciclo Lectivo regular.', 'inicio_clases', '2026-03-02', '2026-03-02', 2026),
            (3, 'Receso Escolar de Invierno', 'Vacaciones de invierno provinciales.', 'receso', '2026-07-06', '2026-07-17', 2026),
            (4, 'Coloquios y Exámenes de Diciembre', 'Instancia de fortalecimiento y evaluación final.', 'evaluacion', '2026-12-07', '2026-12-18', 2026),
            (5, 'Acto de Colación de Egresados 6° Año', 'Entrega de diplomas a técnicos en Agro y Ambiente.', 'cierre', '2026-12-21', '2026-12-21', 2026)
        ");

        // Insertar planificación de ejemplo
        $pdo->exec("INSERT INTO planificaciones_anuales (id, docente_id, espacio_id, anio_lectivo, division, diagnostico, objetivos, contenidos, estrategias, formatos_pedagogicos, recursos, evaluacion, bibliografia, estado, devolucion_directivo) VALUES (
            1, 4, 26, 2026, 'A',
            'El grupo de 4° Año A cuenta con 26 estudiantes con gran interés por las tareas prácticas en la huerta escolar y la tradición productiva caroyense.',
            '[\"Comprender los procesos morfofisiológicos esenciales de las plantas cultivadas en Colonia Caroya.\",\"Diseñar y ejecutar labores culturales apropiadas para cultivos hortícolas locales.\",\"Fomentar el trabajo colaborativo en la huerta escolar.\"]',
            '[\"Eje 1: Anatomía y Fisiología Vegetal - Fotosíntesis y relaciones hídricas.\",\"Eje 2: Propagación y Almácigos - Sustratos y siembra en bandejas.\",\"Eje 3: Manejo Cultural y Sanitario - Acolchados y rotación de cultivos.\"]',
            'Aprendizaje basado en proyectos (ABP), demostraciones prácticas in situ en la huerta y bitácora de campo.',
            'Asignatura teórica combinada con Taller de Huerta y Prácticas en Entorno Formativo.',
            'Canteros de la escuela, sistema de riego por goteo, compostera y semillas INTA Jesús María.',
            'Evaluación formativa continua según Res. 732/17. Rúbricas de desempeño en campo (60%) e informes técnicos (40%).',
            'Diseño Curricular Agro y Ambiente Córdoba (Res. Min. 251/14); Manual de Horticultura Agroecológica INTA.',
            'aprobada',
            'Excelente propuesta Profesora Copetti. Se valora la articulación con el entorno productivo de Colonia Caroya.'
        )");

        // Insertar secuencia didáctica de ejemplo
        $pdo->exec("INSERT INTO secuencias_didacticas (id, docente_id, espacio_id, titulo, fundamentacion, propositos, tiempo_estimado, actividades_inicio, actividades_desarrollo, actividades_cierre, evaluacion, recursos, tipo_articulacion, articulacion_eje, articulacion_materias, estado, devolucion_directivo) VALUES (
            1, 4, 26, 'Técnicas de Compostaje Termofílico y Análisis de Fertilidad Biológica',
            'En el marco del modelo agroecológico caroyense, la gestión de restos de poda permite regenerar la fertilidad del suelo escolar.',
            'Reconocer la microbiota benéfica del suelo y controlar temperatura y humedad en pilas de compostaje.',
            '3 semanas (6 clases)',
            'Indagación con fotos de chacras locales y medición de pH de suelo.',
            'Armado de pila termófila en el IPEM 349. Monitoreo con termómetro de punzón y observación de microorganismos.',
            'Tamizado del abono y aplicación en canteros de hortalizas de hoja.',
            'Rúbrica de trabajo práctico en campo y bitácora grupal.',
            'Termómetro de punzón, restos de poda, tamiz y agua.',
            'declarativa',
            'Suelo vivo y fertilidad agroecológica',
            'Química Aplicada y Bioquímica (4° Año)',
            'aprobada',
            'Propuesta contextualizada a nuestro entorno agropecuario.'
        )");

        // Insertar proyecto articulado colaborativo
        $pdo->exec("INSERT INTO proyectos_articulados (id, creador_id, titulo, descripcion, problema_contexto, producto_final, estado) VALUES (
            1, 4, 'Huerta Agroecológica y Análisis Físico-Químico del Suelo Caroyense',
            'Proyecto integrador entre Producción Vegetal y Química Aplicada para determinar la calidad de suelos de Colonia Caroya.',
            'Degradación de nutrientes y compactación del suelo por labranza intensiva.',
            'Informe edafológico completo con mapa de fertilidad de los canteros escolares.',
            'en_desarrollo'
        )");

        $pdo->exec("INSERT INTO proyecto_articulado_participantes (id, proyecto_id, docente_id, espacio_id, aporte_especifico, aprendizajes_articulados, estado_aporte) VALUES
            (1, 1, 4, 26, 'Siembra de leguminosas fijadoras de nitrógeno y monitoreo radicular con Rhizobium.', 'Relación simbiótica planta-bacteria y manejo de fertilidad.', 'completado'),
            (2, 1, 5, 28, 'Toma de muestras y titulación volumétrica para cuantificar materia orgánica y pH.', 'Reacciones ácido-base y reactivos químicos.', 'completado')
        ");

        // Insertar hitos de agenda
        $pdo->exec("INSERT INTO agenda_hitos (id, docente_id, espacio_id, titulo, descripcion, tipo, fecha, completado) VALUES
            (1, 4, 26, 'Muestreo de suelo en parcela hortícola', 'Práctica a campo con barreno en canteros de 4° Año A.', 'practica_campo', '2026-03-16', 1),
            (2, 4, 26, 'Taller de siembra de almácigos otoño-invierno', 'Siembra en bandejas de 128 celdas.', 'practica_campo', '2026-03-25', 1),
            (3, 4, 26, '1° Hito Evaluativo: Fisiología de la germinación', 'Evaluación escrita y de reconocimiento de plántulas.', 'hito_evaluativo', '2026-04-14', 0),
            (4, 4, 26, 'Visita técnica a vivero cooperativo de vid de Colonia Caroya', 'Observación de pie americano e injertos.', 'practica_campo', '2026-05-18', 0)
        ");
    }
}
