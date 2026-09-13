@echo off
chcp 65001 >nul
set "PROJECT_DIR=%~dp0..\.."
set "PATH=C:\xampp\php;C:\Program Files\nodejs;%PATH%"

:: Matar procesos previos en puertos 8000 y 5173
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

:: Instalar dependencias si es necesario
if not exist "%PROJECT_DIR%\frontend\node_modules\" (
    pushd "%PROJECT_DIR%\frontend"
    call npm install
    popd
)

:: Ejecutar Electron en modo desarrollo
:: electron:dev inicia Vite + espera + abre Electron
:: Electron main.js inicia Laravel automáticamente
pushd "%PROJECT_DIR%\frontend"
call npm run electron:dev
popd

exit /b 0
