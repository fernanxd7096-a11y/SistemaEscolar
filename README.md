# Sistema Escolar — Milagroso San Judas Tadeo

API Laravel 12 + SPA React 19 para la gestión escolar integral.

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

## Módulos implementados

| Módulo | Estado |
|--------|--------|
| Auth (login, logout, recuperar contraseña) | ✅ |
| Dashboard con KPIs y gráficos | ✅ |
| Alumnos CRUD + matrícula | ✅ |
| Docentes CRUD | ✅ |
| Grados y Secciones | ✅ |
| Cursos CRUD | ✅ |
| Horarios (vista semanal) | ✅ |
| Asistencia masiva | ✅ |
| Notas masivas + libreta | ✅ |
| Comunicados | ✅ |
| Eventos escolares | ✅ |
| Padres de familia + vinculación | ✅ |
| Pagos + conceptos + comprobantes | ✅ |
| Reportes JSON + PDF | ✅ |
| API móvil para padres | ✅ |
| Roles y permisos (6 roles, 54 permisos) | ✅ |

## Stack

- **Backend:** Laravel 12, Sanctum, Spatie Permission, DomPDF
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Recharts
- **Desktop (opcional):** Electron + electron-builder

## Seeders

```bash
php artisan migrate:fresh --seed
```

Incluye: roles, admin, datos académicos, cursos, horarios, asistencia, notas, comunicados, padres, eventos y pagos de ejemplo.

## API móvil

Prefijo `/api/movil` — perfil padre, resumen/notas/asistencia/horario/pagos del hijo, comunicados.

## Empaquetado desktop

```bash
cd frontend
npm run electron:build
```
