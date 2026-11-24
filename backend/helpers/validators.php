<?php
/**
 * Validadores reutilizables. Todos responden 422 con details {campo: mensaje}.
 * IPEM N° 349 "Giovanni Bosco"
 */

declare(strict_types=1);

function validationError(string $field, string $message): never {
    jsonError($message, 422, [$field => $message]);
}

/** Cadena recortada. Opciones: required, max, min, default. */
function vString(array $in, string $key, string $label, array $o = []): ?string {
    $required = $o['required'] ?? false;
    $max = $o['max'] ?? 255;
    $min = $o['min'] ?? 0;
    $default = array_key_exists('default', $o) ? $o['default'] : null;
    $v = $in[$key] ?? null;
    if ($v === null || $v === '') {
        if ($required) {
            validationError($key, "El campo {$label} es obligatorio.");
        }
        return $default;
    }
    if (!is_string($v) && !is_int($v) && !is_float($v)) {
        validationError($key, "El campo {$label} tiene un formato inválido.");
    }
    $v = trim((string)$v);
    if ($v === '') {
        if ($required) {
            validationError($key, "El campo {$label} es obligatorio.");
        }
        return $default;
    }
    $len = mb_strlen($v);
    if ($len > $max) {
        validationError($key, "El campo {$label} no puede superar los {$max} caracteres.");
    }
    if ($len < $min) {
        validationError($key, "El campo {$label} debe tener al menos {$min} caracteres.");
    }
    return $v;
}

/** Valor dentro de una lista cerrada. */
function vEnum(array $in, string $key, string $label, array $allowed, bool $required = false, ?string $default = null): ?string {
    $v = $in[$key] ?? null;
    if ($v === null || $v === '') {
        if ($required) {
            validationError($key, "El campo {$label} es obligatorio.");
        }
        return $default;
    }
    if (!is_string($v) || !in_array($v, $allowed, true)) {
        validationError($key, "El campo {$label} debe ser uno de: " . implode(', ', $allowed) . '.');
    }
    return $v;
}

/** Entero con rango opcional. Opciones: required, min, max, default. */
function vInt(array $in, string $key, string $label, array $o = []): ?int {
    $v = $in[$key] ?? null;
    if ($v === null || $v === '') {
        if (!empty($o['required'])) {
            validationError($key, "El campo {$label} es obligatorio.");
        }
        return $o['default'] ?? null;
    }
    if (is_bool($v) || is_array($v) || filter_var($v, FILTER_VALIDATE_INT) === false) {
        validationError($key, "El campo {$label} debe ser un número entero.");
    }
    $n = (int)$v;
    if (isset($o['min']) && $n < $o['min']) {
        validationError($key, "El campo {$label} debe ser mayor o igual a {$o['min']}.");
    }
    if (isset($o['max']) && $n > $o['max']) {
        validationError($key, "El campo {$label} debe ser menor o igual a {$o['max']}.");
    }
    return $n;
}

/** Id positivo. */
function vId(array $in, string $key, string $label, bool $required = true): ?int {
    return vInt($in, $key, $label, ['required' => $required, 'min' => 1]);
}

/** Fecha estricta AAAA-MM-DD. */
function vDate(array $in, string $key, string $label, bool $required = false, ?string $default = null): ?string {
    $v = $in[$key] ?? null;
    if ($v === null || $v === '') {
        if ($required) {
            validationError($key, "El campo {$label} es obligatorio.");
        }
        return $default;
    }
    if (!is_string($v) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $v)) {
        validationError($key, "El campo {$label} debe tener formato AAAA-MM-DD.");
    }
    $d = DateTime::createFromFormat('!Y-m-d', $v);
    if (!$d || $d->format('Y-m-d') !== $v) {
        validationError($key, "El campo {$label} no es una fecha válida.");
    }
    $year = (int)$d->format('Y');
    if ($year < 2000 || $year > 2100) {
        validationError($key, "El campo {$label} está fuera de rango (2000-2100).");
    }
    return $v;
}

/** URL http/https (opcional). */
function vUrl(array $in, string $key, string $label, int $max = 300): ?string {
    $v = vString($in, $key, $label, ['max' => $max]);
    if ($v === null) {
        return null;
    }
    $scheme = strtolower((string)parse_url($v, PHP_URL_SCHEME));
    if (!in_array($scheme, ['http', 'https'], true) || filter_var($v, FILTER_VALIDATE_URL) === false) {
        validationError($key, "El campo {$label} debe ser una URL http o https válida.");
    }
    return $v;
}

/** Lista de textos (array o JSON de array) -> array de strings. */
function vStringList(array $in, string $key, string $label, int $maxItems = 100, int $maxLen = 2000): array {
    $v = $in[$key] ?? [];
    if ($v === null || $v === '') {
        return [];
    }
    if (is_string($v)) {
        $decoded = json_decode($v, true);
        $v = is_array($decoded) ? $decoded : [$v];
    }
    if (!is_array($v)) {
        validationError($key, "El campo {$label} debe ser una lista de textos.");
    }
    $out = [];
    foreach ($v as $item) {
        if (!is_string($item)) {
            validationError($key, "El campo {$label} debe contener solo textos.");
        }
        $item = trim($item);
        if ($item === '') {
            continue;
        }
        if (mb_strlen($item) > $maxLen) {
            validationError($key, "Cada elemento de {$label} puede tener hasta {$maxLen} caracteres.");
        }
        $out[] = $item;
    }
    if (count($out) > $maxItems) {
        validationError($key, "El campo {$label} admite hasta {$maxItems} elementos.");
    }
    return array_values($out);
}

/** 0/1 a partir de bool/int/string. */
function vBool(array $in, string $key, bool $default = true): int {
    if (!isset($in[$key])) {
        return $default ? 1 : 0;
    }
    return filter_var($in[$key], FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
}

/** Verifica que exista el espacio curricular; si no, 422. */
function requireEspacio(PDO $pdo, int $id, string $field = 'espacio_id', ?array $existente = null): void {
    $st = $pdo->prepare('SELECT activo FROM espacios_curriculares WHERE id = :id');
    $st->execute(['id' => $id]);
    $activo = $st->fetchColumn();
    if ($activo === false) {
        validationError($field, 'El espacio curricular indicado no existe.');
    }
    if ((int)$activo === 1) {
        return;
    }
    // Materia inactiva: solo se admite al editar un registro que ya pertenecía a ella.
    $tablas = ['planificaciones_anuales', 'secuencias_didacticas', 'agenda_hitos'];
    if ($existente !== null && in_array($existente['tabla'] ?? '', $tablas, true)) {
        $q = $pdo->prepare("SELECT 1 FROM {$existente['tabla']} WHERE id = :rid AND espacio_id = :eid");
        $q->execute(['rid' => (int)$existente['id'], 'eid' => $id]);
        if ($q->fetchColumn()) {
            return;
        }
    }
    validationError($field, 'El espacio curricular está inactivo y no admite nuevos registros.');
}

/** Decodifica una lista JSON guardada como texto; siempre devuelve array. */
function decodeList(?string $raw): array {
    if ($raw === null || trim($raw) === '') {
        return [];
    }
    $d = json_decode($raw, true);
    if (is_array($d)) {
        return array_values($d);
    }
    return [$raw];
}
