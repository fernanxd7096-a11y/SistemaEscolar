@echo off
chcp 65001 >nul
title Sistema Escolar - San Judas Tadeo

echo ===============================================================
echo   COLEGIO MILAGROSO SAN JUDAS TADEO - SISTEMA ESCOLAR
echo   Conectado al servidor en la nube (Render PostgreSQL)
echo ===============================================================
echo.
echo Iniciando aplicacion de escritorio, por favor espere...
echo.

:: Asegurar que NodeJS este en el PATH del sistema
if exist "C:\Program Files\nodejs" set "PATH=C:\Program Files\nodejs;%PATH%"

cd /d "%~dp0frontend"

:: Instalar dependencias si es la primera ejecucion
if not exist "node_modules\" (
    echo [1/2] Instalando dependencias de la aplicacion...
    call npm install
)

:: Compilar la aplicacion para produccion si no existe dist
if not exist "dist\index.html" (
    echo [2/2] Compilando modulos del sistema...
    call npx vite build
)

:: Iniciar la aplicacion de escritorio conectada a la nube
start "" npx cross-env NODE_ENV=production electron .

exit /b 0
