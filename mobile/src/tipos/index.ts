export interface Rol {
  id: number;
  name: string;
  guard_name: string;
}

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  estado: boolean;
  /** Ruta relativa en el disco "public" del backend (p. ej. "perfiles/xyz.png"). */
  foto?: string | null;
  /** URL absoluta lista para usar en un <Image>; la calcula el backend (accessor). */
  foto_url?: string | null;
  roles: Rol[];
  permisos: string[];
}

export interface RespuestaAuth {
  usuario: Usuario;
  token: string;
}

export interface ResumenDashboard {
  total_alumnos: number;
  total_docentes: number;
  total_usuarios_activos: number;
  asistencia_hoy: number;
  fecha_actual: string;
  año_escolar_actual: string | number;
}

export interface Paginacion<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface Grado {
  id: number;
  nombre: string;
  nivel: 'inicial' | 'primaria' | 'secundaria';
  descripcion?: string | null;
  estado: boolean;
  secciones_count?: number;
  secciones?: Seccion[];
}

export interface Docente {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  especialidad?: string | null;
  titulo?: string | null;
  telefono?: string | null;
  email?: string | null;
  estado: boolean;
  secciones_tutor_count?: number;
}

export interface Seccion {
  id: number;
  grado_id: number;
  nombre: string;
  capacidad: number;
  docente_tutor_id?: number | null;
  estado: boolean;
  grado?: Grado;
  docente_tutor?: Docente | null;
  alumnos_count?: number;
}

export interface Alumno {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento?: string | null;
  genero?: 'M' | 'F' | 'O' | null;
  direccion?: string | null;
  telefono?: string | null;
  estado: boolean;
  secciones?: (Seccion & {
    pivot?: { año_escolar: string; estado: string };
  })[];
}

export interface Curso {
  id: number;
  nombre: string;
  descripcion?: string | null;
  grado_id: number;
  docente_id?: number | null;
  horas_semanales: number;
  estado: boolean;
  grado?: Grado;
  docente?: Docente | null;
}

export interface Horario {
  id: number;
  seccion_id: number;
  curso_id: number;
  docente_id?: number | null;
  dia_semana: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes';
  hora_inicio: string;
  hora_fin: string;
  aula?: string | null;
  estado: boolean;
  seccion?: Seccion & { grado?: Grado };
  curso?: Curso;
  docente?: Docente | null;
}

export interface Asistencia {
  id: number;
  alumno_id: number;
  seccion_id: number;
  fecha: string;
  estado: 'presente' | 'tardanza' | 'falta' | 'justificado';
  observacion?: string | null;
  registrado_por?: number | null;
  alumno?: Alumno;
  seccion?: Seccion;
}

export interface AlumnoAsistencia {
  alumno_id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  estado: 'presente' | 'tardanza' | 'falta' | 'justificado' | null;
  observacion: string | null;
  registrado: boolean;
}

export interface ResumenAsistencia {
  presente: number;
  tardanza: number;
  falta: number;
  justificado: number;
}

export interface Nota {
  id: number;
  alumno_id: number;
  curso_id: number;
  seccion_id: number;
  bimestre: number;
  tipo: 'examen' | 'practica' | 'tarea' | 'participacion';
  calificacion: number;
  peso: number;
  observacion?: string | null;
  alumno?: Alumno;
  curso?: Curso;
  seccion?: Seccion;
}

export interface AlumnoNota {
  alumno_id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  calificacion: number | null;
  observacion: string | null;
  registrado: boolean;
}

export interface Comunicado {
  id: number;
  titulo: string;
  contenido: string;
  tipo: 'general' | 'urgente' | 'informativo';
  destinatarios: 'todos' | 'padres' | 'docentes' | 'alumnos';
  publicado_por?: number | null;
  fecha_publicacion?: string | null;
  estado: boolean;
  autor?: { id: number; nombre: string; apellido: string } | null;
  created_at?: string;
}


// --- Horario avanzado -------------------------------------------------------
// El horario ya no es solo la plantilla semanal de la tabla `horarios`: el backend
// modela reglas recurrentes con rango de vigencia (horario_reglas) y excepciones
// puntuales (horario_excepciones), y expone la agenda ya resuelta día por día.

export type DiaSemana =
  | 'lunes'
  | 'martes'
  | 'miercoles'
  | 'jueves'
  | 'viernes'
  | 'sabado'
  | 'domingo';

export type TipoRegla = 'clase' | 'recuperacion' | 'extracurricular' | 'taller' | 'tutoria' | 'otro';

export type TipoExcepcion =
  | 'feriado'
  | 'suspension'
  | 'viaje'
  | 'recuperacion'
  | 'extracurricular'
  | 'cambio_horario'
  | 'otro';

export type AlcanceExcepcion = 'institucional' | 'seccion' | 'docente';

