@echo off
cd /d "%~dp0..\backend"
set "PATH=C:\xampp\php;C:\Program Files\nodejs;%PATH%"
title Sistema Escolar - API
php artisan serve --host=127.0.0.1 --port=8000
