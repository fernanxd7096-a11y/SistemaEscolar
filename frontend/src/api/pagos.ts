import cliente from './cliente';
import type { Pago, ConceptoPago, Paginacion } from '../tipos';

/* ---- Conceptos ---- */
export const listarConceptos = async (params?: { all?: boolean }): Promise<ConceptoPago[] | Paginacion<ConceptoPago>> => {
  const { data } = await cliente.get('/conceptos-pago', { params });
  return data;
};

export const crearConcepto = async (payload: Partial<ConceptoPago>): Promise<ConceptoPago> => {
  const { data } = await cliente.post('/conceptos-pago', payload);
  return data;
};

export const actualizarConcepto = async (id: number, payload: Partial<ConceptoPago>): Promise<ConceptoPago> => {
  const { data } = await cliente.put(`/conceptos-pago/${id}`, payload);
  return data;
};

export const eliminarConcepto = async (id: number): Promise<void> => {
  await cliente.delete(`/conceptos-pago/${id}`);
};

/* ---- Pagos ---- */
export const listarPagos = async (params?: {
  alumno_id?: number; concepto_pago_id?: number; evento_id?: number;
  estado?: string; desde?: string; hasta?: string; page?: number;
}): Promise<Paginacion<Pago>> => {
  const { data } = await cliente.get('/pagos', { params });
  return data;
};

export const crearPago = async (payload: {
  alumno_id: number; concepto_pago_id: number; evento_id?: number | null;
  monto: number; fecha_pago: string; metodo_pago: string;
  referencia_pago?: string | null; observacion?: string | null; estado?: string;
}): Promise<Pago> => {
  const { data } = await cliente.post('/pagos', payload);
  return data;
};

export const actualizarPago = async (id: number, payload: Partial<Pago>): Promise<Pago> => {
  const { data } = await cliente.put(`/pagos/${id}`, payload);
  return data;
};

export const eliminarPago = async (id: number): Promise<void> => {
  await cliente.delete(`/pagos/${id}`);
};

export const pagosPorEvento = async (eventoId: number): Promise<{
  evento: { id: number; titulo: string; costo?: number | null; fecha_inicio: string };
  resumen: { total_alumnos: number; pagados: number; pendientes: number; monto_recaudado: number };
  alumnos: Array<{ alumno: { id: number; nombres: string; apellidos: string; dni: string }; estado: string; pago: Pago | null }>;
  pagos: Pago[];
}> => {
  const { data } = await cliente.get(`/eventos/${eventoId}/pagos`);
  return data;
};

export const pagosPorPadre = async (padreId: number): Promise<{
  padre: any;
  pagos: Pago[];
  resumen: { total: number; pagados: number; pendientes: number; monto: number };
}> => {
  const { data } = await cliente.get(`/padres/${padreId}/pagos`);
  return data;
};

export const subirEvidenciaPago = async (pagoId: number, archivo: File): Promise<Pago> => {
  const form = new FormData();
  form.append('evidencia', archivo);
  const { data } = await cliente.post(`/pagos/${pagoId}/evidencia`, form);
  return data;
};

export const eliminarEvidenciaPago = async (pagoId: number): Promise<Pago> => {
  const { data } = await cliente.delete(`/pagos/${pagoId}/evidencia`);
  return data;
};
