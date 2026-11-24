# 🌱 IPEM N° 349 "Giovanni Bosco" - Sistema Institucional de Gestión Curricular
### Colonia Caroya, Provincia de Córdoba | Orientación: Agro y Ambiente

Aplicación web institucional y pedagógica desarrollada a medida para el colegio secundario **IPEM N° 349 "Giovanni Bosco" de Colonia Caroya (Córdoba, Argentina)**. Permite gestionar la **Malla Curricular Oficial de la Provincia de Córdoba**, diseñar **Planificaciones Anuales interactivas paso a paso** con objetivos oficiales precargados, construir **Secuencias Didácticas con articulación interdisciplinaria**, realizar el seguimiento de **Prácticas en entornos formativos (campo, huerta y laboratorio)** y supervisar las devoluciones pedagógicas del **Equipo Directivo**.

---

## 🏛️ 1. Arquitectura Tecnológica y Despliegue

El proyecto está diseñado bajo una arquitectura desacoplada y lista para entornos de producción en servidores compartidos **cPanel / Apache con PHP 8+ y MySQL** (sin requerir Node.js en el backend de producción):

```text
proyecto a entregar/
├── frontend/               # Aplicación SPA en React 19 + Vite + Tailwind CSS
│   ├── public/             # Archivos estáticos y .htaccess para Apache
│   ├── src/                # Código fuente modular (Componentes, Contexto, Servicios)
│   ├── dist/               # Build compilado listo para desplegar en hosting web
│   └── package.json
│
├── backend/                # API RESTful en PHP 8 puro con PDO y MySQL
│   ├── config/             # Configuración de Base de Datos y CORS (db.php, cors.php)
│   ├── helpers/            # Autenticación JWT pura y respuestas JSON estandarizadas
│   ├── api/                # Endpoints (auth, espacios, planificaciones, secuencias, etc.)
│   ├── uploads/            # Carpeta segura para almacenamiento de normativas en PDF
│   └── .htaccess           # Cabeceras y seguridad Apache
│
└── database/
    └── schema.sql          # Estructura de tablas normalizadas y datos semilla oficiales
```

---

## 🔑 2. Roles del Sistema y Credenciales de Demostración

El sistema cuenta con un único portal de acceso con control de roles estricto y un **mecanismo de aprobación previa**:

| Rol | Usuario / Email | Contraseña | Capacidades Principales |
|---|---|---|---|
| **Administrador** | `admin@ipem349.edu.ar` | `admin123` | Aprueba/rechaza solicitudes de registro de docentes, sube normativas/diseños curriculares en PDF y actualiza el cronograma escolar. |
| **Equipo Directivo (Directora)** | `direccion@ipem349.edu.ar` | `director123` | Supervisa todas las planificaciones y secuencias, filtra por ciclo/año, aprueba o solicita ajustes y redacta devoluciones pedagógicas. |
| **Coordinador de Área** | `coordinacion.agro@ipem349.edu.ar` | `director123` | Acompañamiento pedagógico específico para el Ciclo Orientado en Agro y Ambiente. |
| **Docente (Agro)** | `docente.agro@ipem349.edu.ar` | `docente123` | Selecciona espacios curriculares, arma planificaciones en asistente paso a paso, gestiona secuencias didácticas y agenda hitos en la huerta escolar. |
| **Docente (Química)** | `docente.quimica@ipem349.edu.ar` | `docente123` | Participa en articulaciones colaborativas entre asignaturas científicas y productivas. |
| **Docente Pendiente** | `docente.pendiente@ipem349.edu.ar` | `docente123` | Cuenta de prueba para evaluar el flujo de aprobación en la consola del Administrador. |

> 💡 **Nota para evaluación rápida:** En la barra superior de navegación existe un selector de **"Simular Rol"** que permite alternar instantáneamente entre Administrador, Directivo y Docente con un solo clic.

---

## 🚀 3. Guía de Instalación y Puesta en Marcha

### A. Configuración de la Base de Datos (MySQL)
1. Abre tu administrador de MySQL (**phpMyAdmin**, **HeidiSQL**, **Laragon** o **XAMPP**).
2. Crea una nueva base de datos llamada `ipem349_gestion` con cotejamiento `utf8mb4_unicode_ci`.
3. Importa el archivo ubicado en:
   ```text
   database/schema.sql
   ```
4. El script creará automáticamente todas las tablas con sus relaciones foráneas y cargará los datos semilla (usuarios precargados, malla oficial de 1° a 6° año de Córdoba, objetivos y contenidos prioritarios, normativas y cronograma escolar).

### B. Configuración del Backend (PHP 8 + PDO)
1. Abre el archivo de configuración de base de datos en:
   ```text
   backend/config/db.php
   ```
2. Modifica si es necesario los valores de conexión:
   ```php
   define('DB_HOST', '127.0.0.1');
   define('DB_PORT', '3306');
   define('DB_NAME', 'ipem349_gestion');
   define('DB_USER', 'root');
   define('DB_PASS', '');
   ```
