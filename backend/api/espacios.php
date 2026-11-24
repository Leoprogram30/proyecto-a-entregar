<?php
/**
 * Endpoint de Espacios Curriculares y Malla Oficial de Córdoba
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

switch ($action) {
    case 'list':
        $ciclo = $_GET['ciclo'] ?? null;
        $anio = isset($_GET['anio']) ? (int)$_GET['anio'] : null;

        $query = 'SELECT * FROM espacios_curriculares WHERE 1=1';
        $params = [];

        if ($ciclo && in_array($ciclo, ['basico', 'orientado'], true)) {
            $query .= ' AND ciclo = :ciclo';
            $params['ciclo'] = $ciclo;
        }

        if ($anio && $anio >= 1 && $anio <= 6) {
            $query .= ' AND anio = :anio';
            $params['anio'] = $anio;
        }

        $query .= ' ORDER BY anio ASC, nombre ASC';

        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $espacios = $stmt->fetchAll();

        jsonSuccess($espacios, 'Malla curricular de Córdoba obtenida');
        break;

    case 'detail':
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) {
            jsonError('ID de espacio curricular no proporcionado', 400);
        }

        // Espacio principal
        $stmt = $pdo->prepare('SELECT * FROM espacios_curriculares WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        $espacio = $stmt->fetch();

        if (!$espacio) {
            jsonError('Espacio curricular no encontrado', 404);
        }

        // Objetivos y contenidos precargados
        $stmtCont = $pdo->prepare('SELECT * FROM curriculum_contenidos WHERE espacio_id = :id ORDER BY tipo, id');
        $stmtCont->execute(['id' => $id]);
        $contenidos = $stmtCont->fetchAll();

        // Normativas o diseños específicos
        $stmtNorm = $pdo->prepare('SELECT * FROM normativas_documentos WHERE espacio_id = :id OR espacio_id IS NULL ORDER BY tipo');
        $stmtNorm->execute(['id' => $id]);
        $normativas = $stmtNorm->fetchAll();

        jsonSuccess([
            'espacio'    => $espacio,
            'contenidos' => $contenidos,
            'normativas' => $normativas
        ], 'Detalle de espacio curricular obtenido');
        break;

    default:
        jsonError('Acción no reconocida', 404);
        break;
}

