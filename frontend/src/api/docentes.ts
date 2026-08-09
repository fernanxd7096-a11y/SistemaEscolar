import cliente from './cliente';
import type { Docente, Paginacion } from '../tipos';

export const listarDocentes = async (params?: {
  buscar?: string;
  estado?: boolean;
  page?: number;
}): Promise<Paginacion<Docente>> => {
  const { data } = await cliente.get('/docentes', { params });
  return data;
};

export const crearDocente = async (payload: Partial<Docente>): Promise<Docente> => {
  const { data } = await cliente.post('/docentes', payload);
  return data;
};

export const actualizarDocente = async (id: number, payload: Partial<Docente>): Promise<Docente> => {
  const { data } = await cliente.put(`/docentes/${id}`, payload);
  return data;
};

export const eliminarDocente = async (id: number): Promise<void> => {
  await cliente.delete(`/docentes/${id}`);
};
