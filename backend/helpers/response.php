<?php
/**
 * Respuestas HTTP estandarizadas en JSON
 * IPEM N° 349 "Giovanni Bosco"
 */

declare(strict_types=1);

function jsonSuccess(mixed $data = null, string $message = 'Operación exitosa', int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => true,
        'message' => $message,
        'data'    => $data,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

function jsonError(string $message = 'Error en la solicitud', int $code = 400, mixed $details = null): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => $message,
        'details' => $details,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

function getJsonInput(): array {
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return $_POST;
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}
