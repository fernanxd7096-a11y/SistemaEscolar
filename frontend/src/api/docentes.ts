import cliente from './cliente';
import type { Docente, Paginacion } from '../tipos';

export const listarDocentes = async (params?: {
  buscar?: string;
  estado?: boolean;
  page?: number;
}): Promise<Paginacion<Docente>> => {
  const { data } = await cliente.get('/docentes', { params });
  return data;
};

export const crearDocente = async (payload: Partial<Docente>): Promise<Docente> => {
  const { data } = await cliente.post('/docentes', payload);
  return data;
};

export const actualizarDocente = async (id: number, payload: Partial<Docente>): Promise<Docente> => {
  const { data } = await cliente.put(`/docentes/${id}`, payload);
  return data;
};

export const eliminarDocente = async (id: number): Promise<void> => {
  await cliente.delete(`/docentes/${id}`);
};

export const listarTodosDocentes = async (): Promise<Docente[]> => {
  const { data } = await cliente.get('/docentes', { params: { all: true } });
  return data;
};

// --- Registro público de docentes ---
export const registrarDocente = async (payload: {
  dni: string;
  nombres: string;
  apellidos: string;
  especialidad?: string;
  titulo?: string;
  telefono?: string;
  email: string;
}): Promise<{ mensaje: string }> => {
  const { data } = await cliente.post('/docentes/registro', payload);
  return data;
};

export const listarDocentesPendientes = async (): Promise<Docente[]> => {
  const { data } = await cliente.get('/docentes/registros/pendientes');
  return data;
};

export const aprobarDocente = async (id: number): Promise<{ mensaje: string; docente: Docente }> => {
  const { data } = await cliente.post(`/docentes/${id}/aprobar`);
  return data;
};

export const rechazarDocente = async (id: number, motivo_rechazo: string): Promise<{ mensaje: string }> => {
  const { data } = await cliente.post(`/docentes/${id}/rechazar`, { motivo_rechazo });
  return data;
};

export const contadorPendientes = async (): Promise<{ pendientes: number }> => {
  const { data } = await cliente.get('/notificaciones/pendientes');
  return data;
};
