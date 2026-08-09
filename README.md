# Sistema Escolar — Milagroso San Judas Tadeo

API Laravel + SPA React para la gestión escolar.

## Requisitos

- PHP 8.2+
- Composer
- Node.js 18+
- PostgreSQL 16 (base `sistema_escolar`)

## Arranque

### Backend

```bash
cd backend
composer install
cp .env.example .env   # si aún no tienes .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

API en `http://localhost:8000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

UI en `http://localhost:5173`

## Credenciales (seeder)

- Email: `admin@sanjudastadeo.edu.pe`
- Password: `Admin123!`

## Estado actual (Fase 1)

- Autenticación (login / logout / recuperar contraseña)
- Roles y permisos (Spatie)
- Dashboard base
- Layout institucional (sidebar, topbar, modo oscuro)

Fases siguientes: cursos, horarios, asistencia, notas, reportes.

## Fase 2 incluida

- CRUD Alumnos (con matrícula a sección)
- CRUD Docentes
- CRUD Grados y Secciones
- Seeder académico de ejemplo (`AcademicoSeeder`)

Tras actualizar el código:

```bash
cd backend
php artisan migrate --seed
```
