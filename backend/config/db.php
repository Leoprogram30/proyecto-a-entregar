<?php
/**
 * Conexión a la Base de Datos con PDO (MySQL y fallback SQLite local)
 * IPEM N° 349 "Giovanni Bosco" - Colonia Caroya
 */

declare(strict_types=1);

require_once __DIR__ . '/sqlite_setup.php';

define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'ipem349_gestion');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') !== false ? getenv('DB_PASS') : '');
define('DB_CHARSET', 'utf8mb4');

function getDbConnection(): PDO {
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    // 1. Intentar conectar a MySQL (Producción / XAMPP activo)
    try {
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            DB_HOST,
            DB_PORT,
            DB_NAME,
            DB_CHARSET
        );

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::ATTR_TIMEOUT            => 1, // Timeout rápido para no demorar si no corre MySQL
            PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci',
        ];

        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (Throwable $e) {
        // 2. Si MySQL no está activo en esta máquina, fallback automático y transparente a SQLite local
        $dbDir = __DIR__ . '/../../database';
        if (!is_dir($dbDir)) {
            mkdir($dbDir, 0755, true);
        }
        $sqlitePath = $dbDir . '/ipem349_local.sqlite';
        $isFirstTime = !file_exists($sqlitePath);

        try {
            $pdo = new PDO('sqlite:' . $sqlitePath);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

            if ($isFirstTime) {
                initSqliteDatabase($pdo);
            }

            return $pdo;
        } catch (Throwable $sqliteErr) {
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode([
                'success' => false,
                'message' => 'Error al conectar a la base de datos (MySQL y SQLite local no disponibles).',
                'error'   => $sqliteErr->getMessage()
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }
}
