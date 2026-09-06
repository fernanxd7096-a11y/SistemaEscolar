import { Stack } from 'expo-router';
import { colores } from '@/utils/colores';

export default function HorarioLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: colores.texto,
        headerStyle: { backgroundColor: colores.fondo },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Mi horario' }} />
    </Stack>
  );
}
