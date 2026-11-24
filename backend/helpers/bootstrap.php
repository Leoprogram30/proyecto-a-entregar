<?php
/**
 * Arranque común de todos los endpoints: errores, CORS, BD, helpers.
 * IPEM N° 349 "Giovanni Bosco"
 */

declare(strict_types=1);

require_once __DIR__ . '/response.php';
registerGlobalErrorHandling();

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/validators.php';
require_once __DIR__ . '/catalogos.php';

handleCors();
