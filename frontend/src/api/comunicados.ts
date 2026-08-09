import cliente from './cliente';
import type { Comunicado, Paginacion } from '../tipos';

export const listarComunicados = async (params?: {
  buscar?: string;
  tipo?: string;
  destinatarios?: string;
  page?: number;
}): Promise<Paginacion<Comunicado>> => {
  const { data } = await cliente.get('/comunicados', { params });
  return data;
};

export const crearComunicado = async (payload: {
  titulo: string;
  contenido: string;
  tipo: string;
  destinatarios: string;
  fecha_publicacion?: string | null;
  estado?: boolean;
}): Promise<Comunicado> => {
  const { data } = await cliente.post('/comunicados', payload);
  return data;
};

export const actualizarComunicado = async (
  id: number,
  payload: Partial<{
    titulo: string;
    contenido: string;
    tipo: string;
    destinatarios: string;
    fecha_publicacion: string | null;
    estado: boolean;
  }>
): Promise<Comunicado> => {
  const { data } = await cliente.put(`/comunicados/${id}`, payload);
  return data;
};

export const eliminarComunicado = async (id: number): Promise<void> => {
  await cliente.delete(`/comunicados/${id}`);
};
