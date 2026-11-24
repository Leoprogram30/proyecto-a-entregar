<?php
/**
 * Respuestas JSON estandarizadas y manejo global de errores.
 * Formato: {success, message, data, details}
 * IPEM N° 349 "Giovanni Bosco"
 */

declare(strict_types=1);

function jsonSuccess(mixed $data = null, string $message = 'Operación exitosa', int $code = 200): never {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => true,
        'message' => $message,
        'data'    => $data,
        'details' => null,
    ], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function jsonError(string $message = 'Error en la solicitud', int $code = 400, mixed $details = null): never {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => $message,
        'data'    => null,
        'details' => $details,
    ], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

/** Exige un metodo HTTP concreto. */
function requireMethod(string $method): void {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== $method) {
        header('Allow: ' . $method);
        jsonError('Método no permitido para esta acción (se requiere ' . $method . ').', 405);
    }
}

/** Cuerpo de la peticion como array (JSON o formulario). */
function getJsonInput(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return $_POST;
    }
    if (strlen($raw) > 1024 * 1024) {
        jsonError('El cuerpo de la solicitud es demasiado grande.', 413);
    }
    $ctype = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($ctype, 'application/x-www-form-urlencoded') !== false && !empty($_POST)) {
        return $_POST;
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        jsonError('El cuerpo de la solicitud no es un JSON válido.', 400);
    }
    return $decoded;
}

/** Convierte cualquier error/excepcion no controlado en JSON 500 generico. */
function registerGlobalErrorHandling(): void {
    ini_set('display_errors', '0');
    ini_set('html_errors', '0');
    error_reporting(E_ALL);

    set_error_handler(static function (int $no, string $str, string $file, int $line): bool {
        if (!(error_reporting() & $no)) {
            return false;
        }
        throw new ErrorException($str, 0, $no, $file, $line);
    });

    set_exception_handler(static function (Throwable $e): void {
        error_log('[IPEM349] ' . get_class($e) . ': ' . $e->getMessage() . ' en ' . $e->getFile() . ':' . $e->getLine());
        if (headers_sent()) {
            exit;
        }
        if ($e instanceof PDOException) {
            $sqlstate = (string)$e->getCode();
            $driver = (int)($e->errorInfo[1] ?? 0);
            if ($sqlstate === '42S02' || $driver === 1146) {
                jsonError('La base de datos no está instalada. Ejecute "php database/instalar.php" o importe database/schema.sql.', 503);
            }
            if ($sqlstate === '23000') {
                jsonError('La operación entra en conflicto con datos existentes.', 409);
            }
            if (in_array($driver, [2002, 2003, 2006, 2013], true)) {
                jsonError('Se perdió la conexión con MySQL. Verifique que el servicio esté activo.', 503);
            }
        }
        jsonError('Error interno del servidor.', 500);
    });

    register_shutdown_function(static function (): void {
        $err = error_get_last();
        if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
            error_log('[IPEM349] Fatal: ' . $err['message'] . ' en ' . $err['file'] . ':' . $err['line']);
            if (!headers_sent()) {
                http_response_code(500);
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode(['success' => false, 'message' => 'Error interno del servidor.', 'data' => null, 'details' => null]);
            }
        }
    });
}
