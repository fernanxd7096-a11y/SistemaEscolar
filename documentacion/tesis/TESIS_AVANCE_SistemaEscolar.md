# PROYECTO DE INNOVACIÓN Y/O MEJORA — CONTENIDO PARA TU TESIS

> **Instrucciones:** Copia cada sección en tu archivo `G1_MODELO202620.docx`, reemplazando el texto de ejemplo de Word y los datos de "Servicio Peralta S.A.C." Completa los campos marcados con `[COMPLETAR]`.

---

## PORTADA

**Título del proyecto:**
**"Desarrollo de un Sistema Web de Gestión Escolar Integral para la I.E.P. Milagroso San Judas Tadeo"**

**Autores:**
- [Tu nombre completo]
- [Nombre del compañero 2, si aplica]
- [Nombre del compañero 3, si aplica]

**Asesor:** Mg. Jose Armando Tiznado Ubillus  
**Institución:** CFP Luis Cáceres Graziani — Ingeniería de Software con Inteligencia Artificial  
**Lima — Perú, 2026**

---

## RESUMEN

La Institución Educativa Privada Milagroso San Judas Tadeo gestiona diariamente información académica y administrativa de alumnos, docentes y padres de familia mediante procesos manuales y registros dispersos en planillas y documentos físicos. Esta situación genera demoras en la atención, duplicidad de datos, dificultad para generar reportes y limitada comunicación con las familias.

El presente proyecto de innovación propone el desarrollo e implementación de un **Sistema Web de Gestión Escolar Integral**, compuesto por una API REST desarrollada con **Laravel 12** y una aplicación web con **React 19** y **TypeScript**. El sistema centraliza la administración del ciclo escolar: matrícula de alumnos, gestión de docentes, grados, secciones, cursos y horarios; registro de asistencia y notas por bimestre; comunicados institucionales; eventos escolares; padres de familia vinculados a alumnos; módulo de pagos con conceptos y comprobantes; reportes académicos exportables a PDF; y una API móvil para consulta de padres.

La solución implementa control de acceso basado en roles y permisos (administrador, director, secretario, docente, padre y alumno) mediante **Laravel Sanctum** y **Spatie Permission**, garantizando seguridad y trazabilidad de operaciones. Como resultado, se optimizan los procesos administrativos, se mejora la comunicación colegio–familia y se dispone de información confiable para la toma de decisiones académicas.

**Palabras clave:** gestión escolar, sistema de información, Laravel, React, API REST, roles y permisos, reportes PDF.

---

## INTRODUCCIÓN

La transformación digital en el sector educativo peruano exige que las instituciones escolares dispongan de herramientas tecnológicas que permitan administrar de forma eficiente el ciclo académico, la comunicación con padres de familia y el seguimiento del rendimiento estudiantil. En muchos colegios privados de pequeña y mediana escala, la gestión continúa apoyándose en registros manuales, hojas de cálculo independientes y archivos físicos, lo cual incrementa el riesgo de errores, retrasa la generación de reportes y dificulta el acceso oportuno a la información por parte de docentes y apoderados.

La **I.E.P. Milagroso San Judas Tadeo** requiere modernizar sus procesos administrativos y académicos para responder a las necesidades de una comunidad educativa que demanda agilidad, transparencia y canales digitales de comunicación. Ante esta necesidad, el presente proyecto plantea el diseño, desarrollo e implementación de un **Sistema Escolar SJT**: una plataforma web integral que unifica en un solo sistema el registro de alumnos, la planificación académica, el control de asistencia y calificaciones, la difusión de comunicados, la organización de eventos, el registro de pagos y la consulta de información por parte de padres de familia a través de una API orientada a dispositivos móviles.

El desarrollo se estructuró en fases incrementales: autenticación y roles; módulos académicos; cursos y horarios; asistencia; notas; comunicados; reportes; y extensiones recientes de eventos, padres, pagos y API móvil. Esta tesis documenta el diagnóstico de la situación actual, la propuesta tecnológica, la arquitectura implementada y los beneficios esperados para la institución.

---

# CAPÍTULO I — GENERALIDADES DE LA INSTITUCIÓN EDUCATIVA

