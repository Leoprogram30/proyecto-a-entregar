<?php
/**
 * Instalador de la base de datos (solo línea de comandos).
 *
 *   php database/instalar.php            Crea la base si no existe e importa la estructura y los datos
 *                                        SOLO si todavía no existe la tabla `usuarios`.
 *   php database/instalar.php --sin-ejemplos   Igual, pero sin planificaciones ni secuencias de ejemplo.
 *   php database/instalar.php --reset    Reinstala BORRANDO todas las tablas (¡destructivo!).
 *
 * Usa la misma configuración que el backend: variables de entorno DB_HOST, DB_PORT, DB_NAME,
 * DB_USER, DB_PASS o backend/config/config.local.php.
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("Este instalador solo puede ejecutarse desde la línea de comandos.\n");
}

require_once __DIR__ . '/../backend/config/db.php';

function out(string $m): void { fwrite(STDOUT, $m . PHP_EOL); }
function fail(string $m): never { fwrite(STDERR, "ERROR: {$m}" . PHP_EOL); exit(1); }

/** Divide un script SQL en sentencias respetando comillas, backticks y comentarios. */
function splitSqlStatements(string $sql): array {
    $stmts = [];
    $buf = '';
    $len = strlen($sql);
    $quote = null;
    for ($i = 0; $i < $len; $i++) {
        $c = $sql[$i];
        $n = $i + 1 < $len ? $sql[$i + 1] : '';
        if ($quote !== null) {
            $buf .= $c;
            if ($c === '\\' && $quote !== '`') {
                $buf .= $n;
                $i++;
            } elseif ($c === $quote) {
                if ($n === $quote) {      // comilla duplicada ('')
                    $buf .= $n;
                    $i++;
                } else {
                    $quote = null;
                }
            }
            continue;
        }
        if ($c === "'" || $c === '"' || $c === '`') {
            $quote = $c;
            $buf .= $c;
        } elseif ($c === '-' && $n === '-' && ($i + 2 >= $len || ctype_space($sql[$i + 2]))) {
            while ($i < $len && $sql[$i] !== "\n") {
                $i++;
            }
            $buf .= "\n";
        } elseif ($c === '#') {
            while ($i < $len && $sql[$i] !== "\n") {
                $i++;
            }
            $buf .= "\n";
        } elseif ($c === ';') {
            if (trim($buf) !== '') {
                $stmts[] = trim($buf);
            }
            $buf = '';
        } else {
            $buf .= $c;
        }
    }
    if (trim($buf) !== '') {
        $stmts[] = trim($buf);
    }
    return $stmts;
}

$reset = in_array('--reset', $argv ?? [], true);
if (in_array('--help', $argv ?? [], true) || in_array('-h', $argv ?? [], true)) {
    out("Uso: php database/instalar.php [--sin-ejemplos] [--reset]");
    exit(0);
}

$c = dbSettings();
if (!preg_match('/^[A-Za-z0-9_]{1,64}$/', $c['name'])) {
    fail('DB_NAME solo puede contener letras, números y guion bajo.');
}
$archivos = ['schema.sql', 'datos_iniciales.sql', 'datos_curriculares.sql'];
if (!in_array('--sin-ejemplos', $argv ?? [], true)) {
    $archivos[] = 'datos_ejemplo.sql';
}
foreach ($archivos as $a) {
    if (!is_file(__DIR__ . '/' . $a)) {
        fail("No se encuentra database/{$a}.");
    }
}

// 1. Conexión al servidor (sin base)
try {
    $server = new PDO(sprintf('mysql:host=%s;port=%s;charset=utf8mb4', $c['host'], $c['port']), $c['user'], $c['pass'], dbOptions());
} catch (Throwable $e) {
    fail(dbConnectionMessage($e, $c['name']) . " (host {$c['host']}, puerto {$c['port']})");
}
out("Conectado a MySQL en {$c['host']}:{$c['port']}.");

// 2. Crear base si no existe
$server->exec("CREATE DATABASE IF NOT EXISTS `{$c['name']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
$server->exec("USE `{$c['name']}`");

// 3. ¿Ya instalada?
$exists = $server->query("SHOW TABLES LIKE 'usuarios'")->fetchColumn() !== false;
if ($exists && !$reset) {
    $n = (int)$server->query('SELECT COUNT(*) FROM usuarios')->fetchColumn();
    out("La base '{$c['name']}' ya está instalada ({$n} usuarios). No se modificó nada.");
    out('Use --reset solo si desea BORRAR todo y reinstalar.');
    exit(0);
}
if ($exists && $reset) {
    out("--reset: se reinstalará la base '{$c['name']}' (se pierden todos los datos).");
}

// 4. Importar estructura y datos, en orden
$done = 0;
foreach ($archivos as $a) {
    $sql = file_get_contents(__DIR__ . '/' . $a);
    if ($sql === false) {
        fail("No se pudo leer {$a}.");
    }
    $n = 0;
    try {
        foreach (splitSqlStatements($sql) as $stmt) {
            $server->exec($stmt);
            $n++;
        }
    } catch (Throwable $e) {
        fail("{$a}: falló la sentencia #" . ($n + 1) . ': ' . $e->getMessage());
    }
    out("  {$a}: {$n} sentencias.");
    $done += $n;
}

$tablas = (int)$server->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()")->fetchColumn();
$users = (int)$server->query('SELECT COUNT(*) FROM usuarios')->fetchColumn();
out("Instalación completa: {$done} sentencias, {$tablas} tablas, {$users} usuarios semilla.");
exit(0);