3. Si deseas probar el backend de forma local con el servidor embebido de PHP:
   ```bash
   cd backend
   php -S 127.0.0.1:8000
   ```

### C. Frontend (React 19 + Vite + Tailwind CSS)
1. Entra a la carpeta del frontend e instala dependencias:
   ```bash
   cd frontend
   npm install
   ```
2. Para ejecutar en modo desarrollo con recarga rápida (HMR):
   ```bash
   npm run dev
   ```
   Abre en tu navegador `http://localhost:5173/`.
3. Para compilar la versión definitiva de producción lista para subir a un hosting:
   ```bash
   npm run build
   ```
   Esto generará la carpeta `frontend/dist/` con todos los archivos estáticos y el archivo `.htaccess` configurado.

---

## 🌐 4. Despliegue en Servidor Apache / cPanel

1. **Subir el Frontend:**
   - Copia todo el contenido de la carpeta `frontend/dist/` dentro del directorio `public_html/` de tu hosting.
   - El archivo `.htaccess` incluido garantiza que al recargar la página en cualquier ruta o hash de React Router no ocurra el error `404 Not Found`.

2. **Subir el Backend:**
   - Sube la carpeta `backend/` a tu servidor (puede ser en `public_html/backend/` o fuera de la raíz pública).
   - Asegúrate de que la carpeta `backend/uploads/` tenga permisos de escritura (`chmod 755` o `775`).
   - Ajusta las credenciales en `backend/config/db.php` con el nombre de usuario y contraseña de MySQL de tu cPanel.

---

## 🌾 5. Módulos y Funcionalidades del Sistema

### 1. Consola de Selección Curricular (Malla de Córdoba)
- Pantalla interactiva dividida en **Ciclo Básico (1° a 3° Año)** y **Ciclo Orientado en Agro y Ambiente (4° a 6° Año)**.
- Incluye las asignaturas del diseño curricular cordobés: *Producción Vegetal I y II*, *Agroecología*, *Ecología y Recursos Naturales*, *Procesos Agroindustriales (Conservas y Embutidos tradicionales de Caroya con IG)*, *Suelos y Riego*, etc.

### 2. Planificación Anual Interactiva (Asistente Paso a Paso)
- **Paso 1:** Diagnóstico del grupo y contexto socioproductivo de Colonia Caroya.
- **Paso 2:** Selección interactiva de **Objetivos oficiales de Córdoba** y **Aprendizajes prioritarios** mediante casillas de verificación, con opción de agregar objetivos personalizados.
- **Paso 3:** Formatos pedagógicos (Asignatura, Taller de Huerta, Laboratorio de Ciencias, Entorno Formativo Campo) y estrategias metodológicas (ABP).
- **Paso 4:** Criterios e instrumentos de evaluación (según **Régimen Académico Res. 732/17**) y bibliografía.
- **Exportación e Impresión Oficial:** Genera un documento con membrete del **IPEM N° 349 "Giovanni Bosco"**, escudo oficial, fecha de ciclo lectivo y líneas de firma para el docente y equipo directivo.

### 3. Secuencias Didácticas y Articulación Interdisciplinaria (Doble Modalidad)
- **Secuencias Propias:** Constructor estructurado en *Inicio*, *Desarrollo* y *Cierre*, con botón para cargar **plantillas modelo para Agro y Ambiente** (*Compostaje termofílico*, *Injerto de vid caroyense*).
- **Articulación Declarativa:** Vinculación directa con otras asignaturas indicando el eje transversal.
- **Articulación Colaborativa Guiada:** Permite publicar una **Propuesta de Proyecto Articulado** (ej. *"Huerta Orgánica y Análisis Edafológico de Suelo"*), invitar a docentes de Química, Matemática o Biología y construir aportes específicos integrados en la misma propuesta.

### 4. Agenda Docente con Hitos de Aprendizaje
- Cronograma oficial del Ciclo Lectivo de Córdoba (inicio, receso invernal, semanas pedagógicas, coloquios de diciembre).
- Agenda personal por materia con tipos de actividad (*Práctica en Entorno Formativo / Huerta*, *Hito Evaluativo*, *Entrega de Proyecto*).
- **Indicador visual de progreso** con porcentaje dinámico de cumplimiento de metas.

### 5. Repositorio Normativo Ministerial
- Enlaces oficiales al portal de **Igualdad y Calidad Educativa de Córdoba** para los Diseños Curriculares de Ciclo Básico y Ciclo Orientado.
- Resoluciones ministeriales, Régimen Académico y protocolos de bioseguridad en entornos formativos agropecuarios.

---

## 👨‍💻 Autoría y Contexto Institucional
- **Institución:** IPEM N° 349 "Giovanni Bosco"
- **Ubicación:** Colonia Caroya, Provincia de Córdoba, Argentina
- **Orientación:** Agro y Ambiente
- **Materia / Curso:** Curso Intensivo: Vibe Coding con React
