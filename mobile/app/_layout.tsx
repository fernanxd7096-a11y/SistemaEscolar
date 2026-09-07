import { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { QueryProvider } from '@/offline/QueryProvider';
import { useAuthStore } from '@/tienda/auth';
import { colores } from '@/utils/colores';

const AutenticacionBootstrap = () => {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const hydrated = useAuthStore((state) => state.hydrated);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (!hydrated) {
    return (
      <View style={estilos.splash}>
        <ActivityIndicator size="large" color={colores.primario} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <StatusBar style="dark" />
          <AutenticacionBootstrap />
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const estilos = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colores.fondo,
  },
});

// line to test the repository