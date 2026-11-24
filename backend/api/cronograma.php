<?php
/**
 * Endpoint de Cronograma Institucional del Ciclo Lectivo (Córdoba)
 * IPEM N° 349 "Giovanni Bosco"
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

handleCors();

$pdo = getDbConnection();
$action = $_GET['action'] ?? 'list';
$method = $_SERVER['REQUEST_METHOD'];

switch ($action) {
    case 'list':
        $anio = isset($_GET['anio']) ? (int)$_GET['anio'] : 2026;
        $stmt = $pdo->prepare('
            SELECT * FROM cronograma_institucional
            WHERE anio_lectivo = :anio
            ORDER BY fecha_inicio ASC
        ');
        $stmt->execute(['anio' => $anio]);
        $eventos = $stmt->fetchAll();
        jsonSuccess($eventos, 'Cronograma escolar oficial');
        break;

    case 'save':
        // Solo administradores pueden agregar o modificar el cronograma escolar
        $admin = requireRole(['admin']);
        if ($method !== 'POST') {
            jsonError('Método no permitido', 405);
        }

        $input = getJsonInput();
        $id = !empty($input['id']) ? (int)$input['id'] : null;
        $titulo = trim($input['titulo'] ?? '');
        $descripcion = trim($input['descripcion'] ?? '');
        $tipo = in_array($input['tipo_evento'] ?? '', ['inicio_clases', 'receso', 'evaluacion', 'feriado', 'cierre', 'academico'], true) ? $input['tipo_evento'] : 'academico';
        $fechaInicio = trim($input['fecha_inicio'] ?? '');
        $fechaFin = trim($input['fecha_fin'] ?? $fechaInicio);
        $anioLectivo = (int)($input['anio_lectivo'] ?? 2026);
        $obligatorio = isset($input['obligatorio']) ? (int)$input['obligatorio'] : 1;

        if (empty($titulo) || empty($fechaInicio)) {
            jsonError('El título y la fecha de inicio son requeridos.');
        }

        if ($id) {
            $update = $pdo->prepare('
                UPDATE cronograma_institucional
                SET titulo = :tit, descripcion = :des, tipo_evento = :tip,
                    fecha_inicio = :ini, fecha_fin = :fin, anio_lectivo = :anio, obligatorio = :obl
                WHERE id = :id
            ');
            $update->execute([
                'tit'  => $titulo,
                'des'  => $descripcion,
                'tip'  => $tipo,
                'ini'  => $fechaInicio,
                'fin'  => $fechaFin,
                'anio' => $anioLectivo,
                'obl'  => $obligatorio,
                'id'   => $id
            ]);
            jsonSuccess(['id' => $id], 'Evento del cronograma institucional actualizado.');
        } else {
            $insert = $pdo->prepare('
                INSERT INTO cronograma_institucional (titulo, descripcion, tipo_evento, fecha_inicio, fecha_fin, anio_lectivo, obligatorio)
                VALUES (:tit, :des, :tip, :ini, :fin, :anio, :obl)
            ');
            $insert->execute([
                'tit'  => $titulo,
                'des'  => $descripcion,
                'tip'  => $tipo,
                'ini'  => $fechaInicio,
                'fin'  => $fechaFin,
                'anio' => $anioLectivo,
                'obl'  => $obligatorio
            ]);
            $newId = (int)$pdo->lastInsertId();
            jsonSuccess(['id' => $newId], 'Nuevo hito agregado al cronograma escolar.');
        }
        break;

    default:
        jsonError('Acción no reconocida en cronograma', 404);
        break;
}

