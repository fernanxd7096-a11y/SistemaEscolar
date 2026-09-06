import { QueryClient } from '@tanstack/react-query';
import { registrarAsistenciaMasiva } from '@/api/asistencias';
import { registrarNotasMasivas } from '@/api/notas';

// gcTime largo: los datos (secciones, alumnos, cursos, listas de asistencia/notas)
// deben seguir disponibles en caché por varios días aunque el docente no abra la app
// a diario, para que el modo offline siga sirviendo algo razonable.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 días
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 2,
    },
    mutations: {
      // networkMode 'online' (default): si no hay conexión, la mutación queda
      // "paused" en vez de fallar, y TanStack Query la reintenta sola apenas
      // vuelve la red. Es la base de la cola de sincronización offline de
      // asistencia/notas — ver src/offline/QueryProvider.tsx.
      retry: 1,
    },
  },
});

export const CLAVE_MUTACION_ASISTENCIA = ['asistencia-masivo'] as const;
export const CLAVE_MUTACION_NOTAS = ['notas-masivo'] as const;

// Una mutación "paused" (offline) se persiste en AsyncStorage como datos planos: la
// función mutationFn original (un closure de JS) no es serializable y se pierde. Al
// reiniciar la app, `resumePausedMutations()` necesita volver a asociar cada mutación
// rehidratada con una mutationFn real — para eso hay que registrar un default por
// mutationKey ANTES de restaurar el cache. Ver QueryProvider.tsx (onSuccess) y
// https://tanstack.com/query/latest/docs/framework/react/guides/mutations#persisting-offline-mutations.
queryClient.setMutationDefaults(CLAVE_MUTACION_ASISTENCIA, {
  mutationFn: registrarAsistenciaMasiva,
});
queryClient.setMutationDefaults(CLAVE_MUTACION_NOTAS, {
  mutationFn: registrarNotasMasivas,
});