## 1.1 Datos Generales de la Empresa / Institución

| Campo | Información |
|-------|-------------|
| **Razón Social** | [COMPLETAR — ej. I.E.P. Milagroso San Judas Tadeo S.A.C.] |
| **RUC** | [COMPLETAR — 11 dígitos] |
| **Empresario / Representante legal** | [COMPLETAR] |
| **Rubro** | Educación inicial, primaria y secundaria |
| **Distrito** | [COMPLETAR] |
| **Dirección** | [COMPLETAR] |
| **Teléfono / Correo** | [COMPLETAR] |
| **Año de fundación** | [COMPLETAR] |
| **Niveles educativos** | Inicial, Primaria y Secundaria |
| **Página web / Redes** | [COMPLETAR si aplica] |

**Figura 1 — Logo de la Institución Educativa**  
*Nota.* Insertar el logo institucional (disponible en `frontend/src/assets/logo.jpg` del proyecto).

---

## 1.2 Reseña Histórica de la Institución

La **Institución Educativa Privada Milagroso San Judas Tadeo** es un centro educativo orientado a la formación integral de niños y adolescentes en los niveles de Inicial, Primaria y Secundaria. [COMPLETAR con la historia real: año de fundación, hitos relevantes, crecimiento de matrícula, reconocimientos de MINEDU, etc.]

A lo largo de su trayectoria, la institución ha consolidado su identidad en torno a valores cristianos y a la excelencia académica, atendiendo a familias de la comunidad [COMPLETAR distrito/región]. Con el incremento de la matrícula y la diversificación de procesos administrativos — matrículas, pagos de pensiones, eventos escolares, entrega de notas y comunicados — surgió la necesidad de contar con un sistema informático que reemplace los procedimientos manuales y centralice la información institucional.

---

## 1.3 ¿Quiénes somos?

Somos una institución educativa privada comprometida con la formación académica, personal y espiritual de nuestros estudiantes. Nuestro equipo está conformado por directivos, personal administrativo, docentes calificados y familias que participan activamente en el proceso educativo. La I.E.P. Milagroso San Judas Tadeo busca brindar un ambiente seguro, ordenado y tecnológicamente actualizado que favorezca el aprendizaje y la comunicación transparente entre el colegio y los padres de familia.

---

## 1.4 Misión, Visión, Objetivos y Valores

### Misión
Formar estudiantes íntegros, competentes y con valores, mediante una educación de calidad en los niveles Inicial, Primaria y Secundaria, promoviendo el respeto, la responsabilidad y el compromiso con la comunidad. [Ajustar con la misión oficial de la institución si difiere.]

### Visión
Ser reconocidos como una institución educativa líder en [COMPLETAR región/distrito], caracterizada por la innovación pedagógica, el uso responsable de la tecnología y la estrecha vinculación con las familias, formando ciudadanos capaces de afrontar los retos del siglo XXI.

### Objetivos institucionales
1. Garantizar un aprendizaje significativo acorde al currículo nacional vigente.
2. Mantener una comunicación fluida y oportuna con padres de familia.
3. Optimizar la gestión administrativa y académica mediante procesos eficientes.
4. Fomentar el uso de herramientas digitales que apoyen la enseñanza y la administración escolar.

### Valores
- Respeto  
- Responsabilidad  
- Honestidad  
- Solidaridad  
- Excelencia académica  
[Completar con los valores oficiales del colegio]

---

## 1.5 Producto, Mercado y Cliente

### Producto / Servicio educativo
La institución ofrece el servicio educativo completo en tres niveles:
- **Educación Inicial**
- **Educación Primaria**
- **Educación Secundaria**

Adicionalmente, brinda servicios complementarios como talleres, eventos institucionales, actividades extracurriculares y comunicación permanente con apoderados.

### Mercado
El mercado objetivo está conformado por familias de la zona [COMPLETAR] que buscan educación privada con acompañamiento personalizado, valores cristianos y seguimiento académico cercano. La competencia incluye otras I.E.P. del distrito que ya incorporan plataformas digitales para comunicación y consulta de notas.

