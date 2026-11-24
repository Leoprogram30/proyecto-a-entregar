<?php
/**
 * Catálogos oficiales usados al planificar (Currículum Córdoba / Orientaciones Pedagógicas y Didácticas).
 * IPEM N° 349 "Giovanni Bosco"
 */

declare(strict_types=1);

const CAPACIDADES_FUNDAMENTALES = [
    'Oralidad, lectura y escritura',
    'Abordaje y resolución de situaciones problemáticas',
    'Pensamiento crítico',
    'Creatividad',
    'Trabajo colaborativo y cooperativo',
    'Gestión y monitoreo del propio aprendizaje',
    'Ciudadanía local, global y digital',
];

const FORMATOS_PEDAGOGICOS = [
    'Materia/Asignatura', 'Seminario', 'Taller', 'Proyecto', 'Laboratorio',
    'Ateneo', 'Observatorio', 'Trabajo de campo', 'Módulo',
];

const TEMAS_TRANSVERSALES = [
    'ESI',
    'Educación Ambiental Integral',
    'Educación Vial',
    'Educación Económica y Financiera',
    'Cultura Digital y Ciencias de la Computación',
];

const MOMENTOS_CLASE = ['inicio', 'desarrollo', 'cierre'];
const PRIORIDADES_CONTENIDO = ['esencial', 'complementario'];

/** Lista de valores de un catálogo cerrado (acepta array o JSON). */
function vCatalogList(array $in, string $key, string $label, array $catalogo): array {
    $items = vStringList($in, $key, $label, 50, 200);
    foreach ($items as $it) {
        if (!in_array($it, $catalogo, true)) {
            validationError($key, "El campo {$label} contiene un valor que no pertenece al catálogo: {$it}.");
        }
    }
    return array_values(array_unique($items));
}

/** Contenidos de planificación/secuencia: [{texto, meta?, indicadores[], fuente?, contenido_id?, prioridad}] */
function vContenidosList(array $in, string $key = 'contenidos'): array {
    $v = $in[$key] ?? [];
    if ($v === null || $v === '') {
        return [];
    }
    if (is_string($v)) {
        $d = json_decode($v, true);
        $v = is_array($d) ? $d : [$v];
    }
    if (!is_array($v)) {
        validationError($key, 'El campo contenidos debe ser una lista.');
    }
    if (count($v) > 200) {
        validationError($key, 'El campo contenidos admite hasta 200 elementos.');
    }
    $out = [];
    foreach ($v as $item) {
        if (is_string($item)) {
            $item = ['texto' => $item];
        }
        if (!is_array($item)) {
            validationError($key, 'Cada contenido debe ser un texto o un objeto.');
        }
        $texto = trim((string)($item['texto'] ?? ''));
        if ($texto === '') {
            continue;
        }
        if (mb_strlen($texto) > 3000) {
            validationError($key, 'Cada contenido puede tener hasta 3000 caracteres.');
        }
        $prio = $item['prioridad'] ?? 'esencial';
        if (!in_array($prio, PRIORIDADES_CONTENIDO, true)) {
            validationError($key, 'La prioridad del contenido debe ser esencial o complementario.');
        }
        $inds = [];
        $rawInds = $item['indicadores'] ?? [];
        if (!is_array($rawInds)) {
            validationError($key, 'Los indicadores de cada contenido deben ser una lista.');
        }
        foreach ($rawInds as $ind) {
            if (!is_string($ind)) {
                validationError($key, 'Los indicadores deben ser textos.');
            }
            $ind = trim($ind);
            if ($ind !== '') {
                if (mb_strlen($ind) > 1000) {
                    validationError($key, 'Cada indicador puede tener hasta 1000 caracteres.');
                }
                $inds[] = $ind;
            }
        }
        $row = ['texto' => $texto, 'indicadores' => array_slice($inds, 0, 30), 'prioridad' => $prio];
        $meta = trim((string)($item['meta'] ?? ''));
        if ($meta !== '') {
            $row['meta'] = mb_substr($meta, 0, 3000);
        }
        $fuente = trim((string)($item['fuente'] ?? ''));
        if ($fuente !== '') {
            $row['fuente'] = mb_substr($fuente, 0, 60);
        }
        if (isset($item['contenido_id']) && filter_var($item['contenido_id'], FILTER_VALIDATE_INT) !== false) {
            $row['contenido_id'] = (int)$item['contenido_id'];
        }
        $out[] = $row;
    }
    return $out;
}

