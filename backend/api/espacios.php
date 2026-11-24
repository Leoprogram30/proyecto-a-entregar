<?php
/**
 * Espacios curriculares y malla oficial de Córdoba
 * IPEM N° 349 "Giovanni Bosco"
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers/bootstrap.php';

$pdo = getDbConnection();
$user = requireAuth();
$action = $_GET['action'] ?? 'list';

switch ($action) {
    case 'list':
        $q = $_GET;
        $ciclo = vEnum($q, 'ciclo', 'ciclo', ['basico', 'orientado']);
        $anio = vInt($q, 'anio', 'año', ['min' => 1, 'max' => 6]);

        $sql = 'SELECT * FROM espacios_curriculares WHERE 1=1';
        $params = [];
        // Las materias inactivas solo las ve el administrador que lo pide explícitamente.
        if (!($user['rol'] === 'admin' && !empty($q['incluir_inactivas']) && $q['incluir_inactivas'] !== '0')) {
            $sql .= ' AND activo = 1';
        }
        if ($ciclo !== null) {
            $sql .= ' AND ciclo = :ciclo';
            $params['ciclo'] = $ciclo;
        }
        if ($anio !== null) {
            $sql .= ' AND anio = :anio';
            $params['anio'] = $anio;
        }
        $st = $pdo->prepare($sql . ' ORDER BY anio ASC, nombre ASC');
        $st->execute($params);
        jsonSuccess($st->fetchAll(), 'Malla curricular');

    case 'detail':
        $id = vId($_GET, 'id', 'espacio');
        $st = $pdo->prepare('SELECT * FROM espacios_curriculares WHERE id = :id');
        $st->execute(['id' => $id]);
        $espacio = $st->fetch();
        if (!$espacio) {
            jsonError('Espacio curricular no encontrado.', 404);
        }

        // Por defecto solo el diseño vigente; ?todos=1 incluye también el material de referencia.
        $todos = !empty($_GET['todos']) && $_GET['todos'] !== '0';
        $st = $pdo->prepare('SELECT id, tipo, titulo, descripcion, fuente, vigente, meta, indicadores, pagina FROM curriculum_contenidos
                             WHERE espacio_id = :id' . ($todos ? '' : ' AND vigente = 1') . ' ORDER BY tipo, id');
        $st->execute(['id' => $id]);
        $contenidos = array_map(static function (array $c): array {
            $c['vigente'] = (int)$c['vigente'] === 1;
            $c['indicadores'] = decodeList($c['indicadores'] ?? null);
            return $c;
        }, $st->fetchAll());

        $st = $pdo->prepare('SELECT id, titulo, tipo, resolucion_numero, organismo, url_oficial, espacio_id, descripcion, fecha_publicacion,
                                    (archivo_pdf IS NOT NULL AND archivo_pdf <> \'\') AS tiene_pdf
                             FROM normativas_documentos WHERE espacio_id = :id OR espacio_id IS NULL ORDER BY tipo, id');
        $st->execute(['id' => $id]);
        $normativas = array_map(static function (array $n): array {
            $n['tiene_pdf'] = (bool)$n['tiene_pdf'];
            return $n;
        }, $st->fetchAll());

        jsonSuccess(['espacio' => $espacio, 'contenidos' => $contenidos, 'normativas' => $normativas], 'Detalle de espacio curricular');

    case 'save':
        requireRole(['admin']);
        requireMethod('POST');
        $in = getJsonInput();
        $id = vId($in, 'id', 'espacio', false);
        $ciclo = vEnum($in, 'ciclo', 'ciclo', ['basico', 'orientado'], true);
        $anio = vInt($in, 'anio', 'año', ['required' => true, 'min' => 1, 'max' => 6]);
        if (($ciclo === 'basico' && $anio > 3) || ($ciclo === 'orientado' && $anio < 4)) {
            validationError('anio', $ciclo === 'basico'
                ? 'El ciclo básico comprende de 1° a 3° año.'
                : 'El ciclo orientado comprende de 4° a 6° año.');
        }
        $nombre = vString($in, 'nombre', 'nombre', ['required' => true, 'max' => 150]);
        $area = vString($in, 'area', 'área', ['required' => true, 'max' => 100]);
        $orientacion = vString($in, 'orientacion', 'orientación', ['max' => 100, 'default' => $ciclo === 'basico' ? 'General' : 'Agro y Ambiente']);
        $horas = vInt($in, 'horas_catedra', 'horas cátedra', ['required' => true, 'min' => 1, 'max' => 20]);
        $descripcion = vString($in, 'descripcion', 'descripción', ['max' => 5000]);
        $campo = vEnum($in, 'campo', 'campo formativo', ['general', 'especifica', 'opcion_institucional']);
        $activo = vBool($in, 'activo', true);
        $campoAprendizaje = vEnum($in, 'campo_aprendizaje', 'campo de aprendizaje', CAMPOS_APRENDIZAJE);

        if ($id !== null) {
            $st = $pdo->prepare('SELECT id FROM espacios_curriculares WHERE id = :id');
            $st->execute(['id' => $id]);
            if (!$st->fetch()) {
                jsonError('Espacio curricular no encontrado.', 404);
            }
        }
        $st = $pdo->prepare('SELECT id FROM espacios_curriculares WHERE anio = :anio AND nombre = :nombre AND id <> :id LIMIT 1');
        $st->execute(['anio' => $anio, 'nombre' => $nombre, 'id' => $id ?? 0]);
        if ($st->fetch()) {
            jsonError('Ya existe una materia con ese nombre en el mismo año.', 409, ['nombre' => 'duplicado']);
        }
        $params = ['ciclo' => $ciclo, 'anio' => $anio, 'nombre' => $nombre, 'area' => $area, 'orientacion' => $orientacion,
                   'horas' => $horas, 'descripcion' => $descripcion, 'campo' => $campo, 'activo' => $activo, 'capr' => $campoAprendizaje, 'caprset' => array_key_exists('campo_aprendizaje', $in) ? 1 : 0];
        if ($id !== null) {
            $params['id'] = $id;
            $pdo->prepare('UPDATE espacios_curriculares SET ciclo=:ciclo, anio=:anio, nombre=:nombre, area=:area, orientacion=:orientacion,
                           horas_catedra=:horas, descripcion=:descripcion, campo=COALESCE(:campo, campo), campo_aprendizaje=IF(:caprset = 1, :capr, campo_aprendizaje), activo=:activo WHERE id=:id')->execute($params);
            $nuevoId = $id;
            $msg = 'Materia actualizada correctamente.';
        } else {
            $pdo->prepare('INSERT INTO espacios_curriculares (ciclo, anio, nombre, area, orientacion, horas_catedra, descripcion, campo, campo_aprendizaje, activo)
                           VALUES (:ciclo, :anio, :nombre, :area, :orientacion, :horas, :descripcion, COALESCE(:campo, "general"), :capr, :activo)')->execute(array_diff_key($params, ['caprset' => 1]));
            $nuevoId = (int)$pdo->lastInsertId();
            $msg = 'Materia creada correctamente.';
        }
        $st = $pdo->prepare('SELECT * FROM espacios_curriculares WHERE id = :id');
        $st->execute(['id' => $nuevoId]);
        jsonSuccess($st->fetch(), $msg, $id === null ? 201 : 200);

    case 'delete':
        requireRole(['admin']);
        requireMethod('POST');
        $in = getJsonInput();
        $id = vId($in, 'id', 'espacio');
        $st = $pdo->prepare('SELECT id FROM espacios_curriculares WHERE id = :id');
        $st->execute(['id' => $id]);
        if (!$st->fetch()) {
            jsonError('Espacio curricular no encontrado.', 404);
        }
        // Las FK hacia espacios_curriculares son ON DELETE CASCADE: se protege el trabajo docente.
        $dependencias = [
            'planificaciones' => 'SELECT COUNT(*) FROM planificaciones_anuales WHERE espacio_id = :id',
            'secuencias didácticas' => 'SELECT COUNT(*) FROM secuencias_didacticas WHERE espacio_id = :id',
            'hitos de agenda' => 'SELECT COUNT(*) FROM agenda_hitos WHERE espacio_id = :id',
            'aportes a proyectos' => 'SELECT COUNT(*) FROM proyecto_articulado_participantes WHERE espacio_id = :id',
        ];
        $con = [];
        foreach ($dependencias as $label => $sql) {
            $q = $pdo->prepare($sql);
            $q->execute(['id' => $id]);
            if (($n = (int)$q->fetchColumn()) > 0) {
                $con[$label] = $n;
            }
        }
        if ($con) {
            $detalle = implode(', ', array_map(static fn($k, $v) => "{$v} {$k}", array_keys($con), $con));
            jsonError("No se puede eliminar: la materia tiene trabajo docente asociado ({$detalle}). Desactívela para ocultarla sin perder esa información.", 409, $con);
        }
        try {
            $pdo->prepare('DELETE FROM espacios_curriculares WHERE id = :id')->execute(['id' => $id]);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                jsonError('No se puede eliminar: la materia tiene registros asociados. Desactívela.', 409);
            }
            throw $e;
        }
        jsonSuccess(['id' => $id], 'Materia eliminada correctamente.');

    case 'contenido_save':
        requireRole(['admin']);
        requireMethod('POST');
        $in = getJsonInput();
        $id = vId($in, 'id', 'contenido', false);
        $espacioId = vId($in, 'espacio_id', 'espacio curricular');
        $tipo = vEnum($in, 'tipo', 'tipo', ['objetivo', 'eje_contenido'], true);
        $titulo = vString($in, 'titulo', 'título', ['required' => true, 'max' => 200]);
        $descripcion = vString($in, 'descripcion', 'descripción', ['required' => true, 'max' => 5000]);
        $st = $pdo->prepare('SELECT 1 FROM espacios_curriculares WHERE id = :id');
        $st->execute(['id' => $espacioId]);
        if (!$st->fetchColumn()) {
            jsonError('Espacio curricular no encontrado.', 404);
        }
        if ($id !== null) {
            $st = $pdo->prepare('SELECT 1 FROM curriculum_contenidos WHERE id = :id AND espacio_id = :e');
            $st->execute(['id' => $id, 'e' => $espacioId]);
            if (!$st->fetchColumn()) {
                jsonError('Contenido curricular no encontrado.', 404);
            }
            $pdo->prepare('UPDATE curriculum_contenidos SET tipo=:t, titulo=:ti, descripcion=:d WHERE id=:id')
                ->execute(['t' => $tipo, 'ti' => $titulo, 'd' => $descripcion, 'id' => $id]);
            $st = $pdo->prepare('SELECT id, espacio_id, tipo, titulo, descripcion, fuente, vigente, meta, indicadores, pagina FROM curriculum_contenidos WHERE id = :id');
            $st->execute(['id' => $id]);
            $row = $st->fetch();
            $row['vigente'] = (int)$row['vigente'] === 1;
            $row['indicadores'] = decodeList($row['indicadores'] ?? null);
            jsonSuccess($row, 'Contenido actualizado correctamente.');
        }
        $pdo->prepare("INSERT INTO curriculum_contenidos (espacio_id, tipo, titulo, descripcion, fuente, vigente) VALUES (:e, :t, :ti, :d, 'institucional', 1)")
            ->execute(['e' => $espacioId, 't' => $tipo, 'ti' => $titulo, 'd' => $descripcion]);
        jsonSuccess(['id' => (int)$pdo->lastInsertId(), 'espacio_id' => $espacioId, 'tipo' => $tipo, 'titulo' => $titulo, 'descripcion' => $descripcion,
                     'fuente' => 'institucional', 'vigente' => true, 'meta' => null, 'indicadores' => [], 'pagina' => null], 'Contenido agregado correctamente.', 201);

    case 'contenido_delete':
        requireRole(['admin']);
        requireMethod('POST');
        $in = getJsonInput();
        $id = vId($in, 'id', 'contenido');
        $st = $pdo->prepare('DELETE FROM curriculum_contenidos WHERE id = :id');
        $st->execute(['id' => $id]);
        if ($st->rowCount() === 0) {
            jsonError('Contenido curricular no encontrado.', 404);
        }
        jsonSuccess(['id' => $id], 'Contenido eliminado correctamente.');

    default:
        jsonError('Acción no reconocida en espacios.', 404);
}
