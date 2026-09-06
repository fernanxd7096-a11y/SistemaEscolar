import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { matricularAlumno, obtenerAlumno } from '@/api/alumnos';
import { listarGrados, listarSecciones } from '@/api/grados';
import { BotonPrimario, Campo, Selector } from '@/componentes/formulario';
import { mensajeError } from '@/utils/errores';
import { colores } from '@/utils/colores';

/**
 * Flujo de matrícula: grado → sección → año escolar → estado.
 *
 * Llama a POST /alumnos/{id}/matricular, que hace un updateOrInsert sobre
 * alumno_seccion: repetir la misma sección y año actualiza el estado de la
 * matrícula en vez de duplicarla, así que la pantalla sirve también para
 * registrar un traslado o un retiro.
 */
export default function MatricularAlumno() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const alumnoId = Number(id);
  const queryClient = useQueryClient();

  const [gradoId, setGradoId] = useState<number | null>(null);
  const [seccionId, setSeccionId] = useState<number | null>(null);
  const [anioEscolar, setAnioEscolar] = useState(String(new Date().getFullYear()));
  const [estadoMatricula, setEstadoMatricula] = useState<'activo' | 'retirado' | 'trasladado'>(
    'activo'
  );

  const { data: alumno, isLoading } = useQuery({
    queryKey: ['alumno', alumnoId],
    queryFn: () => obtenerAlumno(alumnoId),
  });

  const { data: grados = [], isLoading: cargandoGrados } = useQuery({
    queryKey: ['grados'],
    queryFn: () => listarGrados(),
  });

  const { data: secciones = [], isLoading: cargandoSecciones } = useQuery({
    queryKey: ['secciones', gradoId],
    queryFn: () => listarSecciones(gradoId ?? undefined),
    enabled: gradoId !== null,
  });

  const matricular = useMutation({
    mutationFn: () =>
      matricularAlumno(alumnoId, {
        seccion_id: seccionId as number,
        'año_escolar': anioEscolar.trim(),
        estado: estadoMatricula,
      }),
    onSuccess: (respuesta) => {
      queryClient.invalidateQueries({ queryKey: ['alumno', alumnoId] });
      queryClient.invalidateQueries({ queryKey: ['alumnos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      Alert.alert('Matrícula registrada', respuesta.mensaje, [
        { text: 'Aceptar', onPress: () => router.back() },
      ]);
    },
    onError: (error) => Alert.alert('No se pudo matricular', mensajeError(error)),
  });

  if (isLoading) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator color={colores.primario} />
      </View>
    );
  }

  const seccionElegida = secciones.find((seccion) => seccion.id === seccionId);
  const gradoElegido = grados.find((grado) => grado.id === gradoId);
  const puedeGuardar = seccionId !== null && anioEscolar.trim().length >= 4;

  return (
    <ScrollView style={estilos.contenedor} contentContainerStyle={estilos.scroll}>
      <View style={estilos.encabezado}>
        <Ionicons name="school-outline" size={20} color={colores.primario} />
        <View style={{ flex: 1 }}>
          <Text style={estilos.alumno}>
            {alumno?.apellidos}, {alumno?.nombres}
          </Text>
          <Text style={estilos.dni}>DNI {alumno?.dni}</Text>
        </View>
      </View>

      <Selector
        etiqueta="1. Grado"
        requerido
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
        etiqueta="2. Sección"
        requerido
        valor={seccionId}
        cargando={cargandoSecciones}
        deshabilitado={gradoId === null}
        placeholder={gradoId === null ? 'Elige primero un grado' : 'Selecciona la sección'}
        onCambiar={setSeccionId}
        opciones={secciones.map((seccion) => ({
          valor: seccion.id,
          etiqueta: `Sección ${seccion.nombre}`,
          descripcion: `${seccion.alumnos_count ?? 0} matriculados · capacidad ${seccion.capacidad}`,
        }))}
      />

      <Campo
        etiqueta="3. Año escolar"
        requerido
        valor={anioEscolar}
        onCambiar={setAnioEscolar}
        keyboardType="number-pad"
        maxLength={4}
      />

      <Selector
        etiqueta="Estado de la matrícula"
        valor={estadoMatricula}
        onCambiar={setEstadoMatricula}
        opciones={[
          { valor: 'activo', etiqueta: 'Activo', descripcion: 'Cursando normalmente' },
          { valor: 'trasladado', etiqueta: 'Trasladado', descripcion: 'Se fue a otra institución' },
          { valor: 'retirado', etiqueta: 'Retirado', descripcion: 'Dejó de asistir' },
        ]}
      />

      {seccionElegida && (
        <View style={estilos.resumen}>
          <Text style={estilos.resumenTitulo}>Resumen</Text>
          <Text style={estilos.resumenTexto}>
            {alumno?.nombres} {alumno?.apellidos} quedará matriculado en{' '}
            <Text style={estilos.resaltado}>
              {gradoElegido?.nombre} — Sección {seccionElegida.nombre}
            </Text>{' '}
            para el año escolar <Text style={estilos.resaltado}>{anioEscolar}</Text>.
          </Text>
          {seccionElegida.alumnos_count !== undefined &&
            seccionElegida.alumnos_count >= seccionElegida.capacidad && (
              <Text style={estilos.aviso}>
                Atención: la sección ya alcanzó su capacidad de {seccionElegida.capacidad}.
              </Text>
            )}
        </View>
      )}

      <BotonPrimario
        texto="Confirmar matrícula"
        icono="checkmark"
        cargando={matricular.isPending}
        deshabilitado={!puedeGuardar}
        onPress={() => matricular.mutate()}
      />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.fondo },
  scroll: { padding: 16, paddingBottom: 40 },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colores.tarjeta,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 14,
    marginBottom: 18,
  },
  alumno: { fontSize: 14, fontWeight: '700', color: colores.texto },
  dni: { fontSize: 11, color: colores.textoSecundario, marginTop: 2 },
  resumen: {
    backgroundColor: '#f2f8fd',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cfe3f5',
    padding: 14,
    marginBottom: 16,
  },
  resumenTitulo: { fontSize: 11, fontWeight: '700', color: colores.primario, marginBottom: 5 },
  resumenTexto: { fontSize: 13, color: colores.texto, lineHeight: 19 },
  resaltado: { fontWeight: '700' },
  aviso: { fontSize: 12, color: colores.advertencia, marginTop: 8, fontWeight: '600' },
});
