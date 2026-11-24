<?php
/**
 * Autenticación y gestión de usuarios
 * IPEM N° 349 "Giovanni Bosco"
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers/bootstrap.php';

$pdo = getDbConnection();
$action = $_GET['action'] ?? '';

const USER_COLS = 'id, nombre, apellido, dni, email, rol, cargo_descripcion, estado, aprobado_por, fecha_registro';
const ROLES_USUARIO = ['admin', 'director', 'coordinador', 'docente'];
const ESTADOS_USUARIO = ['aprobado', 'pendiente', 'rechazado'];

/** DNI normalizado (solo dígitos, 7 u 8). */
function vDni(array $in): string {
    $raw = vString($in, 'dni', 'DNI', ['required' => true, 'max' => 20]);
    $dni = preg_replace('/\D/', '', (string)$raw);
    if (!preg_match('/^\d{7,8}$/', $dni)) {
        validationError('dni', 'El DNI debe tener 7 u 8 dígitos.');
    }
    return $dni;
}

function vEmail(array $in): string {
    $email = vString($in, 'email', 'correo electrónico', ['required' => true, 'max' => 150]);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        validationError('email', 'El formato de correo electrónico es inválido.');
    }
    return $email;
}

function vPassword(array $in, string $key = 'password', string $label = 'contraseña'): string {
    $p = $in[$key] ?? '';
    if (!is_string($p) || strlen($p) < 6) {
        validationError($key, "La {$label} debe tener al menos 6 caracteres.");
    }
    if (strlen($p) > 72) {
        validationError($key, "La {$label} no puede superar los 72 caracteres.");
    }
    return $p;
}

/** Devuelve [mensaje, details] si email/dni ya pertenecen a otro usuario; null si están libres. */
function duplicateUserError(PDO $pdo, string $email, string $dni, int $exceptId = 0): ?array {
    $st = $pdo->prepare('SELECT email, dni FROM usuarios WHERE (email = :email OR dni = :dni) AND id <> :id LIMIT 1');
    $st->execute(['email' => $email, 'dni' => $dni, 'id' => $exceptId]);
    if ($ex = $st->fetch()) {
        if (strcasecmp($ex['email'], $email) === 0) {
            return ['Ya existe un usuario registrado con este correo electrónico.', ['email' => 'duplicado']];
        }
        return ['Ya existe un usuario registrado con este número de DNI.', ['dni' => 'duplicado']];
    }
    return null;
}

/** Traduce una violación de unicidad (condición de carrera) a 409. */
function uniqueViolationError(PDOException $e): never {
    if (stripos($e->getMessage(), 'dni') !== false) {
        jsonError('Ya existe un usuario registrado con este número de DNI.', 409, ['dni' => 'duplicado']);
    }
    jsonError('Ya existe un usuario registrado con este correo electrónico.', 409, ['email' => 'duplicado']);
}

function fetchUser(PDO $pdo, int $id): ?array {
    $st = $pdo->prepare('SELECT ' . USER_COLS . ' FROM usuarios WHERE id = :id');
    $st->execute(['id' => $id]);
    return $st->fetch() ?: null;
}

/** Cantidad de administradores aprobados distintos del indicado. */
function otherApprovedAdmins(PDO $pdo, int $exceptId): int {
    $st = $pdo->prepare("SELECT COUNT(*) FROM usuarios WHERE rol = 'admin' AND estado = 'aprobado' AND id <> :id");
    $st->execute(['id' => $exceptId]);
    return (int)$st->fetchColumn();
}

