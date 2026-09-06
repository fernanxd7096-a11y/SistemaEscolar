import cliente from './cliente';
import type { Pago, Paginacion, ResumenMetodoPago } from '../tipos';

export const listarPagos = async (params?: {
  alumno_id?: number;
  metodo_pago?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  buscar?: string;
  page?: number;
}): Promise<Paginacion<Pago>> => {
  const { data } = await cliente.get('/pagos', { params });
  return data;
};

export const crearPago = async (payload: {
  alumno_id: number;
  monto: number;
  concepto: string;
  fecha: string;
  metodo_pago: string;
  referencia?: string | null;
  observacion?: string | null;
}): Promise<Pago> => {
  const { data } = await cliente.post('/pagos', payload);
  return data;
};

export const actualizarPago = async (
  id: number,
  payload: Partial<{
    alumno_id: number;
    monto: number;
    concepto: string;
    fecha: string;
    metodo_pago: string;
    referencia: string | null;
    observacion: string | null;
  }>
): Promise<Pago> => {
  const { data } = await cliente.put(`/pagos/${id}`, payload);
  return data;
};

export const eliminarPago = async (id: number): Promise<void> => {
  await cliente.delete(`/pagos/${id}`);
};

export const obtenerResumenMetodoPago = async (params?: {
  fecha_desde?: string;
  fecha_hasta?: string;
}): Promise<ResumenMetodoPago> => {
  const { data } = await cliente.get('/pagos/resumen-metodo', { params });
  return data;
};
