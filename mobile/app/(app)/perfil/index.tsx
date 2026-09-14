import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/tienda/auth';
import { useRol } from '@/hooks/useRol';
import { enviarNotificacionPrueba } from '@/api/pushTokens';
import { obtenerPerfilPadre } from '@/api/perfil';
import { compartirBoletaPdf } from '@/api/boletas';
import { colores } from '@/utils/colores';

export default function PerfilScreen() {
  const usuario = useAuthStore((state) => state.usuario);
  const logout = useAuthStore((state) => state.logout);
  const { esPadre } = useRol();
  const [enviandoPrueba, setEnviandoPrueba] = useState(false);
  const [descargandoHijoId, setDescargandoHijoId] = useState<number | null>(null);

  const { data: perfilPadre, isLoading: cargandoHijos } = useQuery({
    queryKey: ['perfil-padre'],
    queryFn: obtenerPerfilPadre,
    enabled: esPadre,
  });

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

  const handleCompartirBoleta = async (alumnoId: number, nombreAlumno: string) => {
    try {
      setDescargandoHijoId(alumnoId);
      await compartirBoletaPdf(alumnoId, {
        nombreArchivo: `boleta-${nombreAlumno.toLowerCase().replace(/\s+/g, '-')}.pdf`,
      });
    } catch (err: any) {
      Alert.alert(
        'No se pudo obtener la boleta',
        err?.response?.data?.mensaje ?? 'Ocurrió un error al descargar la boleta oficial.'
      );
    } finally {
      setDescargandoHijoId(null);
    }
  };

  const hijos = perfilPadre?.hijos ?? [];

  return (
    <ScrollView style={estilos.contenedor} contentContainerStyle={estilos.scroll}>
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

      {/* --- Sección Mis Hijos (solo para Padres de Familia) --- */}
      {esPadre && (
        <View style={estilos.seccionHijos}>
          <View style={estilos.seccionHeader}>
            <Ionicons name="people" size={18} color={colores.primario} />
            <Text style={estilos.seccionTitulo}>Mis Hijos</Text>
          </View>

          {cargandoHijos ? (
            <ActivityIndicator color={colores.primario} style={{ paddingVertical: 14 }} />
          ) : hijos.length === 0 ? (
            <View style={estilos.tarjetaVacia}>
              <Text style={estilos.textoVacio}>No tienes alumnos vinculados a tu cuenta.</Text>
            </View>
          ) : (
            hijos.map((hijo) => (
              <View key={hijo.id} style={estilos.tarjetaHijo}>
                <View style={estilos.hijoHeaderFila}>
                  <View style={estilos.avatarHijo}>
                    <Ionicons name="school" size={18} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={estilos.hijoNombre}>
                      {hijo.nombres} {hijo.apellidos}
                    </Text>
                    <Text style={estilos.hijoSubtitulo}>
                      {hijo.grado ? `${hijo.grado} · Sección ${hijo.seccion ?? 'A'}` : 'Sin sección asignada'}
                    </Text>
                    <Text style={estilos.hijoDni}>DNI: {hijo.dni}</Text>
                  </View>
                </View>

                <Pressable
                  style={estilos.botonBoletaHijo}
                  onPress={() =>
                    handleCompartirBoleta(hijo.id, `${hijo.nombres} ${hijo.apellidos}`)
                  }
                  disabled={descargandoHijoId === hijo.id}
                >
                  {descargandoHijoId === hijo.id ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Ionicons name="document-text-outline" size={16} color="#fff" />
                  )}
                  <Text style={estilos.botonBoletaHijoTexto}>
                    {descargandoHijoId === hijo.id ? 'Descargando...' : 'Ver / Compartir Boleta'}
                  </Text>
                  <Ionicons name="share-social-outline" size={15} color="rgba(255,255,255,0.8)" />
                </Pressable>
              </View>
            ))
          )}
        </View>
      )}

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
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  scroll: { padding: 20, paddingBottom: 40, alignItems: 'center' },
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

  seccionHijos: {
    width: '100%',
    marginTop: 20,
  },
  seccionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  seccionTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: colores.texto,
  },
  tarjetaVacia: {
    backgroundColor: colores.tarjeta,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 16,
    alignItems: 'center',
  },
  textoVacio: {
    fontSize: 13,
    color: colores.textoSecundario,
  },
  tarjetaHijo: {
    backgroundColor: colores.tarjeta,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 14,
    marginBottom: 12,
  },
  hijoHeaderFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatarHijo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colores.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hijoNombre: {
    fontSize: 14,
    fontWeight: '700',
    color: colores.texto,
  },
  hijoSubtitulo: {
    fontSize: 12,
    color: colores.textoSecundario,
    marginTop: 2,
  },
  hijoDni: {
    fontSize: 11,
    color: colores.textoSecundario,
    marginTop: 1,
  },
  botonBoletaHijo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colores.primario,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  botonBoletaHijoTexto: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

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
