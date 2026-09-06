import { Redirect, Stack } from 'expo-router';
import { useRol } from '@/hooks/useRol';
import { colores } from '@/utils/colores';

export default function GestionLayout() {
  const { esAdministrativo } = useRol();

  // Segunda barrera además de ocultar la pestaña en (app)/_layout.tsx: protege
  // también los enlaces directos (deep links) a las pantallas de gestión.
  if (!esAdministrativo) {
    return <Redirect href="/(app)/dashboard" />;
  }

  return (
    <Stack
      screenOptions={{
        headerTintColor: colores.texto,
        headerStyle: { backgroundColor: colores.fondo },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Gestión' }} />
      <Stack.Screen name="alumnos" options={{ title: 'Alumnos' }} />
      <Stack.Screen name="alumno-formulario" options={{ title: 'Alumno' }} />
      <Stack.Screen name="alumno-ficha" options={{ title: 'Ficha del alumno' }} />
      <Stack.Screen name="alumno-matricula" options={{ title: 'Matricular' }} />
      <Stack.Screen name="docentes" options={{ title: 'Docentes' }} />
      <Stack.Screen name="docente-formulario" options={{ title: 'Docente' }} />
      <Stack.Screen name="cursos" options={{ title: 'Cursos' }} />
      <Stack.Screen name="curso-formulario" options={{ title: 'Curso' }} />
      <Stack.Screen name="horario" options={{ title: 'Horario' }} />
      <Stack.Screen name="horario-reglas" options={{ title: 'Reglas recurrentes' }} />
      <Stack.Screen name="horario-regla-formulario" options={{ title: 'Regla del horario' }} />
      <Stack.Screen name="horario-excepciones" options={{ title: 'Excepciones' }} />
      <Stack.Screen name="horario-excepcion-formulario" options={{ title: 'Excepción del horario' }} />
    </Stack>
  );
}
