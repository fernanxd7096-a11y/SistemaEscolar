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

// ========== PDF Downloads ==========

const descargarPdf = async (url: string, params: Record<string, any>, filename: string) => {
  try {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams();

    // Add all params
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    }

    // Use fetch directly to avoid axios interceptors interfering with blob
    const baseUrl = 'http://localhost:8000/api';
    const fullUrl = `${baseUrl}${url}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/pdf',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PDF download error:', response.status, errorText);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Small delay before revoking to ensure download starts
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch (error) {
    console.error('Error descargando PDF:', error);
    throw error;
  }
};

export const descargarBoletaPdf = async (alumnoId: number, seccionId?: number): Promise<{ guardadoEn: string; carpeta: string }> => {
  const token = localStorage.getItem('token');
  const params = seccionId ? `?seccion_id=${seccionId}` : '';
  const baseUrl = 'http://localhost:8000/api';
  const fullUrl = `${baseUrl}/reportes/boleta/${alumnoId}/pdf${params}`;

  const response = await fetch(fullUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/pdf',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error ${response.status}: ${errorText}`);
  }

  const boletaPath = response.headers.get('X-Boleta-Path') || '';
  const boletaDir = response.headers.get('X-Boleta-Dir') || '';

  // También descarga en el navegador/Electron
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = boletaPath.split(/[/\\]/).pop() || `Informe_Academico_${alumnoId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

  return { guardadoEn: boletaPath, carpeta: boletaDir };
};

export const descargarAsistenciaPdf = async (seccionId: number, fechaDesde: string, fechaHasta: string) => {
  await descargarPdf(
    '/reportes/consolidado-asistencia/pdf',
    { seccion_id: seccionId, fecha_desde: fechaDesde, fecha_hasta: fechaHasta },
    `consolidado_asistencia.pdf`
  );
};

export const descargarNotasPdf = async (seccionId: number, bimestre?: number) => {
  await descargarPdf(
    '/reportes/consolidado-notas/pdf',
    { seccion_id: seccionId, ...(bimestre ? { bimestre } : {}) },
    `consolidado_notas.pdf`
  );
};

