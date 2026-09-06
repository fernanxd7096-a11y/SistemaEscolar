import axios from 'axios';
import type { ConflictoHorario } from '@/tipos';

/**
 * Traduce un error de axios al texto que se le muestra al usuario.
 *
 * El backend responde 422 con `{ message, errors: { campo: [mensajes] } }`
 * (validación de Laravel) o con `{ mensaje }` en los controladores que devuelven
 * un aviso propio, así que hay que mirar las tres formas.
 */
export const mensajeError = (error: unknown, porDefecto = 'Ocurrió un error inesperado.'): string => {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : porDefecto;
  }

  if (!error.response) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión.';
  }

  const datos = error.response.data as
    | { message?: string; mensaje?: string; errors?: Record<string, string[]> }
    | undefined;

  const primerError = datos?.errors ? Object.values(datos.errors)[0]?.[0] : undefined;

  return primerError ?? datos?.mensaje ?? datos?.message ?? porDefecto;
};

/** Errores de validación por campo, para pintarlos debajo de cada input. */
export const erroresPorCampo = (error: unknown): Record<string, string> => {
  if (!axios.isAxiosError(error)) return {};

  const errores = (error.response?.data as { errors?: Record<string, string[]> } | undefined)?.errors;
  if (!errores) return {};

  return Object.fromEntries(Object.entries(errores).map(([campo, lista]) => [campo, lista[0]]));
};

/**
 * Choques de horario que devuelven HorarioReglaControlador y
 * HorarioExcepcionControlador cuando la regla o la excepción se solapa con otra.
 */
export const conflictosDeError = (error: unknown): ConflictoHorario[] => {
  if (!axios.isAxiosError(error)) return [];

  return (error.response?.data as { conflictos?: ConflictoHorario[] } | undefined)?.conflictos ?? [];
};
