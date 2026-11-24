<?php
/**
 * Configuración institucional: ruta TransFORMAR@Cba por ciclo lectivo y seguimiento de la Ruta 2 (institución precursora).
 * IPEM N° 349 "Giovanni Bosco"
 *
 * Referencia normativa: Res. SE 88/2025 (rige 2026); las reglas 2027 no están publicadas. No codifica calificaciones.
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers/bootstrap.php';

$pdo = getDbConnection();
$user = requireAuth();
$action = $_GET['action'] ?? 'rutas';

function vAnio(array $in, string $key = 'anio'): int {
    return (int)vInt($in, $key, 'año lectivo', ['required' => true, 'min' => 2020, 'max' => 2100]);
}

function rutaDe(PDO $pdo, int $anio): array {
    $st = $pdo->prepare('SELECT anio_lectivo, ruta, observaciones FROM configuracion_institucional WHERE anio_lectivo = :a');
    $st->execute(['a' => $anio]);
    $r = $st->fetch();
    return $r ? ['anio_lectivo' => (int)$r['anio_lectivo'], 'ruta' => $r['ruta'], 'observaciones' => $r['observaciones']]
              : ['anio_lectivo' => $anio, 'ruta' => 'ruta_1', 'observaciones' => null];
}

switch ($action) {
    case 'rutas':
        requireMethod('GET');
        $rows = $pdo->query('SELECT anio_lectivo, ruta, observaciones FROM configuracion_institucional ORDER BY anio_lectivo')->fetchAll();
        foreach ($rows as &$r) {
            $r['anio_lectivo'] = (int)$r['anio_lectivo'];
        }
        unset($r);
        jsonSuccess($rows, 'Rutas por ciclo lectivo');

    case 'ruta_save':
        requireRole(['admin']);
        requireMethod('POST');
        $in = getJsonInput();
        $anio = vAnio($in, 'anio_lectivo');
        $ruta = vEnum($in, 'ruta', 'ruta', RUTAS_INSTITUCIONALES, true);
        $obs = vString($in, 'observaciones', 'observaciones', ['max' => 2000]);
        $pdo->prepare('INSERT INTO configuracion_institucional (anio_lectivo, ruta, observaciones) VALUES (:a, :r, :o)
                       ON DUPLICATE KEY UPDATE ruta = VALUES(ruta), observaciones = VALUES(observaciones)')
            ->execute(['a' => $anio, 'r' => $ruta, 'o' => $obs]);
        jsonSuccess(rutaDe($pdo, $anio), 'Ruta guardada correctamente.');

    case 'precursora':
        requireMethod('GET');
        $anio = vAnio($_GET);
        $config = rutaDe($pdo, $anio);

        $st = $pdo->prepare('SELECT a.*, u.nombre AS autor_nombre, u.apellido AS autor_apellido
                             FROM precursora_acciones a LEFT JOIN usuarios u ON u.id = a.actualizado_por WHERE a.anio_lectivo = :a');
        $st->execute(['a' => $anio]);
        $guardadas = [];
        foreach ($st->fetchAll() as $r) {
            $guardadas[$r['linea']] = $r;
        }
        $lineas = [];
        foreach (LINEAS_PRECURSORA as $clave => $def) {
            $g = $guardadas[$clave] ?? null;
            $autor = $g ? trim(($g['autor_nombre'] ?? '') . ' ' . ($g['autor_apellido'] ?? '')) : '';
            $lineas[] = [
                'linea' => $clave, 'texto' => $def['texto'], 'caracter' => $def['caracter'], 'fuente' => $def['fuente'],
                'estado' => $g['estado'] ?? 'pendiente', 'responsable' => $g['responsable'] ?? null,
                'evidencia' => $g['evidencia'] ?? null, 'fecha_prevista' => $g['fecha_prevista'] ?? null,
                'actualizado_en' => $g['actualizado_en'] ?? null,
                'actualizado_por' => $autor !== '' ? $autor : null,
            ];
        }

        // Cobertura automática desde Articulación
        $marcas = implode(',', array_fill(0, count(ESTADOS_COBERTURA), '?'));
        $st = $pdo->prepare("SELECT curso, modalidad, COUNT(*) AS n FROM proyectos_articulados
                             WHERE anio_lectivo = ? AND estado IN ({$marcas}) GROUP BY curso, modalidad");
        $st->execute(array_merge([$anio], ESTADOS_COBERTURA));
        $cnt = [];
        foreach ($st->fetchAll() as $r) {
            $cnt[(int)$r['curso']][$r['modalidad']] = (int)$r['n'];
        }
        $porCurso = [];
        $porCiclo = ['basico' => ['tiempo_compartido' => 0, 'proyecto_interdisciplinario' => 0, 'total' => 0],
                     'orientado' => ['tiempo_compartido' => 0, 'proyecto_interdisciplinario' => 0, 'total' => 0]];
        for ($c = 1; $c <= 6; $c++) {
            $m = $cnt[$c] ?? [];
            $tc = $m['tiempo_compartido'] ?? 0;
            $pi = $m['proyecto_interdisciplinario'] ?? 0;
            $total = array_sum($m);
            $ciclo = $c <= 3 ? 'basico' : 'orientado';
            $porCurso[] = ['curso' => $c, 'ciclo' => $ciclo, 'tiempo_compartido' => $tc, 'proyecto_interdisciplinario' => $pi,
                           'total' => $total, 'minimo' => 1, 'tope' => TOPE_PROPUESTAS_PRECURSORA[$c],
                           'cumple_minimo' => $tc >= 1, 'supera_tope' => $total > TOPE_PROPUESTAS_PRECURSORA[$c]];
            $porCiclo[$ciclo]['tiempo_compartido'] += $tc;
            $porCiclo[$ciclo]['proyecto_interdisciplinario'] += $pi;
            $porCiclo[$ciclo]['total'] += $total;
        }
        foreach ($porCiclo as &$pc) {
            $pc['cumple_minimo'] = $pc['tiempo_compartido'] >= 1;
        }
        unset($pc);
        $porCiclo['orientado']['proyecto_integracion_cumple'] = $porCiclo['orientado']['proyecto_interdisciplinario'] >= 1;

        // Espacios por Campo de Aprendizaje
        $campos = [];
        foreach (CAMPOS_APRENDIZAJE as $k) {
            $campos[$k] = ['campo' => $k, 'label' => CAMPOS_APRENDIZAJE_LABELS[$k], 'espacios' => []];
        }
        $campos['sin_campo'] = ['campo' => null, 'label' => 'Sin campo asignado', 'espacios' => []];
        foreach ($pdo->query('SELECT id, nombre, anio, ciclo, area, campo_aprendizaje FROM espacios_curriculares WHERE activo = 1 ORDER BY anio, nombre')->fetchAll() as $e) {
            $e['id'] = (int)$e['id'];
            $e['anio'] = (int)$e['anio'];
            $campos[$e['campo_aprendizaje'] ?? 'sin_campo']['espacios'][] = $e;
        }

        jsonSuccess([
            'anio' => $anio, 'ruta' => $config['ruta'], 'observaciones' => $config['observaciones'],
            'puede_editar' => in_array($user['rol'], ROLES_DIRECTIVOS, true),
            'lineas' => $lineas,
            'cobertura' => ['por_curso' => $porCurso, 'por_ciclo' => $porCiclo,
                            'por_modalidad' => ['tiempo_compartido' => array_sum(array_column($porCurso, 'tiempo_compartido')),
                                                'proyecto_interdisciplinario' => array_sum(array_column($porCurso, 'proyecto_interdisciplinario'))],
                            'estados_considerados' => ESTADOS_COBERTURA],
            'campos' => array_values($campos),
            'referencia' => 'Referencia: normativa 2026 (Res. SE 88/2025); verificar la que se dicte para 2027.',
        ], 'Seguimiento de institución precursora');

    case 'accion_save':
        requireRole(ROLES_DIRECTIVOS);
        requireMethod('POST');
        $in = getJsonInput();
        $anio = vAnio($in, 'anio_lectivo');
        $linea = vEnum($in, 'linea', 'línea', array_keys(LINEAS_PRECURSORA), true);
        $estado = vEnum($in, 'estado', 'estado', ESTADOS_ACCION, true);
        $resp = vString($in, 'responsable', 'responsable', ['max' => 150]);
        $evid = vString($in, 'evidencia', 'evidencia', ['max' => 5000]);
        $fecha = vDate($in, 'fecha_prevista', 'fecha prevista');
        $pdo->prepare('INSERT INTO precursora_acciones (anio_lectivo, linea, estado, responsable, evidencia, fecha_prevista, actualizado_por)
                       VALUES (:a, :l, :e, :r, :ev, :f, :u)
                       ON DUPLICATE KEY UPDATE estado = VALUES(estado), responsable = VALUES(responsable), evidencia = VALUES(evidencia),
                       fecha_prevista = VALUES(fecha_prevista), actualizado_por = VALUES(actualizado_por)')
            ->execute(['a' => $anio, 'l' => $linea, 'e' => $estado, 'r' => $resp, 'ev' => $evid, 'f' => $fecha, 'u' => (int)$user['sub']]);
        jsonSuccess(['anio_lectivo' => $anio, 'linea' => $linea, 'estado' => $estado], 'Línea actualizada correctamente.');

    default:
        jsonError('Acción no reconocida en institución.', 404);
}