### Clientes / Usuarios del sistema
| Usuario | Necesidad principal |
|---------|---------------------|
| **Dirección** | Indicadores gerenciales, reportes consolidados |
| **Secretaría** | Matrículas, pagos, comunicados, padres de familia |
| **Docentes** | Registro de asistencia y notas, consulta de horarios |
| **Padres de familia** | Consulta de notas, asistencia, horarios y comunicados |
| **Alumnos** | Consulta de calificaciones, horarios y avisos |
| **Administrador TI** | Gestión de usuarios, roles y permisos |

---

## 1.6 Estructura de la Organización

**Figura 2 — Organigrama de la I.E.P. Milagroso San Judas Tadeo**

```
                    ┌─────────────────────┐
                    │     DIRECCIÓN       │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
┌────────▼────────┐  ┌─────────▼─────────┐  ┌───────▼────────┐
│   SECRETARÍA    │  │  COORDINACIÓN     │  │  ADMINISTRACIÓN │
│  (matrícula,    │  │  ACADÉMICA        │  │  Y FINANZAS    │
│   pagos, padres)│  │  (niveles/grado)  │  │                │
└────────┬────────┘  └─────────┬─────────┘  └────────────────┘
         │                     │
         │            ┌────────▼────────┐
         │            │    DOCENTES     │
         │            │  (por nivel y   │
         │            │   área curricular)│
         │            └─────────────────┘
         │
         └────── Comunidad: alumnos y padres de familia
```

*Nota.* Reemplazar con el organigrama oficial de la institución si está disponible.

---

## 1.7 Otra información relevante

- **Año escolar de referencia del sistema:** 2026  
- **Sistema de evaluación:** Escala vigesimal (0–20), organizada en **4 bimestres**  
- **Identificación de alumnos:** DNI de 8 dígitos (formato peruano)  
- **Estados de asistencia registrados:** presente, tardanza, falta, justificado  
- **Tipos de nota:** examen, práctica, tarea, participación  
- **Medios de pago registrados:** efectivo, transferencia, depósito  
- **Plataforma desarrollada:** Sistema Escolar SJT v1.0.0  
- **Empaquetado opcional:** aplicación de escritorio Windows mediante Electron

---

## 1.8 Planificación y Gestión de la Entrevista

### Objetivo de la entrevista
Identificar la problemática principal de la gestión escolar actual, sus causas, los procesos a automatizar y los beneficios esperados con la implementación del sistema informático.

### Datos de la entrevista
| Campo | Detalle |
|-------|---------|
| **Fecha y hora** | [COMPLETAR — ej. 15/10/2025] |
| **Entrevistado** | [COMPLETAR — ej. Director(a) o Secretaria General] |
| **Cargo** | [COMPLETAR] |
| **Entrevistadores** | [Nombres del grupo de tesis] |
| **Lugar** | I.E.P. Milagroso San Judas Tadeo |

### Preguntas realizadas y respuestas (modelo)

**1. ¿Cuáles son sus funciones principales en la institución?**  
*"Supervisar la gestión académica y administrativa del colegio, coordinar con secretaría la matrícula de alumnos, revisar reportes de asistencia y rendimiento académico, autorizar comunicados a padres de familia y validar el calendario de eventos institucionales."*

**2. ¿Cómo se registran actualmente los datos de alumnos, notas y asistencias?**  
*"La matrícula y datos personales se registran en planillas de Excel y fichas físicas. Los docentes anotan asistencia en cuadernos de control y luego secretaría vuelca la información a hojas de cálculo. Las notas se registran por bimestre en formatos independientes por sección, lo que dificulta consolidar reportes."*

**3. ¿Qué dificultades presenta el proceso actual?**  
*"Duplicidad de datos, demora en entregar boletas de notas, errores de transcripción, imposibilidad de que los padres consulten información en tiempo real, y mucho tiempo dedicado a buscar información en archivos dispersos."*

**4. ¿Por qué desea implementar un sistema de gestión escolar?**  
*"Para centralizar toda la información en una sola plataforma, agilizar el registro de asistencia y notas, generar reportes en PDF automáticamente, mejorar la comunicación con padres de familia y tener indicadores claros en un dashboard para la dirección."*

