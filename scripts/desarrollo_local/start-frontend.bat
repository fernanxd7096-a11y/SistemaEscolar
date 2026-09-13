@echo off
cd /d "%~dp0..\..\frontend"
set "PATH=C:\xampp\php;C:\Program Files\nodejs;%PATH%"
title Sistema Escolar - Frontend
npm run dev -- --host 127.0.0.1 --port 5173
