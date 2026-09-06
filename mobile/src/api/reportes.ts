import cliente from './cliente';

export const obtenerResumenGeneral = async (): Promise<{
  total_alumnos: number;
  total_secciones: number;
  total_docentes: number;
  total_cursos: number;
}> => {
  const { data } = await cliente.get('/reportes/resumen');
  return data;
};

export const obtenerBoleta = async (
  alumnoId: number,
  params?: { seccion_id?: number }
): Promise<{
  alumno: { id: number; nombres: string; apellidos: string; dni: string };
  seccion: { nombre: string; grado: string; nivel: string } | null;
  cursos: {
    curso: string;
    bimestre_1: number | null;
    bimestre_2: number | null;
    bimestre_3: number | null;
    bimestre_4: number | null;
    promedio_final: number;
  }[];
}> => {
  const { data } = await cliente.get(`/reportes/boleta/${alumnoId}`, { params });
  return data;
};

export const obtenerConsolidadoAsistencia = async (params: {
  seccion_id: number;
  fecha_desde: string;
  fecha_hasta: string;
}): Promise<{
  alumnos: {
    alumno_id: number;
    nombres: string;
    apellidos: string;
    presente: number;
    tardanza: number;
    falta: number;
    justificado: number;
    total_dias: number;
    porcentaje: number;
  }[];
}> => {
  const { data } = await cliente.get('/reportes/consolidado-asistencia', { params });
  return data;
};

export const obtenerConsolidadoNotas = async (params: {
  seccion_id: number;
  bimestre?: number;
}): Promise<{
  cursos: string[];
  alumnos: {
    alumno_id: number;
    nombres: string;
    apellidos: string;
    notas_por_curso: Record<string, number | null>;
    promedio_general: number | null;
  }[];
}> => {
  const { data } = await cliente.get('/reportes/consolidado-notas', { params });
  return data;
};
