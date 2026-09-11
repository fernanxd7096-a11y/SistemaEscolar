@echo off
cd /d "%~dp0..\backend"
set "PATH=C:\xampp\php;C:\Program Files\nodejs;%PATH%"
title Sistema Escolar - API
php artisan serve --host=0.0.0.0 --port=8000
