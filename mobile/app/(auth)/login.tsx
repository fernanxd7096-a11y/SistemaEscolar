import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/tienda/auth';
import { colores } from '@/utils/colores';

export default function LoginScreen() {
  const login = useAuthStore((state) => state.login);
  const cargando = useAuthStore((state) => state.cargandoLogin);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const manejarLogin = async () => {
    setError(null);
    if (!email || !password) {
      setError('Ingresa tu correo y contraseña.');
      return;
    }
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      const mensaje =
        err?.response?.data?.errors?.email?.[0] ??
        err?.response?.data?.message ??
        'No se pudo iniciar sesión. Verifica tus credenciales.';
      setError(mensaje);
    }
  };

  return (
    <SafeAreaView style={estilos.contenedor}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={estilos.contenedor}
      >
        <View style={estilos.centro}>
          <View style={estilos.encabezado}>
            <View style={estilos.logoPlaceholder}>
              <Text style={estilos.logoTexto}>SJT</Text>
            </View>
            <Text style={estilos.titulo}>Milagroso San Judas Tadeo</Text>
            <Text style={estilos.subtitulo}>Sistema Escolar — App del docente</Text>
          </View>

          <View style={estilos.formulario}>
            <Text style={estilos.etiqueta}>Correo electrónico</Text>
            <TextInput
              style={estilos.input}
              placeholder="docente@sanjudastadeo.edu.pe"
              placeholderTextColor={colores.textoSecundario}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!cargando}
            />

            <Text style={estilos.etiqueta}>Contraseña</Text>
            <TextInput
              style={estilos.input}
              placeholder="••••••••"
              placeholderTextColor={colores.textoSecundario}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!cargando}
              onSubmitEditing={manejarLogin}
            />

            {error && <Text style={estilos.error}>{error}</Text>}

            <Pressable
              style={({ pressed }) => [estilos.boton, pressed && estilos.botonPresionado]}
              onPress={manejarLogin}
              disabled={cargando}
            >
              {cargando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={estilos.botonTexto}>Ingresar</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  centro: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  encabezado: { alignItems: 'center', marginBottom: 40 },
  logoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colores.primario,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoTexto: { color: '#fff', fontSize: 24, fontWeight: '700' },
  titulo: { fontSize: 20, fontWeight: '700', color: colores.texto, textAlign: 'center' },
  subtitulo: { fontSize: 14, color: colores.textoSecundario, marginTop: 4 },
  formulario: {
    backgroundColor: colores.tarjeta,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  etiqueta: { fontSize: 13, fontWeight: '600', color: colores.textoSecundario, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colores.texto,
    backgroundColor: '#fff',
  },
  error: { color: colores.peligro, marginTop: 14, fontSize: 13 },
  boton: {
    backgroundColor: colores.primario,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 22,
  },
  botonPresionado: { backgroundColor: colores.primarioOscuro },
  botonTexto: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