export interface HorarioRegla {
  id: number;
  horario_id?: number | null;
  seccion_id: number;
  curso_id?: number | null;
  docente_id?: number | null;
  tipo: TipoRegla;
  titulo?: string | null;
  dias_semana: DiaSemana[];
  hora_inicio: string;
  hora_fin: string;
  aula?: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  'año_escolar': string;
  observacion?: string | null;
  estado: boolean;
  seccion?: Seccion & { grado?: Grado };
  curso?: Curso | null;
  docente?: Docente | null;
}

export interface HorarioExcepcion {
  id: number;
  tipo: TipoExcepcion;
  alcance: AlcanceExcepcion;
  seccion_id?: number | null;
  docente_id?: number | null;
  curso_id?: number | null;
  regla_id?: number | null;
  evento_id?: number | null;
  titulo: string;
  descripcion?: string | null;
  fecha: string;
  fecha_fin?: string | null;
  hora_inicio?: string | null;
  hora_fin?: string | null;
  aula?: string | null;
  cancela_clases: boolean;
  estado: boolean;
  seccion?: (Seccion & { grado?: Grado }) | null;
  curso?: Curso | null;
  docente?: Docente | null;
}

/** Un bloque ya resuelto de la agenda: viene de una regla o de una excepción. */
export interface AgendaBloque {
  origen: 'regla' | 'excepcion';
  regla_id: number | null;
  excepcion_id: number | null;
  tipo: TipoRegla | TipoExcepcion;
  titulo: string;
  curso_id: number | null;
  curso: string | null;
  seccion_id: number | null;
  seccion: string | null;
  docente_id: number | null;
  docente: string | null;
  aula: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  cancelado: boolean;
  motivo_cancelacion: string | null;
}

export interface AgendaExcepcionResumen {
  id: number;
  tipo: TipoExcepcion;
  alcance: AlcanceExcepcion;
  titulo: string;
  descripcion: string | null;
  cancela_clases: boolean;
  todo_el_dia: boolean;
  hora_inicio: string | null;
  hora_fin: string | null;
  evento_id: number | null;
}

export interface AgendaDia {
  fecha: string;
  dia_semana: DiaSemana;
  etiqueta_dia: string;
  es_fin_semana: boolean;
  es_no_lectivo: boolean;
  motivo_no_lectivo: string | null;
  bloques: AgendaBloque[];
  excepciones: AgendaExcepcionResumen[];
}

export interface RespuestaAgenda {
  desde: string;
  hasta: string;
  seccion_id?: number | null;
  docente_id?: number | null;
  docente?: { id: number; nombres: string; apellidos: string } | null;
  dias: AgendaDia[];
}

/** Choque detectado por el backend al guardar una regla o una excepción. */
export interface ConflictoHorario {
  regla_id?: number;
  fecha?: string;
  motivo: 'seccion' | 'docente';
  dias?: string;
  detalle: string;
}

// --- Dashboard: KPIs y series para gráficos ---------------------------------

export interface AsistenciaDia {
  fecha: string;
  etiqueta?: string;
  presente: number;
  tardanza: number;
  falta: number;
  justificado: number;
  total: number;
  porcentaje: number;
}

export interface KpisDashboard {
  rol_vista: 'global' | 'docente';
  fecha_actual: string;
  'año_escolar_actual': string;
  totales?: {
    alumnos: number;
    alumnos_activos: number;
    docentes: number;
    docentes_activos: number;
    secciones: number;
    cursos: number;
    usuarios_activos: number;
  };
  asistencia_hoy?: AsistenciaDia;
  asistencia_semana?: AsistenciaDia[];
  alumnos_por_grado?: {
    grado_id: number;
    grado: string;
    nivel: string;
    seccion_id: number;
    seccion: string;
    etiqueta: string;
    total: number;
  }[];
  alumnos_por_nivel?: { nivel: string; etiqueta: string; total: number }[];
  eventos_proximos?: { id: number; titulo: string; tipo: string; fecha: string; lugar: string | null }[];
  pagos_del_mes?: { cantidad: number; monto: number } | null;
  docente?: {
    docente_id: number;
    nombre: string;
    total_secciones: number;
    total_cursos: number;
    clases_hoy: number;
    clases_canceladas_hoy: number;
    es_no_lectivo: boolean;
    bloques_hoy: AgendaBloque[];
  } | null;
}

// --- Pagos -------------------------------------------------------------------

export type MetodoPago = 'yape' | 'plin' | 'tarjeta' | 'efectivo';

export interface Pago {
  id: number;
  alumno_id: number;
  monto: number;
  /** Texto libre: el colegio cobra por conceptos variados (pensión, materiales,
   *  actividades...), así que no hay un catálogo cerrado. */
  concepto: string;
  fecha: string;
  metodo_pago: MetodoPago;
  referencia?: string | null;
  observacion?: string | null;
  registrado_por?: number | null;
  alumno?: Alumno;
  registrador?: { id: number; nombre: string; apellido: string } | null;
}

export interface ResumenMetodoPago {
  yape: { total: number; cantidad: number };
  plin: { total: number; cantidad: number };
  efectivo: { total: number; cantidad: number };
  tarjeta: { total: number; cantidad: number };
}
