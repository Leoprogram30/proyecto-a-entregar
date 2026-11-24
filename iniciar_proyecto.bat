@echo off
title IPEM 349 - Iniciar Sistema
echo ==============================================================================
echo  IPEM N^° 349 "Giovanni Bosco" - Colonia Caroya, Cordoba
echo  Iniciando Sistema de Gestion Curricular Agro y Ambiente
echo ==============================================================================
echo.

echo 1. Iniciando API Backend PHP en http://127.0.0.1:8000 ...
start "Backend PHP IPEM 349" /min cmd /c "php -S 127.0.0.1:8000 -t backend"
timeout /t 2 /nobreak >nul

echo 2. Iniciando Servidor Frontend React en http://localhost:5173 ...
cd frontend
start "Frontend Vite IPEM 349" /min cmd /c "npm run dev"
timeout /t 3 /nobreak >nul

echo 3. Abriendo la aplicacion en tu navegador predeterminado...
start http://localhost:5173

echo.
echo ==============================================================================
echo  El sistema ya esta corriendo:
echo   - URL Web:     http://localhost:5173
echo   - API Backend: http://127.0.0.1:8000/api/auth.php?action=all_users
echo.
echo  Credenciales de acceso rapido:
echo   * Administrador:    admin@ipem349.edu.ar        / admin123
echo   * Equipo Directivo: direccion@ipem349.edu.ar    / director123
echo   * Docente Titular:  docente.agro@ipem349.edu.ar / docente123
echo ==============================================================================
echo.
echo Presiona cualquier tecla para cerrar esta ventana informativa (los servidores seguiran activos).
pause >nul

