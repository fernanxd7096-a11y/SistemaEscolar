import { useAuth } from '../contexto/AuthContexto';

export const usePermiso = (permiso: string | string[]) => {
  const { usuario } = useAuth();
  const permisos = usuario?.permisos ?? [];
  const lista = Array.isArray(permiso) ? permiso : [permiso];
  return lista.some((p) => permisos.includes(p));
};
