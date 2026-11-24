<?php
/**
 * Manejo de CORS (Cross-Origin Resource Sharing)
 * IPEM N° 349 "Giovanni Bosco"
 */

declare(strict_types=1);

function handleCors(): void {
    // Permitir cualquier origen en desarrollo o especificar dominio en producción
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400'); // Cache preflight 24h

    // Manejar solicitud preflight OPTIONS
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        }
        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
            header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
        } else {
            header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        }
        http_response_code(200);
        exit;
    }

    header('Content-Type: application/json; charset=utf-8');
}

