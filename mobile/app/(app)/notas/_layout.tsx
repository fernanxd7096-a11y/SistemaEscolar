import { Stack } from 'expo-router';
import { colores } from '@/utils/colores';

export default function NotasLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: colores.texto,
        headerStyle: { backgroundColor: colores.fondo },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Notas' }} />
      <Stack.Screen name="registrar" options={{ title: 'Registrar notas' }} />
    </Stack>
  );
}
