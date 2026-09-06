import { useMutationState } from '@tanstack/react-query';

// Cuenta las mutaciones "paused" (offline, encoladas por TanStack Query) para
// mostrar un indicador ("3 registros pendientes de sincronizar") en el dashboard
// y en las pantallas de asistencia/notas.
export const useSyncPendientes = () => {
  const mutaciones = useMutationState({
    filters: { status: 'pending' },
    select: (mutation) => mutation.state,
  });

  const pendientes = mutaciones.filter((m) => m.isPaused);
  return { total: pendientes.length, hayPendientes: pendientes.length > 0 };
};
