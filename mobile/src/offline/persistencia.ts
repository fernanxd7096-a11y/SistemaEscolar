import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'sjt-cache-tanstack-query',
});

// Conecta el estado de red real del dispositivo (NetInfo) con el onlineManager de
// TanStack Query. Sin esto, la librería asume que siempre hay internet (usa
// `navigator.onLine`, que no existe en RN) y nunca pausaría queries/mutaciones offline.
export const conectarEstadoRed = () => {
  return onlineManager.setEventListener((setOnline) => {
    return NetInfo.addEventListener((state) => {
      setOnline(!!state.isConnected && state.isInternetReachable !== false);
    });
  });
};
