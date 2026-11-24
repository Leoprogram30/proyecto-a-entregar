<?php
/**
 * Repositorio normativo y curricular con PDF
 * IPEM N° 349 "Giovanni Bosco"
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers/bootstrap.php';

const TIPOS_NORMATIVA = ['diseno_curricular', 'resolucion', 'regimen_academico', 'progresion', 'ley', 'orientacion', 'planificacion'];
const MAX_PDF_BYTES = 10 * 1024 * 1024;
const UPLOAD_DIR = __DIR__ . '/../uploads';

$pdo = getDbConnection();
$action = $_GET['action'] ?? 'list';

/** Ruta segura del PDF almacenado o null si el nombre es sospechoso/no existe. */
function storedPdfPath(?string $name): ?string {
    if ($name === null || !preg_match('/^[A-Za-z0-9_.-]{1,255}\.pdf$/', $name) || str_contains($name, '..')) {
        return null;
    }
    $base = realpath(UPLOAD_DIR);
    $path = $base ? $base . DIRECTORY_SEPARATOR . $name : null;
    return ($path && is_file($path)) ? $path : null;
}

function slugify(string $s): string {
    $s = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s) ?: $s;
    $s = strtolower(trim(preg_replace('/[^A-Za-z0-9]+/', '-', $s) ?? '', '-'));
    return $s !== '' ? substr($s, 0, 80) : 'documento';
}

