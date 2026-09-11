import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, Pressable } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  actualizarDocente,
  crearDocente,
  eliminarDocente,
  obtenerDocente,
} from '@/api/docentes';
import { BotonPrimario, Campo, CampoInterruptor } from '@/componentes/formulario';
import { erroresPorCampo, mensajeError } from '@/utils/errores';
import { colores } from '@/utils/colores';

export default function FormularioDocente() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const docenteId = id ? Number(id) : null;
  const esEdicion = docenteId !== null;

  const [dni, setDni] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [titulo, setTitulo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [activo, setActivo] = useState(true);
  const [errores, setErrores] = useState<Record<string, string>>({});

  useEffect(() => {
    navigation.setOptions({ title: esEdicion ? 'Editar docente' : 'Nuevo docente' });
  }, [navigation, esEdicion]);

  const { data: docente, isLoading } = useQuery({
    queryKey: ['docente', docenteId],
    queryFn: () => obtenerDocente(docenteId as number),
    enabled: esEdicion,
  });

  useEffect(() => {
    if (!docente) return;
    setDni(docente.dni ?? '');
    setNombres(docente.nombres ?? '');
    setApellidos(docente.apellidos ?? '');
    setEspecialidad(docente.especialidad ?? '');
    setTitulo(docente.titulo ?? '');
    setTelefono(docente.telefono ?? '');
    setEmail(docente.email ?? '');
    setActivo(docente.estado);
  }, [docente]);

  const guardar = useMutation({
    mutationFn: () => {
      const payload = {
        dni: dni.trim(),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        especialidad: especialidad.trim() || null,
        titulo: titulo.trim() || null,
        telefono: telefono.trim() || null,
        email: email.trim() || null,
        estado: activo,
      };

      return esEdicion ? actualizarDocente(docenteId as number, payload) : crearDocente(payload);
    },
    onSuccess: () => {
      setErrores({});
      queryClient.invalidateQueries({ queryKey: ['docentes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      router.back();
    },
    onError: (error) => {
      setErrores(erroresPorCampo(error));
      Alert.alert('No se pudo guardar', mensajeError(error));
    },
  });

  const borrar = useMutation({
    mutationFn: () => eliminarDocente(docenteId as number),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['docentes'] });
      router.back();
    },
    onError: (error) => Alert.alert('No se pudo eliminar', mensajeError(error)),
  });

  const validar = () => {
    const nuevos: Record<string, string> = {};
    if (!dni.trim()) nuevos.dni = 'El DNI es obligatorio.';
    if (!nombres.trim()) nuevos.nombres = 'Los nombres son obligatorios.';
    if (!apellidos.trim()) nuevos.apellidos = 'Los apellidos son obligatorios.';
    if (email.trim() && !email.includes('@')) nuevos.email = 'El correo no parece válido.';

    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  if (esEdicion && isLoading) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator color={colores.primario} />
      </View>
    );
  }

  return (
    <ScrollView style={estilos.contenedor} contentContainerStyle={estilos.scroll}>
      <Campo
        etiqueta="DNI"
        requerido
        valor={dni}
        onCambiar={setDni}
        error={errores.dni}
        keyboardType="number-pad"
        maxLength={20}
      />
      <Campo
        etiqueta="Nombres"
        requerido
        valor={nombres}
        onCambiar={setNombres}
        error={errores.nombres}
        autoCapitalize="words"
      />
      <Campo
        etiqueta="Apellidos"
        requerido
        valor={apellidos}
        onCambiar={setApellidos}
        error={errores.apellidos}
        autoCapitalize="words"
      />
      <Campo
        etiqueta="Especialidad"
        valor={especialidad}
        onCambiar={setEspecialidad}
        error={errores.especialidad}
        placeholder="Matemáticas, Comunicación..."
      />
      <Campo
        etiqueta="Título"
        valor={titulo}
        onCambiar={setTitulo}
        error={errores.titulo}
        placeholder="Lic. en Educación"
      />
      <Campo
        etiqueta="Teléfono"
        valor={telefono}
        onCambiar={setTelefono}
        error={errores.telefono}
        keyboardType="phone-pad"
      />
      <Campo
        etiqueta="Correo"
        valor={email}
        onCambiar={setEmail}
        error={errores.email}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Text style={estilos.ayuda}>
        El correo se usa para vincular al docente con su usuario del sistema y mostrarle
        &ldquo;Mi horario&rdquo;.
      </Text>

      <CampoInterruptor etiqueta="Docente activo" valor={activo} onCambiar={setActivo} />

      <BotonPrimario
        texto={esEdicion ? 'Guardar cambios' : 'Crear docente'}
        icono="checkmark"
        cargando={guardar.isPending}
        onPress={() => {
          if (validar()) guardar.mutate();
        }}
      />

      {esEdicion && (
        <Pressable
          style={estilos.eliminar}
          disabled={borrar.isPending}
          onPress={() =>
            Alert.alert('Eliminar docente', '¿Seguro que deseas eliminar este docente?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Eliminar', style: 'destructive', onPress: () => borrar.mutate() },
            ])
          }
        >
          <Ionicons name="trash-outline" size={16} color={colores.peligro} />
          <Text style={estilos.eliminarTexto}>Eliminar docente</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.fondo },
  scroll: { padding: 16, paddingBottom: 40 },
  ayuda: { fontSize: 11, color: colores.textoSecundario, marginTop: -6, marginBottom: 14, lineHeight: 16 },
  eliminar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 22,
    paddingVertical: 12,
  },
  eliminarTexto: { fontSize: 13, fontWeight: '700', color: colores.peligro },
});
