import cliente from './cliente';
import type { KpisDashboard, ResumenDashboard } from '../tipos';

export const obtenerResumenDashboard = async (): Promise<ResumenDashboard> => {
  const { data } = await cliente.get('/dashboard/resumen');
  return data;
};

/**
 * KPIs y series para los gráficos del Inicio.
 *
 * El backend arma la respuesta según el rol: administrador/director/secretario
 * reciben los totales del colegio (`totales`, `asistencia_semana`, ...), mientras
 * que el docente solo recibe `docente` con su carga y sus clases de hoy. Por eso
 * casi todas las claves son opcionales: la pantalla decide qué tarjetas pintar
 * mirando `rol_vista`.
 */
export const obtenerKpis = async (): Promise<KpisDashboard> => {
  const { data } = await cliente.get('/dashboard/kpis');
  return data;
};
