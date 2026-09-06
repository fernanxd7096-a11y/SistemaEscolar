import cliente from './cliente';
import type { Evento, Paginacion } from '../tipos';

export const listarEventos = async (params?: {
  buscar?: string;
  tipo?: string;
  estado?: string;
  page?: number;
}): Promise<Paginacion<Evento>> => {
  const { data } = await cliente.get('/eventos', { params });
  return data;
};

export const listarEventosProximos = async (dias?: number): Promise<Evento[]> => {
  const { data } = await cliente.get('/eventos/proximos', { params: dias ? { dias } : undefined });
  return data;
};

export const crearEvento = async (payload: {
  titulo: string;
  descripcion?: string | null;
  tipo: string;
  lugar?: string | null;
  fecha: string;
  hora?: string | null;
  estado?: string;
  visible?: boolean;
}): Promise<Evento> => {
  const { data } = await cliente.post('/eventos', payload);
  return data;
};

export const actualizarEvento = async (
  id: number,
  payload: Partial<{
    titulo: string;
    descripcion: string | null;
    tipo: string;
    lugar: string | null;
    fecha: string;
    hora: string | null;
    estado: string;
    visible: boolean;
  }>
): Promise<Evento> => {
  const { data } = await cliente.put(`/eventos/${id}`, payload);
  return data;
};

export const eliminarEvento = async (id: number): Promise<void> => {
  await cliente.delete(`/eventos/${id}`);
};