/** Decodifica una lista JSON desde el cuerpo (array o string JSON). */
function inputList(array $in, string $key, int $max, string $label): array {
    $v = $in[$key] ?? [];
    if (is_string($v) && $v !== '') {
        $d = json_decode($v, true);
        $v = is_array($d) ? $d : [];
    }
    if ($v === null || $v === '') {
        return [];
    }
    if (!is_array($v) || count($v) > $max) {
        validationError($key, "El campo {$label} debe ser una lista de hasta {$max} elementos.");
    }
    return array_values($v);
}

/** Transversales: [{tema, como}] con tema del catálogo. */
function vTransversales(array $in, string $key = 'transversales'): array {
    $out = [];
    foreach (inputList($in, $key, 20, 'transversales') as $item) {
        if (!is_array($item)) {
            validationError($key, 'Cada tema transversal debe ser un objeto {tema, como}.');
        }
        $tema = trim((string)($item['tema'] ?? ''));
        if ($tema === '') {
            continue;
        }
        if (!in_array($tema, TEMAS_TRANSVERSALES, true)) {
            validationError($key, "El tema transversal no pertenece al catálogo: {$tema}.");
        }
        $out[] = ['tema' => $tema, 'como' => mb_substr(trim((string)($item['como'] ?? '')), 0, 2000)];
    }
    return $out;
}

/** Unidades: [{titulo, periodo, horas, contenidos, actividades}] */
function vUnidades(array $in, string $key = 'unidades'): array {
    $out = [];
    foreach (inputList($in, $key, 60, 'unidades') as $u) {
        if (!is_array($u)) {
            validationError($key, 'Cada unidad debe ser un objeto.');
        }
        $titulo = mb_substr(trim((string)($u['titulo'] ?? '')), 0, 200);
        if ($titulo === '') {
            continue;
        }
        $horas = $u['horas'] ?? null;
        if ($horas === '' || $horas === null) {
            $horas = null;
        } elseif (filter_var($horas, FILTER_VALIDATE_INT) === false || (int)$horas < 0 || (int)$horas > 1000) {
            validationError($key, 'Las horas de cada unidad deben ser un entero entre 0 y 1000.');
        } else {
            $horas = (int)$horas;
        }
        $out[] = [
            'titulo' => $titulo,
            'periodo' => mb_substr(trim((string)($u['periodo'] ?? '')), 0, 100),
            'horas' => $horas,
            'contenidos' => mb_substr(trim((string)($u['contenidos'] ?? '')), 0, 5000),
            'actividades' => mb_substr(trim((string)($u['actividades'] ?? '')), 0, 5000),
        ];
    }
    return $out;
}

/** Clases de una secuencia: [{titulo, momento, duracion, actividades, recursos, evaluativa}] */
function vClases(array $in, string $key = 'clases'): array {
    $out = [];
    foreach (inputList($in, $key, 80, 'clases') as $c) {
        if (!is_array($c)) {
            validationError($key, 'Cada clase debe ser un objeto.');
        }
        $momento = $c['momento'] ?? 'desarrollo';
        if (!in_array($momento, MOMENTOS_CLASE, true)) {
            validationError($key, 'El momento de la clase debe ser inicio, desarrollo o cierre.');
        }
        $titulo = mb_substr(trim((string)($c['titulo'] ?? '')), 0, 200);
        $act = mb_substr(trim((string)($c['actividades'] ?? '')), 0, 8000);
        if ($titulo === '' && $act === '') {
            continue;
        }
        $out[] = [
            'titulo' => $titulo,
            'momento' => $momento,
            'duracion' => mb_substr(trim((string)($c['duracion'] ?? '')), 0, 60),
            'actividades' => $act,
            'recursos' => mb_substr(trim((string)($c['recursos'] ?? '')), 0, 3000),
            'evaluativa' => filter_var($c['evaluativa'] ?? false, FILTER_VALIDATE_BOOLEAN),
        ];
    }
    return $out;
}

