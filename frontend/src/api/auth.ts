import cliente from './cliente';
import type { RespuestaAuth, Usuario } from '../tipos';

type UsuarioApi = Omit<Usuario, 'permisos'> & {
  permisos?: string[];
  permissions?: string[];
};

const normalizarUsuario = (usuario: UsuarioApi, permisosExtra?: string[]): Usuario => {
  const permisos = permisosExtra ?? usuario.permisos ?? usuario.permissions ?? [];
  const { permissions: _permissions, ...resto } = usuario;
  return {
    ...resto,
    permisos,
  };
};

export const login = async (email: string, password: string): Promise<RespuestaAuth> => {
  const { data } = await cliente.post('/auth/login', { email, password });
  return {
    token: data.token,
    usuario: normalizarUsuario(data.usuario),
  };
};

export const logout = async (): Promise<void> => {
  await cliente.post('/auth/logout');
};

export const obtenerUsuarioActual = async (): Promise<Usuario> => {
  const { data } = await cliente.get('/auth/usuario-actual');
  return normalizarUsuario(data.usuario, data.permisos);
};

export const enviarEnlacePassword = async (email: string): Promise<string> => {
  const { data } = await cliente.post('/auth/password/enviar-enlace', { email });
  return data.mensaje ?? 'Enlace enviado.';
};

export const resetearPassword = async (payload: {
  email: string;
  password: string;
  password_confirmation: string;
  token: string;
}): Promise<string> => {
  const { data } = await cliente.post('/auth/password/reset', payload);
  return data.mensaje ?? 'Contraseña restablecida.';
};
