import { useAuthStore } from '@/tienda/auth';

// Adaptado de frontend/src/hooks/usePermiso.ts: usa el store Zustand de auth
// en vez de `useAuth()` (React Context), ver src/tienda/auth.ts.
export const usePermiso = (permiso: string | string[]) => {
  const permisos = useAuthStore((state) => state.usuario?.permisos ?? []);
  const lista = Array.isArray(permiso) ? permiso : [permiso];
  return lista.some((p) => permisos.includes(p));
};
