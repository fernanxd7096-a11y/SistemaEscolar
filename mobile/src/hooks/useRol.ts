import { useAuthStore } from '@/tienda/auth';

/**
 * Roles del usuario autenticado, tal como los devuelve el backend (Spatie).
 *
 * `esAdministrativo` es la puerta de la sección de Gestión (alumnos, docentes y
 * horario): solo administrador y director la ven, igual que en la app web. El
 * backend igual valida los permisos por endpoint; esto solo evita mostrar
 * pantallas que terminarían en 403.
 */
export const useRol = () => {
  const usuario = useAuthStore((estado) => estado.usuario);

  const roles = (usuario?.roles ?? []).map((rol) => rol.name);

  const tieneRol = (...buscados: string[]) => buscados.some((rol) => roles.includes(rol));

  return {
    roles,
    tieneRol,
    esAdministrativo: tieneRol('administrador', 'director'),
    esDocente: tieneRol('docente'),
  };
};
