import cliente from './cliente';
import type { Grado, Seccion } from '../tipos';

export const listarGrados = async (params?: {
  buscar?: string;
  nivel?: string;
}): Promise<Grado[]> => {
  const { data } = await cliente.get('/grados', { params });
  return data;
};

export const crearGrado = async (payload: Partial<Grado>): Promise<Grado> => {
  const { data } = await cliente.post('/grados', payload);
  return data;
};

export const actualizarGrado = async (id: number, payload: Partial<Grado>): Promise<Grado> => {
  const { data } = await cliente.put(`/grados/${id}`, payload);
  return data;
};

export const eliminarGrado = async (id: number): Promise<void> => {
  await cliente.delete(`/grados/${id}`);
};

export const listarSecciones = async (gradoId?: number): Promise<Seccion[]> => {
  const { data } = await cliente.get('/secciones', {
    params: gradoId ? { grado_id: gradoId } : undefined,
  });
  return data;
};

export const crearSeccion = async (
  gradoId: number,
  payload: Partial<Seccion>
): Promise<Seccion> => {
  const { data } = await cliente.post(`/grados/${gradoId}/secciones`, payload);
  return data;
};

export const actualizarSeccion = async (
  id: number,
  payload: Partial<Seccion>
): Promise<Seccion> => {
  const { data } = await cliente.put(`/secciones/${id}`, payload);
  return data;
};

export const eliminarSeccion = async (id: number): Promise<void> => {
  await cliente.delete(`/secciones/${id}`);
};
