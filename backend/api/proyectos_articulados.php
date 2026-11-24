<?php
/**
 * Endpoint de Proyectos Articulados (Articulación Colaborativa Guiada Interdisciplinaria)
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
        $stmt = $pdo->query('
            SELECT p.*, u.nombre AS creador_nombre, u.apellido AS creador_apellido,
                   COUNT(part.id) AS total_participantes
            FROM proyectos_articulados p
            JOIN usuarios u ON p.creador_id = u.id
            LEFT JOIN proyecto_articulado_participantes part ON p.id = part.proyecto_id
            GROUP BY p.id
            ORDER BY p.created_at DESC
        ');
        $proyectos = $stmt->fetchAll();
        jsonSuccess($proyectos, 'Proyectos articulados colaborativos');
        break;

    case 'detail':
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) {
            jsonError('ID de proyecto no indicado');
        }

        $stmt = $pdo->prepare('
            SELECT p.*, u.nombre AS creador_nombre, u.apellido AS creador_apellido, u.email AS creador_email
            FROM proyectos_articulados p
            JOIN usuarios u ON p.creador_id = u.id
            WHERE p.id = :id
            LIMIT 1
        ');
        $stmt->execute(['id' => $id]);
        $proyecto = $stmt->fetch();

        if (!$proyecto) {
            jsonError('Proyecto no encontrado', 404);
        }

        // Obtener participantes y sus aportes
        $partStmt = $pdo->prepare('
            SELECT part.*, u.nombre AS docente_nombre, u.apellido AS docente_apellido, u.email AS docente_email,
                   e.nombre AS espacio_nombre, e.anio AS espacio_anio, e.ciclo AS espacio_ciclo
            FROM proyecto_articulado_participantes part
            JOIN usuarios u ON part.docente_id = u.id
            JOIN espacios_curriculares e ON part.espacio_id = e.id
            WHERE part.proyecto_id = :pid
            ORDER BY part.id ASC
        ');
        $partStmt->execute(['pid' => $id]);
        $participantes = $partStmt->fetchAll();

        jsonSuccess([
            'proyecto'      => $proyecto,
            'participantes' => $participantes
        ], 'Detalle del proyecto colaborativo');
        break;

    case 'create':
        if ($method !== 'POST') {
            jsonError('Método no permitido', 405);
        }
        $input = getJsonInput();
        $titulo = trim($input['titulo'] ?? '');
        $descripcion = trim($input['descripcion'] ?? '');
        $problema = trim($input['problema_contexto'] ?? '');
        $producto = trim($input['producto_final'] ?? '');
        $espacioId = (int)($input['espacio_creador_id'] ?? 0);
        $aporteInicial = trim($input['aporte_inicial'] ?? '');

        if (empty($titulo) || empty($descripcion) || empty($problema) || empty($producto)) {
            jsonError('Todos los campos son obligatorios (Título, Descripción, Problema contextual, Producto final).');
        }

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare('
                INSERT INTO proyectos_articulados (creador_id, titulo, descripcion, problema_contexto, producto_final, estado)
                VALUES (:uid, :titulo, :desc, :prob, :prod, "convocatoria")
            ');
            $stmt->execute([
                'uid'    => $user['sub'],
                'titulo' => $titulo,
                'desc'   => $descripcion,
                'prob'   => $problema,
                'prod'   => $producto
            ]);
            $proyectoId = (int)$pdo->lastInsertId();

            if ($espacioId) {
                $insPart = $pdo->prepare('
                    INSERT INTO proyecto_articulado_participantes (proyecto_id, docente_id, espacio_id, aporte_especifico, estado_aporte, fecha_aporte)
                    VALUES (:pid, :uid, :eid, :aporte, :est, :fec)
                ');
                $insPart->execute([
                    'pid'    => $proyectoId,
                    'uid'    => $user['sub'],
                    'eid'    => $espacioId,
                    'aporte' => $aporteInicial ?: 'Propuesta marco del proyecto e integración inicial.',
                    'est'    => $aporteInicial ? 'completado' : 'pendiente',
                    'fec'    => date('Y-m-d H:i:s')
                ]);
            }

            $pdo->commit();
            jsonSuccess(['proyecto_id' => $proyectoId], 'Propuesta de articulación interdisciplinaria publicada exitosamente.');
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonError('Error al crear proyecto: ' . $e->getMessage(), 500);
        }
        break;

    case 'join':
        if ($method !== 'POST') {
            jsonError('Método no permitido', 405);
        }
        $input = getJsonInput();
        $proyectoId = (int)($input['proyecto_id'] ?? 0);
        $espacioId = (int)($input['espacio_id'] ?? 0);
        $aporte = trim($input['aporte_especifico'] ?? '');
        $aprendizajes = trim($input['aprendizajes_articulados'] ?? '');

        if (!$proyectoId || !$espacioId) {
            jsonError('Proyecto y Espacio Curricular son obligatorios.');
        }

        // Verificar si ya participa con este espacio
        $check = $pdo->prepare('SELECT id FROM proyecto_articulado_participantes WHERE proyecto_id = :pid AND docente_id = :uid AND espacio_id = :eid');
        $check->execute(['pid' => $proyectoId, 'uid' => $user['sub'], 'eid' => $espacioId]);
        if ($check->fetch()) {
            jsonError('Ya te encuentras registrado como participante en este proyecto con este espacio curricular.');
        }

        $ins = $pdo->prepare('
            INSERT INTO proyecto_articulado_participantes (proyecto_id, docente_id, espacio_id, aporte_especifico, aprendizajes_articulados, estado_aporte, fecha_aporte)
            VALUES (:pid, :uid, :eid, :aporte, :aprendizajes, :estado, :fec)
        ');
        $ins->execute([
            'pid'          => $proyectoId,
            'uid'          => $user['sub'],
            'eid'          => $espacioId,
            'aporte'       => $aporte,
            'aprendizajes' => $aprendizajes,
            'estado'       => !empty($aporte) ? 'completado' : 'pendiente',
            'fec'          => date('Y-m-d H:i:s')
        ]);

        // Actualizar estado del proyecto a en_desarrollo si estaba en convocatoria
        $pdo->prepare('UPDATE proyectos_articulados SET estado = "en_desarrollo" WHERE id = :id AND estado = "convocatoria"')->execute(['id' => $proyectoId]);

        jsonSuccess(['proyecto_id' => $proyectoId], 'Te has sumado con éxito al proyecto colaborativo.');
        break;

    default:
        jsonError('Acción no reconocida', 404);
        break;
}