**5. ¿Qué módulos considera prioritarios?**  
*"Alumnos y matrícula, docentes, asistencia, notas, comunicados, reportes PDF y un módulo para que los padres puedan consultar información de sus hijos desde el celular."*

**6. ¿Qué roles de usuario necesita el sistema?**  
*"Administrador del sistema, director, secretaria, docente, padre de familia y, en una etapa posterior, el propio alumno para consultas."*

**7. ¿Qué impacto espera después de la implementación?**  
*"Reducción del tiempo administrativo, mayor transparencia con las familias, reportes confiables para evaluación bimestral y mejor organización de eventos y pagos escolares."*

---

# CAPÍTULO II — DIAGNÓSTICO Y FORMULACIÓN DEL PROBLEMA

## 2.1 Situación problemática

En la I.E.P. Milagroso San Judas Tadeo, la gestión de información académica y administrativa se realiza mediante procedimientos manuales y herramientas no integradas. Esto provoca:

1. **Duplicidad y inconsistencia de datos** entre fichas físicas, Excel y cuadernos de docentes.  
2. **Demora en la generación de boletas y consolidados** de notas y asistencia.  
3. **Comunicación tardía** con padres de familia sobre eventos, pagos y rendimiento académico.  
4. **Dificultad de control** sobre quién accede o modifica información sensible.  
5. **Ausencia de indicadores centralizados** para la toma de decisiones de la dirección.

## 2.2 Formulación del problema

¿De qué manera la implementación de un sistema web de gestión escolar integral, con control de roles y API móvil, puede optimizar los procesos académicos-administrativos y mejorar la comunicación entre la I.E.P. Milagroso San Judas Tadeo y las familias de los estudiantes?

## 2.3 Justificación

| Tipo | Justificación |
|------|---------------|
| **Técnica** | Uso de tecnologías actuales (Laravel 12, React 19, PostgreSQL) con arquitectura desacoplada API + SPA, escalable y mantenible. |
| **Económica** | Reducción de horas-hombre en tareas repetitivas de digitación y consolidación de reportes. |
| **Social** | Mejora la comunicación colegio–familia y el acceso oportuno a información académica. |
| **Académica** | Contribuye a la formación profesional en Ingeniería de Software con un proyecto real aplicado al sector educativo. |

---

# CAPÍTULO III — OBJETIVOS

## 3.1 Objetivo general

Desarrollar e implementar un sistema web de gestión escolar integral para la I.E.P. Milagroso San Judas Tadeo que centralice los procesos académicos, administrativos y de comunicación institucional, mejorando la eficiencia operativa y el acceso a la información por parte de los actores educativos.

## 3.2 Objetivos específicos

1. Analizar los procesos actuales de matrícula, asistencia, evaluación, comunicación y pagos en la institución educativa.  
2. Diseñar la arquitectura del sistema con base en una API REST y una interfaz web responsiva.  
3. Implementar módulos de gestión de alumnos, docentes, grados, secciones, cursos y horarios.  
4. Implementar registro masivo de asistencia y notas por bimestre, acorde al sistema educativo peruano.  
5. Desarrollar módulos de comunicados, eventos escolares, padres de familia y pagos con comprobantes.  
6. Generar reportes académicos (boleta de notas, consolidado de asistencia y consolidado de notas) exportables a PDF.  
7. Implementar control de acceso basado en roles y permisos para seis perfiles de usuario.  
8. Desarrollar una API móvil autenticada para consulta de información por padres de familia.  
9. Validar el funcionamiento del sistema mediante pruebas funcionales con usuarios de la institución.

---

# CAPÍTULO IV — ALCANCE Y LIMITACIONES DEL SISTEMA

## 4.1 Alcance funcional (lo implementado en el proyecto)

