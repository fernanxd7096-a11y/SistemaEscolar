import cliente from './cliente';
import type { Alumno, Paginacion } from '../tipos';

export const listarAlumnos = async (params?: {
  buscar?: string;
  estado?: boolean;
  page?: number;
}): Promise<Paginacion<Alumno>> => {
  const { data } = await cliente.get('/alumnos', { params });
  return data;
};

export const obtenerAlumno = async (id: number): Promise<Alumno> => {
  const { data } = await cliente.get(`/alumnos/${id}`);
  return data;
};

export const crearAlumno = async (payload: Partial<Alumno> & {
  seccion_id?: number;
  año_escolar?: string;
}): Promise<Alumno> => {
  const { data } = await cliente.post('/alumnos', payload);
  return data;
};

export const actualizarAlumno = async (
  id: number,
  payload: Partial<Alumno> & { seccion_id?: number; año_escolar?: string }
): Promise<Alumno> => {
  const { data } = await cliente.put(`/alumnos/${id}`, payload);
  return data;
};

export const eliminarAlumno = async (id: number): Promise<void> => {
  await cliente.delete(`/alumnos/${id}`);
};
