# IPEM N° 349 "Giovanni Bosco" - Sistema de Gestión Curricular

Aplicación web para la gestión curricular del IPEM N° 349 "Giovanni Bosco" de Colonia Caroya (Córdoba), orientación Agro y Ambiente. Es el proyecto de la materia "Vibe Coding con React".

Permite consultar la malla curricular de Córdoba, preparar planificaciones anuales y secuencias didácticas, articular espacios curriculares mediante proyectos compartidos, llevar una agenda de hitos, consultar el repositorio normativo y el cronograma escolar, y supervisar las planificaciones desde el Equipo Directivo.

Para el uso cotidiano por parte de directivos y docentes hay una guía aparte: [GUIA_DE_USO.md](GUIA_DE_USO.md).

---

## 1. Tecnologías

- **Frontend:** React 19, Vite 8 y Tailwind CSS 4 (versiones según `frontend/package.json`).
- **Backend:** API en PHP 8.2 con PDO. Cada recurso es un archivo en `backend/api/`. La sesión usa un token JWT enviado en el encabezado `Authorization`.
- **Base de datos:** MySQL o MariaDB. El proyecto no usa SQLite.

## 2. Estructura

```text
iniciar_proyecto.bat      Arranca todo en Windows (base, API y frontend de desarrollo)
frontend/                 Aplicación React
  src/                    Código fuente (components, config, services, context)
  dist/                   Versión compilada, lista para subir a un hosting
  vite.config.js          Configuración de Vite y proxy hacia la API en desarrollo
backend/                  API PHP
  api/                    Un archivo por recurso: auth, espacios, planificaciones, secuencias,
                          proyectos_articulados, agenda, normativas, cronograma, inicio, institucion
  config/                 Conexión a la base (db.php), CORS (cors.php) y configuración local de ejemplo
  helpers/                Autenticación, validaciones y respuestas JSON
  uploads/                PDF de normativas. Incluye copias de documentos oficiales (oficial-*.pdf)
  router.php              Enrutador solo para el servidor de desarrollo de PHP
database/
  schema.sql              Estructura de tablas (borra y recrea las tablas)
  datos_iniciales.sql     Cuentas de demostración, normativas y cronograma
  datos_curriculares.sql  Malla curricular oficial (espacios, aprendizajes, contenidos e indicadores)
  datos_ejemplo.sql       Planificaciones, secuencias y un proyecto articulado de ejemplo
  instalar.php            Instalador por línea de comandos
```

---

## 3. Instalación rápida (Windows con XAMPP)

**Requisitos:** XAMPP (para PHP y MySQL) y Node.js (para `npm`). Node.js se instala desde https://nodejs.org.

1. Abrir XAMPP y dejar disponible MySQL. El archivo `.bat` también intenta iniciarlo si no está activo.
2. Hacer doble clic en `iniciar_proyecto.bat`, ubicado en la carpeta del proyecto.

El archivo hace lo siguiente:

1. Crea la base `ipem349_gestion` y, si todavía no existe la tabla `usuarios`, carga la estructura y los datos (incluidos los ejemplos). Si la base ya está instalada, no modifica nada.
2. Inicia la API PHP en `http://127.0.0.1:8000`, en una ventana minimizada.
3. Instala las dependencias de React con `npm install` (solo la primera vez) e inicia el frontend en `http://localhost:5173`.
4. Abre el navegador en esa dirección.

Para detener el sistema, cerrar las ventanas "Backend PHP IPEM 349" y "Frontend React IPEM 349".

## 4. Instalación manual

1. Iniciar MySQL desde el panel de XAMPP.
2. Cargar la base con una de estas dos opciones.

**Opción A: instalador por línea de comandos** (desde la carpeta del proyecto):

```bat
C:\xampp\php\php.exe database\instalar.php
```

- `--sin-ejemplos`: no carga las planificaciones, secuencias ni el proyecto de ejemplo.
- `--reset`: **borra todas las tablas de la base y la reinstala. Se pierden todos los datos.** Usarlo solo en una instalación de prueba.

Sin opciones, el instalador no modifica una base que ya tenga la tabla `usuarios`.

**Opción B: phpMyAdmin.**

1. Crear una base llamada `ipem349_gestion` con cotejamiento `utf8mb4_unicode_ci`.
2. Importar, en este orden: `database/schema.sql`, `datos_iniciales.sql`, `datos_curriculares.sql` y, si se quieren ejemplos, `datos_ejemplo.sql`.

Atención: `schema.sql` borra las tablas del proyecto antes de crearlas. Importarlo sobre una base con datos existentes elimina esos datos.

