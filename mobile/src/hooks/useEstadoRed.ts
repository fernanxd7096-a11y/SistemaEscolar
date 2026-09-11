import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const useEstadoRed = () => {
  const [estaConectado, setEstaConectado] = useState(true);

  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      setEstaConectado(!!state.isConnected && state.isInternetReachable !== false);
    });
  }, []);

  return estaConectado;
};