switch ($action) {
    case 'list':
        requireAuth();
        $tipo = vEnum($_GET, 'tipo', 'tipo', TIPOS_NORMATIVA);
        $espacioId = vId($_GET, 'espacio_id', 'espacio', false);

        $sql = 'SELECT n.id, n.titulo, n.tipo, n.resolucion_numero, n.organismo, n.url_oficial, n.espacio_id, n.descripcion,
                       n.fecha_publicacion, n.subido_por, n.created_at,
                       (n.archivo_pdf IS NOT NULL AND n.archivo_pdf <> \'\') AS tiene_pdf,
                       e.nombre AS espacio_nombre, e.anio AS espacio_anio
                FROM normativas_documentos n
                LEFT JOIN espacios_curriculares e ON n.espacio_id = e.id
                WHERE 1=1';
        $params = [];
        if ($tipo !== null) {
            $sql .= ' AND n.tipo = :tipo';
            $params['tipo'] = $tipo;
        }
        if ($espacioId !== null) {
            $sql .= ' AND (n.espacio_id = :espacio_id OR n.espacio_id IS NULL)';
            $params['espacio_id'] = $espacioId;
        }
        $st = $pdo->prepare($sql . ' ORDER BY n.tipo ASC, n.fecha_publicacion DESC, n.id DESC');
        $st->execute($params);
        $docs = array_map(static function (array $d): array {
            $d['tiene_pdf'] = (bool)$d['tiene_pdf'];
            return $d;
        }, $st->fetchAll());
        jsonSuccess($docs, 'Documentos normativos y curriculares');

    case 'upload':
        $admin = requireRole(['admin']);
        requireMethod('POST');

        // Si el cuerpo supera post_max_size, PHP descarta $_POST y $_FILES
        if (empty($_POST) && empty($_FILES) && (int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
            jsonError('El archivo supera el tamaño máximo permitido por el servidor (10 MB).', 413);
        }

        $titulo = vString($_POST, 'titulo', 'título', ['required' => true, 'max' => 200]);
        $tipo = vEnum($_POST, 'tipo', 'tipo', TIPOS_NORMATIVA, false, 'resolucion');
        $resolucion = vString($_POST, 'resolucion_numero', 'número de resolución', ['max' => 50]);
        $organismo = vString($_POST, 'organismo', 'organismo', ['max' => 150, 'default' => 'Ministerio de Educación de Córdoba']);
        $url = vUrl($_POST, 'url_oficial', 'URL oficial');
        $desc = vString($_POST, 'descripcion', 'descripción', ['max' => 5000]);
        $espacioId = vId($_POST, 'espacio_id', 'espacio', false);
        $fecha = vDate($_POST, 'fecha_publicacion', 'fecha de publicación', false, date('Y-m-d'));
        if ($espacioId !== null) {
            requireEspacio($pdo, $espacioId);
        }

        $storedName = null;
        $destPath = null;
        $file = $_FILES['pdf'] ?? null;
        $hasFile = $file !== null && ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE;

        if ($hasFile) {
            $err = $file['error'];
            if ($err === UPLOAD_ERR_INI_SIZE || $err === UPLOAD_ERR_FORM_SIZE) {
                jsonError('El archivo supera el tamaño máximo permitido (10 MB).', 413);
            }
            if ($err !== UPLOAD_ERR_OK) {
                jsonError('No se pudo recibir el archivo (código ' . (int)$err . '). Intente nuevamente.', 422);
            }
            if (!is_uploaded_file($file['tmp_name'])) {
                jsonError('Archivo de subida inválido.', 422);
            }
            if ($file['size'] <= 0) {
                validationError('pdf', 'El archivo está vacío.');
            }
            if ($file['size'] > MAX_PDF_BYTES) {
                jsonError('El archivo no debe superar los 10 MB.', 413);
            }
            $fh = fopen($file['tmp_name'], 'rb');
            $magic = $fh ? fread($fh, 5) : '';
            if ($fh) {
                fclose($fh);
            }
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mime = finfo_file($finfo, $file['tmp_name']);
            finfo_close($finfo);
            if ($magic !== '%PDF-' || $mime !== 'application/pdf') {
                validationError('pdf', 'El archivo subido debe ser un documento PDF válido.');
            }
            if (!is_dir(UPLOAD_DIR) && !mkdir(UPLOAD_DIR, 0755, true)) {
                throw new RuntimeException('No se pudo crear el directorio de uploads.');
            }
            // Nombre aleatorio y extension fija: nunca se usa el nombre ni la extension del cliente.
            $storedName = bin2hex(random_bytes(16)) . '.pdf';
            $destPath = UPLOAD_DIR . '/' . $storedName;
            if (!move_uploaded_file($file['tmp_name'], $destPath)) {
                throw new RuntimeException('move_uploaded_file falló.');
            }
            @chmod($destPath, 0644);
        } elseif ($url === null) {
            validationError('pdf', 'Debe adjuntar un PDF o indicar una URL oficial.');
        }

        try {
            $st = $pdo->prepare('INSERT INTO normativas_documentos (titulo, tipo, resolucion_numero, organismo, url_oficial, archivo_pdf, espacio_id, descripcion, fecha_publicacion, subido_por)
                                 VALUES (:tit, :tip, :res, :org, :url, :pdf, :eid, :des, :fec, :uid)');
            $st->execute([
                'tit' => $titulo, 'tip' => $tipo, 'res' => $resolucion, 'org' => $organismo, 'url' => $url,
                'pdf' => $storedName, 'eid' => $espacioId, 'des' => $desc, 'fec' => $fecha, 'uid' => $admin['sub'],
            ]);
        } catch (Throwable $e) {
            if ($destPath !== null) {
                @unlink($destPath);
            }
            throw $e;
        }
        jsonSuccess(['id' => (int)$pdo->lastInsertId(), 'tiene_pdf' => $storedName !== null], 'Documento normativo registrado correctamente.', 201);

    case 'delete':
        requireRole(['admin']);
        requireMethod('POST');
        $id = vId(getJsonInput(), 'id', 'documento');
        $st = $pdo->prepare('SELECT archivo_pdf FROM normativas_documentos WHERE id = :id');
        $st->execute(['id' => $id]);
        $row = $st->fetch();
        if (!$row) {
            jsonError('Documento no encontrado.', 404);
        }
        $pdo->prepare('DELETE FROM normativas_documentos WHERE id = :id')->execute(['id' => $id]);
        // Los PDF oficiales (oficial-*.pdf) son parte del repositorio: nunca se borran.
        if (!str_starts_with((string)$row["archivo_pdf"], "oficial-") && ($path = storedPdfPath($row["archivo_pdf"]))) {
            @unlink($path);
        }
        jsonSuccess(['id' => $id], 'Documento eliminado.');

    case 'download':
        requireAuth();
        $id = vId($_GET, 'id', 'documento');
        $st = $pdo->prepare('SELECT titulo, archivo_pdf FROM normativas_documentos WHERE id = :id');
        $st->execute(['id' => $id]);
        $row = $st->fetch();
        $path = $row ? storedPdfPath($row['archivo_pdf']) : null;
        if (!$row || !$path) {
            jsonError('El documento no tiene un archivo PDF disponible.', 404);
        }
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="' . slugify($row['titulo']) . '.pdf"');
        header('Content-Length: ' . filesize($path));
        header('Cache-Control: private, max-age=0');
        readfile($path);
        exit;

    default:
        jsonError('Acción no reconocida en normativas.', 404);
}