| Módulo | Funcionalidades |
|--------|-----------------|
| **Autenticación** | Login, logout, recuperación de contraseña, tokens Sanctum |
| **Dashboard** | KPIs y gráficos de resumen institucional |
| **Alumnos** | CRUD, matrícula a sección por año escolar |
| **Docentes** | CRUD completo |
| **Grados y secciones** | CRUD, tutor asignado por sección |
| **Cursos** | CRUD por grado con docente responsable |
| **Horarios** | CRUD por sección, curso, día y franja horaria |
| **Asistencia** | Registro masivo, consulta por sección/fecha, resumen |
| **Notas** | Registro masivo, libreta por alumno, escala 0–20 |
| **Comunicados** | CRUD con tipos y destinatarios |
| **Eventos** | CRUD con costo, cupo, fechas y estados |
| **Padres** | CRUD, vinculación/desvinculación con alumnos |
| **Pagos** | Conceptos de pago, registro de pagos, comprobantes |
| **Reportes** | Resumen, boleta, consolidados + exportación PDF |
| **API móvil** | Perfil padre, resumen/notas/asistencia/horario del hijo |
| **Administración** | Usuarios, roles y permisos (Spatie) |

## 4.2 Limitaciones

- El módulo de pagos tiene backend completo; la interfaz web (`ListaPagos`) aún debe integrarse al menú principal.  
- No existe portal web dedicado para padres/alumnos; la consulta familiar se orienta a la API móvil.  
- La configuración institucional se almacena parcialmente en el navegador (localStorage).  
- No incluye integración con SUNAT ni facturación electrónica.  
- No incluye módulo de biblioteca, transporte escolar ni aula virtual.

---

# CAPÍTULO V — MARCO TECNOLÓGICO Y ARQUITECTURA

## 5.1 Stack tecnológico

| Capa | Tecnología | Propósito |
|------|------------|-----------|
| Backend | PHP 8.2+, Laravel 12 | API REST, lógica de negocio |
| Autenticación | Laravel Sanctum | Tokens Bearer stateless |
| Autorización | Spatie Laravel Permission | Roles y permisos granulares |
| Auditoría | Spatie Activity Log | Trazabilidad de acciones |
| Frontend | React 19, TypeScript, Vite | SPA administrativa |
| Estilos | Tailwind CSS 3 | UI responsiva, modo oscuro |
| Base de datos | PostgreSQL 16 | Persistencia relacional |
| PDF | DomPDF + Blade | Reportes institucionales |
| Gráficos | Recharts | Dashboard analítico |
| Desktop (opcional) | Electron | Empaquetado Windows |

