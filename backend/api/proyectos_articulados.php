<?php
/**
 * Articulación colaborativa y trabajo integrado entre espacios curriculares.
 * IPEM N° 349 "Giovanni Bosco"
 *
 * Base normativa de la modalidad tiempo_compartido: Res. SE 88/2025, Anexo VI (rige en 2026);
 * antecedentes: Res. SE-SIDPyTE 06/2025, Anexo V y "Alternativas para la enseñanza" (2013).
 * Las demás modalidades (declarativa, proyecto interdisciplinario, jornada) son propuestas del sistema.
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers/bootstrap.php';

const MODALIDADES = ['declarativa', 'tiempo_compartido', 'proyecto_interdisciplinario', 'jornada'];
const VIGENCIAS = ['anual', 'cuatrimestre', 'etapa', 'fechas'];
const ESTADOS_EDITABLES = ['borrador', 'en_acuerdo', 'conformado', 'observado'];
const ESTADOS_PRESENTADO_O_POSTERIOR = ['presentado', 'autorizado', 'observado', 'en_ejecucion', 'cerrado'];
const ESTADOS_PLAN = ['borrador', 'en_acuerdo', 'conformado', 'observado', 'autorizado', 'en_ejecucion'];
// Orientada, Res. SE 88/2025 Anexo VI: máximos de horas y de propuestas por curso.
const TOPE_HORAS = [1 => 4, 2 => 4, 3 => 6, 4 => 6, 5 => 8, 6 => 8];
const TOPE_PROPUESTAS = [1 => 3, 2 => 3, 3 => 4, 4 => 4, 5 => 4, 6 => 4];
const TEXTOS_PROYECTO = [
    'fundamentacion' => 'fundamentación', 'marco_integrador' => 'marco integrador', 'objetivos' => 'objetivos',
    'producto_final' => 'producto final', 'organizacion' => 'organización', 'evaluacion_criterios' => 'criterios de evaluación',
    'evaluacion_instrumentos' => 'instrumentos de evaluación', 'evaluacion_momentos' => 'momentos de evaluación',
    'evaluacion_instancia' => 'evaluación de la instancia',
];

$pdo = getDbConnection();
$user = requireAuth();
$action = $_GET['action'] ?? 'list';
$uid = (int)$user['sub'];

// ---------------------------------------------------------------- utilidades

function esAutor(array $u): bool { return in_array($u['rol'], ROLES_AUTORES, true); }

function hist(PDO $pdo, int $pid, int $uid, string $accion, ?string $detalle = null): void {
    $pdo->prepare('INSERT INTO proyecto_historial (proyecto_id, usuario_id, accion, detalle) VALUES (:p, :u, :a, :d)')
        ->execute(['p' => $pid, 'u' => $uid, 'a' => $accion, 'd' => $detalle]);
}

function normTexto(string $s): string {
    return strtr(mb_strtolower($s), ['á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n']);
}

function loadProyecto(PDO $pdo, int $id): array {
    $st = $pdo->prepare('SELECT p.*, u.nombre AS creador_nombre, u.apellido AS creador_apellido
        FROM proyectos_articulados p JOIN usuarios u ON p.creador_id = u.id WHERE p.id = :id');
    $st->execute(['id' => $id]);
    $p = $st->fetch();
    if (!$p) {
        jsonError('Proyecto no encontrado.', 404);
    }
    foreach (['id', 'creador_id', 'anio_lectivo', 'curso', 'horas_compartidas'] as $k) {
        $p[$k] = (int)$p[$k];
    }
    return $p;
}

function participantesDe(PDO $pdo, array $ids): array {
    if (!$ids) {
        return [];
    }
    $in = implode(',', array_fill(0, count($ids), '?'));
    $st = $pdo->prepare("SELECT part.*, u.nombre AS docente_nombre, u.apellido AS docente_apellido,
                                e.nombre AS espacio_nombre, e.anio AS espacio_anio, e.horas_catedra AS espacio_horas
                         FROM proyecto_articulado_participantes part
                         JOIN usuarios u ON part.docente_id = u.id
                         JOIN espacios_curriculares e ON part.espacio_id = e.id
                         WHERE part.proyecto_id IN ({$in}) ORDER BY part.id ASC");
    $st->execute(array_values($ids));
    $out = [];
    foreach ($st->fetchAll() as $r) {
        foreach (['id', 'proyecto_id', 'docente_id', 'espacio_id', 'horas_cede', 'espacio_anio', 'espacio_horas'] as $k) {
            $r[$k] = (int)$r[$k];
        }
        $r['conformidad'] = (int)$r['conformidad'] === 1;
        // Tolera el formato de los datos de ejemplo: {texto, contenido_id} equivale a {titulo, curriculum_id}
        $r['contenidos'] = array_map(static function ($c) {
            if (is_array($c)) {
                $c['titulo'] = $c['titulo'] ?? $c['texto'] ?? '';
                $c['curriculum_id'] = $c['curriculum_id'] ?? $c['contenido_id'] ?? null;
                $c['indicadores'] = $c['indicadores'] ?? [];
            }
            return $c;
        }, decodeList($r['contenidos'] ?? null));
        $out[$r['proyecto_id']][] = $r;
    }
    return $out;
}

function cedeHoras(int $horasCatedra): int {
    return $horasCatedra >= 4 ? 2 : ($horasCatedra === 3 ? 1 : 0);
}

/** Horas compartidas, horas propias restantes y advertencias (Res. SE 88/2025 Anexo VI). */
function calcular(PDO $pdo, array $p, array $parts): array {
    $acept = array_values(array_filter($parts, static fn($x) => $x['invitacion'] === 'aceptado'));
    $adv = [];
    $min = null;
    foreach ($acept as $x) {
        $min = $min === null ? cedeHoras($x['espacio_horas']) : min($min, cedeHoras($x['espacio_horas']));
        if ($x['espacio_horas'] < 3) {
            $adv[] = "{$x['espacio_nombre']} tiene {$x['espacio_horas']} hs semanales: no alcanza las 3 hs desde las que se comparte tiempo.";
        }
    }
    $tc = $p['modalidad'] === 'tiempo_compartido';
    $horas = $tc ? (int)($min ?? 0) : (int)$p['horas_compartidas'];
    $porEspacio = [];
    foreach ($acept as $x) {
        $porEspacio[] = [
            'espacio_id' => $x['espacio_id'], 'espacio_nombre' => $x['espacio_nombre'], 'horas_catedra' => $x['espacio_horas'],
            'cede' => cedeHoras($x['espacio_horas']), 'horas_propias' => max(0, $x['espacio_horas'] - $horas),
        ];
    }
    $esp = array_unique(array_column($acept, 'espacio_id'));
    $doc = array_unique(array_column($acept, 'docente_id'));
    $tope = ['aplica' => false, 'excede' => false];
    if ($tc) {
        if (count($esp) > 2 || count($doc) > 2) {
            $adv[] = 'El trabajo integrado en tiempo compartido vincula exactamente dos espacios curriculares de docentes distintos. Para tres o más espacios use la modalidad "proyecto interdisciplinario" (o "articulación declarativa").';
        }
        $st = $pdo->prepare("SELECT COALESCE(SUM(horas_compartidas), 0) AS h, COUNT(*) AS n FROM proyectos_articulados
            WHERE modalidad = 'tiempo_compartido' AND anio_lectivo = :a AND curso = :c AND division <=> :d AND id <> :id
              AND estado IN ('presentado', 'autorizado', 'en_ejecucion', 'cerrado')");
        $st->execute(['a' => $p['anio_lectivo'], 'c' => $p['curso'], 'd' => $p['division'], 'id' => $p['id']]);
        $o = $st->fetch();
        $totalH = (int)$o['h'] + $horas;
        $totalN = (int)$o['n'] + 1;
        $maxH = TOPE_HORAS[(int)$p['curso']] ?? 8;
        $maxN = TOPE_PROPUESTAS[(int)$p['curso']] ?? 4;
        if ($totalH > $maxH) {
            $adv[] = "Sumando los proyectos de tiempo compartido ya presentados de este curso, se llegaría a {$totalH} hs semanales y el máximo es {$maxH}. Más horas requieren una propuesta fundamentada que autorice la Dirección de Nivel, por vía de la supervisión (Res. SE 88/2025, Anexo VI).";
        }
        if ($totalN > $maxN) {
            $adv[] = "Con este proyecto serían {$totalN} propuestas de integración en el curso y el máximo es {$maxN}. Requiere autorización de la Dirección de Nivel (Res. SE 88/2025, Anexo VI).";
        }
        $tope = [
            'aplica' => true, 'horas_otros' => (int)$o['h'], 'horas_total' => $totalH, 'horas_max' => $maxH,
            'propuestas_total' => $totalN, 'propuestas_max' => $maxN, 'excede' => $totalH > $maxH || $totalN > $maxN,
        ];
    }
    return [
        'horas_compartidas' => $horas, 'por_espacio' => $porEspacio, 'advertencias' => $adv, 'tope' => $tope,
        'requiere_autorizacion_direccion_nivel' => $tope['excede'],
    ];
}

/** null si el acuerdo está completo; si no, el motivo. */
function motivoSinConformidad(array $p, array $parts, bool $exigirTodas = true): ?string {
    $acept = array_values(array_filter($parts, static fn($x) => $x['invitacion'] === 'aceptado'));
    $esp = count(array_unique(array_column($acept, 'espacio_id')));
    $doc = count(array_unique(array_column($acept, 'docente_id')));
    if ($esp < 2 || $doc < 2) {
        return 'Se necesitan al menos dos docentes de espacios curriculares distintos que hayan aceptado participar.';
    }
    if ($p['modalidad'] === 'tiempo_compartido' && ($esp !== 2 || $doc !== 2)) {
        return 'El tiempo compartido vincula exactamente dos espacios curriculares de dos docentes distintos. Para tres o más use la modalidad proyecto interdisciplinario.';
    }
    if (trim((string)$p['eje']) === '') {
        return 'Falta el eje común del proyecto.';
    }
    if ($exigirTodas) {
        foreach ($acept as $x) {
            if (!$x['conformidad']) {
                return "Falta la conformidad de {$x['docente_nombre']} {$x['docente_apellido']} ({$x['espacio_nombre']}).";
            }
        }
    }
    return null;
}

/** Recalcula horas y mueve entre en_acuerdo y conformado según las conformidades. */
function recalcular(PDO $pdo, int $pid): array {
    $p = loadProyecto($pdo, $pid);
    $parts = participantesDe($pdo, [$pid])[$pid] ?? [];
    if ($p['modalidad'] === 'tiempo_compartido') {
        $h = calcular($pdo, $p, $parts)['horas_compartidas'];
        if ($h !== $p['horas_compartidas']) {
            $pdo->prepare('UPDATE proyectos_articulados SET horas_compartidas = :h WHERE id = :id')->execute(['h' => $h, 'id' => $pid]);
        }
    }
    $ok = motivoSinConformidad($p, $parts) === null;
    if ($p['estado'] === 'en_acuerdo' && $ok) {
        $pdo->prepare("UPDATE proyectos_articulados SET estado = 'conformado' WHERE id = :id")->execute(['id' => $pid]);
        hist($pdo, $pid, $p['creador_id'], 'conformado', 'Todos los docentes participantes dieron su conformidad.');
    } elseif ($p['estado'] === 'conformado' && !$ok) {
        $pdo->prepare("UPDATE proyectos_articulados SET estado = 'en_acuerdo' WHERE id = :id")->execute(['id' => $pid]);
    }
    return loadProyecto($pdo, $pid);
}

function anularConformidades(PDO $pdo, int $pid): void {
    $pdo->prepare('UPDATE proyecto_articulado_participantes SET conformidad = 0, fecha_conformidad = NULL WHERE proyecto_id = :p')->execute(['p' => $pid]);
}

/** Nivel de acceso del usuario al proyecto: null si no debe verlo (se responde 404). */
function acceso(array $user, array $p, array $parts): ?array {
    $uid = (int)$user['sub'];
    $mias = array_values(array_filter($parts, static fn($x) => $x['docente_id'] === $uid));
    $creador = $p['creador_id'] === $uid;
    if ($creador || $mias) {
        return ['nivel' => 'completo', 'creador' => $creador, 'mias' => $mias];
    }
    if (isDirectivo($user) && in_array($p['estado'], ESTADOS_PRESENTADO_O_POSTERIOR, true)) {
        return ['nivel' => 'completo', 'creador' => false, 'mias' => []];
    }
    if (esAutor($user) && $p['estado'] === 'en_acuerdo') {
        return ['nivel' => 'convocatoria', 'creador' => false, 'mias' => []];
    }
    return null;
}

function cargarVisible(PDO $pdo, array $user, int $id): array {
    $p = loadProyecto($pdo, $id);
    $parts = participantesDe($pdo, [$id])[$id] ?? [];
    $ac = acceso($user, $p, $parts);
    if ($ac === null) {
        jsonError('Proyecto no encontrado.', 404);
    }
    return [$p, $parts, $ac];
}

function requireCreador(array $ac): void {
    if (!$ac['creador']) {
        jsonError('Solo quien creó el proyecto puede realizar esta acción.', 403);
    }
}

function requireParticipante(array $ac, string $msg): void {
    if (!$ac['creador'] && !array_filter($ac['mias'], static fn($x) => $x['invitacion'] === 'aceptado')) {
        jsonError($msg, 403);
    }
}

function requireEstado(array $p, array $permitidos, string $msg): void {
    if (!in_array($p['estado'], $permitidos, true)) {
        jsonError($msg, 409);
    }
}

function requireEspacioDelCurso(PDO $pdo, int $espacioId, int $curso): array {
    requireEspacio($pdo, $espacioId, 'espacio_id');
    $st = $pdo->prepare('SELECT id, nombre, anio, horas_catedra FROM espacios_curriculares WHERE id = :id');
    $st->execute(['id' => $espacioId]);
    $e = $st->fetch();
    if ((int)$e['anio'] !== $curso) {
        validationError('espacio_id', "El espacio curricular {$e['nombre']} es de {$e['anio']}.° año y el proyecto es de {$curso}.° año.");
    }
    return $e;
}

/** Valida los campos del proyecto. En update ($actual) solo se validan las claves presentes. */
function leerCampos(array $in, ?array $actual): array {
    $crear = $actual === null;
    $v = [];
    $has = static fn(string $k) => $crear || array_key_exists($k, $in);
    if ($has('titulo')) {
        $v['titulo'] = vString($in, 'titulo', 'título', ['required' => true, 'max' => 200]);
    }
    if ($has('eje')) {
        $v['eje'] = vString($in, 'eje', 'eje común (tema, problema o pregunta)', ['required' => true, 'max' => 5000]);
    }
    if ($has('modalidad')) {
        $v['modalidad'] = vEnum($in, 'modalidad', 'modalidad', MODALIDADES, true);
    }
    if ($has('anio_lectivo')) {
        $v['anio_lectivo'] = vInt($in, 'anio_lectivo', 'año lectivo', ['min' => 2020, 'max' => 2100, 'default' => (int)date('Y')]);
    }
    if ($has('curso')) {
        $v['curso'] = vInt($in, 'curso', 'curso', ['required' => true, 'min' => 1, 'max' => 6]);
    }
    if ($has('division')) {
        $v['division'] = vString($in, 'division', 'división', ['max' => 10]);
    }
    if ($has('vigencia')) {
        $v['vigencia'] = vEnum($in, 'vigencia', 'vigencia', VIGENCIAS, false, 'anual');
    }
    if ($has('fecha_inicio')) {
        $v['fecha_inicio'] = vDate($in, 'fecha_inicio', 'fecha de inicio');
    }
    if ($has('fecha_fin')) {
        $v['fecha_fin'] = vDate($in, 'fecha_fin', 'fecha de fin');
    }
    if ($has('horas_compartidas')) {
        $v['horas_compartidas'] = vInt($in, 'horas_compartidas', 'horas compartidas', ['min' => 0, 'max' => 40, 'default' => 0]);
    }
    foreach (TEXTOS_PROYECTO as $k => $label) {
        if ($has($k)) {
            $v[$k] = vString($in, $k, $label, ['max' => 15000]);
        }
    }
    foreach (['capacidades' => 'capacidades', 'transversales' => 'ejes transversales'] as $k => $label) {
        if ($has($k)) {
            $v[$k] = json_encode(vStringList($in, $k, $label, 30, 500), JSON_UNESCAPED_UNICODE);
        }
    }
    $f = $v + ($actual ?? []);
    if (($f['vigencia'] ?? 'anual') === 'fechas' && (empty($f['fecha_inicio']) || empty($f['fecha_fin']))) {
        validationError('fecha_inicio', 'Con vigencia por fechas debe indicar fecha de inicio y de fin.');
    }
    if (!empty($f['fecha_inicio']) && !empty($f['fecha_fin']) && $f['fecha_fin'] < $f['fecha_inicio']) {
        validationError('fecha_fin', 'La fecha de fin no puede ser anterior a la de inicio.');
    }
    return $v;
}

/** Contenidos del aporte: del catálogo de SU espacio (con indicadores) y propios. */
function leerContenidos(PDO $pdo, array $in, int $espacioId): array {
    $raw = $in['contenidos'] ?? [];
    if (is_string($raw)) {
        $raw = $raw === '' ? [] : json_decode($raw, true);
    }
    if ($raw === null) {
        $raw = [];
    }
    if (!is_array($raw) || count($raw) > 60) {
        validationError('contenidos', 'Los contenidos deben ser una lista de hasta 60 elementos.');
    }
    $out = [];
    $vistos = [];
    foreach ($raw as $it) {
        if (!is_array($it)) {
            validationError('contenidos', 'Cada contenido debe ser un objeto con título.');
        }
        $ind = vStringList($it, 'indicadores', 'indicadores', 30, 1000);
        $cid = isset($it['curriculum_id']) && $it['curriculum_id'] !== '' ? vId($it, 'curriculum_id', 'contenido del catálogo') : null;
        if ($cid !== null) {
            if (isset($vistos[$cid])) {
                continue;
            }
            $vistos[$cid] = true;
            $st = $pdo->prepare('SELECT id, tipo, titulo, fuente, pagina FROM curriculum_contenidos WHERE id = :id AND espacio_id = :e');
            $st->execute(['id' => $cid, 'e' => $espacioId]);
            $c = $st->fetch();
            if (!$c) {
                validationError('contenidos', 'Un contenido elegido no pertenece al espacio curricular del aporte.');
            }
            $out[] = ['curriculum_id' => (int)$c['id'], 'tipo' => $c['tipo'], 'titulo' => $c['titulo'], 'fuente' => $c['fuente'],
                'pagina' => $c['pagina'], 'indicadores' => $ind, 'propio' => false];
        } else {
            $out[] = [
                'titulo' => vString($it, 'titulo', 'título del contenido', ['required' => true, 'max' => 250]),
                'descripcion' => vString($it, 'descripcion', 'descripción del contenido', ['max' => 2000]),
                'indicadores' => $ind, 'propio' => true,
            ];
        }
    }
    return $out;
}

function insertParticipante(PDO $pdo, int $pid, int $docenteId, array $espacio, string $invitacion, ?int $invitadoPor): void {
    $pdo->prepare('INSERT INTO proyecto_articulado_participantes (proyecto_id, docente_id, espacio_id, invitacion, invitado_por, horas_cede)
                   VALUES (:p, :d, :e, :i, :ip, :h)')
        ->execute(['p' => $pid, 'd' => $docenteId, 'e' => $espacio['id'], 'i' => $invitacion, 'ip' => $invitadoPor, 'h' => cedeHoras((int)$espacio['horas_catedra'])]);
}

function tx(PDO $pdo, callable $fn): mixed {
    $pdo->beginTransaction();
    try {
        $r = $fn();
        $pdo->commit();
        return $r;
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

function datosEncuentro(array $e): array {
    $e['id'] = (int)$e['id'];
    $e['horas'] = (int)$e['horas'];
    $e['realizado'] = (int)$e['realizado'] === 1;
    $e['docentes'] = array_map('intval', decodeList($e['docentes'] ?? null));
    $e['contenidos'] = decodeList($e['contenidos'] ?? null);
    return $e;
}

function resumenParticipante(array $x, bool $completo): array {
    $r = [
        'id' => $x['id'], 'docente_id' => $x['docente_id'], 'docente_nombre' => $x['docente_nombre'], 'docente_apellido' => $x['docente_apellido'],
        'espacio_id' => $x['espacio_id'], 'espacio_nombre' => $x['espacio_nombre'], 'espacio_anio' => $x['espacio_anio'],
        'espacio_horas' => $x['espacio_horas'], 'invitacion' => $x['invitacion'], 'conformidad' => $x['conformidad'], 'tema' => $x['tema'],
    ];
    if ($completo) {
        foreach (['contenidos', 'actividades', 'recursos', 'saberes_propios', 'evaluacion_aporte', 'horas_cede', 'disponibilidad', 'fecha_conformidad'] as $k) {
            $r[$k] = $x[$k];
        }
    }
    return $r;
}

/** Raíces de búsqueda: sin acentos, en minúscula y con un recorte simple de plurales/derivados. */
function palabrasBusqueda(string $texto): array {
    $out = [];
    foreach (preg_split('/[^\p{L}\p{N}]+/u', normTexto($texto), -1, PREG_SPLIT_NO_EMPTY) ?: [] as $w) {
        $len = mb_strlen($w);
        if ($len < 3) {
            continue;
        }
        if ($len >= 7) {
            $w = mb_substr($w, 0, $len - 2);
        } elseif ($len >= 5 && str_ends_with($w, 's')) {
            $w = mb_substr($w, 0, $len - 1);
        }
        $out[$w] = true;
    }
    return array_slice(array_map('strval', array_keys($out)), 0, 5);
}

/** Condiciones LIKE parametrizadas (sin distinguir acentos por la collation utf8mb4_unicode_ci). */
function condicionesBusqueda(array $palabras, string $alias, array &$par): array {
    $conds = [];
    foreach ($palabras as $i => $w) {
        $esc = '%' . str_replace(['\\', '%', '_'], ['\\\\', '\%', '\_'], $w) . '%';
        $conds[] = "({$alias}titulo LIKE :a{$i} OR {$alias}descripcion LIKE :b{$i} OR {$alias}meta LIKE :c{$i} OR {$alias}indicadores LIKE :d{$i})";
        foreach (['a', 'b', 'c', 'd'] as $l) {
            $par["{$l}{$i}"] = $esc;
        }
    }
    return $conds;
}

// ---------------------------------------------------------------- acciones

switch ($action) {
    case 'list':
        $conds = ['p.creador_id = :me', 'EXISTS (SELECT 1 FROM proyecto_articulado_participantes x WHERE x.proyecto_id = p.id AND x.docente_id = :me2)'];
        if (isDirectivo($user)) {
            $conds[] = "p.estado IN ('presentado','autorizado','observado','en_ejecucion','cerrado')";
        }
        if (esAutor($user)) {
            $conds[] = "p.estado = 'en_acuerdo'";
        }
        $st = $pdo->prepare('SELECT p.id, p.creador_id, p.titulo, p.modalidad, p.anio_lectivo, p.curso, p.division, p.vigencia, p.eje, p.estado,
                p.horas_compartidas, p.created_at, p.updated_at, u.nombre AS creador_nombre, u.apellido AS creador_apellido
            FROM proyectos_articulados p JOIN usuarios u ON p.creador_id = u.id
            WHERE ' . implode(' OR ', $conds) . ' ORDER BY p.updated_at DESC, p.id DESC');
        $st->execute(['me' => $uid, 'me2' => $uid]);
        $rows = $st->fetchAll();
        $parts = participantesDe($pdo, array_map(static fn($r) => (int)$r['id'], $rows));
        foreach ($rows as &$r) {
            foreach (['id', 'creador_id', 'curso', 'anio_lectivo', 'horas_compartidas'] as $k) {
                $r[$k] = (int)$r[$k];
            }
            $ps = $parts[$r['id']] ?? [];
            $r['participantes'] = array_map(static fn($x) => resumenParticipante($x, false), $ps);
            $mias = array_values(array_filter($ps, static fn($x) => $x['docente_id'] === $uid));
            $r['mi_invitacion'] = $mias ? $mias[0]['invitacion'] : null;
            $r['soy_creador'] = $r['creador_id'] === $uid;
            $r['soy_participante'] = (bool)array_filter($mias, static fn($x) => $x['invitacion'] === 'aceptado');
        }
        unset($r);
        jsonSuccess($rows, 'Proyectos de articulación');

    case 'detail':
        [$p, $parts, $ac] = cargarVisible($pdo, $user, vId($_GET, 'id', 'proyecto'));
        $completo = $ac['nivel'] === 'completo';
        $pid = $p['id'];
        $enc = [];
        $hist = [];
        if ($completo) {
            $st = $pdo->prepare('SELECT * FROM proyecto_encuentros WHERE proyecto_id = :p ORDER BY fecha IS NULL, fecha, id');
            $st->execute(['p' => $pid]);
            $enc = array_map('datosEncuentro', $st->fetchAll());
            $st = $pdo->prepare('SELECT h.id, h.accion, h.detalle, h.fecha, u.nombre, u.apellido FROM proyecto_historial h
                LEFT JOIN usuarios u ON u.id = h.usuario_id WHERE h.proyecto_id = :p ORDER BY h.id DESC LIMIT 300');
            $st->execute(['p' => $pid]);
            $hist = $st->fetchAll();
        }
        $directivoAjeno = isDirectivo($user) && !$ac['creador'] && !$ac['mias'];
        $calculo = calcular($pdo, $p, $parts);
        $p['capacidades'] = decodeList($p['capacidades'] ?? null);
        $p['transversales'] = decodeList($p['transversales'] ?? null);
        if (!$completo) {
            foreach (['fundamentacion', 'marco_integrador', 'objetivos', 'organizacion', 'evaluacion_criterios', 'evaluacion_instrumentos', 'evaluacion_momentos', 'evaluacion_instancia', 'devolucion'] as $k) {
                $p[$k] = null;
            }
        }
        jsonSuccess([
            'proyecto' => $p,
            'participantes' => array_map(static fn($x) => resumenParticipante($x, $completo), $parts),
            'encuentros' => $enc,
            'historial' => $hist,
            'calculo' => $calculo,
            'permisos' => [
                'nivel' => $ac['nivel'],
                'es_creador' => $ac['creador'],
                'puede_editar' => $ac['creador'] && in_array($p['estado'], ESTADOS_EDITABLES, true),
                'puede_revisar' => $directivoAjeno && $p['estado'] === 'presentado',
                'mis_espacios' => array_map(static fn($x) => ['espacio_id' => $x['espacio_id'], 'invitacion' => $x['invitacion']], $ac['mias']),
                'puede_unirse' => esAutor($user) && $p['estado'] === 'en_acuerdo' && !$ac['mias'],
            ],
        ], 'Detalle del proyecto');

    case 'docentes_disponibles':
        requireRole(ROLES_AUTORES);
        $rows = $pdo->query("SELECT id, nombre, apellido, cargo_descripcion FROM usuarios
            WHERE estado = 'aprobado' AND rol IN ('docente', 'coordinador') ORDER BY apellido, nombre")->fetchAll();
        jsonSuccess(array_map(static fn($r) => [
            'id' => (int)$r['id'], 'nombre' => trim($r['nombre'] . ' ' . $r['apellido']), 'cargo' => $r['cargo_descripcion'],
        ], $rows), 'Docentes');

    case 'catalogo':
        $eid = vId($_GET, 'espacio_id', 'espacio curricular');
        requireEspacio($pdo, $eid);
        $par = ['e' => $eid];
        $conds = condicionesBusqueda(palabrasBusqueda((string)($_GET['q'] ?? '')), '', $par);
        $sql = 'SELECT id, tipo, titulo, descripcion, fuente, meta, indicadores, pagina FROM curriculum_contenidos WHERE espacio_id = :e AND vigente = 1'
            . ($conds ? ' AND ' . implode(' AND ', $conds) : '') . ' ORDER BY id LIMIT 250';
        $st = $pdo->prepare($sql);
        $st->execute($par);
        $rows = $st->fetchAll();
        foreach ($rows as &$r) {
            $r['id'] = (int)$r['id'];
            $r['indicadores'] = decodeList($r['indicadores']);
        }
        unset($r);
        jsonSuccess($rows, 'Catálogo del espacio');

    case 'sugerencias':
        $curso = vInt($_GET, 'curso', 'curso', ['required' => true, 'min' => 1, 'max' => 6]);
        $texto = vString($_GET, 'texto', 'texto a buscar', ['required' => true, 'max' => 100, 'min' => 3]);
        $palabras = palabrasBusqueda($texto);
        if (!$palabras) {
            validationError('texto', 'Escriba al menos una palabra de tres letras o más.');
        }
        $par = ['curso' => $curso];
        $conds = condicionesBusqueda($palabras, 'c.', $par);
        $st = $pdo->prepare('SELECT c.id, c.espacio_id, c.tipo, c.titulo, c.descripcion, c.fuente, c.meta, c.indicadores, c.pagina,
                e.nombre AS espacio_nombre, e.anio, e.horas_catedra
            FROM curriculum_contenidos c JOIN espacios_curriculares e ON e.id = c.espacio_id
            WHERE e.anio = :curso AND e.activo = 1 AND c.vigente = 1 AND (' . implode(' OR ', $conds) . ') ORDER BY c.id LIMIT 800');
        $st->execute($par);
        $grupos = [];
        foreach ($st->fetchAll() as $r) {
            $tit = normTexto($r['titulo']);
            $cuerpo = normTexto($r['descripcion'] . ' ' . $r['meta'] . ' ' . $r['indicadores']);
            $score = 0;
            foreach ($palabras as $w) {
                $score += (str_contains($tit, $w) ? 3 : 0) + (str_contains($cuerpo, $w) ? 1 : 0);
            }
            $eid = (int)$r['espacio_id'];
            $grupos[$eid] ??= ['espacio_id' => $eid, 'espacio_nombre' => $r['espacio_nombre'], 'anio' => (int)$r['anio'],
                'horas_catedra' => (int)$r['horas_catedra'], 'total' => 0, 'contenidos' => []];
            $grupos[$eid]['total']++;
            $grupos[$eid]['contenidos'][] = [
                'id' => (int)$r['id'], 'tipo' => $r['tipo'], 'titulo' => $r['titulo'], 'fuente' => $r['fuente'], 'pagina' => $r['pagina'],
                'descripcion' => mb_substr((string)$r['descripcion'], 0, 300), 'indicadores' => array_slice(decodeList($r['indicadores']), 0, 4), 'score' => $score,
            ];
        }
        foreach ($grupos as &$g) {
            usort($g['contenidos'], static fn($a, $b) => $b['score'] <=> $a['score']);
            $g['contenidos'] = array_slice($g['contenidos'], 0, 5);
        }
        unset($g);
        $out = array_values($grupos);
        usort($out, static fn($a, $b) => $b['total'] <=> $a['total']);
        jsonSuccess($out, 'Coincidencias por espacio curricular');

    case 'create':
        requireRole(ROLES_AUTORES);
        requireMethod('POST');
        $in = getJsonInput();
        $v = leerCampos($in, null);
        $esp = requireEspacioDelCurso($pdo, vId($in, 'espacio_id', 'espacio curricular desde el que participa'), (int)$v['curso']);
        $v += ['horas_compartidas' => 0, 'vigencia' => 'anual'];
        $pid = tx($pdo, static function () use ($pdo, $v, $uid, $esp) {
            $cols = array_keys($v);
            $pdo->prepare('INSERT INTO proyectos_articulados (creador_id, ' . implode(',', $cols) . ') VALUES (:creador, :' . implode(', :', $cols) . ')')
                ->execute(['creador' => $uid] + $v);
            $pid = (int)$pdo->lastInsertId();
            insertParticipante($pdo, $pid, $uid, $esp, 'aceptado', null);
            hist($pdo, $pid, $uid, 'creado', "Proyecto creado desde {$esp['nombre']}.");
            recalcular($pdo, $pid);
            return $pid;
        });
        jsonSuccess(['proyecto_id' => $pid], 'Proyecto creado como borrador.', 201);

    case 'update':
        requireMethod('POST');
        $in = getJsonInput();
        [$p, $parts, $ac] = cargarVisible($pdo, $user, vId($in, 'proyecto_id', 'proyecto'));
        requireCreador($ac);
        requireEstado($p, ESTADOS_EDITABLES, 'El proyecto ya fue presentado y no admite cambios.');
        $v = leerCampos($in, $p);
        if (!$v) {
            jsonError('No hay cambios para guardar.', 422);
        }
        if (isset($v['curso'])) {
            foreach ($parts as $x) {
                if ($x['espacio_anio'] !== (int)$v['curso']) {
                    jsonError("No puede cambiar el curso: {$x['espacio_nombre']} participa y es de {$x['espacio_anio']}.° año.", 409);
                }
            }
        }
        $cambios = [];
        foreach ($v as $k => $nuevo) {
            if ((string)$nuevo !== (string)($p[$k] ?? '')) {
                $cambios[] = $k;
            }
        }
        $pid = $p['id'];
        tx($pdo, static function () use ($pdo, $v, $cambios, $pid, $uid) {
            $set = implode(', ', array_map(static fn($k) => "{$k} = :{$k}", array_keys($v)));
            $pdo->prepare("UPDATE proyectos_articulados SET {$set} WHERE id = :id")->execute($v + ['id' => $pid]);
            $anula = array_intersect($cambios, ['eje', 'modalidad', 'curso', 'division', 'anio_lectivo']);
            if ($anula) {
                anularConformidades($pdo, $pid);
            }
            if ($cambios) {
                hist($pdo, $pid, $uid, 'actualizado', 'Campos: ' . implode(', ', $cambios) . ($anula ? '. Se anularon las conformidades.' : '.'));
            }
            recalcular($pdo, $pid);
        });
        jsonSuccess(['proyecto_id' => $pid, 'anulo_conformidades' => (bool)array_intersect($cambios, ['eje', 'modalidad', 'curso', 'division', 'anio_lectivo'])], 'Proyecto actualizado.');

    case 'abrir':
        requireMethod('POST');
        [$p, , $ac] = cargarVisible($pdo, $user, vId(getJsonInput(), 'proyecto_id', 'proyecto'));
        requireCreador($ac);
        requireEstado($p, ['borrador'], 'Solo un borrador puede abrirse a acuerdo.');
        $pdo->prepare("UPDATE proyectos_articulados SET estado = 'en_acuerdo' WHERE id = :id")->execute(['id' => $p['id']]);
        hist($pdo, $p['id'], $uid, 'abierto', 'El proyecto quedó abierto a convocatoria de otros docentes.');
        jsonSuccess(['estado' => 'en_acuerdo'], 'El proyecto quedó abierto a convocatoria.');

    case 'invitar':
        requireRole(ROLES_AUTORES);
        requireMethod('POST');
        $in = getJsonInput();
        [$p, $parts, $ac] = cargarVisible($pdo, $user, vId($in, 'proyecto_id', 'proyecto'));
        requireParticipante($ac, 'Solo quienes participan del proyecto pueden invitar.');
        requireEstado($p, ESTADOS_EDITABLES, 'El proyecto ya fue presentado y no admite nuevas invitaciones.');
        $did = vId($in, 'docente_id', 'docente');
        $eid = vId($in, 'espacio_id', 'espacio curricular');
        $esp = requireEspacioDelCurso($pdo, $eid, $p['curso']);
        $st = $pdo->prepare("SELECT nombre, apellido FROM usuarios WHERE id = :id AND estado = 'aprobado' AND rol IN ('docente', 'coordinador')");
        $st->execute(['id' => $did]);
        $d = $st->fetch();
        if (!$d) {
            validationError('docente_id', 'El docente indicado no existe o no puede participar.');
        }
        foreach ($parts as $x) {
            if ($x['docente_id'] === $did && $x['espacio_id'] === $eid) {
                jsonError('Ese docente ya fue invitado o participa con ese espacio curricular.', 409);
            }
        }
        $pid = $p['id'];
        tx($pdo, static function () use ($pdo, $pid, $did, $esp, $uid, $p, $d) {
            insertParticipante($pdo, $pid, $did, $esp, 'invitado', $uid);
            if ($p['estado'] === 'borrador') {
                $pdo->prepare("UPDATE proyectos_articulados SET estado = 'en_acuerdo' WHERE id = :id")->execute(['id' => $pid]);
            }
            hist($pdo, $pid, $uid, 'invitacion', "Invitó a {$d['nombre']} {$d['apellido']} desde {$esp['nombre']}.");
            recalcular($pdo, $pid);
        });
        jsonSuccess(['proyecto_id' => $pid], 'Invitación enviada.', 201);

    case 'responder':
        requireRole(ROLES_AUTORES);
        requireMethod('POST');
        $in = getJsonInput();
        [$p, , $ac] = cargarVisible($pdo, $user, vId($in, 'proyecto_id', 'proyecto'));
        $eid = vId($in, 'espacio_id', 'espacio curricular');
        requireEstado($p, ESTADOS_EDITABLES, 'El proyecto ya fue presentado.');
        $mia = null;
        foreach ($ac['mias'] as $x) {
            if ($x['espacio_id'] === $eid) {
                $mia = $x;
            }
        }
        if (!$mia) {
            jsonError('No tiene una invitación para ese espacio en este proyecto.', 404);
        }
        if ($mia['invitacion'] !== 'invitado') {
            jsonError('Esa invitación ya fue respondida.', 409);
        }
        $acepta = vBool($in, 'aceptar', true) === 1;
        $pid = $p['id'];
        tx($pdo, static function () use ($pdo, $mia, $acepta, $pid, $uid) {
            $pdo->prepare('UPDATE proyecto_articulado_participantes SET invitacion = :i WHERE id = :id')
                ->execute(['i' => $acepta ? 'aceptado' : 'rechazado', 'id' => $mia['id']]);
            hist($pdo, $pid, $uid, $acepta ? 'invitacion_aceptada' : 'invitacion_rechazada', "Espacio: {$mia['espacio_nombre']}.");
            recalcular($pdo, $pid);
        });
        jsonSuccess(['invitacion' => $acepta ? 'aceptado' : 'rechazado'], $acepta ? 'Se sumó al proyecto.' : 'Invitación rechazada.');

    case 'join':
        requireRole(ROLES_AUTORES);
        requireMethod('POST');
        $in = getJsonInput();
        [$p, , $ac] = cargarVisible($pdo, $user, vId($in, 'proyecto_id', 'proyecto'));
        requireEstado($p, ['en_acuerdo'], 'El proyecto no está abierto a nuevas postulaciones.');
        $eid = vId($in, 'espacio_id', 'espacio curricular');
        $esp = requireEspacioDelCurso($pdo, $eid, $p['curso']);
        $pid = $p['id'];
        $previa = null;
        foreach ($ac['mias'] as $x) {
            if ($x['espacio_id'] === $eid) {
                $previa = $x;
            }
        }
        if ($previa && $previa['invitacion'] === 'aceptado') {
            jsonError('Ya participa en este proyecto con ese espacio curricular.', 409);
        }
        tx($pdo, static function () use ($pdo, $previa, $pid, $uid, $esp) {
            if ($previa) {
                $pdo->prepare("UPDATE proyecto_articulado_participantes SET invitacion = 'aceptado' WHERE id = :id")->execute(['id' => $previa['id']]);
            } else {
                insertParticipante($pdo, $pid, $uid, $esp, 'aceptado', null);
            }
            hist($pdo, $pid, $uid, 'postulacion', "Se sumó desde {$esp['nombre']}.");
            recalcular($pdo, $pid);
        });
        jsonSuccess(['proyecto_id' => $pid], 'Se sumó al proyecto.', 201);

    case 'aporte_save':
        requireRole(ROLES_AUTORES);
        requireMethod('POST');
        $in = getJsonInput();
        [$p, , $ac] = cargarVisible($pdo, $user, vId($in, 'proyecto_id', 'proyecto'));
        $eid = vId($in, 'espacio_id', 'espacio curricular');
        requireEstado($p, ESTADOS_EDITABLES, 'El proyecto ya fue presentado y los aportes no pueden modificarse.');
        $mia = null;
        foreach ($ac['mias'] as $x) {
            if ($x['espacio_id'] === $eid) {
                $mia = $x;
            }
        }
        if (!$mia || $mia['invitacion'] !== 'aceptado') {
            jsonError('Solo puede cargar su propio aporte, una vez aceptada su participación.', 403);
        }
        $nuevo = [
            'tema' => vString($in, 'tema', 'tema', ['max' => 250]),
            'contenidos' => json_encode(leerContenidos($pdo, $in, $eid), JSON_UNESCAPED_UNICODE),
        ];
        foreach (['actividades' => 'actividades', 'recursos' => 'recursos', 'saberes_propios' => 'saberes propios', 'evaluacion_aporte' => 'evaluación del aporte', 'disponibilidad' => 'disponibilidad'] as $k => $label) {
            $nuevo[$k] = vString($in, $k, $label, ['max' => 15000]);
        }
        $cambio = false;
        foreach ($nuevo as $k => $val) {
            $viejo = $k === 'contenidos' ? json_encode($mia['contenidos'], JSON_UNESCAPED_UNICODE) : (string)$mia[$k];
            if ((string)$val !== $viejo) {
                $cambio = true;
            }
        }
        $pid = $p['id'];
        tx($pdo, static function () use ($pdo, $nuevo, $mia, $cambio, $pid, $uid) {
            $pdo->prepare('UPDATE proyecto_articulado_participantes SET tema = :tema, contenidos = :contenidos, actividades = :actividades,
                recursos = :recursos, saberes_propios = :saberes_propios, evaluacion_aporte = :evaluacion_aporte, disponibilidad = :disponibilidad
                WHERE id = :id')->execute($nuevo + ['id' => $mia['id']]);
            if ($cambio) {
                anularConformidades($pdo, $pid);
                hist($pdo, $pid, $uid, 'aporte', "Aporte de {$mia['espacio_nombre']} modificado. Se anularon las conformidades.");
            }
            recalcular($pdo, $pid);
        });
        jsonSuccess(['anulo_conformidades' => $cambio, 'estado' => loadProyecto($pdo, $pid)['estado']],
            $cambio ? 'Aporte guardado. Las conformidades previas quedaron sin efecto.' : 'Aporte sin cambios.');

    case 'conformar':
        requireRole(ROLES_AUTORES);
        requireMethod('POST');
        $in = getJsonInput();
        [$p, $parts, $ac] = cargarVisible($pdo, $user, vId($in, 'proyecto_id', 'proyecto'));
        requireEstado($p, ['en_acuerdo', 'conformado', 'observado'], 'El proyecto no está en etapa de acuerdo entre docentes.');
        $conforme = vBool($in, 'conforme', true) === 1;
        $eid = vId($in, 'espacio_id', 'espacio curricular', false);
        $mias = array_values(array_filter($ac['mias'], static fn($x) => $x['invitacion'] === 'aceptado' && ($eid === null || $x['espacio_id'] === $eid)));
        if (!$mias) {
            jsonError('No participa de este proyecto con ese espacio curricular.', 403);
        }
        if ($conforme) {
            if ($m = motivoSinConformidad($p, $parts, false)) {
                jsonError($m, 422, ['conformidad' => $m]);
            }
            foreach ($mias as $x) {
                if (trim((string)$x['tema']) === '' && !$x['contenidos']) {
                    jsonError('Antes de dar su conformidad cargue su aporte (tema o contenidos de su espacio).', 422, ['aporte' => 'Falta el aporte.']);
                }
            }
        }
        $pid = $p['id'];
        tx($pdo, static function () use ($pdo, $mias, $conforme, $pid, $uid) {
            $st = $pdo->prepare('UPDATE proyecto_articulado_participantes SET conformidad = :c, fecha_conformidad = :f WHERE id = :id');
            foreach ($mias as $x) {
                $st->execute(['c' => $conforme ? 1 : 0, 'f' => $conforme ? date('Y-m-d H:i:s') : null, 'id' => $x['id']]);
                hist($pdo, $pid, $uid, $conforme ? 'conformidad' : 'conformidad_retirada', "Espacio: {$x['espacio_nombre']}.");
            }
            recalcular($pdo, $pid);
        });
        $p2 = loadProyecto($pdo, $pid);
        jsonSuccess(['estado' => $p2['estado'], 'pendiente' => motivoSinConformidad($p2, participantesDe($pdo, [$pid])[$pid] ?? [])],
            $conforme ? 'Conformidad registrada.' : 'Conformidad retirada.');

    case 'presentar':
        requireMethod('POST');
        [$p, $parts, $ac] = cargarVisible($pdo, $user, vId(getJsonInput(), 'proyecto_id', 'proyecto'));
        requireCreador($ac);
        requireEstado($p, ['conformado', 'observado'], 'Para presentarlo, el proyecto debe estar conformado por los docentes.');
        if ($m = motivoSinConformidad($p, $parts)) {
            jsonError($m, 409);
        }
        $pid = $p['id'];
        tx($pdo, static function () use ($pdo, $pid, $uid) {
            $pdo->prepare("UPDATE proyectos_articulados SET estado = 'presentado', fecha_presentacion = NOW() WHERE id = :id")->execute(['id' => $pid]);
            hist($pdo, $pid, $uid, 'presentado', 'Presentado a la Dirección.');
        });
        $calculo = calcular($pdo, loadProyecto($pdo, $pid), $parts);
        jsonSuccess(['estado' => 'presentado', 'advertencias' => $calculo['advertencias'],
            'requiere_autorizacion_direccion_nivel' => $calculo['requiere_autorizacion_direccion_nivel']], 'Proyecto presentado a la Dirección.');

    case 'revisar':
        requireRole(ROLES_DIRECTIVOS);
        requireMethod('POST');
        $in = getJsonInput();
        [$p, , $ac] = cargarVisible($pdo, $user, vId($in, 'proyecto_id', 'proyecto'));
        if ($ac['creador'] || $ac['mias']) {
            jsonError('No puede revisar un proyecto en el que participa.', 403);
        }
        $dec = vEnum($in, 'decision', 'decisión', ['autorizado', 'observado'], true);
        $motivo = vString($in, 'motivo', 'motivo', ['required' => $dec === 'observado', 'max' => 5000]);
        requireEstado($p, ['presentado'], 'Solo se revisan proyectos presentados.');
        $pid = $p['id'];
        tx($pdo, static function () use ($pdo, $pid, $uid, $dec, $motivo) {
            $pdo->prepare('UPDATE proyectos_articulados SET estado = :e, devolucion = :d, revisado_por = :u, fecha_revision = NOW() WHERE id = :id')
                ->execute(['e' => $dec, 'd' => $motivo, 'u' => $uid, 'id' => $pid]);
            hist($pdo, $pid, $uid, $dec, $motivo);
        });
        jsonSuccess(['estado' => $dec], $dec === 'autorizado' ? 'Proyecto autorizado.' : 'Proyecto devuelto con observaciones.');

    case 'iniciar':
        requireMethod('POST');
        [$p, , $ac] = cargarVisible($pdo, $user, vId(getJsonInput(), 'proyecto_id', 'proyecto'));
        requireCreador($ac);
        requireEstado($p, ['autorizado'], 'Solo un proyecto autorizado puede iniciarse.');
        $pdo->prepare("UPDATE proyectos_articulados SET estado = 'en_ejecucion' WHERE id = :id")->execute(['id' => $p['id']]);
        hist($pdo, $p['id'], $uid, 'iniciado', 'Comenzó la ejecución.');
        jsonSuccess(['estado' => 'en_ejecucion'], 'Proyecto en ejecución.');

    case 'cerrar':
        requireMethod('POST');
        $in = getJsonInput();
        [$p, , $ac] = cargarVisible($pdo, $user, vId($in, 'proyecto_id', 'proyecto'));
        requireCreador($ac);
        requireEstado($p, ['en_ejecucion'], 'Solo un proyecto en ejecución puede cerrarse.');
        $ev = vString($in, 'evaluacion_instancia', 'evaluación de la instancia', ['required' => true, 'max' => 15000]);
        $pdo->prepare("UPDATE proyectos_articulados SET estado = 'cerrado', evaluacion_instancia = :e WHERE id = :id")->execute(['e' => $ev, 'id' => $p['id']]);
        hist($pdo, $p['id'], $uid, 'cerrado', 'Proyecto cerrado con evaluación de la instancia.');
        jsonSuccess(['estado' => 'cerrado'], 'Proyecto cerrado.');

    case 'encuentro_save':
        requireRole(ROLES_AUTORES);
        requireMethod('POST');
        $in = getJsonInput();
        [$p, $parts, $ac] = cargarVisible($pdo, $user, vId($in, 'proyecto_id', 'proyecto'));
        requireParticipante($ac, 'Solo quienes participan del proyecto pueden editar el plan de trabajo.');
        requireEstado($p, ESTADOS_PLAN, 'En este estado el plan de trabajo no puede modificarse.');
        $eid = vId($in, 'id', 'encuentro', false);
        $pid = $p['id'];
        if ($eid !== null) {
            $st = $pdo->prepare('SELECT 1 FROM proyecto_encuentros WHERE id = :id AND proyecto_id = :p');
            $st->execute(['id' => $eid, 'p' => $pid]);
            if (!$st->fetchColumn()) {
                jsonError('Encuentro no encontrado.', 404);
            }
        }
        $docs = is_array($in['docentes'] ?? null) ? array_map('intval', $in['docentes']) : [];
        $validos = array_column(array_filter($parts, static fn($x) => $x['invitacion'] === 'aceptado'), 'docente_id');
        foreach ($docs as $d) {
            if (!in_array($d, $validos, true)) {
                validationError('docentes', 'Los docentes a cargo deben participar del proyecto.');
            }
        }
        $vals = [
            'fecha' => vDate($in, 'fecha', 'fecha'),
            'horas' => vInt($in, 'horas', 'horas', ['min' => 1, 'max' => 12, 'default' => 1]),
            'titulo' => vString($in, 'titulo', 'título', ['required' => true, 'max' => 200]),
            'actividades' => vString($in, 'actividades', 'actividades', ['max' => 15000]),
            'docentes' => json_encode(array_values(array_unique($docs))),
            'contenidos' => json_encode(vStringList($in, 'contenidos', 'contenidos', 40, 500), JSON_UNESCAPED_UNICODE),
            'evidencia' => vString($in, 'evidencia', 'evidencia', ['max' => 5000]),
        ];
        if ($eid === null) {
            $pdo->prepare('INSERT INTO proyecto_encuentros (proyecto_id, fecha, horas, titulo, actividades, docentes, contenidos, evidencia)
                VALUES (:p, :fecha, :horas, :titulo, :actividades, :docentes, :contenidos, :evidencia)')->execute($vals + ['p' => $pid]);
            $eid = (int)$pdo->lastInsertId();
            hist($pdo, $pid, $uid, 'encuentro', "Nuevo encuentro: {$vals['titulo']}.");
        } else {
            $pdo->prepare('UPDATE proyecto_encuentros SET fecha = :fecha, horas = :horas, titulo = :titulo, actividades = :actividades,
                docentes = :docentes, contenidos = :contenidos, evidencia = :evidencia WHERE id = :id AND proyecto_id = :p')->execute($vals + ['id' => $eid, 'p' => $pid]);
            hist($pdo, $pid, $uid, 'encuentro', "Encuentro modificado: {$vals['titulo']}.");
        }
        jsonSuccess(['id' => $eid], 'Encuentro guardado.', 201);

    case 'encuentro_delete':
        requireMethod('POST');
        $in = getJsonInput();
        [$p, , $ac] = cargarVisible($pdo, $user, vId($in, 'proyecto_id', 'proyecto'));
        requireParticipante($ac, 'Solo quienes participan del proyecto pueden editar el plan de trabajo.');
        requireEstado($p, ESTADOS_PLAN, 'En este estado el plan de trabajo no puede modificarse.');
        $st = $pdo->prepare('DELETE FROM proyecto_encuentros WHERE id = :id AND proyecto_id = :p');
        $st->execute(['id' => vId($in, 'id', 'encuentro'), 'p' => $p['id']]);
        if ($st->rowCount() === 0) {
            jsonError('Encuentro no encontrado.', 404);
        }
        hist($pdo, $p['id'], $uid, 'encuentro_eliminado', null);
        jsonSuccess(null, 'Encuentro eliminado.');

    case 'encuentro_realizado':
        requireMethod('POST');
        $in = getJsonInput();
        [$p, , $ac] = cargarVisible($pdo, $user, vId($in, 'proyecto_id', 'proyecto'));
        requireParticipante($ac, 'Solo quienes participan del proyecto pueden registrar encuentros.');
        requireEstado($p, ['en_ejecucion'], 'Los encuentros se registran como realizados cuando el proyecto está en ejecución.');
        $eid = vId($in, 'id', 'encuentro');
        $real = vBool($in, 'realizado', true);
        $ev = vString($in, 'evidencia', 'evidencia', ['max' => 5000]);
        $chk = $pdo->prepare('SELECT 1 FROM proyecto_encuentros WHERE id = :id AND proyecto_id = :p');
        $chk->execute(['id' => $eid, 'p' => $p['id']]);
        if (!$chk->fetchColumn()) {
            jsonError('Encuentro no encontrado.', 404);
        }
        $pdo->prepare('UPDATE proyecto_encuentros SET realizado = :r, evidencia = COALESCE(:e, evidencia) WHERE id = :id AND proyecto_id = :p')
            ->execute(['r' => $real, 'e' => $ev, 'id' => $eid, 'p' => $p['id']]);
        hist($pdo, $p['id'], $uid, $real ? 'encuentro_realizado' : 'encuentro_pendiente', "Encuentro #{$eid}.");
        jsonSuccess(['realizado' => $real === 1], 'Encuentro actualizado.');

    case 'leave':
        requireMethod('POST');
        [$p, , $ac] = cargarVisible($pdo, $user, vId(getJsonInput(), 'proyecto_id', 'proyecto'));
        if ($ac['creador']) {
            jsonError('Quien creó el proyecto no puede abandonarlo; puede eliminarlo mientras sea borrador o cerrarlo.', 409);
        }
        if (!$ac['mias']) {
            jsonError('No participa en este proyecto.', 404);
        }
        requireEstado($p, ESTADOS_EDITABLES, 'El proyecto ya fue presentado: no se puede abandonar.');
        $pid = $p['id'];
        tx($pdo, static function () use ($pdo, $pid, $uid) {
            $pdo->prepare('DELETE FROM proyecto_articulado_participantes WHERE proyecto_id = :p AND docente_id = :u')->execute(['p' => $pid, 'u' => $uid]);
            anularConformidades($pdo, $pid);
            hist($pdo, $pid, $uid, 'abandono', 'Dejó el proyecto. Se anularon las conformidades.');
            recalcular($pdo, $pid);
        });
        jsonSuccess(['proyecto_id' => $pid], 'Ha dejado el proyecto.');

    case 'delete':
        requireMethod('POST');
        [$p, , $ac] = cargarVisible($pdo, $user, vId(getJsonInput(), 'proyecto_id', 'proyecto'));
        requireCreador($ac);
        requireEstado($p, ['borrador'], 'Solo se pueden eliminar proyectos en borrador.');
        $pdo->prepare('DELETE FROM proyectos_articulados WHERE id = :id')->execute(['id' => $p['id']]);
        jsonSuccess(null, 'Borrador eliminado.');

    default:
        jsonError('Acción no reconocida en proyectos articulados.', 404);
}