**Configuración de la base (opcional).** Por defecto el sistema usa `127.0.0.1:3306`, base `ipem349_gestion`, usuario `root` y sin contraseña. Para cambiarlo, copiar `backend/config/config.local.example.php` a `backend/config/config.local.php` y ajustar los valores. También se pueden usar variables de entorno (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`), que tienen prioridad. El archivo `config.local.php` no debe publicarse ni versionarse.

**Levantar la API y el frontend** (dos ventanas de terminal):

```bat
rem Ventana 1, desde la carpeta del proyecto
C:\xampp\php\php.exe -d upload_max_filesize=12M -d post_max_size=14M -S 127.0.0.1:8000 -t backend backend/router.php

rem Ventana 2
cd frontend
npm install
npm run dev
```

Abrir `http://localhost:5173`.

---

## 5. Desarrollo

- `php -S` no lee los archivos `.htaccess`. Por eso `backend/router.php` solo deja pasar los archivos `/api/*.php` y bloquea el resto (`config/`, `helpers/`, `uploads/`).
- En desarrollo, Vite (puerto 5173, fijo) redirige `/backend` hacia `http://127.0.0.1:8000`. Otra dirección se puede indicar con la variable `VITE_BACKEND_URL`.
- `npm run build` genera `frontend/dist/`. `npm run lint` ejecuta el analizador oxlint.

## 6. Publicación en Apache / cPanel

La aplicación está pensada para un hosting con Apache y PHP. Las rutas son relativas, así que puede instalarse en la raíz de un sitio o en una subcarpeta.

**Frontend.** Copiar el *contenido* de `frontend/dist/` (`index.html`, `static/`, `favicon.svg` y `.htaccess`) en la carpeta pública del sitio, por ejemplo `public_html/`.

**Backend.** Copiar la carpeta `backend/` junto al frontend, de modo que la API quede en `<sitio>/backend/api/`. El frontend en producción llama a esa ruta relativa. Los archivos `.htaccess` bloquean el acceso directo a `config/`, `helpers/` y `uploads/`.

**Configuración.**

1. Crear `backend/config/config.local.php` con los datos de MySQL del hosting. Ver el ejemplo en `config.local.example.php`.
2. Si la API y el frontend están en dominios distintos, indicar el dominio del frontend en `cors_origins`.
3. Permisos de escritura para PHP en `backend/uploads/` (las normativas en PDF se guardan allí, hasta 10 MB por archivo) y en `backend/config/` si no se define `jwt_secret` (el sistema genera allí el archivo `.jwt_secret`). En cPanel esto se ajusta desde el administrador de archivos; los permisos concretos dependen del servidor.
4. Importar la base como se indica en la sección 4.

**Antes de usarlo con datos reales:**

- **Cambiar las claves de las cuentas de demostración** (sección 7), o eliminarlas desde Administración > Usuarios. Las claves figuran en este README y en los datos iniciales.
- **Ocultar los accesos de demostración de la pantalla de ingreso:** compilar con `VITE_MOSTRAR_DEMO=false` (por ejemplo, en `frontend/.env.production`) y volver a subir `frontend/dist/`. Así las claves demo tampoco quedan en el código publicado.
- Verificar que el sitio no muestre errores de PHP en pantalla.

## 7. Cuentas de demostración

Las cuentas están en `database/datos_iniciales.sql`. Las claves son las del instalador y de la pantalla de ingreso.

| Rol | Correo | Clave | Observaciones |
|---|---|---|---|
| Administrador | admin@ipem349.edu.ar | admin123 | Aprueba solicitudes y administra el sistema |
| Equipo Directivo (director) | direccion@ipem349.edu.ar | director123 | Supervisa planificaciones y secuencias |
| Coordinador de Área | coordinacion.agro@ipem349.edu.ar | director123 | Comparte la clave de la cuenta de dirección |
| Docente | docente.agro@ipem349.edu.ar | docente123 | Docente de Sistemas Agroambientales |
| Docente | docente.quimica@ipem349.edu.ar | docente123 | |
| Docente | docente.matematica@ipem349.edu.ar | docente123 | |
| Docente | docente.edfisica@ipem349.edu.ar | docente123 | |
| Docente | docente.biologia@ipem349.edu.ar | docente123 | |
| Docente pendiente | docente.pendiente@ipem349.edu.ar | docente123 | Su cuenta está pendiente: no puede ingresar hasta que el administrador la apruebe |

Los nombres de las personas en estos datos son ficticios.

## 8. Roles y módulos

Roles (según `frontend/src/config/views.js` y los controles de la API): **Administrador**, **Equipo Directivo** (director), **Coordinador de Área** y **Docente**. Los directivos son administrador, director y coordinador.

| Módulo (menú) | Administrador | Director | Coordinador | Docente |
|---|:-:|:-:|:-:|:-:|
| Inicio | Sí | Sí | Sí | Sí |
| Administración (solicitudes, usuarios, materias, normativas, cronograma, institución) | Sí | | | |
| Supervisión | Sí | Sí | Sí | |
| Malla Curricular | Sí | Sí | Sí | Sí |
| Mis Planificaciones | | | Sí | Sí |
| Secuencias | Sí | Sí | Sí | Sí |
| Articulación (proyectos compartidos) | Sí | Sí | Sí | Sí |
| Precursora (Ruta 2) | Sí | Sí | Sí | Lectura |
| Agenda | | | Sí | Sí |
| Repositorio Normativo | Sí | Sí | Sí | Sí |
| Cronograma | Sí | Sí | Sí | Sí |

Notas:

- Solo docentes y coordinadores crean planificaciones, secuencias, hitos y proyectos. Los directivos revisan.
- El asistente de planificación paso a paso también está disponible para docentes y coordinadores sin aparecer en el menú.
- Los documentos del repositorio normativo y el cronograma los carga o modifica el administrador.

## 9. Seguridad

- Las contraseñas se guardan como hash (bcrypt), nunca en texto plano.
- Al iniciar sesión, el token se envía en el encabezado `Authorization`. En cada pedido, el servidor vuelve a leer la cuenta desde la base y exige que esté aprobada.
- Los intentos fallidos de ingreso se limitan por correo y dirección IP en una ventana de 15 minutos.
- El registro público siempre crea cuentas de docente, con estado "pendiente" hasta que el administrador las apruebe. El administrador no puede cambiar su propio rol ni su propio estado.
- Los PDF de normativas se guardan con nombre aleatorio y solo se descargan a través de la API. El acceso directo a la carpeta está bloqueado en Apache.
- Este proyecto no pasó por una auditoría de seguridad. Antes de usarlo con datos reales de estudiantes, conviene revisar la configuración del hosting y cambiar las claves de demostración (sección 6).

## 10. Fuentes oficiales y límites

Fuentes en las que se basan los datos (incluidas como copias en `backend/uploads/`):

- **Diseño Curricular de Educación Secundaria, Tomo 2: Ciclo Básico** (2011-2015), Ministerio de Educación de Córdoba.
- **Diseño Curricular de Educación Secundaria, Tomo 11: Orientación Agro y Ambiente** (2012-2015), Ministerio de Educación de Córdoba.
- **Progresiones de Aprendizaje 2025**, Ministerio de Educación de Córdoba. Varias están publicadas como versión en consulta.
- **Resolución SE 88/2025** (Educación Secundaria 2026). El texto fue leído completo; el alcance y la vigencia de cada punto se deben confirmar con la supervisión.
- **Resolución SE-SIDPyTE 11/2025** (Régimen Académico de la Educación Secundaria).

Límites:

- **El Anexo de la Resolución 11/2025 no estuvo disponible para leer.** Por eso el sistema **no calcula calificaciones, promoción ni asistencia**. Solo muestra el documento en el repositorio normativo.
- **La orientación Ciencias Naturales de la escuela no está cargada.** La malla incluye solo "Ciclo Básico común" y "Agro y Ambiente".
- **El año de algunos espacios se dedujo de las tablas del Tomo 11.** Por ejemplo, Economía y Gestión Agroambiental figura en 6.º año. Conviene confirmarlo con la escuela.
- **Ruta 2 (institución precursora).** La escuela es precursora desde 2027 (dato de la institución). La vista **Precursora** muestra las líneas de la Ruta 2, su avance y la cobertura de propuestas integradas por curso. Las reglas de 2027 no estaban publicadas al armar el sistema: se usan como referencia las de 2026 (Res. SE 88/2025).
- Las personas que aparecen en los datos de ejemplo y de demostración son ficticias.
- Los datos de este proyecto son una referencia de trabajo. No reemplazan la normativa vigente ni las indicaciones de la supervisión.

---

## Autoría

- **Institución:** IPEM N° 349 "Giovanni Bosco"
- **Ubicación:** Colonia Caroya, Córdoba, Argentina
- **Orientación:** Agro y Ambiente
- **Proyecto:** material de la materia "Vibe Coding con React"
