import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Usuario } from '@/tipos';
import { login as loginApi, logout as logoutApi, obtenerUsuarioActual } from '@/api/auth';

// Reemplaza a frontend/src/contexto/AuthContexto.tsx (React Context) por un store
// Zustand. Motivo: el interceptor 401 de axios (src/api/cliente.ts) necesita poder
// leer el token y cerrar sesión fuera del árbol de React, algo que un Context no
// permite sin pasar por hooks. Zustand expone `useAuthStore.getState()` para eso.
//
// El token (sensible) se guarda solo en SecureStore, nunca en AsyncStorage.
// El `usuario` (nombre, permisos, roles) se cachea en AsyncStorage únicamente para
// poder mostrar la app de inmediato y seguir funcionando si el docente abre la app
// sin conexión: un error de RED en /auth/usuario-actual NO cierra sesión (se sigue
// usando el usuario cacheado); solo un 401 real del servidor (token inválido/revocado)
// dispara `cerrarSesionLocal`.
const CLAVE_TOKEN = 'sjt_token';
const CLAVE_USUARIO_CACHE = 'sjt_usuario_cache';

interface AuthState {
  usuario: Usuario | null;
  token: string | null;
  hydrated: boolean;
  cargandoLogin: boolean;
  estaAutenticado: boolean;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  cerrarSesionLocal: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  usuario: null,
  token: null,
  hydrated: false,
  cargandoLogin: false,
  estaAutenticado: false,

  bootstrap: async () => {
    try {
      const token = await SecureStore.getItemAsync(CLAVE_TOKEN);
      if (!token) {
        set({ hydrated: true });
        return;
      }

      const usuarioCacheRaw = await AsyncStorage.getItem(CLAVE_USUARIO_CACHE);
      const usuarioCache = usuarioCacheRaw ? (JSON.parse(usuarioCacheRaw) as Usuario) : null;
      set({ token, usuario: usuarioCache, estaAutenticado: true });

      try {
        const usuarioFresco = await obtenerUsuarioActual();
        set({ usuario: usuarioFresco });
        await AsyncStorage.setItem(CLAVE_USUARIO_CACHE, JSON.stringify(usuarioFresco));
      } catch {
        // Sin red o el servidor no respondió: seguimos con el usuario cacheado.
        // Si el token era inválido, el interceptor 401 de cliente.ts ya llamó a
        // cerrarSesionLocal() como parte de esa misma petición fallida.
      }
    } finally {
      set({ hydrated: true });
    }
  },

  login: async (email: string, password: string) => {
    set({ cargandoLogin: true });
    try {
      const { token, usuario } = await loginApi(email, password);
      await SecureStore.setItemAsync(CLAVE_TOKEN, token);
      await AsyncStorage.setItem(CLAVE_USUARIO_CACHE, JSON.stringify(usuario));
      set({ token, usuario, estaAutenticado: true });
    } finally {
      set({ cargandoLogin: false });
    }
  },

  logout: async () => {
    try {
      if (get().token) await logoutApi();
    } catch {
      // Si el logout remoto falla (p. ej. sin red), igual limpiamos localmente.
    } finally {
      get().cerrarSesionLocal();
    }
  },

  cerrarSesionLocal: () => {
    SecureStore.deleteItemAsync(CLAVE_TOKEN).catch(() => {});
    AsyncStorage.removeItem(CLAVE_USUARIO_CACHE).catch(() => {});
    set({ token: null, usuario: null, estaAutenticado: false });
  },
}));