switch ($action) {
    case 'login':
        requireMethod('POST');
        $in = getJsonInput();
        $email = vString($in, 'email', 'correo electrónico', ['required' => true, 'max' => 150]);
        $password = $in['password'] ?? '';
        if (!is_string($password) || $password === '') {
            validationError('password', 'Debe ingresar su contraseña.');
        }

        $ip = substr((string)($_SERVER['REMOTE_ADDR'] ?? 'desconocida'), 0, 45);
        $emailKey = mb_strtolower($email);
        $pdo->exec("DELETE FROM intentos_login WHERE creado_en < (NOW() - INTERVAL 1 DAY)");
        $q = $pdo->prepare('SELECT COUNT(*) FROM intentos_login WHERE email = :e AND ip = :ip AND creado_en > (NOW() - INTERVAL 15 MINUTE)');
        $q->execute(['e' => $emailKey, 'ip' => $ip]);
        if ((int)$q->fetchColumn() >= 8) {
            header('Retry-After: 900');
            jsonError('Demasiados intentos fallidos. Espere 15 minutos antes de volver a intentar.', 429);
        }

        $st = $pdo->prepare('SELECT * FROM usuarios WHERE email = :email LIMIT 1');
        $st->execute(['email' => $email]);
        $user = $st->fetch();

        // password_verify aun sin usuario, para no filtrar por tiempo de respuesta
        $hash = $user['password_hash'] ?? '$2y$10$abcdefghijklmnopqrstuuYkFhI8m0n5q2s0yYyV3q4o0r1m5H6e2';
        $ok = password_verify($password, $hash);
        if (!$user || !$ok) {
            $pdo->prepare('INSERT INTO intentos_login (email, ip) VALUES (:e, :ip)')->execute(['e' => $emailKey, 'ip' => $ip]);
            jsonError('Credenciales incorrectas o usuario no registrado.', 401);
        }
        if ($user['estado'] === 'pendiente') {
            jsonError('Su cuenta está PENDIENTE de aprobación por el Administrador del IPEM 349.', 403, ['estado' => 'pendiente']);
        }
        if ($user['estado'] === 'rechazado') {
            jsonError('Su solicitud de acceso fue rechazada por la administración escolar.', 403, ['estado' => 'rechazado']);
        }

        $pdo->prepare('DELETE FROM intentos_login WHERE email = :e AND ip = :ip')->execute(['e' => $emailKey, 'ip' => $ip]);
        $token = generateToken((int)$user['id']);
        unset($user['password_hash']);
        jsonSuccess(['token' => $token, 'user' => $user], 'Inicio de sesión exitoso.');

    case 'register':
        requireMethod('POST');
        $in = getJsonInput();
        $nombre   = vString($in, 'nombre', 'nombre', ['required' => true, 'max' => 100]);
        $apellido = vString($in, 'apellido', 'apellido', ['required' => true, 'max' => 100]);
        $dni = vDni($in);
        $email = vEmail($in);
        $password = vPassword($in);
        $cargo = vString($in, 'cargo_descripcion', 'cargo', ['max' => 150, 'default' => 'Docente de Nivel Secundario']);

        if ($dup = duplicateUserError($pdo, $email, $dni)) {
            jsonError($dup[0], 409, $dup[1]);
        }
        try {
            $pdo->prepare("INSERT INTO usuarios (nombre, apellido, dni, email, password_hash, rol, cargo_descripcion, estado)
                           VALUES (:nombre, :apellido, :dni, :email, :hash, 'docente', :cargo, 'pendiente')")
                ->execute([
                    'nombre' => $nombre, 'apellido' => $apellido, 'dni' => $dni, 'email' => $email,
                    'hash' => password_hash($password, PASSWORD_BCRYPT), 'cargo' => $cargo,
                ]);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                uniqueViolationError($e);
            }
            throw $e;
        }

        jsonSuccess([
            'id' => (int)$pdo->lastInsertId(),
            'nombre' => "{$nombre} {$apellido}",
            'email' => $email,
            'rol' => 'docente',
            'estado' => 'pendiente',
        ], 'Solicitud de registro enviada. Su cuenta queda pendiente de aprobación por la Administración.', 201);

    case 'me':
        $auth = requireAuth();
        unset($auth['sub']);
        jsonSuccess($auth, 'Perfil de usuario');

    case 'pending_users':
        requireRole(['admin']);
        $rows = $pdo->query("SELECT " . USER_COLS . " FROM usuarios WHERE estado = 'pendiente' ORDER BY fecha_registro DESC")->fetchAll();
        jsonSuccess($rows, 'Solicitudes pendientes');

    case 'all_users':
        requireRole(['admin', 'director']);
        $rows = $pdo->query('SELECT ' . USER_COLS . ' FROM usuarios ORDER BY rol ASC, apellido ASC, nombre ASC')->fetchAll();
        jsonSuccess($rows, 'Listado de usuarios');

    case 'update_status':
        $admin = requireRole(['admin']);
        requireMethod('POST');
        $in = getJsonInput();
        $targetId = vId($in, 'user_id', 'usuario');
        $estado = vEnum($in, 'estado', 'estado', ['aprobado', 'rechazado', 'pendiente'], true);
        $rol = vEnum($in, 'rol', 'rol', ['admin', 'director', 'coordinador', 'docente']);

        if ($targetId === $admin['sub']) {
            jsonError('No puede modificar su propio estado ni su propio rol.', 403);
        }
        $st = $pdo->prepare('SELECT id FROM usuarios WHERE id = :id');
        $st->execute(['id' => $targetId]);
        if (!$st->fetch()) {
            jsonError('Usuario no encontrado.', 404);
        }

        $sql = 'UPDATE usuarios SET estado = :estado, aprobado_por = :admin';
        $params = ['estado' => $estado, 'admin' => $admin['sub'], 'id' => $targetId];
        if ($rol !== null) {
            $sql .= ', rol = :rol';
            $params['rol'] = $rol;
        }
        $pdo->prepare($sql . ' WHERE id = :id')->execute($params);

        $st = $pdo->prepare('SELECT ' . USER_COLS . ' FROM usuarios WHERE id = :id');
        $st->execute(['id' => $targetId]);
        $u = $st->fetch();
        jsonSuccess(['user_id' => $targetId, 'estado' => $u['estado'], 'rol' => $u['rol'], 'user' => $u],
            "Usuario actualizado: estado '{$u['estado']}', rol '{$u['rol']}'.");

    case 'create_user':
        $admin = requireRole(['admin']);
        requireMethod('POST');
        $in = getJsonInput();
        $nombre   = vString($in, 'nombre', 'nombre', ['required' => true, 'max' => 100]);
        $apellido = vString($in, 'apellido', 'apellido', ['required' => true, 'max' => 100]);
        $dni = vDni($in);
        $email = vEmail($in);
        $password = vPassword($in);
        $rol = vEnum($in, 'rol', 'rol', ROLES_USUARIO, false, 'docente');
        $estado = vEnum($in, 'estado', 'estado', ESTADOS_USUARIO, false, 'aprobado');
        $cargo = vString($in, 'cargo_descripcion', 'cargo', ['max' => 150, 'default' => 'Docente de Nivel Secundario']);

        if ($dup = duplicateUserError($pdo, $email, $dni)) {
            jsonError($dup[0], 409, $dup[1]);
        }
        try {
            $pdo->prepare('INSERT INTO usuarios (nombre, apellido, dni, email, password_hash, rol, cargo_descripcion, estado, aprobado_por)
                           VALUES (:nombre, :apellido, :dni, :email, :hash, :rol, :cargo, :estado, :ap)')
                ->execute([
                    'nombre' => $nombre, 'apellido' => $apellido, 'dni' => $dni, 'email' => $email,
                    'hash' => password_hash($password, PASSWORD_BCRYPT), 'rol' => $rol, 'cargo' => $cargo,
                    'estado' => $estado, 'ap' => $estado === 'aprobado' ? $admin['sub'] : null,
                ]);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                uniqueViolationError($e);
            }
            throw $e;
        }
        jsonSuccess(fetchUser($pdo, (int)$pdo->lastInsertId()), 'Usuario creado correctamente.', 201);

    case 'update_user':
        $admin = requireRole(['admin']);
        requireMethod('POST');
        $in = getJsonInput();
        $targetId = vId($in, 'user_id', 'usuario');
        $nombre   = vString($in, 'nombre', 'nombre', ['required' => true, 'max' => 100]);
        $apellido = vString($in, 'apellido', 'apellido', ['required' => true, 'max' => 100]);
        $dni = vDni($in);
        $email = vEmail($in);
        $rol = vEnum($in, 'rol', 'rol', ROLES_USUARIO, true);
        $estado = vEnum($in, 'estado', 'estado', ESTADOS_USUARIO, true);
        $cargo = vString($in, 'cargo_descripcion', 'cargo', ['max' => 150, 'default' => 'Docente de Nivel Secundario']);

        $target = fetchUser($pdo, $targetId);
        if (!$target) {
            jsonError('Usuario no encontrado.', 404);
        }
        if ($targetId === $admin['sub'] && ($rol !== 'admin' || $estado !== 'aprobado')) {
            jsonError('No puede quitarse a sí mismo el rol de administrador ni desactivar su propia cuenta.', 403);
        }
        if ($target['rol'] === 'admin' && $target['estado'] === 'aprobado'
            && ($rol !== 'admin' || $estado !== 'aprobado') && otherApprovedAdmins($pdo, $targetId) < 1) {
            jsonError('Debe quedar al menos un administrador aprobado en el sistema.', 409);
        }
        if ($dup = duplicateUserError($pdo, $email, $dni, $targetId)) {
            jsonError($dup[0], 409, $dup[1]);
        }
        try {
            $pdo->prepare('UPDATE usuarios SET nombre = :nombre, apellido = :apellido, dni = :dni, email = :email,
                           rol = :rol, estado = :estado, cargo_descripcion = :cargo, aprobado_por = :ap WHERE id = :id')
                ->execute([
                    'nombre' => $nombre, 'apellido' => $apellido, 'dni' => $dni, 'email' => $email, 'rol' => $rol,
                    'estado' => $estado, 'cargo' => $cargo, 'ap' => $admin['sub'], 'id' => $targetId,
                ]);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                uniqueViolationError($e);
            }
            throw $e;
        }
        jsonSuccess(fetchUser($pdo, $targetId), 'Usuario actualizado correctamente.');

    case 'reset_password':
        requireRole(['admin']);
        requireMethod('POST');
        $in = getJsonInput();
        $targetId = vId($in, 'user_id', 'usuario');
        $nueva = vPassword($in, 'nueva', 'nueva contraseña');
        if (!fetchUser($pdo, $targetId)) {
            jsonError('Usuario no encontrado.', 404);
        }
        $pdo->prepare('UPDATE usuarios SET password_hash = :h WHERE id = :id')
            ->execute(['h' => password_hash($nueva, PASSWORD_BCRYPT), 'id' => $targetId]);
        jsonSuccess(null, 'Contraseña restablecida correctamente.');

    case 'delete_user':
        $admin = requireRole(['admin']);
        requireMethod('POST');
        $in = getJsonInput();
        $targetId = vId($in, 'user_id', 'usuario');
        if ($targetId === $admin['sub']) {
            jsonError('No puede eliminar su propia cuenta.', 403);
        }
        $target = fetchUser($pdo, $targetId);
        if (!$target) {
            jsonError('Usuario no encontrado.', 404);
        }
        if ($target['rol'] === 'admin' && $target['estado'] === 'aprobado' && otherApprovedAdmins($pdo, $targetId) < 1) {
            jsonError('Debe quedar al menos un administrador aprobado en el sistema.', 409);
        }
        // Las FK hacia usuarios son ON DELETE CASCADE: se verifica el trabajo docente antes de borrar.
        $dependencias = [
            'planificaciones' => 'SELECT COUNT(*) FROM planificaciones_anuales WHERE docente_id = :id',
            'secuencias didácticas' => 'SELECT COUNT(*) FROM secuencias_didacticas WHERE docente_id = :id',
            'hitos de agenda' => 'SELECT COUNT(*) FROM agenda_hitos WHERE docente_id = :id',
            'proyectos articulados' => 'SELECT COUNT(*) FROM proyectos_articulados WHERE creador_id = :id',
            'aportes a proyectos' => 'SELECT COUNT(*) FROM proyecto_articulado_participantes WHERE docente_id = :id',
            'comentarios' => 'SELECT COUNT(*) FROM planificacion_comentarios WHERE usuario_id = :id',
        ];
        $con = [];
        foreach ($dependencias as $label => $sql) {
            $st = $pdo->prepare($sql);
            $st->execute(['id' => $targetId]);
            if (($n = (int)$st->fetchColumn()) > 0) {
                $con[$label] = $n;
            }
        }
        if ($con) {
            $detalle = implode(', ', array_map(static fn($k, $v) => "{$v} {$k}", array_keys($con), $con));
            jsonError("No se puede eliminar: el usuario tiene trabajo registrado ({$detalle}). Para quitarle el acceso, desactívelo (estado rechazado).", 409, $con);
        }
        try {
            $pdo->prepare('DELETE FROM usuarios WHERE id = :id')->execute(['id' => $targetId]);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                jsonError('No se puede eliminar: el usuario tiene registros asociados. Desactívelo (estado rechazado).', 409);
            }
            throw $e;
        }
        jsonSuccess(['user_id' => $targetId], 'Usuario eliminado correctamente.');

    case 'update_profile':
        $me = requireAuth();
        requireMethod('POST');
        $in = getJsonInput();
        $nombre = vString($in, 'nombre', 'nombre', ['required' => true, 'max' => 100]);
        $apellido = vString($in, 'apellido', 'apellido', ['required' => true, 'max' => 100]);
        $cargo = vString($in, 'cargo_descripcion', 'cargo', ['max' => 150, 'default' => 'Docente de Nivel Secundario']);
        $pdo->prepare('UPDATE usuarios SET nombre = :n, apellido = :a, cargo_descripcion = :c WHERE id = :id')
            ->execute(['n' => $nombre, 'a' => $apellido, 'c' => $cargo, 'id' => $me['sub']]);
        $st = $pdo->prepare('SELECT id, nombre, apellido, dni, email, rol, cargo_descripcion, estado, fecha_registro FROM usuarios WHERE id = :id');
        $st->execute(['id' => $me['sub']]);
        jsonSuccess($st->fetch(), 'Perfil actualizado correctamente.');

    case 'change_password':
        $me = requireAuth();
        requireMethod('POST');
        $in = getJsonInput();
        $actual = $in['actual'] ?? '';
        $nueva = $in['nueva'] ?? '';
        if (!is_string($actual) || $actual === '') {
            validationError('actual', 'Debe ingresar su contraseña actual.');
        }
        if (!is_string($nueva) || strlen($nueva) < 6) {
            validationError('nueva', 'La nueva contraseña debe tener al menos 6 caracteres.');
        }
        if (strlen($nueva) > 72) {
            validationError('nueva', 'La nueva contraseña no puede superar los 72 caracteres.');
        }
        $st = $pdo->prepare('SELECT password_hash FROM usuarios WHERE id = :id');
        $st->execute(['id' => $me['sub']]);
        $hash = (string)$st->fetchColumn();
        if (!password_verify($actual, $hash)) {
            // 422 (no 401): una contraseña actual errónea no significa sesión inválida.
            validationError('actual', 'La contraseña actual es incorrecta.');
        }
        $pdo->prepare('UPDATE usuarios SET password_hash = :h WHERE id = :id')
            ->execute(['h' => password_hash($nueva, PASSWORD_BCRYPT), 'id' => $me['sub']]);
        jsonSuccess(null, 'Contraseña actualizada correctamente.');

    default:
        jsonError('Acción no reconocida en el módulo de autenticación.', 404);
}
