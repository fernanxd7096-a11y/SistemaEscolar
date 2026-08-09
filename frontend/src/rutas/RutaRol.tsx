import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexto/AuthContexto';

interface RutaRolProps {
  rolesPermitidos: string[];
}

export const RutaRol = ({ rolesPermitidos }: RutaRolProps) => {
  const { usuario } = useAuth();

  const tieneRol = usuario?.roles.some(r => rolesPermitidos.includes(r.name));

  if (!tieneRol) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
