<?php
/**
 * Router para el servidor embebido de PHP (desarrollo). php -S no lee los .htaccess,
 * por eso aca se expone unicamente /api/*.php y nunca config/, helpers/ ni uploads/.
 *
 *   php -S 127.0.0.1:8000 -t backend backend/router.php
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli-server') {
    http_response_code(404);
    exit;
}

$ruta = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';

if (preg_match('#^/api/[a-z_]+\.php$#', $ruta) && is_file(__DIR__ . $ruta)) {
    return false;
}

http_response_code(404);
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['success' => false, 'message' => 'Recurso no encontrado.', 'data' => null, 'details' => null]);
return true;
