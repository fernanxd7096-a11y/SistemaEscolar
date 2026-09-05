import cliente from './cliente';
import type { Evento, Paginacion } from '../tipos';

export const listarEventos = async (params?: {
  buscar?: string;
  tipo?: string;
  estado?: string;
  desde?: string;
  hasta?: string;
  page?: number;
}): Promise<Paginacion<Evento>> => {
  const { data } = await cliente.get('/eventos', { params });
  return data;
};

export const crearEvento = async (payload: {
  titulo: string;
  descripcion?: string | null;
  tipo: string;
  fecha_inicio: string;
  hora_inicio?: string | null;
  fecha_fin?: string | null;
  hora_fin?: string | null;
  lugar?: string | null;
  costo?: number | null;
  cupo_maximo?: number | null;
  estado?: string;
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
    fecha_inicio: string;
    hora_inicio: string | null;
    fecha_fin: string | null;
    hora_fin: string | null;
    lugar: string | null;
    costo: number | null;
    cupo_maximo: number | null;
    estado: string;
  }>
): Promise<Evento> => {
  const { data } = await cliente.put(`/eventos/${id}`, payload);
  return data;
};

export const eliminarEvento = async (id: number): Promise<void> => {
  await cliente.delete(`/eventos/${id}`);
};
