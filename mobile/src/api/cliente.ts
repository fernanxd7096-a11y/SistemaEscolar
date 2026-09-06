import axios from 'axios';
import { useAuthStore } from '@/tienda/auth';

// Adaptado de frontend/src/api/cliente.ts:
// - baseURL viene de EXPO_PUBLIC_API_URL (no hay un único host fijo como en la web).
// - El token no vive en localStorage (no existe en RN): se lee del store de Zustand
//   `useAuthStore`, que a su vez lo espeja desde SecureStore en el arranque de la app
//   (ver src/tienda/auth.ts). Leer del store en vez de SecureStore aquí evita que cada
//   request dispare una llamada async a SecureStore solo para armar el header.
// - En vez de `window.location.href = '/login'` (no existe en RN), un 401 dispara
//   `useAuthStore.getState().cerrarSesionLocal()`, que limpia el estado y SecureStore;
//   la navegación a /login la hace el layout raíz al detectar `estaAutenticado === false`.
const baseURL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api';

const cliente = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

cliente.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

cliente.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().cerrarSesionLocal();
    }
    return Promise.reject(error);
  }
);

export default cliente;
