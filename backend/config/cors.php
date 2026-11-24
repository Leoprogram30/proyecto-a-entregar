<?php
/**
 * CORS con lista blanca: localhost/127.0.0.1 (cualquier puerto) + CORS_ORIGINS (coma).
 * IPEM N° 349 "Giovanni Bosco"
 */

declare(strict_types=1);

function isAllowedOrigin(string $origin): bool {
    if (preg_match('#^https?://(localhost|127\.0\.0\.1|\[::1\])(:\d{1,5})?$#i', $origin)) {
        return true;
    }
    $extra = appConfig('cors_origins', '') ?? '';
    foreach (array_filter(array_map('trim', explode(',', $extra))) as $allowed) {
        if (strcasecmp(rtrim($allowed, '/'), $origin) === 0) {
            return true;
        }
    }
    return false;
}

function handleCors(): void {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    header('Vary: Origin');
    header('X-Content-Type-Options: nosniff');

    if ($origin !== '' && isAllowedOrigin($origin)) {
        header("Access-Control-Allow-Origin: {$origin}");
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Expose-Headers: Content-Disposition');
    }

    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        if ($origin !== '' && isAllowedOrigin($origin)) {
            header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
            header('Access-Control-Max-Age: 86400');
            http_response_code(204);
        } else {
            http_response_code(403);
        }
        exit;
    }

    header('Content-Type: application/json; charset=utf-8');
}
