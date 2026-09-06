# -*- coding: utf-8 -*-
"""Genera diagrama de arquitectura inicial del SistemaEscolar para el Cuaderno."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(r"c:\Users\ferna\Desktop\SistemaEscolar\entregables_senati\03_Diagrama_Arquitectura_Inicial.png")

W, H = 1100, 1450
img = Image.new("RGB", (W, H), "#FFFFFF")
draw = ImageDraw.Draw(img)

try:
    font_title = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 28)
    font_sub = ImageFont.truetype(r"C:\Windows\Fonts\arial.ttf", 16)
    font_box = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 18)
    font_small = ImageFont.truetype(r"C:\Windows\Fonts\arial.ttf", 14)
    font_tiny = ImageFont.truetype(r"C:\Windows\Fonts\arial.ttf", 13)
except OSError:
    font_title = font_sub = font_box = font_small = font_tiny = ImageFont.load_default()

GUINDA = "#6B001A"
DORADO = "#D4A017"
AZUL = "#1F4E79"
VERDE = "#2E7D32"
NARANJA = "#E65100"
MORADO = "#5E35B1"
GRIS = "#37474F"
CAJA = "#F7F7F7"
BORDE = "#90A4AE"


def center_text(y, text, font, fill):
    bbox = draw.textbbox((0, 0), text, font=font)
    x = (W - (bbox[2] - bbox[0])) // 2
    draw.text((x, y), text, font=font, fill=fill)


def box(y, h, title, lines, color):
    x0, x1 = 120, W - 120
    draw.rounded_rectangle([x0, y, x1, y + h], radius=14, fill=CAJA, outline=color, width=3)
    draw.rectangle([x0, y, x0 + 12, y + h], fill=color)
    draw.text((x0 + 28, y + 14), title, font=font_box, fill=color)
    ty = y + 44
    for line in lines:
        draw.text((x0 + 28, ty), line, font=font_small, fill=GRIS)
        ty += 22
    return y + h


def arrow(y0, y1):
    cx = W // 2
    draw.line([(cx, y0 + 4), (cx, y1 - 4)], fill=DORADO, width=4)
    draw.polygon([(cx - 10, y1 - 14), (cx + 10, y1 - 14), (cx, y1)], fill=DORADO)


# Header
draw.rectangle([0, 0, W, 90], fill=GUINDA)
center_text(18, "Arquitectura inicial del SistemaEscolar", font_title, "#FFFFFF")
center_text(54, "I.E.P. Milagroso San Judas Tadeo  |  Arranque del desarrollo", font_sub, "#FFECB3")

y = 120
y = box(y, 90, "1. Usuario (roles del sistema)", [
    "Administrador, director, secretario, docente, padre o alumno",
    "Accede desde navegador (SPA) o app de escritorio opcional (Electron)",
], AZUL)

arrow(y, y + 36)
y += 36
y = box(y, 100, "2. Frontend — React 19 + Vite + TypeScript", [
    "Interfaz web en localhost:5173 (npm run dev)",
    "Tailwind CSS, Axios / TanStack Query",
    "Envía peticiones HTTP con token Bearer",
], NARANJA)

arrow(y, y + 36)
y += 36
y = box(y, 110, "3. API Backend — Laravel 12 (PHP 8.2+)", [
    "Servidor local: php artisan serve → localhost:8000/api",
    "Autenticación con Laravel Sanctum",
    "Roles y permisos (Spatie Permission)",
    "Lógica de módulos académicos y administrativos",
], VERDE)

arrow(y, y + 36)
y += 36
y = box(y, 110, "4. Base de datos", [
    "PostgreSQL 16 (configuración objetivo del proyecto)",
    "SQLite aparece como default en .env.example (contradicción documentada)",
    "Migraciones Eloquent: usuarios, grados, alumnos, docentes, etc.",
], MORADO)

arrow(y, y + 36)
y += 36
y = box(y, 100, "5. Respuesta al usuario", [
    "JSON desde la API → actualización de la SPA",
    "Login, dashboard y primeros CRUD académicos",
    "Base lista para continuar el desarrollo de módulos",
], GUINDA)

# Proceso de desarrollo
y += 40
draw.line([(80, y), (W - 80, y)], fill=DORADO, width=2)
y += 18
center_text(y, "Proceso de las dos primeras semanas", font_box, GUINDA)
y += 40

steps = [
    ("Análisis", AZUL),
    ("Diseño", NARANJA),
    ("Configuración", VERDE),
    ("Desarrollo", MORADO),
    ("Integración", "#00838F"),
    ("Pruebas", GUINDA),
]
bw = 140
gap = 18
total_w = len(steps) * bw + (len(steps) - 1) * gap
sx = (W - total_w) // 2
for i, (label, color) in enumerate(steps):
    x = sx + i * (bw + gap)
    draw.rounded_rectangle([x, y, x + bw, y + 48], radius=10, fill=color, outline=color)
    bbox = draw.textbbox((0, 0), label, font=font_small)
    tw = bbox[2] - bbox[0]
    draw.text((x + (bw - tw) // 2, y + 14), label, font=font_small, fill="#FFFFFF")
    if i < len(steps) - 1:
        ax = x + bw
        draw.line([(ax + 2, y + 24), (ax + gap - 2, y + 24)], fill=DORADO, width=3)
        draw.polygon([(ax + gap - 2, y + 24), (ax + gap - 12, y + 18), (ax + gap - 12, y + 30)], fill=DORADO)

y += 70
draw.rounded_rectangle([80, y, W - 80, y + 120], radius=12, fill="#FFF8E1", outline=DORADO, width=2)
draw.text((100, y + 16), "Leyenda de la tarea significativa", font=font_box, fill=GUINDA)
draw.text((100, y + 48), "• Objetivo: dejar operativa la base del sistema (entorno + API + SPA + auth).", font=font_tiny, fill=GRIS)
draw.text((100, y + 70), "• Herramientas: VS Code, Git/GitHub, XAMPP (PHP), Node.js/npm, Laravel, React/Vite.", font=font_tiny, fill=GRIS)
draw.text((100, y + 92), "• Resultado: arquitectura inicial lista para desarrollar los módulos escolares.", font=font_tiny, fill=GRIS)

img.save(OUT, "PNG")
print(f"Saved {OUT} ({OUT.stat().st_size} bytes)")
