<?php
/**
 * Endpoint de Secuencias Didácticas
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

        $query = '
            SELECT s.*, e.nombre AS espacio_nombre, e.anio AS espacio_anio, e.ciclo AS espacio_ciclo,
                   u.nombre AS docente_nombre, u.apellido AS docente_apellido
            FROM secuencias_didacticas s
            JOIN espacios_curriculares e ON s.espacio_id = e.id
            JOIN usuarios u ON s.docente_id = u.id
            WHERE 1=1
        ';
        $params = [];

        // Si es docente, solo ve sus secuencias a menos que sea directivo
        if ($user['rol'] === 'docente') {
            $query .= ' AND s.docente_id = :docente_id';
            $params['docente_id'] = $user['sub'];
        }

        if ($espacioId) {
            $query .= ' AND s.espacio_id = :espacio_id';
            $params['espacio_id'] = $espacioId;
        }

        $query .= ' ORDER BY s.fecha_actualizacion DESC';
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $secuencias = $stmt->fetchAll();

        jsonSuccess($secuencias, 'Listado de secuencias didácticas');
        break;

    case 'detail':
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) {
            jsonError('ID de secuencia requerido');
        }

        $stmt = $pdo->prepare('
            SELECT s.*, e.nombre AS espacio_nombre, e.anio AS espacio_anio, e.ciclo AS espacio_ciclo,
                   u.nombre AS docente_nombre, u.apellido AS docente_apellido, u.email AS docente_email
            FROM secuencias_didacticas s
            JOIN espacios_curriculares e ON s.espacio_id = e.id
            JOIN usuarios u ON s.docente_id = u.id
            WHERE s.id = :id
            LIMIT 1
        ');
        $stmt->execute(['id' => $id]);
        $secuencia = $stmt->fetch();

        if (!$secuencia) {
            jsonError('Secuencia no encontrada', 404);
        }

        jsonSuccess($secuencia, 'Detalle de secuencia didáctica');
        break;

    case 'save':
        if ($method !== 'POST') {
            jsonError('Método no permitido', 405);
        }
        $input = getJsonInput();
        $id = !empty($input['id']) ? (int)$input['id'] : null;
        $espacioId = (int)($input['espacio_id'] ?? 0);
        $titulo = trim($input['titulo'] ?? '');
        $fundamentacion = trim($input['fundamentacion'] ?? '');
        $propositos = trim($input['propositos'] ?? '');
        $tiempoEstimado = trim($input['tiempo_estimado'] ?? '4 clases');
        $actInicio = trim($input['actividades_inicio'] ?? '');
        $actDesarrollo = trim($input['actividades_desarrollo'] ?? '');
        $actCierre = trim($input['actividades_cierre'] ?? '');
        $evaluacion = trim($input['evaluacion'] ?? '');
        $recursos = trim($input['recursos'] ?? '');
        $tipoArticulacion = in_array($input['tipo_articulacion'] ?? '', ['ninguna', 'declarativa', 'colaborativa'], true) ? $input['tipo_articulacion'] : 'ninguna';
        $articulacionEje = trim($input['articulacion_eje'] ?? '');
        $articulacionMaterias = trim($input['articulacion_materias'] ?? '');
        $estado = in_array($input['estado'] ?? '', ['borrador', 'pendiente_revision'], true) ? $input['estado'] : 'borrador';

        if (empty($titulo) || !$espacioId) {
            jsonError('El título y el espacio curricular son obligatorios.');
        }

        if ($id) {
            $check = $pdo->prepare('SELECT docente_id FROM secuencias_didacticas WHERE id = :id');
            $check->execute(['id' => $id]);
            $row = $check->fetch();
            if (!$row) {
                jsonError('Secuencia no encontrada', 404);
            }
            if ($user['rol'] === 'docente' && (int)$row['docente_id'] !== (int)$user['sub']) {
                jsonError('No tiene permisos para editar esta secuencia', 403);
            }

            $updateStmt = $pdo->prepare('
                UPDATE secuencias_didacticas
                SET titulo = :titulo, fundamentacion = :fundamentacion, propositos = :propositos,
                    tiempo_estimado = :tiempo, actividades_inicio = :act_inicio, actividades_desarrollo = :act_des,
                    actividades_cierre = :act_cie, evaluacion = :evaluacion, recursos = :recursos,
                    tipo_articulacion = :tipo_art, articulacion_eje = :art_eje, articulacion_materias = :art_mat,
                    estado = :estado
                WHERE id = :id
            ');
            $updateStmt->execute([
                'titulo'         => $titulo,
                'fundamentacion' => $fundamentacion,
                'propositos'     => $propositos,
                'tiempo'         => $tiempoEstimado,
                'act_inicio'     => $actInicio,
                'act_des'        => $actDesarrollo,
                'act_cie'        => $actCierre,
                'evaluacion'     => $evaluacion,
                'recursos'       => $recursos,
                'tipo_art'       => $tipoArticulacion,
                'art_eje'        => $articulacionEje,
                'art_mat'        => $articulacionMaterias,
                'estado'         => $estado,
                'id'             => $id
            ]);

            jsonSuccess(['id' => $id, 'estado' => $estado], 'Secuencia didáctica actualizada con éxito.');
        } else {
            $insertStmt = $pdo->prepare('
                INSERT INTO secuencias_didacticas
                (docente_id, espacio_id, titulo, fundamentacion, propositos, tiempo_estimado, actividades_inicio, actividades_desarrollo, actividades_cierre, evaluacion, recursos, tipo_articulacion, articulacion_eje, articulacion_materias, estado)
                VALUES
                (:docente_id, :espacio_id, :titulo, :fundamentacion, :propositos, :tiempo, :act_inicio, :act_des, :act_cie, :evaluacion, :recursos, :tipo_art, :art_eje, :art_mat, :estado)
            ');
            $insertStmt->execute([
                'docente_id'     => $user['sub'],
                'espacio_id'     => $espacioId,
                'titulo'         => $titulo,
                'fundamentacion' => $fundamentacion,
                'propositos'     => $propositos,
                'tiempo'         => $tiempoEstimado,
                'act_inicio'     => $actInicio,
                'act_des'        => $actDesarrollo,
                'act_cie'        => $actCierre,
                'evaluacion'     => $evaluacion,
                'recursos'       => $recursos,
                'tipo_art'       => $tipoArticulacion,
                'art_eje'        => $articulacionEje,
                'art_mat'        => $articulacionMaterias,
                'estado'         => $estado
            ]);
            $newId = (int)$pdo->lastInsertId();
            jsonSuccess(['id' => $newId, 'estado' => $estado], 'Secuencia didáctica guardada con éxito.');
        }
        break;

    case 'review':
        if (!in_array($user['rol'], ['admin', 'director', 'coordinador'], true)) {
            jsonError('Acceso exclusivo para el Equipo Directivo', 403);
        }
        if ($method !== 'POST') {
            jsonError('Método no permitido', 405);
        }

        $input = getJsonInput();
        $id = (int)($input['secuencia_id'] ?? 0);
        $nuevoEstado = trim($input['estado'] ?? '');
        $devolucion = trim($input['devolucion'] ?? '');

        if (!$id || !in_array($nuevoEstado, ['pendiente_revision', 'aprobada', 'requiere_ajustes'], true)) {
            jsonError('Parámetros de revisión inválidos.');
        }

        $stmt = $pdo->prepare('
            UPDATE secuencias_didacticas
            SET estado = :estado, devolucion_directivo = :devolucion
            WHERE id = :id
        ');
        $stmt->execute([
            'estado'     => $nuevoEstado,
            'devolucion' => $devolucion,
            'id'         => $id
        ]);

        jsonSuccess([
            'secuencia_id' => $id,
            'estado'       => $nuevoEstado
        ], "Secuencia didáctica revisada. Estado: {$nuevoEstado}.");
        break;

    default:
        jsonError('Acción no reconocida en secuencias', 404);
        break;
}
