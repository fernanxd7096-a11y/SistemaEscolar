import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEstadoRed } from '@/hooks/useEstadoRed';
import { useSyncPendientes } from '@/hooks/useSyncPendientes';
import { colores } from '@/utils/colores';

export const BannerEstado = () => {
  const estaConectado = useEstadoRed();
  const { total, hayPendientes } = useSyncPendientes();

  if (estaConectado && !hayPendientes) return null;

  return (
    <View style={[estilos.banner, !estaConectado ? estilos.sinConexion : estilos.sincronizando]}>
      <Ionicons
        name={!estaConectado ? 'cloud-offline-outline' : 'sync-outline'}
        size={16}
        color="#fff"
      />
      <Text style={estilos.texto}>
        {!estaConectado
          ? hayPendientes
            ? `Sin conexión — ${total} registro(s) guardados, se enviarán al reconectar`
            : 'Sin conexión — mostrando datos guardados localmente'
          : `Sincronizando ${total} registro(s) pendiente(s)...`}
      </Text>
    </View>
  );
};

const estilos = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  sinConexion: { backgroundColor: colores.advertencia },
  sincronizando: { backgroundColor: colores.info },
  texto: { color: '#fff', fontSize: 12, fontWeight: '600', flex: 1 },
});
