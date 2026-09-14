# -*- coding: utf-8 -*-
"""Genera BASE_MAESTRA_SistemaEscolar.pdf con la documentación maestra del proyecto."""

from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable, ListFlowable, ListItem,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

OUT = Path(r"c:\Users\ferna\Desktop\SistemaEscolar\BASE_MAESTRA_SistemaEscolar.pdf")
FONT_REG = r"C:\Windows\Fonts\arial.ttf"
FONT_BOLD = r"C:\Windows\Fonts\arialbd.ttf"

pdfmetrics.registerFont(TTFont("ArialES", FONT_REG))
pdfmetrics.registerFont(TTFont("ArialES-Bold", FONT_BOLD))

GUINDA = HexColor("#6B001A")
GUINDA_CLARO = HexColor("#8B1A2B")
DORADO = HexColor("#D4A017")
GRIS = HexColor("#444444")
GRIS_CLARO = HexColor("#F5F5F5")
BORDE = HexColor("#DDDDDD")


def estilos():
    base = getSampleStyleSheet()
    s = {}
    s["portada_titulo"] = ParagraphStyle(
        "portada_titulo", fontName="ArialES-Bold", fontSize=20, leading=26,
        textColor=GUINDA, alignment=TA_CENTER, spaceAfter=12,
    )
    s["portada_sub"] = ParagraphStyle(
        "portada_sub", fontName="ArialES", fontSize=12, leading=16,
        textColor=GRIS, alignment=TA_CENTER, spaceAfter=6,
    )
    s["h1"] = ParagraphStyle(
        "h1", fontName="ArialES-Bold", fontSize=14, leading=18,
        textColor=GUINDA, spaceBefore=16, spaceAfter=8,
    )
    s["h2"] = ParagraphStyle(
        "h2", fontName="ArialES-Bold", fontSize=12, leading=15,
        textColor=GUINDA_CLARO, spaceBefore=10, spaceAfter=5,
    )
    s["h3"] = ParagraphStyle(
        "h3", fontName="ArialES-Bold", fontSize=10.5, leading=13,
        textColor=black, spaceBefore=8, spaceAfter=4,
    )
    s["body"] = ParagraphStyle(
        "body", fontName="ArialES", fontSize=9, leading=12,
        textColor=black, alignment=TA_JUSTIFY, spaceAfter=4,
    )
    s["bullet"] = ParagraphStyle(
        "bullet", fontName="ArialES", fontSize=9, leading=12,
        textColor=black, leftIndent=12, spaceAfter=2,
    )
    s["nota"] = ParagraphStyle(
        "nota", fontName="ArialES", fontSize=8.5, leading=11,
        textColor=GRIS, alignment=TA_LEFT, spaceAfter=4,
    )
    s["celda"] = ParagraphStyle(
        "celda", fontName="ArialES", fontSize=7.5, leading=9.5, textColor=black,
    )
    s["celda_b"] = ParagraphStyle(
        "celda_b", fontName="ArialES-Bold", fontSize=7.5, leading=9.5, textColor=black,
    )
    s["footer"] = ParagraphStyle(
        "footer", fontName="ArialES", fontSize=8, textColor=GRIS, alignment=TA_CENTER,
    )
    s["mono"] = ParagraphStyle(
        "mono", fontName="ArialES", fontSize=7.5, leading=10,
        textColor=black, leftIndent=6, spaceAfter=2,
    )
    return s


def P(text, style):
    return Paragraph(str(text).replace("\n", "<br/>"), style)


def hr():
    return HRFlowable(width="100%", thickness=1, color=DORADO, spaceBefore=4, spaceAfter=8)


