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

## Infraestructura y Disponibilidad (Render Free Tier)

El backend de producción está desplegado en el servicio gratuito de **Render** (`https://sistema-escolar-sjt.onrender.com/api`). Los contenedores de la capa gratuita se suspenden automáticamente tras **15 minutos de inactividad**, requiriendo un arranque en frío (*cold start*) de **~50 segundos** en la siguiente petición.

Para evitar tiempos de espera a docentes, administrativos y padres, se implementó una estrategia **multi-capa de Keep-Alive**:

### 1. GitHub Actions Programado (`.github/workflows/keep_alive.yml`)
- Ejecuta automáticamente un ping HTTP cada **10 minutos** (`*/10 * * * *`).
- Verifica respuesta `HTTP 200` y registra tiempos de latencia y estado.
- Disparable manualmente desde la pestaña *Actions* de GitHub con *Run workflow*.

### 2. App de Escritorio (Electron)
- Al abrir la aplicación conectada a la nube, `frontend/electron/main.js` envía un ping preventivo de calentamiento inmediato.
- Mientras la aplicación permanezca abierta o minimizada en la bandeja del sistema, emite un pulso HTTP cada **10 minutos** manteniendo el servidor caliente durante la jornada escolar.

### 3. Script Independiente (`scripts/keep_alive.js`)
Para ejecutar un monitor ligero desde cualquier servidor o terminal local:
```bash
# Ping único
node scripts/keep_alive.js

# Monitoreo continuo en segundo plano (cada 10 min)
node scripts/keep_alive.js --daemon
```

### 4. Configuración de Monitoreo Externo Gratuito (UptimeRobot / Cron-job.org)
Para monitoreo 24/7 completamente autónomo que no dependa de minutos de GitHub Actions ni de máquinas locales:

#### Opción A: UptimeRobot (Recomendado - 5 minutos)
1. Registrarse gratis en [uptimerobot.com](https://uptimerobot.com).
2. Crear un nuevo monitor (**+ Add New Monitor**):
   - **Monitor Type:** `HTTP(s)`
   - **Friendly Name:** `San Judas Tadeo API Ping`
   - **URL (or IP):** `https://sistema-escolar-sjt.onrender.com/api/ping`
   - **Monitoring Interval:** `5 minutes` (o `10 minutes`)
   - **Monitor Timeout:** `30 seconds`
3. Guardar el monitor (**Create Monitor**). Listo: UptimeRobot mantendrá despierto el servidor y alertará por correo ante cualquier eventualidad.

#### Opción B: Cron-Job.org
1. Registrarse gratis en [cron-job.org](https://cron-job.org).
2. Ir a **Cronjobs** → **Create Cronjob**.
3. Configurar:
   - **Title:** `Keep-Alive SJT Render`
   - **URL:** `https://sistema-escolar-sjt.onrender.com/api/ping`
   - **Execution schedule:** `User-defined` → Cada `10 minutes`.
4. Guardar.

### 5. Endpoint de Verificación (`GET /api/ping`)
Responde de forma inmediata sin consultar la base de datos:
```json
{
  "estado": "ok",
  "sistema": "Milagroso San Judas Tadeo",
  "version": "2.0.0-produccion",
  "entorno": "production",
  "timestamp": "2026-09-14T05:25:00.000000Z"
}
```
Cabecera: `Cache-Control: no-cache, no-store, must-revalidate`.

