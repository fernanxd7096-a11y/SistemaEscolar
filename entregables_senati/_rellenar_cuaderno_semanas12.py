# -*- coding: utf-8 -*-
"""
Rellena Cuaderno_Informe_01_Semana01.docx (semanas 1 y 2)
sin alterar el formato/estructura del documento SENATI.
Narrativa: inicio del desarrollo del SistemaEscolar.
"""
from __future__ import annotations

import copy
import shutil
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Cm, Pt
from docx.oxml import OxmlElement

SRC = Path(r"c:\Users\ferna\Downloads\Cuaderno_Informe_01_Semana01.docx")
OUT = Path(r"c:\Users\ferna\Desktop\SistemaEscolar\entregables_senati\Cuaderno_Informe_01_Semana01_RELLENO.docx")
DIAGRAM = Path(r"c:\Users\ferna\Desktop\SistemaEscolar\entregables_senati\03_Diagrama_Arquitectura_Inicial.png")

# --- Contenido (basado en BASE_MAESTRA / README / cronología del proyecto) ---

SEMANA1 = [
    (
        None,  # fecha ya está en LUNES/17/08/2026 (dos párrafos)
        "Análisis inicial del SistemaEscolar para la I.E.P. Milagroso San Judas Tadeo: revisión del problema de gestión manual y definición del alcance del sistema web integral.",
        "8",
    ),
    (
        "MARTES 18/08/2026",
        "Definición de módulos funcionales del sistema (auth, alumnos, docentes, grados/secciones, cursos, horarios, asistencia, notas, comunicados, eventos, padres, pagos y reportes).",
        "8",
    ),
    (
        "MIÉRCOLES 19/08/2026",
        "Diseño de la arquitectura API REST + SPA: backend Laravel (PHP) y frontend React + Vite, con autenticación por token (Laravel Sanctum).",
        "8",
    ),
    (
        "JUEVES 20/08/2026",
        "Preparación del entorno de desarrollo en Windows: instalación/verificación de PHP 8.2+, Composer, Node.js/npm, XAMPP, Visual Studio Code y Git.",
        "8",
    ),
    (
        "VIERNES 21/08/2026",
        "Configuración inicial del backend Laravel: dependencias Composer, archivo .env, generación de APP_KEY y arranque local con php artisan serve (puerto 8000).",
        "8",
    ),
    (
        "SÁBADO 22/08/2026",
        "Configuración inicial del frontend React 19 + TypeScript + Vite: instalación npm, estructura del SPA y verificación de arranque en localhost:5173.",
        "4",
    ),
]

SEMANA2 = [
    (
        "LUNES 24/08/2026",
        "Configuración de la base de datos del proyecto (PostgreSQL 16 según README; se revisó también SQLite en .env.example) y preparación de migraciones iniciales.",
        "8",
    ),
    (
        "MARTES 25/08/2026",
        "Implementación de la autenticación base con Laravel Sanctum (login/logout) y alineación de rutas /api/auth entre backend y frontend.",
        "8",
    ),
    (
        "MIÉRCOLES 26/08/2026",
        "Conexión frontend–API: almacenamiento del token Bearer, consumo de endpoints con Axios y acceso al dashboard tras el inicio de sesión.",
        "8",
    ),
    (
        "JUEVES 27/08/2026",
        "Desarrollo de las primeras funcionalidades académicas: CRUD de alumnos, docentes, grados y secciones, con sus endpoints y pantallas iniciales.",
        "8",
    ),
    (
        "VIERNES 28/08/2026",
        "Pruebas funcionales de autenticación y CRUD básicos; corrección de desalineaciones detectadas entre frontend y backend en el módulo de auth.",
        "8",
    ),
    (
        "SÁBADO 29/08/2026",
        "Documentación del arranque local (README) y consolidación del entorno para continuar el desarrollo de los módulos restantes del sistema.",
        "4",
    ),
]

TAREA = (
    "Configuración inicial de la arquitectura y del entorno de desarrollo del SistemaEscolar "
    "(API Laravel + SPA React/Vite), porque constituye el punto de partida para construir el sistema "
    "desde cero: sin entorno, base de datos y autenticación operativos no es posible avanzar en los "
    "módulos escolares. Respecto al PEA: en la documentación disponible no figuran números de "
    "operaciones/tareas del PEA identificados para esta actividad; por ello no se consignan códigos PEA."
)

