import cliente from './cliente';
import type { Horario } from '../tipos';

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
