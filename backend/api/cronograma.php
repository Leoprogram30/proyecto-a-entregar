<?php
/**
 * Cronograma institucional del ciclo lectivo
 * IPEM N° 349 "Giovanni Bosco"
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers/bootstrap.php';

const TIPOS_EVENTO = ['inicio_clases', 'receso', 'evaluacion', 'feriado', 'cierre', 'academico'];

$pdo = getDbConnection();
$action = $_GET['action'] ?? 'list';

function normalizeEvento(array $r): array {
    $r['obligatorio'] = (int)$r['obligatorio'];
    return $r;
}

switch ($action) {
    case 'list':
        requireAuth();
        $anio = vInt($_GET, 'anio', 'año lectivo', ['min' => 2000, 'max' => 2100]);
        $sql = 'SELECT * FROM cronograma_institucional';
        $params = [];
        if ($anio !== null) {
            $sql .= ' WHERE anio_lectivo = :anio';
            $params['anio'] = $anio;
        }
        $st = $pdo->prepare($sql . ' ORDER BY fecha_inicio ASC, id ASC');
        $st->execute($params);
        jsonSuccess(array_map('normalizeEvento', $st->fetchAll()), 'Cronograma escolar');

    case 'save':
        requireRole(['admin']);
        requireMethod('POST');
        $in = getJsonInput();
        $id = vId($in, 'id', 'evento', false);
        $titulo = vString($in, 'titulo', 'título', ['required' => true, 'max' => 150]);
        $desc = vString($in, 'descripcion', 'descripción', ['max' => 5000]);
        $tipo = vEnum($in, 'tipo_evento', 'tipo de evento', TIPOS_EVENTO, false, 'academico');
        $ini = vDate($in, 'fecha_inicio', 'fecha de inicio', true);
        $fin = vDate($in, 'fecha_fin', 'fecha de fin', false, $ini);
        $anio = vInt($in, 'anio_lectivo', 'año lectivo', ['min' => 2000, 'max' => 2100, 'default' => (int)substr($ini, 0, 4)]);
        $obl = vBool($in, 'obligatorio', true);
        if ($fin < $ini) {
            validationError('fecha_fin', 'La fecha de fin no puede ser anterior a la de inicio.');
        }

        $params = ['tit' => $titulo, 'des' => $desc, 'tip' => $tipo, 'ini' => $ini, 'fin' => $fin, 'anio' => $anio, 'obl' => $obl];
        if ($id) {
            $st = $pdo->prepare('SELECT 1 FROM cronograma_institucional WHERE id = :id');
            $st->execute(['id' => $id]);
            if (!$st->fetchColumn()) {
                jsonError('Evento no encontrado.', 404);
            }
            $params['id'] = $id;
            $pdo->prepare('UPDATE cronograma_institucional SET titulo=:tit, descripcion=:des, tipo_evento=:tip,
                           fecha_inicio=:ini, fecha_fin=:fin, anio_lectivo=:anio, obligatorio=:obl WHERE id=:id')->execute($params);
            jsonSuccess(['id' => $id], 'Evento del cronograma actualizado.');
        }
        $pdo->prepare('INSERT INTO cronograma_institucional (titulo, descripcion, tipo_evento, fecha_inicio, fecha_fin, anio_lectivo, obligatorio)
                       VALUES (:tit, :des, :tip, :ini, :fin, :anio, :obl)')->execute($params);
        jsonSuccess(['id' => (int)$pdo->lastInsertId()], 'Evento agregado al cronograma.', 201);

    case 'delete':
        requireRole(['admin']);
        requireMethod('POST');
        $id = vId(getJsonInput(), 'id', 'evento');
        $st = $pdo->prepare('DELETE FROM cronograma_institucional WHERE id = :id');
        $st->execute(['id' => $id]);
        if ($st->rowCount() === 0) {
            jsonError('Evento no encontrado.', 404);
        }
        jsonSuccess(['id' => $id], 'Evento eliminado del cronograma.');

    default:
        jsonError('Acción no reconocida en cronograma.', 404);
}
