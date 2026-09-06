import { useEffect, type ReactNode } from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient } from './queryClient';
import { asyncStoragePersister, conectarEstadoRed } from './persistencia';

export const QueryProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => conectarEstadoRed(), []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 días, igual que gcTime
      }}
      onSuccess={() => {
        // Las mutaciones offline (asistencia/notas registradas sin conexión) quedan
        // "paused" en el cache persistido. Al reabrir la app hay que reanudarlas
        // explícitamente: TanStack Query no lo hace solo tras una restauración.
        queryClient.resumePausedMutations().then(() => {
          queryClient.invalidateQueries();
        });
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
};
