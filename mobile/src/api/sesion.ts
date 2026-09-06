/**
 * Puente entre la capa de API y el store de autenticación.
 *
 * Existe para romper un ciclo de imports que Metro reportaba en consola:
 *
 *   src/tienda/auth.ts -> src/api/auth.ts -> src/api/cliente.ts -> src/tienda/auth.ts
 *
 * El cliente axios necesita el token y necesita poder cerrar sesión ante un 401,
 * pero importar `useAuthStore` para eso cerraba el círculo (el store, a su vez,
 * llama a `src/api/auth.ts` para login/logout). Los ciclos en Metro no rompen la
 * app, pero dejan valores sin inicializar según el orden de evaluación.
 *
 * En vez de que la API conozca al store, el store se registra aquí al cargarse.
 * Este módulo no importa nada: es una hoja del grafo de dependencias, así que
 * cualquiera puede depender de él sin volver a crear un ciclo.
 */

type ObtenerToken = () => string | null;
type AlExpirarSesion = () => void;

// Valores por defecto inofensivos: si por algún motivo la API se usara antes de
// que el store se registre, las peticiones simplemente saldrían sin Authorization
// en vez de reventar con un error de módulo sin inicializar.
let obtenerTokenActual: ObtenerToken = () => null;
let alExpirarSesion: AlExpirarSesion = () => {};

/**
 * Lo llama `src/tienda/auth.ts` al evaluarse, antes de que se dispare cualquier
 * petición (el layout raíz importa el store en el arranque de la app).
 */
export const registrarSesion = (opciones: {
  obtenerToken: ObtenerToken;
  alExpirar: AlExpirarSesion;
}) => {
  obtenerTokenActual = opciones.obtenerToken;
  alExpirarSesion = opciones.alExpirar;
};

/** Token vigente para el header Authorization, o null si no hay sesión. */
export const tokenActual = (): string | null => obtenerTokenActual();

/** Avisa al store que el servidor rechazó el token (401) y hay que limpiar sesión. */
export const notificarSesionExpirada = (): void => alExpirarSesion();
