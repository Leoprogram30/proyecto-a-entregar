<?php
/**
 * Secuencias didácticas
 * IPEM N° 349 "Giovanni Bosco"
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers/bootstrap.php';

const TEXTO_LARGO = 15000;

const SEC_SELECT = 'SELECT s.*, e.nombre AS espacio_nombre, e.anio AS espacio_anio, e.ciclo AS espacio_ciclo,
        e.area AS espacio_area, e.horas_catedra,
        u.nombre AS docente_nombre, u.apellido AS docente_apellido, u.email AS docente_email
    FROM secuencias_didacticas s
    JOIN espacios_curriculares e ON s.espacio_id = e.id
    JOIN usuarios u ON s.docente_id = u.id';

function formatSec(array $s): array {
    foreach (['contenidos', 'capacidades', 'clases'] as $k) {
        $s[$k] = decodeList($s[$k] ?? null);
    }
    foreach ($s['clases'] as $i => $c) {
        if (is_array($c)) {
            $s['clases'][$i]['evaluativa'] = !empty($c['evaluativa']);
        }
    }
    if (isset($s['planificacion_id'])) {
        $s['planificacion_id'] = (int)$s['planificacion_id'];
    }
    return $s;
}

const SEC_COLS = ['fund' => 'fundamentacion', 'obj' => 'objetivos', 'cont' => 'contenidos', 'cap' => 'capacidades', 'formato' => 'formato',
    'tiempo' => 'tiempo_estimado', 'agr' => 'agrupamientos', 'amb' => 'ambiente', 'clases' => 'clases', 'prod' => 'producto',
    'ecri' => 'evaluacion_criterios', 'eins' => 'evaluacion_instrumentos', 'rec' => 'recursos', 'bib' => 'bibliografia',
    'tipo' => 'tipo_articulacion', 'eje' => 'articulacion_eje', 'mat' => 'articulacion_materias'];
const SEC_JSON = ['cont', 'cap', 'clases'];

function canViewSec(array $user, array $s): bool {
    if ((int)$s['docente_id'] === $user['sub']) {
        return true;
    }
    return isDirectivo($user) && $s['estado'] !== 'borrador';
}

$pdo = getDbConnection();
$user = requireAuth();
$action = $_GET['action'] ?? 'list';

switch ($action) {
    case 'list':
        $espacioId = vId($_GET, 'espacio_id', 'espacio', false);
        // Directivos ven lo enviado a revision (no borradores ajenos); los demas, solo lo propio.
        if (isDirectivo($user)) {
            $sql = SEC_SELECT . " WHERE (s.estado <> 'borrador' OR s.docente_id = :uid)";
        } else {
            $sql = SEC_SELECT . ' WHERE s.docente_id = :uid';
        }
        $params = ['uid' => $user['sub']];
        if ($espacioId !== null) {
            $sql .= ' AND s.espacio_id = :espacio_id';
            $params['espacio_id'] = $espacioId;
        }
        $st = $pdo->prepare($sql . ' ORDER BY s.fecha_actualizacion DESC, s.id DESC');
        $st->execute($params);
        jsonSuccess(array_map('formatSec', $st->fetchAll()), 'Listado de secuencias didácticas');

    case 'detail':
        $id = vId($_GET, 'id', 'secuencia');
        $st = $pdo->prepare(SEC_SELECT . ' WHERE s.id = :id');
        $st->execute(['id' => $id]);
        $sec = $st->fetch();
        if (!$sec) {
            jsonError('Secuencia no encontrada.', 404);
        }
        if (!canViewSec($user, $sec)) {
            jsonError('No tiene autorización para ver esta secuencia.', 403);
        }
        jsonSuccess(formatSec($sec), 'Detalle de secuencia didáctica');

    case 'save':
        requireRole(ROLES_AUTORES);
        requireMethod('POST');
        $in = getJsonInput();
        $id = vId($in, 'id', 'secuencia', false);
        $espacioId = vId($in, 'espacio_id', 'espacio curricular');
        requireEspacio($pdo, $espacioId, 'espacio_id', $id ? ['tabla' => 'secuencias_didacticas', 'id' => $id] : null);
        $titulo = vString($in, 'titulo', 'título', ['required' => true, 'max' => 200]);
        if ($id) {
            $q = $pdo->prepare('SELECT docente_id FROM secuencias_didacticas WHERE id = :id');
            $q->execute(['id' => $id]);
            $dueno = $q->fetchColumn();
            if ($dueno !== false && (int)$dueno !== $user['sub']) {
                jsonError('Solo el autor puede editar esta secuencia.', 403);
            }
        }
        $planId = vId($in, 'planificacion_id', 'planificación', false);
        if ($planId !== null) {
            $q = $pdo->prepare('SELECT docente_id, espacio_id FROM planificaciones_anuales WHERE id = :id');
            $q->execute(['id' => $planId]);
            $pl = $q->fetch();
            if (!$pl || (int)$pl['docente_id'] !== $user['sub']) {
                validationError('planificacion_id', 'La planificación indicada no existe o no es suya.');
            }
            if ((int)$pl['espacio_id'] !== $espacioId) {
                validationError('planificacion_id', 'La planificación debe ser del mismo espacio curricular.');
            }
        }
        $v = [
            'fund' => vString($in, 'fundamentacion', 'fundamentación', ['max' => TEXTO_LARGO]),
            'obj' => vString($in, 'objetivos', 'objetivos', ['max' => TEXTO_LARGO]),
            'cont' => vContenidosList($in, 'contenidos'),
            'cap' => vCatalogList($in, 'capacidades', 'capacidades', CAPACIDADES_FUNDAMENTALES),
            'formato' => vEnum($in, 'formato', 'formato', FORMATOS_PEDAGOGICOS),
            'tiempo' => vString($in, 'tiempo_estimado', 'tiempo estimado', ['max' => 100]),
            'agr' => vString($in, 'agrupamientos', 'agrupamientos', ['max' => TEXTO_LARGO]),
            'amb' => vString($in, 'ambiente', 'ambiente', ['max' => TEXTO_LARGO]),
            'clases' => vClases($in, 'clases'),
            'prod' => vString($in, 'producto', 'producto', ['max' => TEXTO_LARGO]),
            'ecri' => vString($in, 'evaluacion_criterios', 'criterios de evaluación', ['max' => TEXTO_LARGO]),
            'eins' => vString($in, 'evaluacion_instrumentos', 'instrumentos de evaluación', ['max' => TEXTO_LARGO]),
            'rec' => vString($in, 'recursos', 'recursos', ['max' => TEXTO_LARGO]),
            'bib' => vString($in, 'bibliografia', 'bibliografía', ['max' => TEXTO_LARGO]),
            'tipo' => vEnum($in, 'tipo_articulacion', 'tipo de articulación', ['ninguna', 'declarativa', 'colaborativa'], false, 'ninguna'),
            'eje' => vString($in, 'articulacion_eje', 'eje de articulación', ['max' => 255]),
            'mat' => vString($in, 'articulacion_materias', 'materias de articulación', ['max' => 255]),
        ];
        $estado = vEnum($in, 'estado', 'estado', ['borrador', 'pendiente_revision'], false, 'borrador');
        if ($estado === 'pendiente_revision') {
            $falt = [];
            if ($v['obj'] === null) {
                $falt['objetivos'] = 'Indique los objetivos de la secuencia.';
            }
            if (!$v['cont']) {
                $falt['contenidos'] = 'Seleccione o agregue al menos un contenido.';
            }
            if (!$v['clases']) {
                $falt['clases'] = 'Agregue al menos una clase con sus actividades.';
            }
            if ($v['ecri'] === null) {
                $falt['evaluacion_criterios'] = 'Indique los criterios de evaluación.';
            }
            if ($falt) {
                jsonError('Faltan datos esenciales para enviar la secuencia a revisión.', 422, $falt);
            }
        }
        $params = ['espacio_id' => $espacioId, 'titulo' => $titulo, 'plan' => $planId, 'estado' => $estado];
        foreach (SEC_COLS as $k => $col) {
            $params[$k] = in_array($k, SEC_JSON, true) ? json_encode($v[$k], JSON_UNESCAPED_UNICODE) : $v[$k];
        }
        $sets = implode(', ', array_map(static fn($k, $c) => "{$c}=:{$k}", array_keys(SEC_COLS), SEC_COLS));
        $cols = implode(', ', SEC_COLS);
        $phs = implode(', ', array_map(static fn($k) => ":{$k}", array_keys(SEC_COLS)));

        if ($id) {
            $st = $pdo->prepare('SELECT docente_id, estado FROM secuencias_didacticas WHERE id = :id');
            $st->execute(['id' => $id]);
            $ex = $st->fetch();
            if (!$ex) {
                jsonError('Secuencia no encontrada.', 404);
            }
            if ((int)$ex['docente_id'] !== $user['sub']) {
                jsonError('Solo el autor puede editar esta secuencia.', 403);
            }
            if ($ex['estado'] === 'aprobada') {
                jsonError('La secuencia está aprobada y no puede modificarse.', 409);
            }
            $params['id'] = $id;
            $pdo->prepare("UPDATE secuencias_didacticas SET espacio_id=:espacio_id, titulo=:titulo, planificacion_id=:plan, {$sets}, estado=:estado WHERE id=:id")->execute($params);
            jsonSuccess(['id' => $id, 'estado' => $params['estado']], 'Secuencia didáctica actualizada con éxito.');
        }

        $params['uid'] = $user['sub'];
        $pdo->prepare("INSERT INTO secuencias_didacticas (docente_id, espacio_id, titulo, planificacion_id, {$cols}, estado)
                       VALUES (:uid, :espacio_id, :titulo, :plan, {$phs}, :estado)")->execute($params);
        jsonSuccess(['id' => (int)$pdo->lastInsertId(), 'estado' => $params['estado']], 'Secuencia didáctica guardada con éxito.', 201);

    case 'duplicate':
        requireRole(ROLES_AUTORES);
        requireMethod('POST');
        $id = vId(getJsonInput(), 'id', 'secuencia');
        $st = $pdo->prepare('SELECT * FROM secuencias_didacticas WHERE id = :id');
        $st->execute(['id' => $id]);
        $orig = $st->fetch();
        if (!$orig) {
            jsonError('Secuencia no encontrada.', 404);
        }
        if ((int)$orig['docente_id'] !== $user['sub']) {
            jsonError('Solo puede duplicar sus propias secuencias.', 403);
        }
        $cols = implode(', ', SEC_COLS);
        $phs = implode(', ', array_map(static fn($c) => ":{$c}", SEC_COLS));
        $params = ['uid' => $user['sub'], 'espacio_id' => (int)$orig['espacio_id'], 'titulo' => mb_substr($orig['titulo'] . ' (copia)', 0, 200),
                   'plan' => $orig['planificacion_id']];
        foreach (SEC_COLS as $c) {
            $params[$c] = $orig[$c];
        }
        $pdo->prepare("INSERT INTO secuencias_didacticas (docente_id, espacio_id, titulo, planificacion_id, {$cols}, estado)
                       VALUES (:uid, :espacio_id, :titulo, :plan, {$phs}, 'borrador')")->execute($params);
        jsonSuccess(['id' => (int)$pdo->lastInsertId(), 'estado' => 'borrador'], 'Secuencia duplicada como borrador.', 201);

    case 'review':
        if (!isDirectivo($user)) {
            jsonError('Acceso exclusivo para el Equipo Directivo.', 403);
        }
        requireMethod('POST');
        $in = getJsonInput();
        $id = vId($in, 'secuencia_id', 'secuencia');
        $nuevo = vEnum($in, 'estado', 'estado', ['aprobada', 'requiere_ajustes'], true);
        $dev = vString($in, 'devolucion', 'devolución', ['max' => 5000]);
        if ($nuevo === 'requiere_ajustes' && $dev === null) {
            validationError('devolucion', 'Debe indicar una devolución cuando se solicitan ajustes.');
        }
        $st = $pdo->prepare('SELECT docente_id, estado FROM secuencias_didacticas WHERE id = :id');
        $st->execute(['id' => $id]);
        $sec = $st->fetch();
        if (!$sec) {
            jsonError('Secuencia no encontrada.', 404);
        }
        if ((int)$sec['docente_id'] === $user['sub']) {
            jsonError('No puede revisar su propia secuencia.', 403);
        }
        if ($sec['estado'] === 'borrador') {
            jsonError('La secuencia aún es un borrador y no fue enviada a revisión.', 409);
        }
        $pdo->prepare('UPDATE secuencias_didacticas SET estado=:estado, devolucion_directivo=:dev WHERE id=:id')
            ->execute(['estado' => $nuevo, 'dev' => $dev, 'id' => $id]);
        jsonSuccess(['secuencia_id' => $id, 'estado' => $nuevo], "Secuencia revisada. Estado: {$nuevo}.");

    case 'delete':
        requireMethod('POST');
        $id = vId(getJsonInput(), 'id', 'secuencia');
        $st = $pdo->prepare('SELECT docente_id, estado FROM secuencias_didacticas WHERE id = :id');
        $st->execute(['id' => $id]);
        $sec = $st->fetch();
        if (!$sec) {
            jsonError('Secuencia no encontrada.', 404);
        }
        if ((int)$sec['docente_id'] !== $user['sub']) {
            jsonError('Solo el autor puede eliminar esta secuencia.', 403);
        }
        if ($sec['estado'] === 'aprobada') {
            jsonError('Una secuencia aprobada no puede eliminarse.', 409);
        }
        $pdo->prepare('DELETE FROM secuencias_didacticas WHERE id = :id')->execute(['id' => $id]);
        jsonSuccess(['id' => $id], 'Secuencia eliminada.');

    default:
        jsonError('Acción no reconocida en secuencias.', 404);
}