def tabla(headers, rows, col_widths, s):
    data = [[P(h, s["celda_b"]) for h in headers]]
    for row in rows:
        data.append([P(c, s["celda"]) for c in row])
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), GUINDA),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("BACKGROUND", (0, 1), (-1, -1), white),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, GRIS_CLARO]),
        ("GRID", (0, 0), (-1, -1), 0.4, BORDE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("BACKGROUND", (0, 0), (-1, 0), GUINDA),
    ]))
    # Force header text white via Paragraph color override isn't easy; paint bg is enough if we rebuild header
    header_row = []
    white_style = ParagraphStyle("celda_w", fontName="ArialES-Bold", fontSize=7.5, leading=9.5, textColor=white)
    for h in headers:
        header_row.append(Paragraph(h, white_style))
    data[0] = header_row
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), GUINDA),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, GRIS_CLARO]),
        ("GRID", (0, 0), (-1, -1), 0.4, BORDE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    return t


def add_header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(GUINDA)
    canvas.rect(0, A4[1] - 1.2 * cm, A4[0], 1.2 * cm, fill=1, stroke=0)
    canvas.setFillColor(white)
    canvas.setFont("ArialES", 8)
    canvas.drawString(1.5 * cm, A4[1] - 0.75 * cm, "BASE MAESTRA — SistemaEscolar | Milagroso San Judas Tadeo")
    canvas.setFillColor(DORADO)
    canvas.rect(0, 0, A4[0], 0.8 * cm, fill=1, stroke=0)
    canvas.setFillColor(white)
    canvas.setFont("ArialES", 8)
    canvas.drawCentredString(A4[0] / 2, 0.3 * cm, f"Página {doc.page}  |  Generado 05/09/2026  |  Solo evidencia de conversaciones y archivos")
    canvas.restoreState()


def build():
    s = estilos()
    story = []

    # PORTADA
    story.append(Spacer(1, 2.5 * cm))
    story.append(P("BASE DE INFORMACIÓN MAESTRA DEL PROYECTO", s["portada_titulo"]))
    story.append(hr())
    story.append(P("<b>SistemaEscolar</b>", s["portada_sub"]))
    story.append(P("I.E.P. Milagroso San Judas Tadeo", s["portada_sub"]))
    story.append(Spacer(1, 0.5 * cm))
    story.append(P("Documento para entregar contexto completo a otra IA o para tesis / SENATI", s["portada_sub"]))
    story.append(Spacer(1, 0.8 * cm))
    story.append(P("Fuentes: conversaciones Cursor (jul–sep 2026), archivos del repositorio, "
                   "implementation_plan.md, plan del 24-ago-2026, plantilla G1_MODELO202620.docx, "
                   "documentos de tesis e informe generados.", s["body"]))
    story.append(Spacer(1, 0.4 * cm))
    story.append(P("<b>Leyenda</b>", s["h3"]))
    story.append(P("✅ Confirmado por el usuario (lo pidió, aceptó o aportó explícitamente)", s["bullet"]))
    story.append(P("⚠️ Mencionado / visto en archivos o planes (puede haber cambiado)", s["bullet"]))
    story.append(P("❓ Falta información", s["bullet"]))
    story.append(P("💡 Propuesta / idea no confirmada como decisión final", s["bullet"]))
    story.append(Spacer(1, 0.5 * cm))
    story.append(P("<b>REGLA:</b> No se inventa información. Si hay contradicción, se muestran ambas versiones. "
                   "Si no hay dato: «No tengo información suficiente sobre esto.»", s["nota"]))
    story.append(PageBreak())

    # 1
    story.append(P("1. IDENTIDAD DEL PROYECTO", s["h1"]))
    story.append(hr())
    story.append(tabla(
        ["Campo", "Información", "Etiqueta"],
        [
            ["Nombre del proyecto / carpeta", "SistemaEscolar", "✅"],
            ["Nombre del sistema", "Variantes: Sistema Escolar SJT / Sistema Escolar San Judas Tadeo / Sistema Escolar — Milagroso San Judas Tadeo", "⚠️"],
            ["Tipo", "Sistema web de gestión escolar (API + SPA); desktop opcional con Electron", "⚠️"],
            ["Objetivo principal", "Gestión escolar integral del colegio", "⚠️"],
            ["Problema", "Procesos manuales / datos dispersos (texto de tesis generada)", "⚠️"],
            ["Público objetivo", "Dirección, secretaría, docentes, padres, alumnos, admin TI", "⚠️"],
            ["Institución", "I.E.P. / Colegio Milagroso San Judas Tadeo", "✅"],
            ["Estado", "Sistema funcional en local con muchos módulos; repo GitHub privado compartido", "✅/⚠️"],
            ["Versión", "1.0.0 (package.json + ping API)", "⚠️"],
            ["Ubicación", r"c:\Users\ferna\Desktop\SistemaEscolar", "✅"],
            ["GitHub", "https://github.com/fernanxd7096-a11y/SistemaEscolar (privado; colaborador MrSek18 / Kevin BG)", "✅"],
        ],
        [3.5 * cm, 11.5 * cm, 2 * cm],
        s,
    ))
    story.append(Spacer(1, 0.3 * cm))
    story.append(P("<b>Contradicción de nombres:</b> no hay un único nombre oficial confirmado por el usuario.", s["nota"]))

    # 2
    story.append(P("2. CONTEXTO Y PROBLEMA", s["h1"]))
    story.append(hr())
    story.append(P("<b>Cómo funciona actualmente el proceso</b>", s["h3"]))
    story.append(P("⚠️ En TESIS_AVANCE_SistemaEscolar.md se describe: matrícula/datos en Excel y fichas físicas; "
                   "asistencia en cuadernos; notas por bimestre en formatos separados.", s["body"]))
    story.append(P("❓ No tengo información suficiente de que eso sea una entrevista real del colegio "
                   "(hay campos [COMPLETAR] y respuestas modelo).", s["body"]))
    story.append(P("<b>Problemas detectados (tesis generada)</b>", s["h3"]))
    story.append(P("⚠️ Duplicidad de datos, demora en boletas, comunicación tardía con padres, "
                   "poco control de acceso, falta de indicadores centralizados.", s["body"]))
    story.append(P("<b>Por qué se decidió desarrollar</b>", s["h3"]))
    story.append(P("⚠️ Plan e tesis: modernizar gestión académica/administrativa. "
                   "❓ No hay justificación institucional firmada más allá de eso.", s["body"]))
    story.append(P("<b>Solución propuesta</b>", s["h3"]))
    story.append(P("⚠️ Sistema web integral: alumnos, docentes, grados/secciones, cursos, horarios, asistencia, "
                   "notas, comunicados, eventos, padres, pagos, reportes PDF, API móvil, roles/permisos.", s["body"]))

    # 3
    story.append(P("3. OBJETIVOS", s["h1"]))
    story.append(hr())
    story.append(P("<b>Objetivo general</b> (⚠️ tesis generada, no redactado independientemente por el usuario):", s["body"]))
    story.append(P("Desarrollar e implementar un sistema web de gestión escolar integral para la I.E.P. "
                   "Milagroso San Judas Tadeo que centralice procesos académicos, administrativos y de comunicación.", s["body"]))
    story.append(P("<b>Objetivos específicos</b> (⚠️ los 9 de TESIS_AVANCE…):", s["body"]))
    for i, o in enumerate([
        "Analizar procesos de matrícula, asistencia, evaluación, comunicación y pagos.",
        "Diseñar arquitectura API REST + interfaz web responsiva.",
        "Implementar alumnos, docentes, grados, secciones, cursos y horarios.",
        "Implementar asistencia y notas por bimestre (sistema peruano).",
        "Desarrollar comunicados, eventos, padres y pagos con comprobantes.",
        "Generar reportes académicos exportables a PDF.",
        "Implementar control de acceso con seis perfiles.",
        "Desarrollar API móvil autenticada para padres.",
        "Validar con pruebas funcionales.",
    ], 1):
        story.append(P(f"{i}. {o}", s["bullet"]))
    story.append(P("❓ No hay constancia de que el usuario los haya aprobado formalmente como objetivos definitivos.", s["nota"]))

    # 4
    story.append(P("4. FUNCIONALIDADES DEL SISTEMA", s["h1"]))
    story.append(hr())
    story.append(tabla(
        ["Nombre", "Descripción", "Quién", "Estado"],
        [
            ["Auth", "Login, logout, recuperar contraseña", "Todos", "✅/⚠️"],
            ["Dashboard", "KPIs y gráficos", "Admin/dirección", "⚠️"],
            ["Alumnos + matrícula", "CRUD; matricular a sección/año", "Secretaría/admin", "✅"],
            ["Docentes CRUD", "Gestión docentes", "Admin/dirección", "⚠️"],
            ["Registro docentes", "Registro público + aprobar/rechazar", "Docentes/admin", "⚠️"],
            ["Grados y secciones", "CRUD; tutor por sección", "Admin", "⚠️"],
            ["Cursos", "CRUD por grado + docente", "Admin", "⚠️"],
            ["Horarios", "Vista semanal; crear clases", "Admin/docente", "✅ bugs reportados"],
            ["Asistencia masiva", "Por sección/fecha", "Docente/secretaría", "⚠️"],
            ["Notas + libreta", "Por bimestre/tipos", "Docente", "⚠️"],
            ["Comunicados", "CRUD tipos/destinatarios", "Admin/secretaría", "⚠️"],
            ["Eventos", "CRUD costo/cupo/fechas", "Admin", "✅ pedido 24-ago"],
            ["Padres + vinculación", "CRUD; vincular/desvincular", "Secretaría", "✅"],
            ["Pagos + evidencias", "Conceptos, pagos, captura/foto", "Secretaría/padres", "✅"],
            ["Reportes PDF", "Boleta y consolidados", "Dirección/secretaría", "⚠️"],
            ["API móvil /api/movil", "Consulta padre (sin app UI)", "Padres", "⚠️"],
            ["Roles y permisos", "Spatie; 6 roles", "Admin", "⚠️"],
            ["Configuración", "/configuracion (parcial localStorage)", "Admin", "⚠️"],
            ["Electron", "App Windows opcional", "Uso local", "⚠️"],
            ["Excel Maatwebsite", "Previsto en plan; NO en composer.json", "—", "💡/❓"],
        ],
        [3.2 * cm, 6.5 * cm, 3.8 * cm, 3.5 * cm],
        s,
    ))

    # 5
    story.append(P("5. USUARIOS Y ROLES", s["h1"]))
    story.append(hr())
    story.append(P("Roles en seeder ⚠️: administrador, director, secretario, docente, padre, alumno.", s["body"]))
    story.append(tabla(
        ["Rol", "Puede hacer (seeder)", "Restricciones"],
        [
            ["Administrador", "Todos los permisos", "—"],
            ["Director", "Casi todo académico/admin", "Sin eliminar muchos recursos; sin CRUD completo roles"],
            ["Secretario", "Alumnos, asistencia, comunicados, eventos(ver), padres, pagos, reportes", "Sin muchos CRUD cursos/horarios/notas"],
            ["Docente", "Ver alumnos, horarios, asistencia, notas, comunicados, cursos, eventos", "Sin gestión pagos/padres/usuarios"],
            ["Padre", "Ver notas, asistencias, comunicados, eventos, pagos", "Solo consulta"],
            ["Alumno", "Ver notas, asistencias, horarios, comunicados, eventos", "Solo consulta"],
        ],
        [3 * cm, 8.5 * cm, 5.5 * cm],
        s,
    ))
    story.append(P("Credencial seeder ⚠️: admin@sanjudastadeo.edu.pe / Admin123!", s["body"]))
    story.append(P("<b>Contradicción permisos:</b> plan ~30; tesis ~40; README/RolesPermisosSeeder ≈ 54.", s["nota"]))

    # 6
    story.append(P("6. TECNOLOGÍAS", s["h1"]))
    story.append(hr())
    story.append(tabla(
        ["Tecnología", "Uso", "Etiqueta"],
        [
            ["PHP 8.2+", "Backend", "⚠️"],
            ["Laravel 12", "API REST (código/composer)", "⚠️"],
            ["Laravel Sanctum", "Tokens Bearer", "⚠️"],
            ["Spatie Permission / Activity Log", "Roles y auditoría", "⚠️"],
            ["DomPDF", "Reportes PDF", "⚠️"],
            ["PostgreSQL 16", "BD objetivo (plan/README)", "⚠️"],
            ["SQLite", "Default en .env.example", "⚠️ contradicción"],
            ["React 19 + TypeScript + Vite", "SPA", "⚠️"],
            ["Tailwind CSS 3", "Estilos", "⚠️"],
            ["Axios, TanStack Query, Zustand", "HTTP / estado / tema", "⚠️"],
            ["Recharts, Lucide, Toastify, RHF+Zod", "UI y formularios", "⚠️"],
            ["Electron + electron-builder", "Desktop Windows", "⚠️"],
            ["XAMPP PHP", "Path en launch.bat", "⚠️"],
            ["Git / GitHub", "Versionado", "✅"],
            ["React Native", "App móvil futura", "💡 no implementada"],
            ["Maatwebsite Excel", "Export Excel", "💡 no instalado"],
        ],
        [5 * cm, 8.5 * cm, 3.5 * cm],
        s,
    ))
    story.append(P("<b>Contradicción Laravel:</b> planes dicen Laravel 11; composer/README dicen Laravel 12.", s["nota"]))

    # 7
    story.append(P("7. ARQUITECTURA", s["h1"]))
    story.append(hr())
    story.append(P("Frontend React (localhost:5173) —Bearer Token→ Laravel API (localhost:8000/api)", s["body"]))
    story.append(P("Electron (opcional) empaqueta/lanza Vite + Laravel", s["body"]))
    story.append(P("API móvil: mismo backend, prefijo /api/movil", s["body"]))
    story.append(P("PostgreSQL (o sqlite según .env) ← Eloquent", s["body"]))
    story.append(P("Auth: Sanctum auth:sanctum + middleware permission:/role:", s["body"]))
    story.append(P("Integraciones externas (SUNAT, etc.): ❓ ninguna confirmada.", s["body"]))

    # 8
    story.append(P("8. BASE DE DATOS", s["h1"]))
    story.append(hr())
    story.append(P("Esquema desde migraciones (no hay ERD oficial del usuario). ⚠️", s["body"]))
    story.append(P("<b>Tablas:</b> usuarios; Spatie permissions/roles/pivots; personal_access_tokens; activity_log; "
                   "grados; docentes; secciones; alumnos; padres; alumno_padre; alumno_seccion; cursos; horarios; "
                   "asistencias; notas; comunicados; eventos; conceptos_pago; pagos; comprobantes; + cache/jobs/sessions.", s["body"]))
    story.append(P("<b>Campos relevantes:</b> grados nivel inicial|primaria|secundaria; asistencia presente|tardanza|falta|justificado; "
                   "notas bimestre + tipo examen|practica|tarea|participacion; horarios unique (seccion_id, dia_semana, hora_inicio); "
                   "pagos método efectivo|transferencia|deposito + evidencia; docentes estado_registro pendiente|aprobado|rechazado.", s["body"]))
    story.append(P("<b>Posible problema:</b> evidencia en migración 2026_08_23 y otra vez en 2026_08_25 → riesgo de columna duplicada.", s["nota"]))
    story.append(P("Backup: sistema_escolar_backup.sql (subido a GitHub a pedido del usuario). ⚠️", s["body"]))
    story.append(P("❓ Diagrama ER completo oficial: No tengo información suficiente.", s["body"]))

    # 9
    story.append(P("9. INTERFAZ Y DISEÑO", s["h1"]))
    story.append(hr())
    story.append(P("Menú Sidebar ⚠️: Dashboard, Alumnos, Docentes, Padres, Grados, Cursos, Horarios, Asistencia, "
                   "Notas, Comunicados, Eventos, Pagos, Reportes, Configuración.", s["body"]))
    story.append(P("Paleta guinda + dorado (primario ~#8B1A2B / #6B001A / #4A0012; acento #D4A017). "
                   "💡 Plan proponía #800020. ❓ Hex oficial no confirmado.", s["body"]))
    story.append(P("Logo: ✅ pedido por el usuario → frontend/src/assets/logo.png", s["body"]))
    story.append(P("Dark mode (Zustand); fuente Inter; Sidebar «UGEL 05 — S.J.L.» ⚠️ en código (❓ no confirmado en chat).", s["body"]))
    story.append(P("Responsive: sidebar colapsable + overlay mobile. Login con gradiente institucional + logo.", s["body"]))

    # 10
    story.append(P("10. PROCESOS DEL SISTEMA", s["h1"]))
    story.append(hr())
    procesos = [
        ("Login ✅", "Usuario → /login → POST /api/auth/login → token localStorage → Bearer → /dashboard."),
        ("Matrícula ⚠️", "Alumnos → crear/editar → matricular → POST alumnos/{id}/matricular → alumno_seccion."),
        ("Asistencia ⚠️", "Asistencia → sección+fecha → POST asistencias/masivo."),
        ("Notas ⚠️", "Notas → sección/curso/bimestre → POST notas/masivo → libreta GET notas/libreta/{alumno}."),
        ("Horarios ✅ (errores)", "Horarios → nueva clase → validación/conflicto → POST horarios."),
        ("Padres/pagos/evidencias ✅", "Vinculación → pagos → subir evidencia foto/captura."),
        ("Reportes PDF ⚠️", "Reportes → endpoints .../pdf → Blade DomPDF."),
        ("API móvil ⚠️", "/api/movil/... → datos hijo/comunicados. ❓ App móvil UI: No tengo información suficiente."),
        ("Arranque desktop ⚠️", "Abrir Sistema Escolar.bat / scripts/launch.bat → Electron + Vite + Laravel."),
    ]
    for titulo, desc in procesos:
        story.append(P(f"<b>{titulo}</b>", s["h3"]))
        story.append(P(desc, s["body"]))

    # 11
    story.append(P("11. REQUERIMIENTOS", s["h1"]))
    story.append(hr())
    story.append(P("<b>Funcionales:</b> no hay SRS firmado. Lo más cercano es el plan + módulos. "
                   "⚠️ RF interpretables: auth, CRUD académicos, asistencia, notas, comunicados, eventos, padres, pagos, PDF, roles, API móvil.", s["body"]))
    story.append(P("<b>No funcionales:</b> ⚠️ escalabilidad API desacoplada; UI responsiva; Sanctum. "
                   "❓ RNF medibles: No tengo información suficiente.", s["body"]))

    # 12
    story.append(P("12. PROYECTO Y DESARROLLO", s["h1"]))
    story.append(hr())
    story.append(P("<b>Evolución observada</b>", s["h3"]))
    for line in [
        "Jul 22, 2026: análisis; plan ~30–35%; Fase 1 auth; Fase 2 académicos; problemas pdo_pgsql.",
        "Ago 9: GitHub fernanxd7096-a11y; invitación MrSek18.",
        "Ago 19: revisión .bat / Electron.",
        "Ago 24: tesis SENATI + informe; plan guinda/horarios/eventos/pagos; logo; bugs horarios.",
        "Ago 25: .bat no abre; Padres/Pagos; concepto/captura; error login.",
        "Sep 2: migración estado_registro docentes.",
        "Sep 4: push completo; repo privado solo Kevin BG.",
        "Sep 5: solicitud de base maestra.",
    ]:
        story.append(P("• " + line, s["bullet"]))

    story.append(P("<b>Errores y soluciones</b>", s["h3"]))
    story.append(tabla(
        ["Problema", "Solución / estado"],
        [
            ["Auth frontend/backend desalineados", "Realineados a /auth/..."],
            ["Doble hash password", "Corregido"],
            ["extension=pgsql pegado en PowerShell", "Debía editarse php.ini"],
            ["Password PostgreSQL", "Usuario indicó: 123"],
            ["Horarios: solo 15 cursos/docentes", "Plan: cargar todos / all=true"],
            ["validation.date_format al crear clase", "Bug reportado por el usuario"],
            ["Conflicto «Ya existe una clase…»", "Bug reportado por el usuario"],
            ["Evidencia/concepto no en UI pagos", "Pedido de corrección"],
            ["Login fallaba (25 ago)", "Reportado; causa final ❓"],
            [".bat no abría", "Revisado varias veces"],
        ],
        [8 * cm, 9 * cm],
        s,
    ))

    # 13
    story.append(P("13. ARCHIVOS Y DOCUMENTACIÓN", s["h1"]))
    story.append(hr())
    story.append(tabla(
        ["Archivo / ruta", "Contenido"],
        [
            ["README.md", "Arranque, módulos, stack, credenciales"],
            ["TESIS_AVANCE_SistemaEscolar.md/.docx", "Contenido tesis"],
            ["INFORME_AVANCES_SistemaEscolar.docx", "Informe de avances"],
            ["_generar_tesis_docx.py / _generar_informe_avances.py", "Generadores Word"],
            ["sistema_escolar_backup.sql", "Backup BD"],
            ["backend/ / frontend/", "API Laravel + SPA React/Electron"],
            ["scripts/*.bat", "Arranque"],
            ["frontend/src/assets/logo.png", "Logo"],
            ["backend/resources/views/pdf/*.blade.php", "Plantillas PDF"],
            ["Boletas/...pdf", "Ejemplo boleta (subido a GH)"],
            [r"Downloads\implementation_plan.md", "Plan original"],
            [r"Downloads\G1_MODELO202620.docx", "Plantilla SENATI"],
            ["Escritorio: Abrir Sistema Escolar.bat", "Launcher mencionado"],
        ],
        [7.5 * cm, 9.5 * cm],
        s,
    ))

    # 14
    story.append(P("14. DECISIONES IMPORTANTES", s["h1"]))
    story.append(hr())
    decisiones = [
        "Jul 2026 — Seguir plan de implementación del colegio. ✅",
        "Jul 22 — Priorizar Fase 1 («cualquiera») y Fase 2 («va»). ✅",
        "Jul 22 — PostgreSQL con contraseña 123. ✅",
        "Ago 9 — Publicar en GitHub fernanxd7096-a11y/SistemaEscolar. ✅",
        "Ago 9 — Compartir con MrSek18. ✅",
        "Ago 24 — Alinear tesis SENATI al proyecto real. ✅",
        "Ago 24 — Ejecutar plan guinda/horarios/eventos/padres/pagos. ✅",
        "Ago 24 — Usar logo enviado. ✅",
        "Ago 25 — Evidencias foto/captura en pagos. ✅",
        "Sep 4 — Subir todo; repo privado solo Kevin BG. ✅",
    ]
    for d in decisiones:
        story.append(P("• " + d, s["bullet"]))

    # 15
    story.append(P("15. INFORMACIÓN PARA INFORME DE FORMACIÓN PRÁCTICA SENATI", s["h1"]))
    story.append(hr())
    story.append(P("<b>Lo que sí hay (parcial):</b>", s["h3"]))
    story.append(P("⚠️ CFP Luis Cáceres Graziani — Ingeniería de Software con Inteligencia Artificial (plantilla).", s["bullet"]))
    story.append(P("⚠️ Asesor citado: Mg. Jose Armando Tiznado Ubillus (de plantilla; ❓ si es el real).", s["bullet"]))
    story.append(P("Actividades observables: auth, módulos académicos, horarios, asistencia, notas, comunicados, "
                   "eventos, padres, pagos/evidencias, reportes PDF, API móvil, Electron, GitHub, docs tesis/informe.", s["bullet"]))
    story.append(P("Seguridad aplicable: roles/permisos, Sanctum, no subir .env, repo privado. ⚠️", s["bullet"]))
    story.append(P("<b>Lo que falta:</b>", s["h3"]))
    for f in [
        "❓ Nombre completo, código SENATI, fechas exactas de práctica",
        "❓ Empresa/centro de práctica",
        "❓ Actividades diarias/semanales firmadas",
        "❓ SST específicas",
        "❓ Resultados cuantificados",
        "❓ Supervisor de empresa",
    ]:
        story.append(P(f, s["bullet"]))
    story.append(P("No se inventa SST ni bitácora: No tengo información suficiente más allá del trabajo técnico en Cursor.", s["nota"]))

    # 16
    story.append(P("16. CRONOLOGÍA", s["h1"]))
    story.append(hr())
    story.append(tabla(
        ["Fecha", "Actividad", "Resultado"],
        [
            ["2026-07-22", "Análisis + plan", "Diagnóstico incompleto (~30–35%)"],
            ["2026-07-22", "Fase 1 + Fase 2", "Auth alineado; académicos en código; bloqueo pgsql"],
            ["2026-07-22", "Password BD 123", "Configuración local"],
            ["2026-08-09", "Push GitHub + MrSek18", "Repo online"],
            ["2026-08-19", "Revisar .bat", "Contexto Electron/launcher"],
            ["2026-08-24", "Tesis + informe Word", "Docs generados"],
            ["2026-08-24", "Plan eventos/pagos/guinda", "Cierre de fases"],
            ["2026-08-24", "Logo institucional", "Integrado en UI"],
            ["2026-08-24/25", "Bugs horarios y pagos", "Correcciones pedidas"],
            ["2026-08-25", ".bat / login", "Problemas de arranque y credenciales"],
            ["2026-09-02", "estado_registro docentes", "Nueva funcionalidad BD"],
            ["2026-09-04", "GitHub privado Kevin BG", "Repo privado compartido"],
            ["2026-09-05", "Base maestra", "Este documento"],
        ],
        [3 * cm, 6 * cm, 8 * cm],
        s,
    ))

    # 17
    story.append(P("17. ESTADO ACTUAL", s["h1"]))
    story.append(hr())
    story.append(P("<b>Terminado / presente en código ⚠️:</b> módulos README; rutas con /pagos; Electron; docs; GitHub privado.", s["body"]))
    story.append(P("<b>Frágil:</b> arranque .bat/Electron; login falló en intentos; UX pagos/evidencias tuvo fallos.", s["body"]))
    story.append(P("<b>Pendiente:</b> app móvil real; filtrar menú por permisos; config en BD; despliegue nube; capacitación. "
                   "Contradicción: tesis decía Pagos fuera del menú; Sidebar actual ya tiene Pagos.", s["body"]))
    story.append(P("<b>Abiertos ❓:</b> login post 25-ago; launcher; migración duplicada evidencia; contradicciones documentales.", s["body"]))

    # 18
    story.append(P("18. INFORMACIÓN FALTANTE", s["h1"]))
    story.append(hr())
    for i, item in enumerate([
        "Nombre completo, DNI, código SENATI, ciclo, fechas de práctica",
        "Datos reales del colegio (RUC, dirección, distrito, representante, fundación)",
        "Confirmación: ¿Laravel 12 es el stack oficial?",
        "Confirmación BD actual (pgsql vs sqlite) y usuario/BD reales",
        "Hex oficial de color institucional",
        "Si «UGEL 05 — S.J.L.» es correcto",
        "Objetivos de tesis/práctica aprobados por asesor",
        "Entrevista real (fecha, entrevistado, respuestas)",
        "Estado actual de bugs (horarios, pagos, login, .bat)",
        "Qué falta priorizar (móvil, despliegue, usuarios reales…)",
        "Compañeros de tesis / autores",
        "Contenido SST / bitácora de formación práctica",
        "Si Excel export y React Native siguen en alcance",
        "Credenciales de prueba no-admin",
        "Servidor de producción (si existe)",
    ], 1):
        story.append(P(f"{i}. {item}", s["bullet"]))

    # 19
    story.append(P("19. RESUMEN EJECUTIVO", s["h1"]))
    story.append(hr())
    story.append(P(
        "<b>SistemaEscolar</b> es un monorepo en el escritorio del usuario para la <b>I.E.P. Milagroso San Judas Tadeo</b>: "
        "backend <b>Laravel 12</b> (API REST + Sanctum + Spatie) y frontend <b>React 19 + TypeScript + Vite + Tailwind</b>, "
        "con opción <b>Electron</b> para Windows. El objetivo es centralizar matrícula, docentes, estructura académica, "
        "horarios, asistencia, notas, comunicados, eventos, padres, pagos y reportes PDF, más una <b>API móvil</b> "
        "para consultas de padres.",
        s["body"],
    ))
    story.append(P(
        "El desarrollo se hizo por fases (auth → académicos → cursos/horarios → asistencia → notas → comunicados → "
        "reportes → extensiones eventos/padres/pagos/móvil). Hay seeders, backup SQL, documentación de tesis SENATI "
        "e informe de avances. El código vive en GitHub privado fernanxd7096-a11y/SistemaEscolar, compartido con "
        "<b>Kevin BG (MrSek18)</b>.",
        s["body"],
    ))
    story.append(P(
        "No todo lo de la documentación está validado por el usuario: varios textos de tesis/objetivos/problema fueron "
        "generados a partir del código y la plantilla. Hay contradicciones (Laravel 11 vs 12; 30/40/54 permisos; "
        "sqlite vs PostgreSQL; pagos «fuera del menú» vs menú actual). Quedan abiertos datos institucionales, "
        "informe de formación práctica con SST, y confirmación del estado final de bugs de login, horarios y pagos.",
        s["body"],
    ))

    # 20
    story.append(P("20. CONTEXTO MAESTRO DEL PROYECTO PARA OTRA IA", s["h1"]))
    story.append(hr())
    story.append(P("Bloque compacto para pegar a otra IA (sin eliminar información crítica):", s["nota"]))

    bloque = """
PROYECTO: SistemaEscolar
RUTA LOCAL: c:\\Users\\ferna\\Desktop\\SistemaEscolar
GITHUB: https://github.com/fernanxd7096-a11y/SistemaEscolar (privado)
DUEÑO GH: fernanxd7096-a11y | COLABORADOR: MrSek18 (Kevin BG), push
INSTITUCIÓN: I.E.P. / Colegio Milagroso San Judas Tadeo (Perú)
NOMBRES (variantes): Sistema Escolar SJT / San Judas Tadeo / Milagroso San Judas Tadeo
VERSIÓN: 1.0.0

STACK EN CÓDIGO: PHP 8.2+, Laravel 12, Sanctum, Spatie Permission + Activitylog, DomPDF |
React 19, TypeScript, Vite, Tailwind 3, Axios, TanStack Query, Zustand, RRD, Recharts, RHF+Zod |
Electron + electron-builder (Windows). API: http://localhost:8000/api | UI: http://localhost:5173
BD OBJETIVO: PostgreSQL 16, database sistema_escolar | .env.example: sqlite ← CONTRADICCIÓN
Password PostgreSQL mencionada por el usuario: 123
Admin seeder: admin@sanjudastadeo.edu.pe / Admin123!
CONTRADICCIÓN: planes = Laravel 11; composer/README = Laravel 12.

ROLES: administrador, director, secretario, docente, padre, alumno (~54 permisos). Docs también dicen ~30/~40.

MÓDULOS UI: /login, /recuperar-password, /dashboard, /alumnos, /docentes, /padres, /grados, /cursos,
/horarios, /asistencia, /notas, /comunicados, /eventos, /pagos, /reportes, /configuracion
+ registro público docentes + aprobación.

TABLAS: usuarios, grados, docentes(+estado_registro), secciones, alumnos, padres, alumno_padre,
alumno_seccion, cursos, horarios, asistencias, notas, comunicados, eventos, conceptos_pago,
pagos(+evidencia), comprobantes, Spatie, tokens, activity_log.
CUIDADO: evidencia en 2026_08_23 Y 2026_08_25.

DISEÑO: guinda+dorado; logo frontend/src/assets/logo.png; dark mode; Sidebar «UGEL 05 — S.J.L.» (no confirmado verbalmente).
SCRIPTS: scripts/launch.bat (C:\\xampp\\php + electron:dev). Fallos .bat y login reportados 25-ago-2026.

DOCS: README, TESIS_AVANCE_*, INFORME_AVANCES_*, backup SQL, implementation_plan.md, G1_MODELO202620.docx
(SENATI CFP Luis Cáceres Graziani; asesor citado Mg. Jose Armando Tiznado Ubillus — verificar).

PEDIDOS EXPLÍCITOS DEL USUARIO: analizar/completar plan; GitHub + MrSek18/Kevin BG privado; tesis e informe;
fix horarios; logo; evidencias pagos; arreglar .bat/login; NO inventar datos.

NO CONOCIDO / NO INVENTAR: nombre real del estudiante, RUC/dirección colegio, entrevista real,
objetivos oficiales firmados, SST/bitácora, estado 100% bugs, producción, app móvil UI.

REGLA: Distinguir ✅ usuario vs ⚠️ código/docs vs ❓ faltante. Ante contradicciones, mostrar ambas y preguntar.
Responder en español si el usuario lo pide.
""".strip()

    for line in bloque.split("\n"):
        story.append(P(line if line.strip() else "&nbsp;", s["mono"]))

    story.append(Spacer(1, 0.6 * cm))
    story.append(hr())
    story.append(P(
        "<b>Nota de fidelidad:</b> Esta base no inventa datos institucionales ni SST. Lo más confirmado por el usuario: "
        "colegio, ruta del proyecto, uso del plan, GitHub/MrSek18/Kevin BG, password BD 123, logo, trabajo en "
        "horarios/pagos/evidencias, .bat, tesis/informe SENATI, y el pedido de documentación maestra. El resto proviene "
        "de código, README, planes y documentos generados, y puede haber cambiado.",
        s["nota"],
    ))

    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=A4,
        leftMargin=1.5 * cm,
        rightMargin=1.5 * cm,
        topMargin=1.8 * cm,
        bottomMargin=1.4 * cm,
        title="Base Maestra — SistemaEscolar",
        author="SistemaEscolar / Cursor",
    )
    doc.build(story, onFirstPage=add_header_footer, onLaterPages=add_header_footer)
    print(f"PDF generado: {OUT}")


if __name__ == "__main__":
    build()