// ---------------------------------------------------------------- Institución precursora (Ruta 2)
// Referencia: Res. SE 88/2025 (rige 2026). Las reglas 2027 no están publicadas: verificar la normativa que se dicte.
const RUTAS_INSTITUCIONALES = ['ruta_1', 'ruta_2'];
const ESTADOS_ACCION = ['pendiente', 'en_curso', 'implementada', 'no_aplica'];
const ESTADOS_COBERTURA = ['presentado', 'autorizado', 'en_ejecucion', 'cerrado'];
const CAMPOS_APRENDIZAJE = ['lenguajes_comunicacion', 'artes_movimiento', 'sociales_humanas', 'naturales_exactas'];
const CAMPOS_APRENDIZAJE_LABELS = [
    'lenguajes_comunicacion' => 'Lenguajes y Comunicación',
    'artes_movimiento' => 'Artes y Movimiento',
    'sociales_humanas' => 'Sociales y Humanas',
    'naturales_exactas' => 'Naturales y Exactas',
];
// Máximo de propuestas de articulación por curso (Anexo VI, orientada)
const TOPE_PROPUESTAS_PRECURSORA = [1 => 3, 2 => 3, 3 => 4, 4 => 4, 5 => 4, 6 => 4];

const LINEAS_PRECURSORA = [
    'campos_aprendizaje' => ['caracter' => 'implementa', 'fuente' => 'Res. SE 88/2025, art. 8 y Anexo IV',
        'texto' => 'Reorganizar los departamentos en los 4 Campos de Aprendizaje.'],
    'cn_cs_ciclo_basico' => ['caracter' => 'implementa', 'fuente' => 'Res. SE 88/2025, art. 8 y Anexo V',
        'texto' => 'Reorganizar Ciencias Naturales y Ciencias Sociales en el Ciclo Básico (A: proyecto con calificación única; B: tiempo compartido de 1 HC; C: propuesta institucional aprobada por Supervisión).'],
    'artes_integradas' => ['caracter' => 'implementa', 'fuente' => 'Res. SE 88/2025, art. 8',
        'texto' => 'Propuesta de Artes integradas.'],
    'ingles_intensificado' => ['caracter' => 'implementa', 'fuente' => 'Res. SE 88/2025, art. 8',
        'texto' => 'Propuesta de Inglés intensificado.'],
    'proyectos_integracion_co' => ['caracter' => 'implementa', 'fuente' => 'Res. SE 88/2025, art. 8',
        'texto' => 'Proyectos de integración en el Ciclo Orientado (mínimo un curso).'],
    'crea' => ['caracter' => 'implementa', 'fuente' => 'Res. SE 88/2025, art. 8',
        'texto' => 'Experiencias CREA y STEAM ampliado, vinculadas a la Feria de Ciencias.'],
    'tiempo_compartido' => ['caracter' => 'implementa', 'fuente' => 'Res. SE 88/2025, art. 8 y Anexo VI',
        'texto' => 'Espacios de tiempo compartido: al menos una propuesta en cada ciclo (el Anexo VI sugiere un espacio compartido por curso como mínimo).'],
    'capacitacion_laboral' => ['caracter' => 'implementa', 'fuente' => 'Res. SE 88/2025, art. 8 y Anexo VII',
        'texto' => 'Capacitación laboral / formación profesional: mínimo un curso por orientación.'],
    'actualizacion_fe' => ['caracter' => 'implementa', 'fuente' => 'Res. SE 88/2025, art. 8',
        'texto' => 'Participar en la actualización de la formación específica.'],
    'unidad_pedagogica' => ['caracter' => 'opcional', 'fuente' => 'Res. SE 88/2025, Anexo VIII',
        'texto' => 'Unidad pedagógica (opcional).'],
    'dual_alternancia' => ['caracter' => 'opcional', 'fuente' => 'Res. SE 88/2025, Anexo I',
        'texto' => 'Formación dual / alternancia (opcional).'],
    'protagonismo_estudiantil' => ['caracter' => 'opcional', 'fuente' => 'Res. SE 88/2025, Anexo IX',
        'texto' => 'Protagonismo estudiantil (opcional).'],
    'institutos_formacion' => ['caracter' => 'opcional', 'fuente' => 'Res. SE 88/2025, art. 8',
        'texto' => 'Vinculación con institutos de formación (opcional).'],
];
