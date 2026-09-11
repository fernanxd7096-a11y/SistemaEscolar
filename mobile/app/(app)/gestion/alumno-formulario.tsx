import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { actualizarAlumno, crearAlumno, obtenerAlumno } from '@/api/alumnos';
import { listarGrados, listarSecciones } from '@/api/grados';
import {
  BotonPrimario,
  Campo,
  CampoFecha,
  CampoInterruptor,
  Selector,
} from '@/componentes/formulario';
import { erroresPorCampo, mensajeError } from '@/utils/errores';
import { colores } from '@/utils/colores';

/**
 * Alta y edición de alumnos.
 *
 * Al crear, el backend (AlumnoControlador::store) acepta `seccion_id` y
 * `año_escolar` opcionales y matricula al alumno en el mismo POST; por eso el
 * formulario ofrece grado y sección como paso opcional. Al editar, la matrícula
 * se cambia desde la ficha con el flujo dedicado, que es más explícito.
 */
export default function FormularioAlumno() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const alumnoId = id ? Number(id) : null;
  const esEdicion = alumnoId !== null;

  const [dni, setDni] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [genero, setGenero] = useState<'M' | 'F' | 'O' | null>(null);
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [activo, setActivo] = useState(true);
  const [gradoId, setGradoId] = useState<number | null>(null);
  const [seccionId, setSeccionId] = useState<number | null>(null);
  const [anioEscolar, setAnioEscolar] = useState(String(new Date().getFullYear()));
  const [errores, setErrores] = useState<Record<string, string>>({});

  useEffect(() => {
    navigation.setOptions({ title: esEdicion ? 'Editar alumno' : 'Nuevo alumno' });
  }, [navigation, esEdicion]);

  const { data: alumno, isLoading } = useQuery({
    queryKey: ['alumno', alumnoId],
    queryFn: () => obtenerAlumno(alumnoId as number),
    enabled: esEdicion,
  });

  useEffect(() => {
    if (!alumno) return;
    setDni(alumno.dni ?? '');
    setNombres(alumno.nombres ?? '');
    setApellidos(alumno.apellidos ?? '');
    setFechaNacimiento(alumno.fecha_nacimiento?.slice(0, 10) ?? '');
    setGenero(alumno.genero ?? null);
    setDireccion(alumno.direccion ?? '');
    setTelefono(alumno.telefono ?? '');
    setActivo(alumno.estado);
  }, [alumno]);

  const { data: grados = [], isLoading: cargandoGrados } = useQuery({
    queryKey: ['grados'],
    queryFn: () => listarGrados(),
    enabled: !esEdicion,
  });

  const { data: secciones = [], isLoading: cargandoSecciones } = useQuery({
    queryKey: ['secciones', gradoId],
    queryFn: () => listarSecciones(gradoId ?? undefined),
    enabled: !esEdicion && gradoId !== null,
  });

  const guardar = useMutation({
    mutationFn: async () => {
      const base = {
        dni: dni.trim(),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        fecha_nacimiento: fechaNacimiento || null,
        genero,
        direccion: direccion.trim() || null,
        telefono: telefono.trim() || null,
        estado: activo,
      };

      if (esEdicion) {
        return actualizarAlumno(alumnoId as number, base);
      }

      return crearAlumno({
        ...base,
        ...(seccionId ? { seccion_id: seccionId, 'año_escolar': anioEscolar } : {}),
      });
    },
    onSuccess: (alumnoGuardado) => {
      setErrores({});
      queryClient.invalidateQueries({ queryKey: ['alumnos'] });
      queryClient.invalidateQueries({ queryKey: ['alumno', alumnoGuardado.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });

      if (esEdicion) {
        router.back();
      } else {
        router.replace({
          pathname: '/(app)/gestion/alumno-ficha',
          params: { id: String(alumnoGuardado.id) },
        });
      }
    },
    onError: (error) => {
      setErrores(erroresPorCampo(error));
      Alert.alert('No se pudo guardar', mensajeError(error));
    },
  });

  const validar = () => {
    const nuevos: Record<string, string> = {};
    if (!dni.trim()) nuevos.dni = 'El DNI es obligatorio.';
    if (!nombres.trim()) nuevos.nombres = 'Los nombres son obligatorios.';
    if (!apellidos.trim()) nuevos.apellidos = 'Los apellidos son obligatorios.';

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
      <Text style={estilos.seccion}>Datos personales</Text>

      <Campo
        etiqueta="DNI"
        requerido
        valor={dni}
        onCambiar={setDni}
        error={errores.dni}
        keyboardType="number-pad"
        maxLength={20}
        placeholder="12345678"
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
      <CampoFecha
        etiqueta="Fecha de nacimiento"
        valor={fechaNacimiento}
        onCambiar={setFechaNacimiento}
        error={errores.fecha_nacimiento}
      />
      <Selector
        etiqueta="Género"
        valor={genero}
        onCambiar={setGenero}
        error={errores.genero}
        opciones={[
          { valor: 'M', etiqueta: 'Masculino' },
          { valor: 'F', etiqueta: 'Femenino' },
          { valor: 'O', etiqueta: 'Otro' },
        ]}
      />

      <Text style={estilos.seccion}>Contacto</Text>
      <Campo
        etiqueta="Dirección"
        valor={direccion}
        onCambiar={setDireccion}
        error={errores.direccion}
      />
      <Campo
        etiqueta="Teléfono"
        valor={telefono}
        onCambiar={setTelefono}
        error={errores.telefono}
        keyboardType="phone-pad"
      />

      <CampoInterruptor
        etiqueta="Alumno activo"
        descripcion="Los alumnos inactivos no aparecen en asistencia ni en notas."
        valor={activo}
        onCambiar={setActivo}
      />

      {!esEdicion && (
        <>
          <Text style={estilos.seccion}>Matrícula (opcional)</Text>
          <Text style={estilos.ayuda}>
            Puedes matricular al alumno ahora o hacerlo después desde su ficha.
          </Text>

          <Selector
            etiqueta="Grado"
            valor={gradoId}
            cargando={cargandoGrados}
            onCambiar={(valor) => {
              setGradoId(valor);
              setSeccionId(null);
            }}
            opciones={grados.map((grado) => ({
              valor: grado.id,
              etiqueta: grado.nombre,
              descripcion: grado.nivel,
            }))}
          />
          <Selector
            etiqueta="Sección"
            valor={seccionId}
            cargando={cargandoSecciones}
            deshabilitado={gradoId === null}
            placeholder={gradoId === null ? 'Elige primero un grado' : 'Selecciona la sección'}
            onCambiar={setSeccionId}
            opciones={secciones.map((seccion) => ({
              valor: seccion.id,
              etiqueta: seccion.nombre,
              descripcion: `Capacidad ${seccion.capacidad}`,
            }))}
          />
          <Campo
            etiqueta="Año escolar"
            valor={anioEscolar}
            onCambiar={setAnioEscolar}
            keyboardType="number-pad"
            maxLength={4}
          />
        </>
      )}

      <BotonPrimario
        texto={esEdicion ? 'Guardar cambios' : 'Crear alumno'}
        icono="checkmark"
        cargando={guardar.isPending}
        onPress={() => {
          if (validar()) guardar.mutate();
        }}
      />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.fondo },
  scroll: { padding: 16, paddingBottom: 40 },
  seccion: {
    fontSize: 13,
    fontWeight: '700',
    color: colores.texto,
    marginTop: 8,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  ayuda: { fontSize: 12, color: colores.textoSecundario, marginTop: -6, marginBottom: 12 },
});
