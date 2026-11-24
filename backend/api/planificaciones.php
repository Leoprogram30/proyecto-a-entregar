<?php
/**
 * Planificaciones anuales (wizard docente y supervisión directiva)
 * IPEM N° 349 "Giovanni Bosco"
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers/bootstrap.php';

const ESTADOS_PLAN = ['borrador', 'pendiente_revision', 'aprobada', 'requiere_ajustes'];
const TEXTO_LARGO = 15000;

const PLAN_SELECT = 'SELECT p.*, e.nombre AS espacio_nombre, e.anio AS espacio_anio, e.ciclo AS espacio_ciclo,
        e.area AS espacio_area, e.orientacion AS espacio_orientacion, e.horas_catedra,
        u.nombre AS docente_nombre, u.apellido AS docente_apellido, u.email AS docente_email
    FROM planificaciones_anuales p
    JOIN espacios_curriculares e ON p.espacio_id = e.id
    JOIN usuarios u ON p.docente_id = u.id';

function formatPlan(array $p): array {
    foreach (['metas', 'objetivos', 'contenidos', 'capacidades', 'transversales', 'unidades', 'formatos_pedagogicos'] as $k) {
        $p[$k] = decodeList($p[$k] ?? null);
    }
    return $p;
}

/** Datos validados de una planificación a partir del cuerpo de la petición. */
function planDesdeEntrada(array $in): array {
    return [
        'diag' => vString($in, 'diagnostico', 'diagnóstico', ['max' => TEXTO_LARGO]),
        'fund' => vString($in, 'fundamentacion', 'fundamentación', ['max' => TEXTO_LARGO]),
        'metas' => vStringList($in, 'metas', 'metas', 50, 3000),
        'obj' => vStringList($in, 'objetivos', 'objetivos'),
        'cont' => vContenidosList($in, 'contenidos'),
        'cap' => vCatalogList($in, 'capacidades', 'capacidades', CAPACIDADES_FUNDAMENTALES),
        'trans' => vTransversales($in, 'transversales'),
        'uni' => vUnidades($in, 'unidades'),
        'estr' => vString($in, 'estrategias', 'estrategias', ['max' => TEXTO_LARGO]),
        'form' => vCatalogList($in, 'formatos_pedagogicos', 'formatos pedagógicos', FORMATOS_PEDAGOGICOS),
        'rec' => vString($in, 'recursos', 'recursos', ['max' => TEXTO_LARGO]),
        'art' => vString($in, 'articulacion', 'articulación', ['max' => TEXTO_LARGO]),
        'ecri' => vString($in, 'evaluacion_criterios', 'criterios de evaluación', ['max' => TEXTO_LARGO]),
        'eins' => vString($in, 'evaluacion_instrumentos', 'instrumentos de evaluación', ['max' => TEXTO_LARGO]),
        'emom' => vString($in, 'evaluacion_momentos', 'momentos de evaluación', ['max' => TEXTO_LARGO]),
        'bib' => vString($in, 'bibliografia', 'bibliografía', ['max' => TEXTO_LARGO]),
    ];
}

/** Lo esencial para enviar a revisión: campo => mensaje. */
function planFaltantes(array $d): array {
    $f = [];
    if ($d['diag'] === null) {
        $f['diagnostico'] = 'Complete el diagnóstico del grupo.';
    }
    if (!$d['obj']) {
        $f['objetivos'] = 'Agregue al menos un objetivo.';
    }
    if (!$d['cont']) {
        $f['contenidos'] = 'Seleccione o agregue al menos un aprendizaje o contenido.';
    }
    if ($d['ecri'] === null) {
        $f['evaluacion_criterios'] = 'Indique los criterios de evaluación.';
    }
    if ($d['eins'] === null) {
        $f['evaluacion_instrumentos'] = 'Indique los instrumentos de evaluación.';
    }
    return $f;
}

