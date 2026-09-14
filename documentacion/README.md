# Documentación y Entregables del Proyecto

> **Colegio Milagroso San Judas Tadeo**  
> **Proyecto:** Sistema de Gestión Escolar Integral (Web SPA, Desktop Electron, Móvil React Native, Backend Cloud API Laravel)  
> **Revisión y Evaluación:** Septiembre 2026

---

## 📁 Estructura de Documentación

Esta carpeta consolida todos los entregables académicos, informes de tesis, cuadernos de práctica y evidencias técnicas para facilitar la evaluación y revisión del proyecto:

`
documentacion/
├── README.md                      # Este índice general
├── tesis/                         # Documentos de tesis y avances del proyecto
├── senati/                        # Entregables oficiales para SENATI (FPE y Cuadernos)
├── boletas/                       # Muestras de boletas y reportes académicos generados en PDF
└── backups/                       # Copias de seguridad y esquemas de base de datos
`

---

## 📑 1. Tesis e Informes del Proyecto (/tesis)

Contiene la documentación formal del proyecto de titulación/grado y los informes de avance técnico:

| Documento | Formato | Descripción |
|---|---|---|
| [**TESIS_AVANCE_SistemaEscolar.docx**](./tesis/TESIS_AVANCE_SistemaEscolar.docx) | Word (.docx) | Documento principal de tesis: Carátula, Introducción, Planteamiento del Problema, Objetivos, Justificación, Marco Teórico, Requerimientos Funcionales/No Funcionales y Arquitectura. |
| [**TESIS_AVANCE_SistemaEscolar.md**](./tesis/TESIS_AVANCE_SistemaEscolar.md) | Markdown (.md) | Versión navegable e indexada en GitHub del avance de tesis para lectura rápida en navegador. |
| [**INFORME_AVANCES_SistemaEscolar.docx**](./tesis/INFORME_AVANCES_SistemaEscolar.docx) | Word (.docx) | Informe ejecutivo de avances del sistema para control de hitos y revisiones periódicas. |
| [**BASE_MAESTRA_SistemaEscolar.pdf**](./tesis/BASE_MAESTRA_SistemaEscolar.pdf) | PDF (.pdf) | Documento maestro con las especificaciones institucionales, estructura curricular y diseño del sistema. |
| Scripts de Generación | Python (.py) | Automatización de compilación y formateo de documentos (_generar_tesis_docx.py, _generar_informe_avances.py, _generar_base_maestra_pdf.py). |

---

## 🎓 2. Entregables Oficiales SENATI (/senati)

Documentación correspondiente al plan de formación práctica en empresa (FPE):

| Entregable | Archivo | Descripción |
|---|---|---|
| **Informe FPE** | [CNIU-108_INFORME_FPE_RELLENO.docx](./senati/CNIU-108_INFORME_FPE_RELLENO.docx) | Informe de Formación Práctica en Empresa según formato oficial SENATI CNIU-108. |
| **Cuaderno Semanal (DOCX)** | [Cuaderno_Informe_01_Semana01_RELLENO.docx](./senati/Cuaderno_Informe_01_Semana01_RELLENO.docx) | Cuaderno de informe semanal con actividades y tareas prácticas completadas. |
| **Cuaderno Semanal (PDF)** | [Cuaderno_Informe_01_Semana01_RELLENO.pdf](./senati/Cuaderno_Informe_01_Semana01_RELLENO.pdf) | Versión lista para impresión o firma digital del cuaderno de informe. |
| **Diagrama de Arranque** | [02_Diagrama_Arranque_SistemaEscolar.png](./senati/02_Diagrama_Arranque_SistemaEscolar.png) | Diagrama de flujo de inicio del sistema (Electron, Frontend y Cloud API). |
| **Diagrama de Arquitectura** | [03_Diagrama_Arquitectura_Inicial.png](./senati/03_Diagrama_Arquitectura_Inicial.png) | Diagrama técnico de capas: Cliente, Nube (Render), Base de Datos (PostgreSQL) y App Móvil. |

---

## 📄 3. Boletas y Reportes Académicos (/boletas)

Muestras de boletas de información e informes académicos oficiales emitidos por el motor de generación en backend (DomPDF + CSS institucional):

- [Informe_Academico_Garcia_Mendez_Lucia_2026.pdf](./boletas/Informe_Academico_Garcia_Mendez_Lucia_2026.pdf)
- [Informe_Academico_Castro_Rios_Valentina_2026.pdf](./boletas/Informe_Academico_Castro_Rios_Valentina_2026.pdf)
- [Informe_Academico_TEST.pdf](./boletas/Informe_Academico_TEST.pdf)

---

## 💾 4. Base de Datos y Respaldos (/backups)

- [**sistema_escolar_backup.sql**](./backups/sistema_escolar_backup.sql): Respaldo estructurado de la base de datos PostgreSQL con el esquema completo de tablas académicas, usuarios, roles, permisos y configuraciones.

---

*Repositorio mantenido para la sustentación y revisión del proyecto institucional San Judas Tadeo.*
