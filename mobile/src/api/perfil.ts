import cliente from './cliente';
import type { Usuario } from '../tipos';

/**
 * Autoservicio de perfil: cada usuario autenticado edita sus propios datos.
 * Corresponde a PerfilControlador (backend), que no exige ningún permiso de rol
 * —a diferencia de la administración de OTROS usuarios— porque cualquiera con
 * sesión puede tocar su propio registro.
 */

export const actualizarPerfil = async (payload: {
  nombre: string;
  apellido: string;
}): Promise<Usuario> => {
  const { data } = await cliente.put('/perfil', payload);
  return data;
};

export const cambiarPasswordPerfil = async (payload: {
  password_actual: string;
  password: string;
  password_confirmation: string;
}): Promise<{ mensaje: string }> => {
  const { data } = await cliente.put('/perfil/password', payload);
  return data;
};

/**
 * Sube la foto de perfil desde un uri local (el que devuelve expo-image-picker).
 *
 * Se arma un FormData con el archivo tal cual RN lo necesita (uri/name/type),
 * no un Blob: RN no soporta `fetch(uri)` seguido de `.blob()` de forma confiable
 * en todas las plataformas, así que axios recibe el descriptor de archivo directo.
 */
export const subirFotoPerfil = async (uri: string): Promise<Usuario> => {
  const nombreArchivo = uri.split('/').pop() ?? `foto-${Date.now()}.jpg`;
  const extension = nombreArchivo.split('.').pop()?.toLowerCase() ?? 'jpg';
  const tipoMime = extension === 'png' ? 'image/png' : 'image/jpeg';

  const formData = new FormData();
  formData.append('foto', {
    uri,
    name: nombreArchivo,
    type: tipoMime,
  } as unknown as Blob);

  const { data } = await cliente.post('/perfil/foto', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const eliminarFotoPerfil = async (): Promise<Usuario> => {
  const { data } = await cliente.delete('/perfil/foto');
  return data;
};