PROCESO = [
    "1. Se analizó el contexto del colegio y el objetivo del SistemaEscolar (gestión escolar integral).",
    "2. Se definieron los módulos prioritarios a implementar (auth y módulos académicos base).",
    "3. Se diseñó la arquitectura: Frontend React/Vite ↔ API Laravel ↔ Base de datos.",
    "4. Se preparó el entorno local (PHP 8.2+, Composer, Node.js/npm, XAMPP, VS Code y Git).",
    "5. Se configuró el backend Laravel (.env, key, dependencias) y se verificó php artisan serve :8000.",
    "6. Se configuró el frontend React 19 + Vite y se verificó el arranque en localhost:5173.",
    "7. Se preparó la base de datos (PostgreSQL objetivo / revisión de SQLite en .env.example) y migraciones.",
    "8. Se implementó la autenticación con Laravel Sanctum y la conexión frontend–API con token Bearer.",
    "9. Se desarrollaron las primeras pantallas/CRUD de alumnos, docentes, grados y secciones.",
    "10. Se realizaron pruebas funcionales, se corrigieron desalineaciones de auth y se documentó el arranque.",
]

MAQUINAS = [
    "Laptop/PC personal (Windows) como estación de desarrollo.",
    "Visual Studio Code (editor), Git y GitHub (control de versiones del repositorio SistemaEscolar).",
    "XAMPP (intérprete PHP 8.2+), Composer, Node.js y npm.",
    "Backend: PHP 8.2+ y Laravel 12 (API REST + Sanctum). Frontend: React 19 + TypeScript + Vite.",
    "Base de datos: PostgreSQL 16 (según README). Nota: .env.example usa SQLite por defecto.",
    "Electron + electron-builder (opción de escritorio Windows, documentada en el proyecto).",
]

SEGURIDAD = (
    "Aplicación de pausas visuales y postura ergonómica en el puesto de trabajo frente al computador. "
    "Respaldo del código con Git antes de cambios relevantes. No se registraron procedimientos ATS "
    "específicos adicionales en la documentación del proyecto."
)

RESULTADOS = [
    "Se logró dejar operativa la base del SistemaEscolar: entorno local, API Laravel, SPA React/Vite, autenticación Sanctum y primeros módulos académicos.",
    "Quedó definida y funcional la arquitectura Frontend → API → Base de datos, permitiendo continuar el desarrollo del resto de módulos.",
    "Recomendación: unificar la configuración de base de datos (PostgreSQL vs SQLite) en la documentación del proyecto para evitar confusiones.",
    "Recomendación: mantener actualizado el README con requisitos (PHP, Node, Composer) y pasos de arranque del backend y frontend.",
]


def set_run_text(paragraph, text: str, keep_trailing_tabs: bool = True) -> None:
    """Reemplaza el texto del párrafo preservando el primer run (formato) y tabs finales."""
    runs = paragraph.runs
    if not runs:
        paragraph.add_run(text)
        return

    # Conservar tabs/espacios de corridas posteriores si existen
    trailing = ""
    if keep_trailing_tabs and len(runs) > 1:
        for r in runs[1:]:
            if r.text.strip() == "" and ("\t" in r.text or r.text == ""):
                trailing += r.text
            else:
                # Si hay contenido real en runs posteriores (títulos pegados), no conservar
                trailing = ""
                break

    runs[0].text = text
    for r in runs[1:]:
        r.text = ""
    if trailing:
        # restaurar tabs en el segundo run si existe
        if len(runs) > 1:
            runs[1].text = trailing
        else:
            paragraph.add_run(trailing)


def set_cell_text(cell, text: str, font_size_half_points: int | None = 22) -> None:
    """Escribe texto en la primera celda/párrafo, creando run si hace falta."""
    if not cell.paragraphs:
        cell.add_paragraph(text)
        return
    p = cell.paragraphs[0]
    if p.runs:
        p.runs[0].text = text
        for r in p.runs[1:]:
            r.text = ""
    else:
        run = p.add_run(text)
        run.font.size = Pt(11)

    # Limpiar párrafos extra vacíos dejando al menos uno
    for extra in cell.paragraphs[1:]:
        # no borrar si tiene contenido; vaciar
        for r in extra.runs:
            r.text = ""


def clear_drawings(paragraph) -> None:
    for drawing in list(paragraph._element.findall(".//" + qn("w:drawing"))):
        parent = drawing.getparent()
        if parent is not None:
            parent.remove(drawing)


def insert_picture_in_paragraph(paragraph, image_path: Path, width_cm: float = 15.5) -> None:
    clear_drawings(paragraph)
    # vaciar texto
    for r in paragraph.runs:
        r.text = ""
    run = paragraph.add_run()
    run.add_picture(str(image_path), width=Cm(width_cm))
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER


def fill_week_table(table, activities, is_week2: bool) -> None:
    total = 0
    for i, (dia, act, horas) in enumerate(activities, start=1):
        row = table.rows[i]
        if is_week2:
            set_cell_text(row.cells[0], dia)
        elif dia:
            # semana 1: algunos días tienen fecha en el mismo párrafo
            set_cell_text(row.cells[0], dia)
        # actividad
        set_cell_text(row.cells[1], act)
        # horas
        set_cell_text(row.cells[2], horas)
        total += int(horas)
    set_cell_text(table.rows[7].cells[2], str(total))


def restore_section_titles(doc: Document) -> None:
    """
    En el DOC fuente, títulos de Seguridad/Resultados quedaron pegados en párrafos de contenido.
    Se restauran títulos en sus párrafos lógicos y se separa el contenido.
    Estructura objetivo:
      P138 título Máquinas
      P139-P141 máquinas (3 líneas útiles; usaremos P139-P141 y parte de runs)
      Luego Seguridad título + contenido
      Luego Resultados título + contenido
    """
    # Identificar por texto de encabezados conocidos
    # Trabajaremos por índices estables del documento fuente inspeccionado.
    pass


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"No existe fuente: {SRC}")
    if not DIAGRAM.exists():
        raise SystemExit(f"No existe diagrama: {DIAGRAM}")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(SRC, OUT)
    doc = Document(str(OUT))

    # --- Registro semanal ---
    fill_week_table(doc.tables[2], SEMANA1, is_week2=False)
    # Asegurar fecha lunes semana 1 intacta (dos párrafos)
    lun = doc.tables[2].rows[1].cells[0]
    if len(lun.paragraphs) >= 2:
        if lun.paragraphs[0].runs:
            lun.paragraphs[0].runs[0].text = "LUNES"
        if lun.paragraphs[1].runs:
            lun.paragraphs[1].runs[0].text = "17/08/2026"
        else:
            lun.paragraphs[1].add_run("17/08/2026")

    fill_week_table(doc.tables[3], SEMANA2, is_week2=True)

    # --- Tarea significativa ---
    set_run_text(doc.paragraphs[125], TAREA + " ")

    # --- Descripción del proceso (P127-P136) ---
    for idx, texto in enumerate(PROCESO):
        p = doc.paragraphs[127 + idx]
        set_run_text(p, texto + " ")

    # --- Máquinas (P139-P141). P141 hoy mezcla máquinas + título Seguridad ---
    set_run_text(doc.paragraphs[139], MAQUINAS[0] + " ")
    set_run_text(doc.paragraphs[140], MAQUINAS[1] + " ")

    # Reconstruir P141: contenido máquinas restantes + título Seguridad como run separado
    p141 = doc.paragraphs[141]
    titulo_seg = "Seguridad e higiene industrial/ambiental (ATS, Charla de cinco minutos: SST/SGA)"
    maq_rest = " ".join(MAQUINAS[2:]) + " "
    if not p141.runs:
        p141.add_run(maq_rest)
        p141.add_run(titulo_seg)
    else:
        p141.runs[0].text = maq_rest
        if len(p141.runs) >= 2:
            p141.runs[1].text = titulo_seg
            for r in p141.runs[2:]:
                # conservar solo tabs
                r.text = "\t" if "\t" in r.text else ""
        else:
            p141.add_run(titulo_seg)

    # --- Seguridad + título Resultados en P142 ---
    p142 = doc.paragraphs[142]
    titulo_res = (
        "Resultados de la ejecución de la tarea/Recomendaciones "
        "(¿Se logró el objetivo que motivó la ejecución de la tarea? "
        "Qué recomendaciones sugiere para garantizar la operatividad del bien o servicio realizado"
    )
    if not p142.runs:
        p142.add_run(SEGURIDAD + " ")
        p142.add_run(titulo_res)
    else:
        p142.runs[0].text = SEGURIDAD + " "
        if len(p142.runs) >= 2:
            p142.runs[1].text = titulo_res
            for r in p142.runs[2:]:
                r.text = "\t" if "\t" in r.text else ""
        else:
            p142.add_run(titulo_res)

    # --- Resultados P143-P146 ---
    for i, texto in enumerate(RESULTADOS):
        set_run_text(doc.paragraphs[143 + i], texto + " ")

    # --- Diagrama en tabla 4 ---
    cell = doc.tables[4].rows[0].cells[0]
    # Título en P0; imagen en P1 (como en RELLENO previo)
    if len(cell.paragraphs) < 2:
        cell.add_paragraph("")
    # Asegurar título
    if cell.paragraphs[0].runs:
        cell.paragraphs[0].runs[0].text = "HACER ESQUEMA, DIBUJO O DIAGRAMA"
    insert_picture_in_paragraph(cell.paragraphs[1], DIAGRAM, width_cm=15.2)

    doc.save(str(OUT))
    print(f"OK -> {OUT}")
    print(f"size={OUT.stat().st_size}")


if __name__ == "__main__":
    main()
