<?php
/**
 * Endpoint de Repositorio Normativo y Curricular con Subida de Archivos PDF
 * IPEM N° 349 "Giovanni Bosco"
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

handleCors();

$pdo = getDbConnection();
$action = $_GET['action'] ?? 'list';
$method = $_SERVER['REQUEST_METHOD'];

switch ($action) {
    case 'list':
        $tipo = $_GET['tipo'] ?? null;
        $espacioId = isset($_GET['espacio_id']) ? (int)$_GET['espacio_id'] : null;

        $query = '
            SELECT n.*, e.nombre AS espacio_nombre, e.anio AS espacio_anio
            FROM normativas_documentos n
            LEFT JOIN espacios_curriculares e ON n.espacio_id = e.id
            WHERE 1=1
        ';
        $params = [];

        if ($tipo && in_array($tipo, ['diseno_curricular', 'resolucion', 'regimen_academico', 'progresion'], true)) {
            $query .= ' AND n.tipo = :tipo';
            $params['tipo'] = $tipo;
        }

        if ($espacioId) {
            $query .= ' AND (n.espacio_id = :espacio_id OR n.espacio_id IS NULL)';
            $params['espacio_id'] = $espacioId;
        }

        $query .= ' ORDER BY n.tipo ASC, n.fecha_publicacion DESC';
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $documentos = $stmt->fetchAll();

        // Agregar URL pública de descarga a los archivos PDF locales
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $baseUri = "{$protocol}://{$host}/backend/uploads/";

        foreach ($documentos as &$doc) {
            if (!empty($doc['archivo_pdf'])) {
                $doc['download_url'] = $baseUri . $doc['archivo_pdf'];
            }
        }

        jsonSuccess($documentos, 'Documentos normativos y curriculares');
        break;

    case 'upload':
        // Subida de PDFs de normativas por parte del Administrador
        $admin = requireRole(['admin']);
        if ($method !== 'POST') {
            jsonError('Método no permitido', 405);
        }

        $titulo = trim($_POST['titulo'] ?? '');
        $tipo = in_array($_POST['tipo'] ?? '', ['diseno_curricular', 'resolucion', 'regimen_academico', 'progresion'], true) ? $_POST['tipo'] : 'resolucion';
        $resolucion = trim($_POST['resolucion_numero'] ?? '');
        $organismo = trim($_POST['organismo'] ?? 'Ministerio de Educación de Córdoba');
        $urlOficial = trim($_POST['url_oficial'] ?? '');
        $descripcion = trim($_POST['descripcion'] ?? '');
        $espacioId = !empty($_POST['espacio_id']) ? (int)$_POST['espacio_id'] : null;
        $fechaPublicacion = !empty($_POST['fecha_publicacion']) ? $_POST['fecha_publicacion'] : date('Y-m-d');

        if (empty($titulo)) {
            jsonError('El título del documento es obligatorio.');
        }

        $nombreArchivoPdf = null;

        // Procesar subida de archivo PDF si fue adjuntado
        if (isset($_FILES['pdf']) && $_FILES['pdf']['error'] === UPLOAD_ERR_OK) {
            $file = $_FILES['pdf'];
            $fileTmp = $file['tmp_name'];
            $fileName = $file['name'];
            $fileSize = $file['size'];

            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $fileTmp);
            finfo_close($finfo);

            if ($mimeType !== 'application/pdf') {
                jsonError('El archivo subido debe ser un documento en formato PDF.');
            }

            // Máximo 25 MB
            if ($fileSize > 25 * 1024 * 1024) {
                jsonError('El archivo no debe superar los 25 MB.');
            }

            $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            $safeName = preg_replace('/[^a-zA-Z0-9_-]/', '_', pathinfo($fileName, PATHINFO_FILENAME));
            $nombreArchivoPdf = "normativa_{$safeName}_" . uniqid() . ".{$extension}";

            $destDir = __DIR__ . '/../uploads';
            if (!is_dir($destDir)) {
                mkdir($destDir, 0755, true);
            }

            $destPath = $destDir . '/' . $nombreArchivoPdf;
            if (!move_uploaded_file($fileTmp, $destPath)) {
                jsonError('No se pudo guardar el archivo en el servidor.', 500);
            }
        }

        $stmt = $pdo->prepare('
            INSERT INTO normativas_documentos (titulo, tipo, resolucion_numero, organismo, url_oficial, archivo_pdf, espacio_id, descripcion, fecha_publicacion, subido_por)
            VALUES (:tit, :tip, :res, :org, :url, :pdf, :eid, :des, :fec, :uid)
        ');
        $stmt->execute([
            'tit' => $titulo,
            'tip' => $tipo,
            'res' => $resolucion ?: null,
            'org' => $organismo,
            'url' => $urlOficial ?: null,
            'pdf' => $nombreArchivoPdf,
            'eid' => $espacioId,
            'des' => $descripcion,
            'fec' => $fechaPublicacion,
            'uid' => $admin['sub']
        ]);

        $newId = (int)$pdo->lastInsertId();
        jsonSuccess([
            'id'          => $newId,
            'archivo_pdf' => $nombreArchivoPdf
        ], 'Documento normativo registrado y guardado correctamente.');
        break;

    default:
        jsonError('Acción no reconocida en normativas', 404);
        break;
}

