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
  foto?: string;
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
  estado_registro?: 'pendiente' | 'aprobado' | 'rechazado';
  motivo_rechazo?: string | null;
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

export interface Padre {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  relacion: 'padre' | 'madre' | 'tutor' | 'apoderado';
  telefono?: string | null;
  email?: string | null;
  usuario_id?: number | null;
  alumnos?: Alumno[];
}

export interface AsistenciaSemanal {
  fecha: string;
  presente: number;
  tardanza: number;
  falta: number;
  justificado: number;
}

export interface PromedioCurso {
  curso: string;
  promedio: number;
}

export interface AlumnoFaltas {
  nombres: string;
  apellidos: string;
  total_faltas: number;
}

export interface AsistenciaMensual {
  mes: string;
  porcentaje_asistencia: number;
  total: number;
}

export interface GraficosDashboard {
  asistencia_semanal: AsistenciaSemanal[];
  distribucion_asistencia: ResumenAsistencia;
  promedios_por_curso: PromedioCurso[];
  alumnos_mas_faltas: AlumnoFaltas[];
  comunicados_recientes: Comunicado[];
  asistencia_mensual: AsistenciaMensual[];
}

export interface Evento {
  id: number;
  titulo: string;
  descripcion?: string | null;
  tipo: 'institucional' | 'reunion' | 'celebracion' | 'escolar' | 'actividad';
  fecha_inicio: string;
  hora_inicio?: string | null;
  fecha_fin?: string | null;
  hora_fin?: string | null;
  lugar?: string | null;
  costo?: number | null;
  cupo_maximo?: number | null;
  estado: 'activo' | 'cancelado' | 'finalizado';
  creado_por?: number | null;
  creador?: { id: number; nombre: string; apellido: string } | null;
  created_at?: string;
}

export interface ConceptoPago {
  id: number;
  nombre: string;
  descripcion?: string | null;
  monto_base: number;
  año_escolar?: string | null;
  estado: boolean;
}

export interface Comprobante {
  id: number;
  pago_id: number;
  numero_comprobante: string;
  tipo: 'boleta' | 'recibo' | 'factura';
  archivo?: string | null;
  fecha_emision: string;
}

export interface Pago {
  id: number;
  alumno_id: number;
  concepto_pago_id: number;
  evento_id?: number | null;
  monto: number;
  fecha_pago: string;
  metodo_pago: 'efectivo' | 'transferencia' | 'deposito';
  referencia_pago?: string | null;
  observacion?: string | null;
  evidencia?: string | null;
  evidencia_url?: string | null;
  estado: 'pendiente' | 'pagado' | 'anulado';
  alumno?: { id: number; nombres: string; apellidos: string; dni: string };
  concepto_pago?: ConceptoPago;
  evento?: { id: number; titulo: string } | null;
  comprobante?: Comprobante | null;
  created_at?: string;
}

