import axios from 'axios';
import { notificarSesionExpirada, tokenActual } from './sesion';

// Adaptado de frontend/src/api/cliente.ts:
// - baseURL viene de EXPO_PUBLIC_API_URL (no hay un único host fijo como en la web).
// - El token no vive en localStorage (no existe en RN): lo entrega `tokenActual()`,
//   que lee el store de Zustand a través del puente de src/api/sesion.ts. El store
//   espeja el token desde SecureStore en el arranque (ver src/tienda/auth.ts), así
//   que leerlo de ahí evita una llamada async a SecureStore por cada request.
// - Este módulo NO importa `useAuthStore` directamente a propósito: hacerlo creaba
//   el ciclo tienda/auth -> api/auth -> api/cliente -> tienda/auth que Metro
//   reportaba como "Require cycle". El puente de sesion.ts invierte esa dependencia.
// - En vez de `window.location.href = '/login'` (no existe en RN), un 401 dispara
//   `notificarSesionExpirada()`, que termina llamando a `cerrarSesionLocal()` del
//   store para limpiar el estado y SecureStore; la navegación a /login la hace el
//   layout raíz al detectar `estaAutenticado === false`.
const baseURL =
  process.env.EXPO_PUBLIC_API_URL || 'https://sistema-escolar-sjt.onrender.com/api';

const cliente = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

cliente.interceptors.request.use((config) => {
  const token = tokenActual();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

cliente.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      notificarSesionExpirada();
    }
    return Promise.reject(error);
  }
);

export default cliente;
