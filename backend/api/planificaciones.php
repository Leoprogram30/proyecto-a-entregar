<?php
/**
 * Endpoint de Planificaciones Anuales (Wizard Interactivo y Supervisión Directiva)
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
$action = $_GET['action'] ?? 'my_plans';
$method = $_SERVER['REQUEST_METHOD'];

switch ($action) {
    case 'my_plans':
        $stmt = $pdo->prepare('
            SELECT p.*, e.nombre AS espacio_nombre, e.anio AS espacio_anio, e.ciclo AS espacio_ciclo, e.area AS espacio_area
            FROM planificaciones_anuales p
            JOIN espacios_curriculares e ON p.espacio_id = e.id
            WHERE p.docente_id = :docente_id
            ORDER BY p.fecha_actualizacion DESC
        ');
        $stmt->execute(['docente_id' => $user['sub']]);
        $plans = $stmt->fetchAll();
        jsonSuccess($plans, 'Planificaciones del docente');
        break;

    case 'all_plans':
        // Vista especial de supervisión para Equipo Directivo y Admin
        if (!in_array($user['rol'], ['admin', 'director', 'coordinador'], true)) {
            jsonError('Acceso restringido al Equipo Directivo y Administración', 403);
        }

        $ciclo = $_GET['ciclo'] ?? null;
        $anio = isset($_GET['anio']) && !empty($_GET['anio']) ? (int)$_GET['anio'] : null;
        $estado = $_GET['estado'] ?? null;
        $espacioId = isset($_GET['espacio_id']) && !empty($_GET['espacio_id']) ? (int)$_GET['espacio_id'] : null;

        $query = '
            SELECT p.*, e.nombre AS espacio_nombre, e.anio AS espacio_anio, e.ciclo AS espacio_ciclo, e.area AS espacio_area,
                   u.nombre AS docente_nombre, u.apellido AS docente_apellido, u.email AS docente_email
            FROM planificaciones_anuales p
            JOIN espacios_curriculares e ON p.espacio_id = e.id
            JOIN usuarios u ON p.docente_id = u.id
            WHERE 1=1
        ';
        $params = [];

        if ($ciclo && in_array($ciclo, ['basico', 'orientado'], true)) {
            $query .= ' AND e.ciclo = :ciclo';
            $params['ciclo'] = $ciclo;
        }
        if ($anio) {
            $query .= ' AND e.anio = :anio';
            $params['anio'] = $anio;
        }
        if ($estado && in_array($estado, ['borrador', 'pendiente_revision', 'aprobada', 'requiere_ajustes'], true)) {
            $query .= ' AND p.estado = :estado';
            $params['estado'] = $estado;
        }
        if ($espacioId) {
            $query .= ' AND p.espacio_id = :espacio_id';
            $params['espacio_id'] = $espacioId;
        }

        $query .= ' ORDER BY p.fecha_actualizacion DESC';
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $plans = $stmt->fetchAll();

        jsonSuccess($plans, 'Supervisión de planificaciones institucionales');
        break;

    case 'detail':
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) {
            jsonError('ID de planificación no proporcionado');
        }

        $stmt = $pdo->prepare('
            SELECT p.*, e.nombre AS espacio_nombre, e.anio AS espacio_anio, e.ciclo AS espacio_ciclo, e.area AS espacio_area, e.orientacion AS espacio_orientacion, e.horas_catedra,
                   u.nombre AS docente_nombre, u.apellido AS docente_apellido, u.dni AS docente_dni, u.email AS docente_email
            FROM planificaciones_anuales p
            JOIN espacios_curriculares e ON p.espacio_id = e.id
            JOIN usuarios u ON p.docente_id = u.id
            WHERE p.id = :id
            LIMIT 1
        ');
        $stmt->execute(['id' => $id]);
        $plan = $stmt->fetch();

        if (!$plan) {
            jsonError('Planificación no encontrada', 404);
        }

        // Si es docente y no es suya, verificar permisos
        if ($user['rol'] === 'docente' && (int)$plan['docente_id'] !== (int)$user['sub']) {
            jsonError('No tiene autorización para visualizar esta planificación', 403);
        }

        // Obtener historial de comentarios
        $comStmt = $pdo->prepare('
            SELECT c.*, u.nombre, u.apellido, u.rol
            FROM planificacion_comentarios c
            JOIN usuarios u ON c.usuario_id = u.id
            WHERE c.planificacion_id = :plan_id
            ORDER BY c.created_at ASC
        ');
        $comStmt->execute(['plan_id' => $id]);
        $comentarios = $comStmt->fetchAll();

        jsonSuccess([
            'planificacion' => $plan,
            'comentarios'   => $comentarios
        ], 'Detalle de la planificación anual');
        break;

    case 'save':
        if ($method !== 'POST') {
            jsonError('Método no permitido', 405);
        }
        $input = getJsonInput();
        $id = !empty($input['id']) ? (int)$input['id'] : null;
        $espacioId = (int)($input['espacio_id'] ?? 0);
        $anioLectivo = (int)($input['anio_lectivo'] ?? 2026);
        $division = trim($input['division'] ?? 'A');
        $diagnostico = trim($input['diagnostico'] ?? '');
        $objetivos = is_array($input['objetivos'] ?? null) ? json_encode($input['objetivos'], JSON_UNESCAPED_UNICODE) : ($input['objetivos'] ?? '[]');
        $contenidos = is_array($input['contenidos'] ?? null) ? json_encode($input['contenidos'], JSON_UNESCAPED_UNICODE) : ($input['contenidos'] ?? '[]');
        $estrategias = trim($input['estrategias'] ?? '');
        $formatos = trim($input['formatos_pedagogicos'] ?? 'Asignatura / Taller / Laboratorio / Entorno Formativo Campo');
        $recursos = trim($input['recursos'] ?? '');
        $evaluacion = trim($input['evaluacion'] ?? '');
        $bibliografia = trim($input['bibliografia'] ?? '');
        $estado = in_array($input['estado'] ?? '', ['borrador', 'pendiente_revision'], true) ? $input['estado'] : 'borrador';

        if (!$espacioId) {
            jsonError('Debe indicar el espacio curricular correspondiente.');
        }

        if ($id) {
            // Verificar propiedad si es docente
            $check = $pdo->prepare('SELECT docente_id, estado FROM planificaciones_anuales WHERE id = :id');
            $check->execute(['id' => $id]);
            $existing = $check->fetch();
            if (!$existing) {
                jsonError('Planificación no encontrada', 404);
            }
            if ($user['rol'] === 'docente' && (int)$existing['docente_id'] !== (int)$user['sub']) {
                jsonError('No posee permisos para editar esta planificación', 403);
            }

            $updateStmt = $pdo->prepare('
                UPDATE planificaciones_anuales
                SET anio_lectivo = :anio_lectivo, division = :division, diagnostico = :diagnostico,
                    objetivos = :objetivos, contenidos = :contenidos, estrategias = :estrategias,
                    formatos_pedagogicos = :formatos, recursos = :recursos, evaluacion = :evaluacion,
                    bibliografia = :bibliografia, estado = :estado
                WHERE id = :id
            ');
            $updateStmt->execute([
                'anio_lectivo' => $anioLectivo,
                'division'     => $division,
                'diagnostico'  => $diagnostico,
                'objetivos'    => $objetivos,
                'contenidos'   => $contenidos,
                'estrategias'  => $estrategias,
                'formatos'     => $formatos,
                'recursos'     => $recursos,
                'evaluacion'   => $evaluacion,
                'bibliografia' => $bibliografia,
                'estado'       => $estado,
                'id'           => $id
            ]);

            jsonSuccess(['id' => $id, 'estado' => $estado], 'Planificación actualizada correctamente.');
        } else {
            $insertStmt = $pdo->prepare('
                INSERT INTO planificaciones_anuales 
                (docente_id, espacio_id, anio_lectivo, division, diagnostico, objetivos, contenidos, estrategias, formatos_pedagogicos, recursos, evaluacion, bibliografia, estado)
                VALUES 
                (:docente_id, :espacio_id, :anio_lectivo, :division, :diagnostico, :objetivos, :contenidos, :estrategias, :formatos, :recursos, :evaluacion, :bibliografia, :estado)
            ');
            $insertStmt->execute([
                'docente_id'   => $user['sub'],
                'espacio_id'   => $espacioId,
                'anio_lectivo' => $anioLectivo,
                'division'     => $division,
                'diagnostico'  => $diagnostico,
                'objetivos'    => $objetivos,
                'contenidos'   => $contenidos,
                'estrategias'  => $estrategias,
                'formatos'     => $formatos,
                'recursos'     => $recursos,
                'evaluacion'   => $evaluacion,
                'bibliografia' => $bibliografia,
                'estado'       => $estado
            ]);
            $newId = (int)$pdo->lastInsertId();
            jsonSuccess(['id' => $newId, 'estado' => $estado], 'Planificación guardada con éxito.');
        }
        break;

    case 'review':
        // Solo directivos y admin
        if (!in_array($user['rol'], ['admin', 'director', 'coordinador'], true)) {
            jsonError('Acceso exclusivo para el Equipo Directivo', 403);
        }
        if ($method !== 'POST') {
            jsonError('Método no permitido', 405);
        }

        $input = getJsonInput();
        $id = (int)($input['planificacion_id'] ?? 0);
        $nuevoEstado = trim($input['estado'] ?? '');
        $comentario = trim($input['comentario'] ?? '');

        if (!$id || !in_array($nuevoEstado, ['pendiente_revision', 'aprobada', 'requiere_ajustes'], true)) {
            jsonError('Planificación o estado de revisión inválido.');
        }

        $pdo->beginTransaction();
        try {
            $update = $pdo->prepare('
                UPDATE planificaciones_anuales
                SET estado = :estado, devolucion_directivo = :devolucion, revisado_por = :revisor_id, fecha_revision = NOW()
                WHERE id = :id
            ');
            $update->execute([
                'estado'     => $nuevoEstado,
                'devolucion' => $comentario,
                'revisor_id' => $user['sub'],
                'id'         => $id
            ]);

            if (!empty($comentario)) {
                $insCom = $pdo->prepare('
                    INSERT INTO planificacion_comentarios (planificacion_id, usuario_id, comentario, estado_asociado)
                    VALUES (:pid, :uid, :com, :est)
                ');
                $insCom->execute([
                    'pid' => $id,
                    'uid' => $user['sub'],
                    'com' => $comentario,
                    'est' => $nuevoEstado
                ]);
            }

            $pdo->commit();
            jsonSuccess([
                'planificacion_id' => $id,
                'estado'           => $nuevoEstado
            ], "Revisión registrada con éxito. Estado actualizado a '{$nuevoEstado}'.");
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonError('Error al guardar la revisión: ' . $e->getMessage(), 500);
        }
        break;

    default:
        jsonError('Acción no reconocida en planificaciones', 404);
        break;
}
