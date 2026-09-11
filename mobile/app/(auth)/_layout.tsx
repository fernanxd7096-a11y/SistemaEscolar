import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/tienda/auth';

export default function AuthLayout() {
  const estaAutenticado = useAuthStore((state) => state.estaAutenticado);

  if (estaAutenticado) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
