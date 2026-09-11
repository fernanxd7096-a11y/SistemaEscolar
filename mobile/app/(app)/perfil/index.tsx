import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/tienda/auth';
import { enviarNotificacionPrueba } from '@/api/pushTokens';
import { colores } from '@/utils/colores';

export default function PerfilScreen() {
  const usuario = useAuthStore((state) => state.usuario);
  const logout = useAuthStore((state) => state.logout);
  const [enviandoPrueba, setEnviandoPrueba] = useState(false);

  const confirmarLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const probarNotificacion = async () => {
    setEnviandoPrueba(true);
    try {
      await enviarNotificacionPrueba();
      Alert.alert('Enviado', 'Revisa las notificaciones de tu dispositivo en unos segundos.');
    } catch (err: any) {
      Alert.alert(
        'No se pudo enviar',
        err?.response?.data?.mensaje ?? 'Verifica que tu dispositivo tenga notificaciones activadas.'
      );
    } finally {
      setEnviandoPrueba(false);
    }
  };

  return (
    <View style={estilos.contenedor}>
      {usuario?.foto_url ? (
        <Image source={{ uri: usuario.foto_url }} style={estilos.avatarFoto} />
      ) : (
        <View style={estilos.avatar}>
          <Text style={estilos.avatarTexto}>
            {(usuario?.nombre?.[0] ?? '') + (usuario?.apellido?.[0] ?? '')}
          </Text>
        </View>
      )}
      <Text style={estilos.nombre}>
        {usuario?.nombre} {usuario?.apellido}
      </Text>
      <Text style={estilos.email}>{usuario?.email}</Text>

      <View style={estilos.tarjeta}>
        <Text style={estilos.etiqueta}>Rol</Text>
        <Text style={estilos.valor}>{usuario?.roles?.map((r) => r.name).join(', ') || '—'}</Text>
      </View>

      <Pressable
        style={estilos.botonSecundario}
        onPress={() => router.push('/(app)/perfil/editar')}
      >
        <Ionicons name="create-outline" size={18} color={colores.primario} />
        <Text style={estilos.botonSecundarioTexto}>Editar perfil</Text>
      </Pressable>

      <Pressable style={estilos.botonSecundario} onPress={probarNotificacion} disabled={enviandoPrueba}>
        {enviandoPrueba ? (
          <ActivityIndicator color={colores.primario} size="small" />
        ) : (
          <Ionicons name="notifications-outline" size={18} color={colores.primario} />
        )}
        <Text style={estilos.botonSecundarioTexto}>Enviar notificación de prueba</Text>
      </Pressable>

      <Pressable style={estilos.boton} onPress={confirmarLogout}>
        <Ionicons name="log-out-outline" size={18} color="#fff" />
        <Text style={estilos.botonTexto}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo, padding: 20, alignItems: 'center' },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colores.primario,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  avatarFoto: {
    width: 84,
    height: 84,
    borderRadius: 42,
    marginTop: 16,
    backgroundColor: colores.borde,
  },
  avatarTexto: { color: '#fff', fontSize: 28, fontWeight: '700' },
  nombre: { fontSize: 18, fontWeight: '700', color: colores.texto, marginTop: 12 },
  email: { fontSize: 13, color: colores.textoSecundario, marginTop: 2 },
  tarjeta: {
    width: '100%',
    backgroundColor: colores.tarjeta,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 14,
    marginTop: 16,
  },
  etiqueta: { fontSize: 12, fontWeight: '600', color: colores.textoSecundario },
  valor: { fontSize: 14, color: colores.texto, marginTop: 4, textTransform: 'capitalize' },
  botonSecundario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colores.primario,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 14,
  },
  botonSecundarioTexto: { color: colores.primario, fontWeight: '700', fontSize: 13 },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: colores.peligro,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 14,
  },
  botonTexto: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
