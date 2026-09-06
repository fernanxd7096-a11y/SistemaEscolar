import { Redirect } from 'expo-router';
import { useAuthStore } from '@/tienda/auth';

export default function Indice() {
  const estaAutenticado = useAuthStore((state) => state.estaAutenticado);
  return <Redirect href={estaAutenticado ? '/(app)/dashboard' : '/(auth)/login'} />;
}
