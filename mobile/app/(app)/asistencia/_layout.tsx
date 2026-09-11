import { Stack } from 'expo-router';
import { colores } from '@/utils/colores';

export default function AsistenciaLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: colores.texto,
        headerStyle: { backgroundColor: colores.fondo },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Asistencia' }} />
      <Stack.Screen name="registrar" options={{ title: 'Registrar asistencia' }} />
    </Stack>
  );
}
