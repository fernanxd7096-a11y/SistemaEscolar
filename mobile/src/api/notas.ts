import cliente from './cliente';
import type { AlumnoNota } from '../tipos';

export const obtenerNotasSeccionCurso = async (params: {
  seccion_id: number;
  curso_id: number;
  bimestre: number;
  tipo?: string;
}): Promise<{ seccion_id: number; curso_id: number; bimestre: number; tipo: string; alumnos: AlumnoNota[] }> => {
  const { data } = await cliente.get('/notas/seccion-curso', { params });
  return data;
};

export const registrarNotasMasivas = async (payload: {
  seccion_id: number;
  curso_id: number;
  bimestre: number;
  tipo: string;
  notas: {
    alumno_id: number;
    calificacion: number;
    observacion?: string | null;
  }[];
}): Promise<{ mensaje: string; total: number }> => {
  const { data } = await cliente.post('/notas/masivo', payload);
  return data;
};

export const obtenerLibreta = async (
  alumnoId: number,
  params?: { seccion_id?: number }
): Promise<{
  alumno: { id: number; nombres: string; apellidos: string; dni: string };
  cursos: {
    curso_id: number;
    curso_nombre: string;
    bimestres: Record<string, { notas: Record<string, number>; promedio: number }>;
    promedio_final: number;
  }[];
}> => {
  const { data } = await cliente.get(`/notas/libreta/${alumnoId}`, { params });
  return data;
};

export const eliminarNota = async (id: number): Promise<void> => {
  await cliente.delete(`/notas/${id}`);
};
