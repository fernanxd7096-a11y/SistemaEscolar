import cliente from './cliente';
import type { AlumnoAsistencia, ResumenAsistencia } from '../tipos';

export const obtenerAsistenciaSeccionFecha = async (params: {
  seccion_id: number;
  fecha: string;
}): Promise<{ seccion_id: number; fecha: string; alumnos: AlumnoAsistencia[] }> => {
  const { data } = await cliente.get('/asistencias/seccion-fecha', { params });
  return data;
};

export const registrarAsistenciaMasiva = async (payload: {
  seccion_id: number;
  fecha: string;
  asistencias: {
    alumno_id: number;
    estado: string;
    observacion?: string | null;
  }[];
}): Promise<{ mensaje: string; total: number }> => {
  const { data } = await cliente.post('/asistencias/masivo', payload);
  return data;
};

export const obtenerResumenAsistencia = async (params: {
  seccion_id: number;
  fecha_desde?: string;
  fecha_hasta?: string;
}): Promise<ResumenAsistencia> => {
  const { data } = await cliente.get('/asistencias/resumen', { params });
  return data;
};

export const eliminarAsistencia = async (id: number): Promise<void> => {
  await cliente.delete(`/asistencias/${id}`);
};
