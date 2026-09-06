import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useAuthStore } from '@/tienda/auth';
import { registrarPushToken } from '@/api/pushTokens';

// Desde el SDK 53, Expo Go en Android ya no soporta push notifications remotas: con
// solo llamar a `setNotificationHandler` (o cualquier API de expo-notifications) se
// dispara un warning y, en la práctica, rompe el registro de rutas de Expo Router.
// Por eso NADA de este módulo toca `expo-notifications` cuando corre dentro de
// Expo Go: la app entera se prueba ahí durante desarrollo, y esta función solo
// funciona en un development build / build standalone real.
// Ver https://docs.expo.dev/develop/development-builds/introduction/.
const corriendoEnExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const useRegistrarPush = () => {
  const estaAutenticado = useAuthStore((state) => state.estaAutenticado);

  useEffect(() => {
    if (!estaAutenticado || corriendoEnExpoGo) return;

    const registrar = async () => {
      try {
        if (!Device.isDevice) return; // los emuladores/simuladores no reciben push

        // Import diferido: así el módulo nativo de expo-notifications ni siquiera
        // se toca cuando corriendoEnExpoGo es true.
        const Notifications = await import('expo-notifications');

        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.DEFAULT,
          });
        }

        const permisos = await Notifications.getPermissionsAsync();
        let estado = permisos.status;
        if (estado !== 'granted') {
          const solicitud = await Notifications.requestPermissionsAsync();
          estado = solicitud.status;
        }
        if (estado !== 'granted') return;

        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        const { data: token } = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined
        );

        await registrarPushToken({
          token,
          plataforma: Platform.OS === 'ios' ? 'ios' : 'android',
        });
      } catch (error) {
        console.warn('No se pudo registrar el push token:', error);
      }
    };

    registrar();
  }, [estaAutenticado]);
};
