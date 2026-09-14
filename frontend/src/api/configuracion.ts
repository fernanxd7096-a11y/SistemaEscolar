import cliente from './cliente';
import type { ConfiguracionInstitucional } from '../tipos';

/**
 * Obtener la configuración institucional pública.
 * GET /api/configuracion
 */
export const obtenerConfiguracion = async (): Promise<ConfiguracionInstitucional> => {
  const { data } = await cliente.get('/configuracion');
  return data;
};

/**
 * Actualizar datos de configuración institucional.
 * PUT /api/configuracion
 */
export const actualizarConfiguracion = async (
  payload: Partial<ConfiguracionInstitucional>
): Promise<ConfiguracionInstitucional> => {
  const { data } = await cliente.put('/configuracion', payload);
  return data;
};

/**
 * Subir nuevo logo institucional en el backend.
 * POST /api/configuracion/logo
 */
export const subirLogoInstitucional = async (
  archivo: File
): Promise<{ mensaje: string; logo_url: string; logo_base64: string }> => {
  const formData = new FormData();
  formData.append('logo', archivo);

  const { data } = await cliente.post('/configuracion/logo', formData);
  return data;
};
