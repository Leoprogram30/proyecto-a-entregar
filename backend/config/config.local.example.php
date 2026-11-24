<?php
/**
 * Copiar a config.local.php y ajustar. Las variables de entorno tienen prioridad.
 * config.local.php NO debe versionarse ni exponerse (config/.htaccess lo bloquea).
 */
return [
    'db_host'      => '127.0.0.1',
    'db_port'      => '3306',
    'db_name'      => 'ipem349_gestion',
    'db_user'      => 'root',
    'db_pass'      => '',
    // 'jwt_secret'   => 'cadena-larga-aleatoria',   // si se omite se genera config/.jwt_secret
    // 'cors_origins' => 'https://mi-dominio.edu.ar,https://otro.dominio',
];
