import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import {
  actualizarPerfil,
  cambiarPasswordPerfil,
  eliminarFotoPerfil,
  subirFotoPerfil,
} from '@/api/perfil';
import { useAuthStore } from '@/tienda/auth';
import { BotonPrimario, Campo } from '@/componentes/formulario';
import { erroresPorCampo, mensajeError } from '@/utils/errores';
import { colores } from '@/utils/colores';

/**
 * Edición del propio perfil: foto, nombre/apellido y contraseña.
 *
 * Son tres acciones independientes (cada una con su propia mutación) en vez de
 * un único "Guardar todo": subir una foto o cambiar la contraseña son operaciones
 * con semántica y validación distintas a actualizar el nombre, y el usuario puede
 * querer hacer solo una de las tres sin tocar las demás.
 */
export default function EditarPerfil() {
  const usuario = useAuthStore((state) => state.usuario);
  const actualizarUsuario = useAuthStore((state) => state.actualizarUsuario);

  const [nombre, setNombre] = useState(usuario?.nombre ?? '');
  const [apellido, setApellido] = useState(usuario?.apellido ?? '');
  const [erroresDatos, setErroresDatos] = useState<Record<string, string>>({});

  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');
  const [erroresPassword, setErroresPassword] = useState<Record<string, string>>({});

  const mutacionFoto = useMutation({
    mutationFn: (uri: string) => subirFotoPerfil(uri),
    onSuccess: (usuarioActualizado) => actualizarUsuario(usuarioActualizado),
    onError: (error) => Alert.alert('No se pudo subir la foto', mensajeError(error)),
  });

  const mutacionQuitarFoto = useMutation({
    mutationFn: () => eliminarFotoPerfil(),
    onSuccess: (usuarioActualizado) => actualizarUsuario(usuarioActualizado),
    onError: (error) => Alert.alert('No se pudo quitar la foto', mensajeError(error)),
  });

  const mutacionDatos = useMutation({
    mutationFn: () => actualizarPerfil({ nombre: nombre.trim(), apellido: apellido.trim() }),
    onSuccess: (usuarioActualizado) => {
      setErroresDatos({});
      actualizarUsuario(usuarioActualizado);
      Alert.alert('Listo', 'Tus datos se actualizaron correctamente.');
    },
    onError: (error) => {
      setErroresDatos(erroresPorCampo(error));
      Alert.alert('No se pudo guardar', mensajeError(error));
    },
  });

  const mutacionPassword = useMutation({
    mutationFn: () =>
      cambiarPasswordPerfil({
        password_actual: passwordActual,
        password: passwordNueva,
        password_confirmation: passwordConfirmar,
      }),
    onSuccess: () => {
      setErroresPassword({});
      setPasswordActual('');
      setPasswordNueva('');
      setPasswordConfirmar('');
      Alert.alert('Listo', 'Tu contraseña se actualizó correctamente.');
    },
    onError: (error) => {
      setErroresPassword(erroresPorCampo(error));
      Alert.alert('No se pudo cambiar la contraseña', mensajeError(error));
    },
  });

  const elegirFoto = async (origen: 'galeria' | 'camara') => {
    const permiso =
      origen === 'galeria'
        ? await ImagePicker.requestMediaLibraryPermissionsAsync()
        : await ImagePicker.requestCameraPermissionsAsync();

    if (!permiso.granted) {
      Alert.alert(
        'Permiso necesario',
        origen === 'galeria'
          ? 'Activa el permiso de galería para elegir una foto.'
          : 'Activa el permiso de cámara para tomar una foto.'
      );
      return;
    }

    const resultado =
      origen === 'galeria'
        ? await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          })
        : await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });

    if (resultado.canceled || !resultado.assets?.[0]) return;

    mutacionFoto.mutate(resultado.assets[0].uri);
  };

  const mostrarOpcionesFoto = () => {
    Alert.alert('Foto de perfil', undefined, [
      { text: 'Tomar foto', onPress: () => elegirFoto('camara') },
      { text: 'Elegir de la galería', onPress: () => elegirFoto('galeria') },
      ...(usuario?.foto_url
        ? [
            {
              text: 'Quitar foto',
              style: 'destructive' as const,
              onPress: () => mutacionQuitarFoto.mutate(),
            },
          ]
        : []),
      { text: 'Cancelar', style: 'cancel' as const },
    ]);
  };

  const validarDatos = () => {
    const nuevos: Record<string, string> = {};
    if (!nombre.trim()) nuevos.nombre = 'El nombre es obligatorio.';
    if (!apellido.trim()) nuevos.apellido = 'El apellido es obligatorio.';
    setErroresDatos(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const validarPassword = () => {
    const nuevos: Record<string, string> = {};
    if (!passwordActual) nuevos.password_actual = 'Ingresa tu contraseña actual.';
    if (passwordNueva.length < 8) nuevos.password = 'La nueva contraseña necesita al menos 8 caracteres.';
    if (passwordNueva !== passwordConfirmar) {
      nuevos.password_confirmation = 'Las contraseñas no coinciden.';
    }
    setErroresPassword(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const subiendoFoto = mutacionFoto.isPending || mutacionQuitarFoto.isPending;

  return (
    <ScrollView style={estilos.contenedor} contentContainerStyle={estilos.scroll}>
      <View style={estilos.seccionFoto}>
        <Pressable onPress={mostrarOpcionesFoto} disabled={subiendoFoto}>
          {usuario?.foto_url ? (
            <Image source={{ uri: usuario.foto_url }} style={estilos.avatarFoto} />
          ) : (
            <View style={estilos.avatar}>
              <Text style={estilos.avatarTexto}>
                {(usuario?.nombre?.[0] ?? '') + (usuario?.apellido?.[0] ?? '')}
              </Text>
            </View>
          )}
          <View style={estilos.iconoCamara}>
            {subiendoFoto ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera" size={15} color="#fff" />
            )}
          </View>
        </Pressable>
        <Text style={estilos.ayudaFoto}>Toca la foto para cambiarla</Text>
      </View>

      <Text style={estilos.seccionTitulo}>Datos personales</Text>
      <Campo
        etiqueta="Nombre"
        requerido
        valor={nombre}
        onCambiar={setNombre}
        error={erroresDatos.nombre}
        autoCapitalize="words"
      />
      <Campo
        etiqueta="Apellido"
        requerido
        valor={apellido}
        onCambiar={setApellido}
        error={erroresDatos.apellido}
        autoCapitalize="words"
      />
      <BotonPrimario
        texto="Guardar datos"
        icono="checkmark"
        cargando={mutacionDatos.isPending}
        onPress={() => {
          if (validarDatos()) mutacionDatos.mutate();
        }}
      />

      <Text style={estilos.seccionTitulo}>Cambiar contraseña</Text>
      <Campo
        etiqueta="Contraseña actual"
        requerido
        valor={passwordActual}
        onCambiar={setPasswordActual}
        error={erroresPassword.password_actual}
        secureTextEntry
        autoCapitalize="none"
      />
      <Campo
        etiqueta="Nueva contraseña"
        requerido
        valor={passwordNueva}
        onCambiar={setPasswordNueva}
        error={erroresPassword.password}
        secureTextEntry
        autoCapitalize="none"
        placeholder="Mínimo 8 caracteres"
      />
      <Campo
        etiqueta="Confirmar nueva contraseña"
        requerido
        valor={passwordConfirmar}
        onCambiar={setPasswordConfirmar}
        error={erroresPassword.password_confirmation}
        secureTextEntry
        autoCapitalize="none"
      />
      <BotonPrimario
        texto="Cambiar contraseña"
        icono="lock-closed-outline"
        variante="secundario"
        cargando={mutacionPassword.isPending}
        onPress={() => {
          if (validarPassword()) mutacionPassword.mutate();
        }}
      />

      <Pressable style={estilos.volver} onPress={() => router.back()}>
        <Text style={estilos.volverTexto}>Volver a mi perfil</Text>
      </Pressable>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  scroll: { padding: 16, paddingBottom: 40 },
  seccionFoto: { alignItems: 'center', marginBottom: 8 },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colores.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFoto: { width: 92, height: 92, borderRadius: 46, backgroundColor: colores.borde },
  avatarTexto: { color: '#fff', fontSize: 30, fontWeight: '700' },
  iconoCamara: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colores.primario,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colores.fondo,
  },
  ayudaFoto: { fontSize: 12, color: colores.textoSecundario, marginTop: 8 },
  seccionTitulo: {
    fontSize: 12,
    fontWeight: '700',
    color: colores.textoSecundario,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 22,
    marginBottom: 10,
  },
  volver: { alignItems: 'center', paddingVertical: 16 },
  volverTexto: { fontSize: 13, fontWeight: '600', color: colores.textoSecundario },
});
