import cliente from './cliente';
import type {
  AlcanceExcepcion,
  ConflictoHorario,
  DiaSemana,
  Horario,
  HorarioExcepcion,
  HorarioRegla,
  RespuestaAgenda,
  TipoExcepcion,
  TipoRegla,
} from '../tipos';

export const listarHorarios = async (params?: {
  seccion_id?: number;
  docente_id?: number;
  dia_semana?: string;
}): Promise<Horario[]> => {
  const { data } = await cliente.get('/horarios', { params });
  return data;
};

export const crearHorario = async (payload: {
  seccion_id: number;
  curso_id: number;
  docente_id?: number | null;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
  aula?: string | null;
  estado?: boolean;
}): Promise<Horario> => {
  const { data } = await cliente.post('/horarios', payload);
  return data;
};

export const actualizarHorario = async (
  id: number,
  payload: Partial<{
    seccion_id: number;
    curso_id: number;
    docente_id: number | null;
    dia_semana: string;
    hora_inicio: string;
    hora_fin: string;
    aula: string | null;
    estado: boolean;
  }>
): Promise<Horario> => {
  const { data } = await cliente.put(`/horarios/${id}`, payload);
  return data;
};

export const eliminarHorario = async (id: number): Promise<void> => {
  await cliente.delete(`/horarios/${id}`);
};

// --- Horario avanzado -------------------------------------------------------
// Las funciones de arriba siguen sirviendo a la plantilla semanal clásica
// (tabla `horarios`, usada también por la app web). Lo que va debajo consume el
// modelo nuevo: reglas recurrentes con rango de vigencia, excepciones puntuales
// (feriados, viajes, recuperaciones) y la agenda ya resuelta día por día.

export interface PayloadRegla {
  seccion_id: number;
  curso_id?: number | null;
  docente_id?: number | null;
  tipo?: TipoRegla;
  titulo?: string | null;
  dias_semana: DiaSemana[];
  hora_inicio: string;
  hora_fin: string;
  aula?: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  'año_escolar'?: string;
  observacion?: string | null;
  estado?: boolean;
  /** Guarda la regla aunque el backend detecte conflictos. */
  forzar?: boolean;
}

export const listarReglas = async (params?: {
  seccion_id?: number;
  docente_id?: number;
  curso_id?: number;
  tipo?: TipoRegla;
  vigente_en?: string;
  estado?: boolean;
}): Promise<HorarioRegla[]> => {
  const { data } = await cliente.get('/horarios/reglas', { params });
  return data;
};

export const obtenerRegla = async (id: number): Promise<HorarioRegla> => {
  const { data } = await cliente.get(`/horarios/reglas/${id}`);
  return data;
};

export const crearRegla = async (payload: PayloadRegla): Promise<HorarioRegla> => {
  const { data } = await cliente.post('/horarios/reglas', payload);
  return data;
};

export const actualizarRegla = async (
  id: number,
  payload: Partial<PayloadRegla>
): Promise<HorarioRegla> => {
  const { data } = await cliente.put(`/horarios/reglas/${id}`, payload);
  return data;
};

export const eliminarRegla = async (id: number): Promise<void> => {
  await cliente.delete(`/horarios/reglas/${id}`);
};

/** Comprobación previa de choques, sin guardar nada. */
export const verificarConflictosRegla = async (payload: {
  seccion_id: number;
  docente_id?: number | null;
  dias_semana: DiaSemana[];
  hora_inicio: string;
  hora_fin: string;
  fecha_inicio: string;
  fecha_fin: string;
  ignorar_regla_id?: number;
}): Promise<{ hay_conflictos: boolean; conflictos: ConflictoHorario[] }> => {
  const { data } = await cliente.post('/horarios/reglas/verificar', payload);
  return data;
};

export interface PayloadExcepcion {
  tipo: TipoExcepcion;
  alcance?: AlcanceExcepcion;
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
  cancela_clases?: boolean;
  estado?: boolean;
  forzar?: boolean;
}

export const listarExcepciones = async (params?: {
  seccion_id?: number;
  docente_id?: number;
  tipo?: TipoExcepcion;
  desde?: string;
  hasta?: string;
}): Promise<HorarioExcepcion[]> => {
  const { data } = await cliente.get('/horarios/excepciones', { params });
  return data;
};

export const crearExcepcion = async (payload: PayloadExcepcion): Promise<HorarioExcepcion> => {
  const { data } = await cliente.post('/horarios/excepciones', payload);
  return data;
};

export const actualizarExcepcion = async (
  id: number,
  payload: Partial<PayloadExcepcion>
): Promise<HorarioExcepcion> => {
  const { data } = await cliente.put(`/horarios/excepciones/${id}`, payload);
  return data;
};

export const eliminarExcepcion = async (id: number): Promise<void> => {
  await cliente.delete(`/horarios/excepciones/${id}`);
};

/** Agenda resuelta (reglas + excepciones aplicadas) de una sección o un docente. */
export const obtenerAgenda = async (params: {
  seccion_id?: number;
  docente_id?: number;
  desde?: string;
  hasta?: string;
}): Promise<RespuestaAgenda> => {
  const { data } = await cliente.get('/horarios/agenda', { params });
  return data;
};

/** Agenda del docente autenticado ("Mi horario"). */
export const obtenerMiAgenda = async (params?: {
  desde?: string;
  hasta?: string;
}): Promise<RespuestaAgenda> => {
  const { data } = await cliente.get('/horarios/mi-agenda', { params });
  return data;
};
