@echo off
setlocal
chcp 65001 >nul
title IPEM 349 - Iniciar Sistema
cd /d "%~dp0"

echo ==============================================================
echo  IPEM 349 "Giovanni Bosco" - Sistema de Gestion Curricular
echo ==============================================================
echo.

rem --- PHP: primero el de XAMPP, si no el del PATH ---
set "PHP=C:\xampp\php\php.exe"
if not exist "%PHP%" set "PHP=php"
"%PHP%" -v >nul 2>&1
if errorlevel 1 goto :sinphp

where npm >nul 2>&1
if errorlevel 1 goto :sinnode

rem --- MySQL: si no responde, se intenta iniciar el de XAMPP ---
echo [1/4] Verificando MySQL y la base de datos...
"%PHP%" database\instalar.php
if not errorlevel 1 goto :dblista

if not exist "C:\xampp\mysql\bin\mysqld.exe" goto :sinmysql
netstat -ano | findstr /r /c:":3306 .*LISTENING" >nul
if not errorlevel 1 goto :errordb

echo       Iniciando MySQL de XAMPP...
start "MySQL XAMPP" /min /d "C:\xampp" "C:\xampp\mysql\bin\mysqld.exe" --defaults-file=C:\xampp\mysql\bin\my.ini --standalone
set /a intentos=0
:esperar
ping -n 3 127.0.0.1 >nul
set /a intentos+=1
"%PHP%" database\instalar.php
if not errorlevel 1 goto :dblista
if %intentos% lss 10 goto :esperar
goto :errordb

:dblista
rem --- Si la API o React ya estan activos, no se inician de nuevo ---
"%PHP%" -r "exit(@fsockopen('127.0.0.1',8000)?0:1);" >nul 2>&1
if not errorlevel 1 goto :apilista
echo [2/4] Iniciando API PHP en http://127.0.0.1:8000 ...
start "Backend PHP IPEM 349" /min "%PHP%" -d display_errors=0 -d upload_max_filesize=12M -d post_max_size=14M -S 127.0.0.1:8000 -t backend backend/router.php
:apilista

cd frontend
"%PHP%" -r "exit(@fsockopen('127.0.0.1',5173)?0:1);" >nul 2>&1
if not errorlevel 1 goto :weblista
if exist node_modules\vite goto :deps
echo [3/4] Instalando dependencias del frontend (solo la primera vez)...
call npm install
if errorlevel 1 goto :errornpm
:deps
echo [4/4] Iniciando React en http://localhost:5173 ...
start "Frontend React IPEM 349" /min cmd /c "npm run dev"

rem --- Espera a que los dos servidores respondan antes de abrir el navegador (max. 60 s) ---
set /a espera=0
:esperarweb
ping -n 2 127.0.0.1 >nul
set /a espera+=1
"%PHP%" -r "exit(@fsockopen('127.0.0.1',5173)?0:1);" >nul 2>&1
if not errorlevel 1 goto :weblista
if %espera% lss 60 goto :esperarweb
goto :errorweb

:weblista
set /a espera=0
:esperarapi
"%PHP%" -r "exit(@fsockopen('127.0.0.1',8000)?0:1);" >nul 2>&1
if not errorlevel 1 goto :abrir
ping -n 2 127.0.0.1 >nul
set /a espera+=1
if %espera% lss 15 goto :esperarapi
goto :errorapi

:abrir
start "" http://localhost:5173

echo.
echo  Sistema iniciado: http://localhost:5173
echo   Administrador: admin@ipem349.edu.ar        / admin123
echo   Directora:     direccion@ipem349.edu.ar    / director123
echo   Docente:       docente.agro@ipem349.edu.ar / docente123
echo.
echo  Para detenerlo, cierre las ventanas "Backend PHP" y "Frontend React".
pause
exit /b 0

:sinphp
echo ERROR: no se encontro PHP. Instale XAMPP.
goto :fin
:sinnode
echo ERROR: no se encontro Node.js / npm. Instalelo desde https://nodejs.org
goto :fin
:sinmysql
echo ERROR: MySQL no esta activo. Inicielo y vuelva a ejecutar este archivo.
goto :fin
:errordb
echo ERROR: no se pudo preparar la base de datos. Revise el mensaje anterior,
echo inicie MySQL desde el panel de XAMPP y vuelva a intentar.
goto :fin
:errornpm
echo ERROR: fallo npm install.
goto :fin
:errorweb
echo ERROR: React no respondio en el puerto 5173. Para ver el motivo, abra una
echo consola en la carpeta frontend y ejecute: npm run dev
goto :fin
:errorapi
echo ERROR: la API PHP no respondio en el puerto 8000. Cierre las ventanas
echo "Backend PHP" y "Frontend React" y vuelva a ejecutar este archivo.
:fin
pause
exit /b 1
