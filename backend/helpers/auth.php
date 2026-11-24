<?php
/**
 * Autenticación JWT (HS256, sin librerías) y autorización por rol.
 * El token solo identifica al usuario (sub); rol y estado se leen de la BD en cada request.
 * IPEM N° 349 "Giovanni Bosco"
 */

declare(strict_types=1);

const ROLES_DIRECTIVOS = ['admin', 'director', 'coordinador'];
const ROLES_AUTORES    = ['docente', 'coordinador'];

/** Secreto JWT: env/config.local.php, o archivo generado en config/.jwt_secret. */
function jwtSecret(): string {
    static $secret = null;
    if ($secret !== null) {
        return $secret;
    }
    $fromCfg = appConfig('jwt_secret');
    if ($fromCfg !== null && strlen($fromCfg) >= 16) {
        return $secret = $fromCfg;
    }
    $file = __DIR__ . '/../config/.jwt_secret';
    if (is_file($file)) {
        $s = trim((string)file_get_contents($file));
        if (strlen($s) >= 32) {
            return $secret = $s;
        }
    }
    $s = bin2hex(random_bytes(32));
    if (file_put_contents($file, $s, LOCK_EX) === false) {
        throw new RuntimeException('No se pudo guardar config/.jwt_secret (revise permisos de escritura).');
    }
    @chmod($file, 0600);
    return $secret = $s;
}

function base64UrlEncode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode(string $data): string {
    return (string)base64_decode(strtr($data, '-_', '+/'), false);
}

function generateToken(int $userId, int $expirySeconds = 86400 * 7): string {
    $header  = base64UrlEncode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
    $payload = base64UrlEncode(json_encode([
        'sub' => $userId,
        'iat' => time(),
        'exp' => time() + $expirySeconds,
    ]));
    $sig = base64UrlEncode(hash_hmac('sha256', "{$header}.{$payload}", jwtSecret(), true));
    return "{$header}.{$payload}.{$sig}";
}

function verifyToken(?string $jwt): ?array {
    if (!$jwt) {
        return null;
    }
    $parts = explode('.', $jwt);
    if (count($parts) !== 3) {
        return null;
    }
    [$h, $p, $s] = $parts;

    $header = json_decode(base64UrlDecode($h), true);
    if (!is_array($header) || ($header['alg'] ?? '') !== 'HS256') {
        return null;
    }
    $expected = hash_hmac('sha256', "{$h}.{$p}", jwtSecret(), true);
    if (!hash_equals($expected, base64UrlDecode($s))) {
        return null;
    }
    $payload = json_decode(base64UrlDecode($p), true);
    if (!is_array($payload) || !isset($payload['exp'], $payload['sub']) || (int)$payload['exp'] < time()) {
        return null;
    }
    return $payload;
}

/** Header Authorization desde cualquier SAPI/servidor. */
function getAuthorizationHeader(): string {
    foreach (['HTTP_AUTHORIZATION', 'REDIRECT_HTTP_AUTHORIZATION'] as $k) {
        if (!empty($_SERVER[$k])) {
            return (string)$_SERVER[$k];
        }
    }
    if (function_exists('getallheaders')) {
        foreach (getallheaders() as $name => $value) {
            if (strcasecmp((string)$name, 'Authorization') === 0) {
                return (string)$value;
            }
        }
    }
    return '';
}

function getBearerToken(): ?string {
    if (preg_match('/^Bearer\s+(\S+)$/i', trim(getAuthorizationHeader()), $m)) {
        return $m[1];
    }
    return null;
}

/**
 * Exige sesión válida. Lee el usuario de la BD: debe existir y estar aprobado.
 * Devuelve fila de usuario (sin hash) con claves extra 'sub' (= id).
 */
function requireAuth(): array {
    $payload = verifyToken(getBearerToken());
    if (!$payload) {
        jsonError('Sesión ausente, inválida o expirada. Inicie sesión nuevamente.', 401);
    }
    $pdo = getDbConnection();
    $st = $pdo->prepare('SELECT id, nombre, apellido, dni, email, rol, cargo_descripcion, estado, fecha_registro FROM usuarios WHERE id = :id');
    $st->execute(['id' => (int)$payload['sub']]);
    $u = $st->fetch();
    if (!$u || $u['estado'] !== 'aprobado') {
        jsonError('Su cuenta ya no está habilitada. Inicie sesión nuevamente.', 401);
    }
    $u['sub'] = (int)$u['id'];
    return $u;
}

function requireRole(array|string $roles): array {
    $user = requireAuth();
    $allowed = is_array($roles) ? $roles : [$roles];
    if (!in_array($user['rol'], $allowed, true)) {
        jsonError('Acceso prohibido: su rol (' . $user['rol'] . ') no tiene permisos para esta acción.', 403);
    }
    return $user;
}

function isDirectivo(array $user): bool {
    return in_array($user['rol'], ROLES_DIRECTIVOS, true);
}
