<?php
/**
 * Endpoint de Autenticación y Gestión de Usuarios
 * IPEM N° 349 "Giovanni Bosco"
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

handleCors();

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'login':
        if ($method !== 'POST') {
            jsonError('Método no permitido', 405);
        }
        $input = getJsonInput();
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';

        if (empty($email) || empty($password)) {
            jsonError('Debe ingresar correo institucional y contraseña.');
        }

        $stmt = $pdo->prepare('SELECT * FROM usuarios WHERE email = :email LIMIT 1');
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            jsonError('Credenciales incorrectas o usuario no registrado.', 401);
        }

        if ($user['estado'] === 'pendiente') {
            jsonError('Su cuenta se encuentra PENDIENTE de aprobación por el Administrador del IPEM 349. Por favor, comuníquese con el equipo de gestión.', 403, [
                'estado' => 'pendiente'
            ]);
        }

        if ($user['estado'] === 'rechazado') {
            jsonError('Su solicitud de acceso ha sido rechazada por la administración escolar.', 403, [
                'estado' => 'rechazado'
            ]);
        }

        // Generar JWT
        $token = generateToken($user);

        // Omitir el hash de la respuesta
        unset($user['password_hash']);

        jsonSuccess([
            'token' => $token,
            'user'  => $user
        ], 'Inicio de sesión exitoso. ¡Bienvenido/a al IPEM 349!');
        break;

    case 'register':
        if ($method !== 'POST') {
            jsonError('Método no permitido', 405);
        }
        $input = getJsonInput();
        $nombre = trim($input['nombre'] ?? '');
        $apellido = trim($input['apellido'] ?? '');
        $dni = trim($input['dni'] ?? '');
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';
        $rol = trim($input['rol'] ?? 'docente');
        $cargo = trim($input['cargo_descripcion'] ?? 'Docente de Nivel Secundario');

        if (empty($nombre) || empty($apellido) || empty($dni) || empty($email) || empty($password)) {
            jsonError('Todos los campos son obligatorios (Nombre, Apellido, DNI, Email, Contraseña).');
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonError('El formato de correo electrónico es inválido.');
        }

        if (!in_array($rol, ['docente', 'coordinador', 'director'], true)) {
            $rol = 'docente';
        }

        // Verificar unicidad de email o dni
        $checkStmt = $pdo->prepare('SELECT id, email, dni FROM usuarios WHERE email = :email OR dni = :dni LIMIT 1');
        $checkStmt->execute(['email' => $email, 'dni' => $dni]);
        $existing = $checkStmt->fetch();

        if ($existing) {
            if ($existing['email'] === $email) {
                jsonError('Ya existe un usuario registrado con este correo electrónico.');
            }
            if ($existing['dni'] === $dni) {
                jsonError('Ya existe un usuario registrado con este número de DNI.');
            }
        }

        $passwordHash = password_hash($password, PASSWORD_BCRYPT);

        $insertStmt = $pdo->prepare('
            INSERT INTO usuarios (nombre, apellido, dni, email, password_hash, rol, cargo_descripcion, estado)
            VALUES (:nombre, :apellido, :dni, :email, :password_hash, :rol, :cargo, "pendiente")
        ');

        $insertStmt->execute([
            'nombre'        => $nombre,
            'apellido'      => $apellido,
            'dni'           => $dni,
            'email'         => $email,
            'password_hash' => $passwordHash,
            'rol'           => $rol,
            'cargo'         => $cargo
        ]);

        $newId = (int)$pdo->lastInsertId();

        jsonSuccess([
            'id'     => $newId,
            'nombre' => "{$nombre} {$apellido}",
            'email'  => $email,
            'rol'    => $rol,
            'estado' => 'pendiente'
        ], 'Solicitud de registro enviada con éxito. Su cuenta se encuentra en estado Pendiente de Aprobación por la Administración del colegio.');
        break;

    case 'me':
        $auth = requireAuth();
        $stmt = $pdo->prepare('SELECT id, nombre, apellido, dni, email, rol, cargo_descripcion, estado, fecha_registro FROM usuarios WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $auth['sub']]);
        $user = $stmt->fetch();

        if (!$user) {
            jsonError('Usuario no encontrado', 404);
        }

        jsonSuccess($user, 'Perfil de usuario obtenido');
        break;

    case 'pending_users':
        // Solo administradores pueden ver usuarios pendientes
        requireRole(['admin']);
        $stmt = $pdo->query('
            SELECT id, nombre, apellido, dni, email, rol, cargo_descripcion, estado, fecha_registro
            FROM usuarios
            WHERE estado = "pendiente"
            ORDER BY fecha_registro DESC
        ');
        $pending = $stmt->fetchAll();
        jsonSuccess($pending, 'Lista de solicitudes pendientes');
        break;

    case 'all_users':
        requireRole(['admin', 'director']);
        $stmt = $pdo->query('
            SELECT id, nombre, apellido, dni, email, rol, cargo_descripcion, estado, fecha_registro
            FROM usuarios
            ORDER BY rol ASC, apellido ASC
        ');
        $users = $stmt->fetchAll();
        jsonSuccess($users, 'Listado general de usuarios');
        break;

    case 'update_status':
        // Administrador aprueba o rechaza usuarios
        $admin = requireRole(['admin']);
        if ($method !== 'POST') {
            jsonError('Método no permitido', 405);
        }

        $input = getJsonInput();
        $targetUserId = (int)($input['user_id'] ?? 0);
        $newEstado = trim($input['estado'] ?? '');

        if (!$targetUserId || !in_array($newEstado, ['aprobado', 'rechazado', 'pendiente'], true)) {
            jsonError('Datos insuficientes o estado inválido (aprobado/rechazado/pendiente).');
        }

        $updateStmt = $pdo->prepare('
            UPDATE usuarios
            SET estado = :estado, aprobado_por = :admin_id
            WHERE id = :id
        ');
        $updateStmt->execute([
            'estado'   => $newEstado,
            'admin_id' => $admin['sub'],
            'id'       => $targetUserId
        ]);

        jsonSuccess([
            'user_id' => $targetUserId,
            'estado'  => $newEstado
        ], "El estado del usuario fue actualizado a '{$newEstado}' correctamente.");
        break;

    default:
        jsonError('Acción no reconocida en el módulo de autenticación', 404);
        break;
}
