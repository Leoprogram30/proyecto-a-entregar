<?php
/**
 * Agenda docente: clases, prácticas de campo, hitos evaluativos y entregas
 * IPEM N° 349 "Giovanni Bosco"
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers/bootstrap.php';

const TIPOS_HITO = ['clase', 'practica_campo', 'hito_evaluativo', 'entrega_proyecto'];

$pdo = getDbConnection();
$user = requireAuth();
$action = $_GET['action'] ?? 'list';

function hitoFields(PDO $pdo, array $in, ?int $hitoId = null): array {
    $espacioId = vId($in, 'espacio_id', 'espacio curricular');
    requireEspacio($pdo, $espacioId, 'espacio_id', $hitoId ? ['tabla' => 'agenda_hitos', 'id' => $hitoId] : null);
    return [
        'eid' => $espacioId,
        'tit' => vString($in, 'titulo', 'título', ['required' => true, 'max' => 150]),
        'des' => vString($in, 'descripcion', 'descripción', ['max' => 5000]),
        'tip' => vEnum($in, 'tipo', 'tipo', TIPOS_HITO, false, 'clase'),
        'fec' => vDate($in, 'fecha', 'fecha', true),
    ];
}

function ownHito(PDO $pdo, int $id, int $uid): array {
    $st = $pdo->prepare('SELECT * FROM agenda_hitos WHERE id = :id');
    $st->execute(['id' => $id]);
    $h = $st->fetch();
    if (!$h) {
        jsonError('Actividad no encontrada.', 404);
    }
    if ((int)$h['docente_id'] !== $uid) {
        jsonError('No tiene autorización sobre esta actividad.', 403);
    }
    return $h;
}

switch ($action) {
    case 'list':
        $espacioId = vId($_GET, 'espacio_id', 'espacio', false);
        $target = $user['sub'];
        if ($user['rol'] !== 'docente') {
            $target = vId($_GET, 'docente_id', 'docente', false) ?? $user['sub'];
        }
        $sql = 'SELECT a.*, e.nombre AS espacio_nombre, e.anio AS espacio_anio
                FROM agenda_hitos a JOIN espacios_curriculares e ON a.espacio_id = e.id
                WHERE a.docente_id = :uid';
        $params = ['uid' => $target];
        if ($espacioId !== null) {
            $sql .= ' AND a.espacio_id = :eid';
            $params['eid'] = $espacioId;
        }
        $st = $pdo->prepare($sql . ' ORDER BY a.fecha ASC, a.id ASC');
        $st->execute($params);
        $hitos = $st->fetchAll();
        $total = count($hitos);
        $comp = count(array_filter($hitos, static fn($h) => (int)$h['completado'] === 1));
        jsonSuccess([
            'hitos' => $hitos,
            'metricas' => [
                'total' => $total,
                'completados' => $comp,
                'pendientes' => $total - $comp,
                'porcentaje' => $total > 0 ? (int)round($comp / $total * 100) : 0,
            ],
        ], 'Agenda obtenida');

    case 'create':
        requireRole(ROLES_AUTORES);
        requireMethod('POST');
        $f = hitoFields($pdo, getJsonInput());
        $pdo->prepare('INSERT INTO agenda_hitos (docente_id, espacio_id, titulo, descripcion, tipo, fecha, completado)
                       VALUES (:uid, :eid, :tit, :des, :tip, :fec, 0)')->execute($f + ['uid' => $user['sub']]);
        jsonSuccess(['id' => (int)$pdo->lastInsertId()], 'Actividad agendada con éxito.', 201);

    case 'update':
        requireRole(ROLES_AUTORES);
        requireMethod('POST');
        $in = getJsonInput();
        $id = vId($in, 'id', 'actividad');
        ownHito($pdo, $id, $user['sub']);
        $f = hitoFields($pdo, $in, $id);
        $pdo->prepare('UPDATE agenda_hitos SET espacio_id=:eid, titulo=:tit, descripcion=:des, tipo=:tip, fecha=:fec WHERE id=:id')
            ->execute($f + ['id' => $id]);
        jsonSuccess(['id' => $id], 'Actividad actualizada.');

    case 'toggle':
        requireMethod('POST');
        $id = vId(getJsonInput(), 'id', 'actividad');
        $h = ownHito($pdo, $id, $user['sub']);
        $nuevo = ((int)$h['completado'] === 1) ? 0 : 1;
        $pdo->prepare('UPDATE agenda_hitos SET completado = :c, fecha_completado = :f WHERE id = :id')
            ->execute(['c' => $nuevo, 'f' => $nuevo === 1 ? date('Y-m-d H:i:s') : null, 'id' => $id]);
        jsonSuccess(['id' => $id, 'completado' => $nuevo], $nuevo === 1 ? 'Actividad marcada como completada.' : 'Actividad marcada como pendiente.');

    case 'delete':
        requireMethod('POST');
        $id = vId(getJsonInput(), 'id', 'actividad');
        ownHito($pdo, $id, $user['sub']);
        $pdo->prepare('DELETE FROM agenda_hitos WHERE id = :id')->execute(['id' => $id]);
        jsonSuccess(['id' => $id], 'Actividad eliminada de la agenda.');

    default:
        jsonError('Acción no reconocida en agenda.', 404);
}
