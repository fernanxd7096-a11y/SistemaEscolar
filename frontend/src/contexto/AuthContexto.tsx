import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Usuario } from '../tipos';
import { login as loginApi, logout as logoutApi, obtenerUsuarioActual } from '../api/auth';

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  estaAutenticado: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verificarAuth = async () => {
      if (token) {
        try {
          const user = await obtenerUsuarioActual();
          setUsuario(user);
        } catch (error) {
          console.error("Error validando token:", error);
          setToken(null);
          setUsuario(null);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    verificarAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    const data = await loginApi(email, password);
    setToken(data.token);
    setUsuario(data.usuario);
    localStorage.setItem('token', data.token);
  };

  const logout = async () => {
    try {
      if (token) await logoutApi();
    } catch (e) {
      console.error(e);
    } finally {
      setToken(null);
      setUsuario(null);
      localStorage.removeItem('token');
    }
  };

  return (
    <AuthContext.Provider value={{
      usuario,
      token,
      loading,
      login,
      logout,
      estaAutenticado: !!token && !!usuario
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
