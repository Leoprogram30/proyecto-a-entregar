<?php
/**
 * Autenticación y Verificación de Tokens (JWT puro en PHP sin librerías externas)
 * IPEM N° 349 "Giovanni Bosco"
 */

declare(strict_types=1);

require_once __DIR__ . '/response.php';

define('JWT_SECRET', getenv('JWT_SECRET') ?: 'IPEM349_CAROYA_AGRO_SECRET_2026_COLONIA_BOSCO!');

function base64UrlEncode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode(string $data): string {
    return base64_decode(strtr($data, '-_', '+/'));
}

function generateToken(array $user, int $expirySeconds = 86400 * 7): string {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode([
        'sub'    => $user['id'],
        'email'  => $user['email'],
        'nombre' => $user['nombre'],
        'apellido' => $user['apellido'],
        'rol'    => $user['rol'],
        'cargo'  => $user['cargo_descripcion'] ?? '',
        'estado' => $user['estado'],
        'iat'    => time(),
        'exp'    => time() + $expirySeconds
    ]);

    $base64Header = base64UrlEncode($header);
    $base64Payload = base64UrlEncode($payload);

    $signature = hash_hmac('sha256', "{$base64Header}.{$base64Payload}", JWT_SECRET, true);
    $base64Signature = base64UrlEncode($signature);

    return "{$base64Header}.{$base64Payload}.{$base64Signature}";
}

function verifyToken(?string $jwt): ?array {
    if (!$jwt) {
        return null;
    }

    $parts = explode('.', $jwt);
    if (count($parts) !== 3) {
        return null;
    }

    [$base64Header, $base64Payload, $base64Signature] = $parts;

    $signature = base64UrlDecode($base64Signature);
    $expectedSignature = hash_hmac('sha256', "{$base64Header}.{$base64Payload}", JWT_SECRET, true);

    if (!hash_equals($signature, $expectedSignature)) {
        return null;
    }

    $payload = json_decode(base64UrlDecode($base64Payload), true);
    if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
        return null; // Expirado
    }

    return $payload;
}

function getBearerToken(): ?string {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

    if (empty($authHeader) && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    }

    if (preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
        return $matches[1];
    }

    // Soporte para query param en descargas directas de PDFs
    if (isset($_GET['token']) && !empty($_GET['token'])) {
        return $_GET['token'];
    }

    return null;
}

function requireAuth(): array {
    $token = getBearerToken();
    $payload = verifyToken($token);

    if (!$payload) {
        jsonError('Acceso denegado: Token de sesión ausente, inválido o expirado.', 401);
    }

    return $payload;
}

function requireRole(array|string $roles): array {
    $user = requireAuth();
    $allowedRoles = is_array($roles) ? $roles : [$roles];

    if (!in_array($user['rol'], $allowedRoles, true)) {
        jsonError('Acceso prohibido: Su rol (' . $user['rol'] . ') no cuenta con permisos suficientes.', 403);
    }

    return $user;
}

