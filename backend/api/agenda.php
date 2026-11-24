<?php
/**
 * Endpoint de Agenda Docente e Hitos Evaluativos/Prácticas de Campo
 * IPEM N° 349 "Giovanni Bosco"
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

handleCors();

$pdo = getDbConnection();
$user = requireAuth();
$action = $_GET['action'] ?? 'list';
$method = $_SERVER['REQUEST_METHOD'];

switch ($action) {
    case 'list':
        $espacioId = isset($_GET['espacio_id']) ? (int)$_GET['espacio_id'] : null;
        $targetDocenteId = ($user['rol'] !== 'docente' && isset($_GET['docente_id'])) ? (int)$_GET['docente_id'] : (int)$user['sub'];

        $query = '
            SELECT a.*, e.nombre AS espacio_nombre, e.anio AS espacio_anio
            FROM agenda_hitos a
            JOIN espacios_curriculares e ON a.espacio_id = e.id
            WHERE a.docente_id = :docente_id
        ';
        $params = ['docente_id' => $targetDocenteId];

        if ($espacioId) {
            $query .= ' AND a.espacio_id = :espacio_id';
            $params['espacio_id'] = $espacioId;
        }

        $query .= ' ORDER BY a.fecha ASC';
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $hitos = $stmt->fetchAll();

        // Calcular estadísticas de avance
        $total = count($hitos);
        $completados = count(array_filter($hitos, fn($h) => (int)$h['completado'] === 1));
        $porcentaje = $total > 0 ? round(($completados / $total) * 100) : 0;

        jsonSuccess([
            'hitos'       => $hitos,
            'metricas'    => [
                'total'       => $total,
                'completados' => $completados,
                'pendientes'  => $total - $completados,
                'porcentaje'  => $porcentaje
            ]
        ], 'Agenda de hitos y clases obtenida');
        break;

    case 'create':
        if ($method !== 'POST') {
            jsonError('Método no permitido', 405);
        }
        $input = getJsonInput();
        $espacioId = (int)($input['espacio_id'] ?? 0);
        $titulo = trim($input['titulo'] ?? '');
        $descripcion = trim($input['descripcion'] ?? '');
        $tipo = in_array($input['tipo'] ?? '', ['clase', 'practica_campo', 'hito_evaluativo', 'entrega_proyecto'], true) ? $input['tipo'] : 'clase';
        $fecha = trim($input['fecha'] ?? '');

        if (!$espacioId || empty($titulo) || empty($fecha)) {
            jsonError('Espacio curricular, título y fecha son campos obligatorios.');
        }

        $stmt = $pdo->prepare('
            INSERT INTO agenda_hitos (docente_id, espacio_id, titulo, descripcion, tipo, fecha, completado)
            VALUES (:uid, :eid, :tit, :des, :tip, :fec, 0)
        ');
        $stmt->execute([
            'uid' => $user['sub'],
            'eid' => $espacioId,
            'tit' => $titulo,
            'des' => $descripcion,
            'tip' => $tipo,
            'fec' => $fecha
        ]);

        $newId = (int)$pdo->lastInsertId();
        jsonSuccess(['id' => $newId], 'Hito/Actividad agendada con éxito.');
        break;

    case 'toggle':
        if ($method !== 'POST') {
            jsonError('Método no permitido', 405);
        }
        $input = getJsonInput();
        $id = (int)($input['id'] ?? 0);
        if (!$id) {
            jsonError('ID de hito inválido');
        }

        $check = $pdo->prepare('SELECT docente_id, completado FROM agenda_hitos WHERE id = :id');
        $check->execute(['id' => $id]);
        $row = $check->fetch();

        if (!$row) {
            jsonError('Hito no encontrado', 404);
        }
        if ($user['rol'] === 'docente' && (int)$row['docente_id'] !== (int)$user['sub']) {
            jsonError('No tiene autorización para modificar este hito', 403);
        }

        $nuevoEstado = ((int)$row['completado'] === 1) ? 0 : 1;
        $fechaComp = $nuevoEstado === 1 ? date('Y-m-d H:i:s') : null;

        $upd = $pdo->prepare('UPDATE agenda_hitos SET completado = :comp, fecha_completado = :fec WHERE id = :id');
        $upd->execute([
            'comp' => $nuevoEstado,
            'fec'  => $fechaComp,
            'id'   => $id
        ]);

        jsonSuccess([
            'id'         => $id,
            'completado' => $nuevoEstado
        ], $nuevoEstado === 1 ? '¡Hito marcado como completado!' : 'Hito marcado como pendiente.');
        break;

    case 'delete':
        if ($method !== 'POST') {
            jsonError('Método no permitido', 405);
        }
        $input = getJsonInput();
        $id = (int)($input['id'] ?? 0);
        $stmt = $pdo->prepare('DELETE FROM agenda_hitos WHERE id = :id AND docente_id = :uid');
        $stmt->execute(['id' => $id, 'uid' => $user['sub']]);
        jsonSuccess(['id' => $id], 'Actividad eliminada de la agenda.');
        break;

    default:
        jsonError('Acción no reconocida en agenda', 404);
        break;
}
