import cliente from './cliente';
import type { Padre, Paginacion } from '../tipos';

export const listarPadres = async (params?: { buscar?: string; page?: number }) => {
  const { data } = await cliente.get<Paginacion<Padre>>('/padres', { params });
  return data;
};

export const crearPadre = async (datos: Omit<Padre, 'id' | 'alumnos'>) => {
  const { data } = await cliente.post<Padre>('/padres', datos);
  return data;
};

export const obtenerPadre = async (id: number) => {
  const { data } = await cliente.get<Padre>(`/padres/${id}`);
  return data;
};

export const actualizarPadre = async (id: number, datos: Partial<Padre>) => {
  const { data } = await cliente.put<Padre>(`/padres/${id}`, datos);
  return data;
};

export const eliminarPadre = async (id: number) => {
  await cliente.delete(`/padres/${id}`);
};

export const vincularAlumno = async (padreId: number, alumnoId: number) => {
  const { data } = await cliente.post(`/padres/${padreId}/vincular`, { alumno_id: alumnoId });
  return data;
};

export const desvincularAlumno = async (padreId: number, alumnoId: number) => {
  await cliente.delete(`/padres/${padreId}/desvincular/${alumnoId}`);
};
