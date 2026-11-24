<?php
/**
 * Configuracion y conexion a MySQL/MariaDB (PDO).
 * Prioridad: variables de entorno > config/config.local.php > valores por defecto.
 * IPEM N° 349 "Giovanni Bosco" - Colonia Caroya
 */

declare(strict_types=1);

/** Lee un valor de configuracion (env DB_HOST... o clave en config.local.php). */
function appConfig(string $key, ?string $default = null): ?string {
    static $file = null;
    if ($file === null) {
        $file = [];
        $path = __DIR__ . '/config.local.php';
        if (is_file($path)) {
            $loaded = require $path;
            if (is_array($loaded)) {
                $file = $loaded;
            }
        }
    }
    $env = getenv(strtoupper($key));
    if ($env !== false) {
        return (string)$env;
    }
    if (isset($file[$key])) {
        return (string)$file[$key];
    }
    return $default;
}

function dbSettings(): array {
    return [
        'host' => appConfig('db_host', '127.0.0.1'),
        'port' => appConfig('db_port', '3306'),
        'name' => appConfig('db_name', 'ipem349_gestion'),
        'user' => appConfig('db_user', 'root'),
        'pass' => appConfig('db_pass', ''),
    ];
}

/** Opciones PDO compartidas con el instalador. */
function dbOptions(): array {
    return [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::ATTR_TIMEOUT            => 3,
    ];
}

/** Traduce un error de conexion a un mensaje claro SIN credenciales. */
function dbConnectionMessage(Throwable $e, string $dbName): string {
    $code = (int)($e instanceof PDOException && isset($e->errorInfo[1]) ? $e->errorInfo[1] : $e->getCode());
    switch ($code) {
        case 1049:
            return "La base de datos '{$dbName}' no existe. Ejecute 'php database/instalar.php' o importe database/schema.sql desde phpMyAdmin.";
        case 1045:
            return 'MySQL rechazó el usuario o la contraseña configurados. Revise backend/config/config.local.php o las variables DB_USER y DB_PASS.';
        case 2002:
        case 2003:
        case 2006:
            return 'No se pudo conectar a MySQL: el servidor no está activo. Inicie MySQL desde el panel de XAMPP y revise DB_HOST y DB_PORT.';
        default:
            return 'No se pudo conectar a la base de datos MySQL. Verifique que el servicio esté activo y la configuración sea correcta.';
    }
}

function dbUnavailable(string $message): never {
    http_response_code(503);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'message' => $message, 'data' => null, 'details' => null], JSON_UNESCAPED_UNICODE);
    exit;
}

function getDbConnection(): PDO {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $c = dbSettings();
    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $c['host'], $c['port'], $c['name']);

    try {
        $pdo = new PDO($dsn, $c['user'], $c['pass'], dbOptions());
        $pdo->exec("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
    } catch (Throwable $e) {
        error_log('[IPEM349] Fallo de conexion MySQL: ' . $e->getMessage());
        dbUnavailable(dbConnectionMessage($e, $c['name']));
    }
    return $pdo;
}