const PLAN_COLS = ['diag' => 'diagnostico', 'fund' => 'fundamentacion', 'metas' => 'metas', 'obj' => 'objetivos', 'cont' => 'contenidos',
    'cap' => 'capacidades', 'trans' => 'transversales', 'uni' => 'unidades', 'estr' => 'estrategias', 'form' => 'formatos_pedagogicos',
    'rec' => 'recursos', 'art' => 'articulacion', 'ecri' => 'evaluacion_criterios', 'eins' => 'evaluacion_instrumentos',
    'emom' => 'evaluacion_momentos', 'bib' => 'bibliografia'];
const PLAN_JSON = ['metas', 'obj', 'cont', 'cap', 'trans', 'uni', 'form'];

/** Un usuario puede ver una planificación si es suya, o si es directivo y no es un borrador ajeno. */
function canViewPlan(array $user, array $plan): bool {
    if ((int)$plan['docente_id'] === $user['sub']) {
        return true;
    }
    return isDirectivo($user) && $plan['estado'] !== 'borrador';
}

$pdo = getDbConnection();
$user = requireAuth();
$action = $_GET['action'] ?? 'my_plans';

switch ($action) {
    case 'my_plans':
        $st = $pdo->prepare(PLAN_SELECT . ' WHERE p.docente_id = :uid ORDER BY p.fecha_actualizacion DESC, p.id DESC');
        $st->execute(['uid' => $user['sub']]);
        jsonSuccess(array_map('formatPlan', $st->fetchAll()), 'Mis planificaciones');

    case 'all_plans':
        if (!isDirectivo($user)) {
            jsonError('Acceso restringido al Equipo Directivo y Administración.', 403);
        }
        $ciclo = vEnum($_GET, 'ciclo', 'ciclo', ['basico', 'orientado']);
        $anio = vInt($_GET, 'anio', 'año', ['min' => 1, 'max' => 6]);
        $estado = vEnum($_GET, 'estado', 'estado', ESTADOS_PLAN);
        $espacioId = vId($_GET, 'espacio_id', 'espacio', false);

        $sql = PLAN_SELECT . " WHERE (p.estado <> 'borrador' OR p.docente_id = :uid)";
        $params = ['uid' => $user['sub']];
        if ($ciclo !== null) {
            $sql .= ' AND e.ciclo = :ciclo';
            $params['ciclo'] = $ciclo;
        }
        if ($anio !== null) {
            $sql .= ' AND e.anio = :anio';
            $params['anio'] = $anio;
        }
        if ($estado !== null) {
            $sql .= ' AND p.estado = :estado';
            $params['estado'] = $estado;
        }
        if ($espacioId !== null) {
            $sql .= ' AND p.espacio_id = :espacio_id';
            $params['espacio_id'] = $espacioId;
        }
        $st = $pdo->prepare($sql . ' ORDER BY p.fecha_actualizacion DESC, p.id DESC');
        $st->execute($params);
        jsonSuccess(array_map('formatPlan', $st->fetchAll()), 'Supervisión de planificaciones');

    case 'detail':
        $id = vId($_GET, 'id', 'planificación');
        $st = $pdo->prepare(PLAN_SELECT . ' WHERE p.id = :id');
        $st->execute(['id' => $id]);
        $plan = $st->fetch();
        if (!$plan) {
            jsonError('Planificación no encontrada.', 404);
        }
        if (!canViewPlan($user, $plan)) {
            jsonError('No tiene autorización para ver esta planificación.', 403);
        }
        $st = $pdo->prepare('SELECT c.id, c.planificacion_id, c.usuario_id, c.comentario, c.estado_asociado, c.created_at,
                                    u.nombre, u.apellido, u.rol
                             FROM planificacion_comentarios c JOIN usuarios u ON c.usuario_id = u.id
                             WHERE c.planificacion_id = :id ORDER BY c.created_at ASC, c.id ASC');
        $st->execute(['id' => $id]);
        jsonSuccess(['planificacion' => formatPlan($plan), 'comentarios' => $st->fetchAll()], 'Detalle de la planificación');

    case 'save':
        requireRole(ROLES_AUTORES);
        requireMethod('POST');
        $in = getJsonInput();
        $id = vId($in, 'id', 'planificación', false);
        $espacioId = vId($in, 'espacio_id', 'espacio curricular');
        requireEspacio($pdo, $espacioId, 'espacio_id', $id ? ['tabla' => 'planificaciones_anuales', 'id' => $id] : null);
        $anioLectivo = vInt($in, 'anio_lectivo', 'año lectivo', ['min' => 2000, 'max' => 2100, 'default' => (int)date('Y')]);
        $division = vString($in, 'division', 'división', ['max' => 10, 'default' => 'A']);
        $d = planDesdeEntrada($in);
        $estado = vEnum($in, 'estado', 'estado', ['borrador', 'pendiente_revision'], false, 'borrador');
        if ($estado === 'pendiente_revision') {
            $falt = planFaltantes($d);
            if ($falt) {
                jsonError('Faltan datos esenciales para enviar la planificación a revisión.', 422, $falt);
            }
        }
        $params = ['espacio_id' => $espacioId, 'anio' => $anioLectivo, 'division' => $division, 'estado' => $estado];
        foreach (PLAN_COLS as $k => $col) {
            $params[$k] = in_array($k, PLAN_JSON, true) ? json_encode($d[$k], JSON_UNESCAPED_UNICODE) : $d[$k];
        }
        $sets = implode(', ', array_map(static fn($k, $c) => "{$c}=:{$k}", array_keys(PLAN_COLS), PLAN_COLS));
        $cols = implode(', ', PLAN_COLS);
        $phs = implode(', ', array_map(static fn($k) => ":{$k}", array_keys(PLAN_COLS)));

        if ($id) {
            $st = $pdo->prepare('SELECT docente_id, estado FROM planificaciones_anuales WHERE id = :id');
            $st->execute(['id' => $id]);
            $ex = $st->fetch();
            if (!$ex) {
                jsonError('Planificación no encontrada.', 404);
            }
            if ((int)$ex['docente_id'] !== $user['sub']) {
                jsonError('Solo el autor puede editar esta planificación.', 403);
            }
            if ($ex['estado'] === 'aprobada') {
                jsonError('La planificación está aprobada y no puede modificarse.', 409);
            }
            $params['id'] = $id;
            $pdo->prepare("UPDATE planificaciones_anuales SET espacio_id=:espacio_id, anio_lectivo=:anio, division=:division, {$sets}, estado=:estado WHERE id=:id")->execute($params);
            jsonSuccess(['id' => $id, 'estado' => $estado], 'Planificación actualizada correctamente.');
        }

        $params['uid'] = $user['sub'];
        $pdo->prepare("INSERT INTO planificaciones_anuales (docente_id, espacio_id, anio_lectivo, division, {$cols}, estado)
                       VALUES (:uid, :espacio_id, :anio, :division, {$phs}, :estado)")->execute($params);
        jsonSuccess(['id' => (int)$pdo->lastInsertId(), 'estado' => $estado], 'Planificación guardada con éxito.', 201);

    case 'duplicate':
        requireRole(ROLES_AUTORES);
        requireMethod('POST');
        $in = getJsonInput();
        $id = vId($in, 'id', 'planificación');
        $st = $pdo->prepare('SELECT * FROM planificaciones_anuales WHERE id = :id');
        $st->execute(['id' => $id]);
        $orig = $st->fetch();
        if (!$orig) {
            jsonError('Planificación no encontrada.', 404);
        }
        if ((int)$orig['docente_id'] !== $user['sub']) {
            jsonError('Solo puede duplicar sus propias planificaciones.', 403);
        }
        $anioN = vInt($in, 'anio_lectivo', 'año lectivo', ['min' => 2000, 'max' => 2100, 'default' => (int)$orig['anio_lectivo']]);
        $divN = vString($in, 'division', 'división', ['max' => 10, 'default' => $orig['division']]);
        $cols = implode(', ', PLAN_COLS);
        $phs = implode(', ', array_map(static fn($c) => ":{$c}", PLAN_COLS));
        $params = ['uid' => $user['sub'], 'espacio_id' => (int)$orig['espacio_id'], 'anio' => $anioN, 'division' => $divN];
        foreach (PLAN_COLS as $c) {
            $params[$c] = $orig[$c];
        }
        $pdo->prepare("INSERT INTO planificaciones_anuales (docente_id, espacio_id, anio_lectivo, division, {$cols}, estado)
                       VALUES (:uid, :espacio_id, :anio, :division, {$phs}, 'borrador')")->execute($params);
        jsonSuccess(['id' => (int)$pdo->lastInsertId(), 'estado' => 'borrador'], 'Planificación duplicada como borrador.', 201);

    case 'review':
        if (!isDirectivo($user)) {
            jsonError('Acceso exclusivo para el Equipo Directivo.', 403);
        }
        requireMethod('POST');
        $in = getJsonInput();
        $id = vId($in, 'planificacion_id', 'planificación');
        $nuevo = vEnum($in, 'estado', 'estado', ['aprobada', 'requiere_ajustes'], true);
        $comentario = vString($in, 'comentario', 'comentario', ['max' => 5000]);
        if ($nuevo === 'requiere_ajustes' && $comentario === null) {
            validationError('comentario', 'Debe indicar un comentario cuando se solicitan ajustes.');
        }

        $st = $pdo->prepare('SELECT docente_id, estado FROM planificaciones_anuales WHERE id = :id');
        $st->execute(['id' => $id]);
        $plan = $st->fetch();
        if (!$plan) {
            jsonError('Planificación no encontrada.', 404);
        }
        if ((int)$plan['docente_id'] === $user['sub']) {
            jsonError('No puede revisar su propia planificación.', 403);
        }
        if ($plan['estado'] === 'borrador') {
            jsonError('La planificación aún es un borrador y no fue enviada a revisión.', 409);
        }

        $pdo->beginTransaction();
        try {
            $pdo->prepare('UPDATE planificaciones_anuales SET estado=:estado, devolucion_directivo=:dev, revisado_por=:rev, fecha_revision=:fec WHERE id=:id')
                ->execute(['estado' => $nuevo, 'dev' => $comentario, 'rev' => $user['sub'], 'fec' => date('Y-m-d H:i:s'), 'id' => $id]);
            if ($comentario !== null) {
                $pdo->prepare('INSERT INTO planificacion_comentarios (planificacion_id, usuario_id, comentario, estado_asociado) VALUES (:pid, :uid, :com, :est)')
                    ->execute(['pid' => $id, 'uid' => $user['sub'], 'com' => $comentario, 'est' => $nuevo]);
            }
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
        jsonSuccess(['planificacion_id' => $id, 'estado' => $nuevo], "Revisión registrada. Estado: {$nuevo}.");

    case 'delete':
        requireMethod('POST');
        $id = vId(getJsonInput(), 'id', 'planificación');
        $st = $pdo->prepare('SELECT docente_id, estado FROM planificaciones_anuales WHERE id = :id');
        $st->execute(['id' => $id]);
        $plan = $st->fetch();
        if (!$plan) {
            jsonError('Planificación no encontrada.', 404);
        }
        if ((int)$plan['docente_id'] !== $user['sub']) {
            jsonError('Solo el autor puede eliminar esta planificación.', 403);
        }
        if ($plan['estado'] === 'aprobada') {
            jsonError('Una planificación aprobada no puede eliminarse.', 409);
        }
        $pdo->prepare('DELETE FROM planificaciones_anuales WHERE id = :id')->execute(['id' => $id]);
        jsonSuccess(['id' => $id], 'Planificación eliminada.');

    default:
        jsonError('Acción no reconocida en planificaciones.', 404);
}
