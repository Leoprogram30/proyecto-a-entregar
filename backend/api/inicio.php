<?php
/**
 * Resumen de la pantalla de inicio según el rol del usuario.
 * IPEM N° 349 "Giovanni Bosco"
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers/bootstrap.php';

$pdo = getDbConnection();
$user = requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonError('Método no permitido', 405);
}

/** Cantidad de filas por estado: ['borrador' => n, ...] */
function contarEstados(PDO $pdo, string $tabla, ?int $docenteId): array {
    $sql = "SELECT estado, COUNT(*) AS n FROM {$tabla}" . ($docenteId !== null ? ' WHERE docente_id = :d' : '') . ' GROUP BY estado';
    $st = $pdo->prepare($sql);
    $st->execute($docenteId !== null ? ['d' => $docenteId] : []);
    $out = ['borrador' => 0, 'pendiente_revision' => 0, 'aprobada' => 0, 'requiere_ajustes' => 0];
    foreach ($st->fetchAll() as $f) {
        $out[$f['estado']] = (int)$f['n'];
    }
    return $out;
}

$data = ['rol' => $user['rol']];
$uid = (int)$user['sub'];

if (in_array($user['rol'], ['docente', 'coordinador'], true)) {
    $data['mis_planificaciones'] = contarEstados($pdo, 'planificaciones_anuales', $uid);
    $data['mis_secuencias'] = contarEstados($pdo, 'secuencias_didacticas', $uid);

    $st = $pdo->prepare('
        SELECT a.id, a.titulo, a.tipo, a.fecha, e.nombre AS espacio_nombre, e.anio AS espacio_anio
        FROM agenda_hitos a JOIN espacios_curriculares e ON e.id = a.espacio_id
        WHERE a.docente_id = :d AND a.completado = 0 AND a.fecha >= CURDATE()
        ORDER BY a.fecha ASC, a.id ASC LIMIT 5');
    $st->execute(['d' => $uid]);
    $data['proximos_hitos'] = $st->fetchAll();

    $st = $pdo->prepare('SELECT COUNT(*) FROM agenda_hitos WHERE docente_id = :d AND completado = 0 AND fecha < CURDATE()');
    $st->execute(['d' => $uid]);
    $data['hitos_vencidos'] = (int)$st->fetchColumn();
}

if (in_array($user['rol'], ['admin', 'director', 'coordinador'], true)) {
    $data['institucion'] = [
        'planificaciones' => contarEstados($pdo, 'planificaciones_anuales', null),
        'secuencias' => contarEstados($pdo, 'secuencias_didacticas', null),
    ];
}

if ($user['rol'] === 'admin') {
    $data['usuarios_pendientes'] = (int)$pdo->query("SELECT COUNT(*) FROM usuarios WHERE estado = 'pendiente'")->fetchColumn();
}

$anioActual = (int)date('Y');
$st = $pdo->prepare('SELECT anio_lectivo, ruta FROM configuracion_institucional WHERE anio_lectivo IN (:a, :b)');
$st->execute(['a' => $anioActual, 'b' => $anioActual + 1]);
$rutas = [];
foreach ($st->fetchAll() as $r) {
    $rutas[(int)$r['anio_lectivo']] = $r['ruta'];
}
$data['ruta'] = [
    'anio' => $anioActual, 'ruta' => $rutas[$anioActual] ?? 'ruta_1',
    'anio_proximo' => $anioActual + 1, 'ruta_proximo' => $rutas[$anioActual + 1] ?? 'ruta_1',
];

$data['cronograma'] = $pdo->query('
    SELECT id, titulo, tipo_evento, fecha_inicio, fecha_fin
    FROM cronograma_institucional
    WHERE COALESCE(fecha_fin, fecha_inicio) >= CURDATE()
    ORDER BY fecha_inicio ASC LIMIT 5')->fetchAll();

jsonSuccess($data, 'Resumen de inicio');
