import cliente from './cliente';
import type { Curso, Paginacion } from '../tipos';

export const listarCursos = async (params?: {
  buscar?: string;
  grado_id?: number;
  page?: number;
}): Promise<Paginacion<Curso>> => {
  const { data } = await cliente.get('/cursos', { params });
  return data;
};

export const crearCurso = async (payload: {
  nombre: string;
  descripcion?: string | null;
  grado_id: number;
  docente_id?: number | null;
  horas_semanales?: number;
  estado?: boolean;
}): Promise<Curso> => {
  const { data } = await cliente.post('/cursos', payload);
  return data;
};

export const actualizarCurso = async (
  id: number,
  payload: Partial<{
    nombre: string;
    descripcion: string | null;
    grado_id: number;
    docente_id: number | null;
    horas_semanales: number;
    estado: boolean;
  }>
): Promise<Curso> => {
  const { data } = await cliente.put(`/cursos/${id}`, payload);
  return data;
};

export const eliminarCurso = async (id: number): Promise<void> => {
  await cliente.delete(`/cursos/${id}`);
};