## 5.2 Arquitectura del sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                      │
│  React SPA (Web)  │  Electron (Escritorio)  │  App Móvil*  │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP/JSON + Bearer Token
┌────────────────────────────▼────────────────────────────────┐
│                    CAPA DE APLICACIÓN (API)                  │
│              Laravel 12 — Controladores REST                 │
│         Middleware: auth:sanctum + permission/role           │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    CAPA DE DATOS                             │
│         PostgreSQL — Modelos Eloquent + Migraciones          │
└─────────────────────────────────────────────────────────────┘
* App móvil futura consume API /movil
```

## 5.3 Roles y permisos

| Rol | Permisos principales |
|-----|---------------------|
| **Administrador** | Acceso total, gestión de usuarios y roles |
| **Director** | Consulta y gestión académica; sin eliminar registros críticos |
| **Secretario** | Alumnos, asistencia, comunicados, reportes |
| **Docente** | Registro de asistencia y notas; consulta de horarios |
| **Padre** | Consulta: notas, asistencias, comunicados (vía API móvil) |
| **Alumno** | Consulta: notas, asistencias, horarios, comunicados |

---

# CAPÍTULO VI — METODOLOGÍA DE DESARROLLO

Se aplicó una metodología **incremental por fases**, alineada con las etapas documentadas en el código fuente:

| Fase | Entregable |
|------|------------|
| Fase 1 | Autenticación, roles, dashboard, layout institucional |
| Fase 2 | Alumnos, docentes, grados y secciones |
| Fase 3 | Cursos y horarios |
| Fase 4 | Asistencia (registro masivo) |
| Fase 5 | Notas (registro masivo, libreta) |
| Fase 6 | Comunicados institucionales |
| Fase 7 | Reportes JSON y PDF |
| Extensión | Eventos, padres, pagos, API móvil |

**Actividades por ciclo:** levantamiento de requisitos → diseño de base de datos → implementación backend → implementación frontend → pruebas → validación con usuario.

---

# CAPÍTULO VII — RESULTADOS Y BENEFICIOS ESPERADOS

## 7.1 Resultados obtenidos

1. Sistema funcional desplegable en entorno local (`localhost:8000` API, `localhost:5173` UI).  
2. Base de datos relacional con más de 15 entidades interconectadas.  
3. Interfaz administrativa con 13+ módulos navegables.  
4. Generación automática de boletas y consolidados en PDF con membrete institucional.  
5. API móvil con 7 endpoints para consulta de padres de familia.  
6. Sistema de permisos con ~40 permisos granulares distribuidos en 6 roles.

## 7.2 Beneficios

| Beneficiario | Beneficio |
|--------------|-----------|
| **Secretaría** | Menos digitación manual; reportes en un clic |
| **Docentes** | Registro rápido de asistencia y notas por sección |
| **Dirección** | Dashboard con indicadores en tiempo real |
| **Padres** | Consulta oportuna del progreso de sus hijos |
| **Institución** | Imagen moderna; datos centralizados y seguros |

---

# CAPÍTULO VIII — CONCLUSIONES Y RECOMENDACIONES

## 8.1 Conclusiones

1. El desarrollo del Sistema Escolar SJT responde a la necesidad identificada en la I.E.P. Milagroso San Judas Tadeo de centralizar procesos académicos y administrativos.  
2. La arquitectura API REST + SPA demostró ser adecuada para separar responsabilidades y permitir futuras interfaces (web, móvil, escritorio).  
3. El control de acceso por roles garantiza que cada usuario interactúe solo con la información que le corresponde.  
4. Los módulos de reportes PDF y API móvil aportan valor directo a padres de familia y directivos.  
5. El proyecto evidencia la aplicación práctica de competencias de Ingeniería de Software con Inteligencia Artificial en un caso real del sector educativo peruano.

## 8.2 Recomendaciones

1. Integrar el módulo de **Pagos** al menú principal del frontend.  
2. Desarrollar la **aplicación móvil** (Flutter o React Native) que consuma la API `/movil`.  
3. Migrar la configuración institucional del localStorage a base de datos.  
4. Implementar **filtrado del menú lateral** según permisos del usuario autenticado.  
5. Desplegar el sistema en un **servidor en la nube** con respaldo automático de la base de datos.  
6. Capacitar al personal administrativo y docente en el uso del sistema antes del inicio del año escolar 2027.

---

# ANEXOS SUGERIDOS

| Anexo | Contenido |
|-------|-----------|
| A | Manual de usuario del sistema |
| B | Manual de instalación (README del proyecto) |
| C | Diagrama entidad-relación de la base de datos |
| D | Capturas de pantalla de cada módulo |
| E | Evidencias de pruebas funcionales |
| F | Código fuente (repositorio Git) |
| G | Acta o constancia de implementación firmada por la institución |

---

# CAPTURAS RECOMENDADAS PARA LA TESIS

Toma screenshots de estas pantallas del proyecto en ejecución:

1. Login institucional (`/login`)  
2. Dashboard con gráficos (`/dashboard`)  
3. Lista de alumnos con matrícula (`/alumnos`)  
4. Registro de asistencia masiva (`/asistencia`)  
5. Registro de notas (`/notas`)  
6. Comunicados (`/comunicados`)  
7. Eventos escolares (`/eventos`)  
8. Padres vinculados a alumnos (`/padres`)  
9. Reportes con descarga PDF (`/reportes`)  
10. Diagrama de roles en Postman o documentación API  

---

# PRÓXIMOS PASOS PARA TI

1. **Reemplaza** en Word todo el texto que dice *"El vídeo proporciona una manera eficaz..."* — es texto de plantilla de Microsoft.  
2. **Cambia** los datos de "Servicio Peralta S.A.C." por los de la I.E.P. Milagroso San Judas Tadeo.  
3. **Completa** los campos `[COMPLETAR]` con datos reales de tu colegio.  
4. **Inserta** capturas del sistema funcionando.  
5. **Agrega** los capítulos II–VIII si tu asesor los requiere (el modelo solo trae Capítulo I, pero un proyecto de esta envergadura los necesita).

---

*Documento generado en base al análisis del proyecto SistemaEscolar y la plantilla G1_MODELO202620.docx — Agosto 2026.*
