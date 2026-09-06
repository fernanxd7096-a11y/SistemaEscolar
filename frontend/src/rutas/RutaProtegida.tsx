import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexto/AuthContexto';

export const RutaProtegida = () => {
  const { loading, estaAutenticado, token } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primario-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!token && !estaAutenticado) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
