import { Stack } from 'expo-router';
import { colores } from '@/utils/colores';

export default function PerfilLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: colores.texto,
        headerStyle: { backgroundColor: colores.fondo },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Mi perfil' }} />
      <Stack.Screen name="editar" options={{ title: 'Editar perfil' }} />
    </Stack>
  );
}
