import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, Pressable } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { actualizarCurso, crearCurso, eliminarCurso, obtenerCurso } from '@/api/cursos';
import { listarGrados } from '@/api/grados';
import { listarDocentes } from '@/api/docentes';
import {
  AreaTexto,
  BotonPrimario,
  Campo,
  CampoInterruptor,
  Selector,
} from '@/componentes/formulario';
import { erroresPorCampo, mensajeError } from '@/utils/errores';
import { colores } from '@/utils/colores';

/**
 * Alta y edición de cursos.
 *
 * El curso pertenece a un grado (no a una sección): es el plan de estudios del
 * grado, y las reglas del horario lo asignan luego a una sección concreta. Por eso
 * el selector de cursos del formulario de horario filtra por el grado de la sección.
 */
export default function FormularioCurso() {
  const { id, gradoId: gradoInicial } = useLocalSearchParams<{ id?: string; gradoId?: string }>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const cursoId = id ? Number(id) : null;
  const esEdicion = cursoId !== null;

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [gradoId, setGradoId] = useState<number | null>(
    gradoInicial ? Number(gradoInicial) : null
  );
  const [docenteId, setDocenteId] = useState<number | null>(null);
  const [horas, setHoras] = useState('2');
  const [activo, setActivo] = useState(true);
  const [errores, setErrores] = useState<Record<string, string>>({});

  useEffect(() => {
    navigation.setOptions({ title: esEdicion ? 'Editar curso' : 'Nuevo curso' });
  }, [navigation, esEdicion]);

  const { data: curso, isLoading } = useQuery({
    queryKey: ['curso', cursoId],
    queryFn: () => obtenerCurso(cursoId as number),
    enabled: esEdicion,
  });

  useEffect(() => {
    if (!curso) return;
    setNombre(curso.nombre ?? '');
    setDescripcion(curso.descripcion ?? '');
    setGradoId(curso.grado_id);
    setDocenteId(curso.docente_id ?? null);
    setHoras(String(curso.horas_semanales ?? 2));
    setActivo(curso.estado);
  }, [curso]);

  const { data: grados = [], isLoading: cargandoGrados } = useQuery({
    queryKey: ['grados'],
    queryFn: () => listarGrados(),
  });

  const { data: docentesPagina, isLoading: cargandoDocentes } = useQuery({
    queryKey: ['docentes', '', 1],
    queryFn: () => listarDocentes({ page: 1 }),
  });

  const guardar = useMutation({
    mutationFn: () => {
      const payload = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        grado_id: gradoId as number,
        docente_id: docenteId,
        horas_semanales: Number(horas) || 2,
        estado: activo,
      };

      return esEdicion ? actualizarCurso(cursoId as number, payload) : crearCurso(payload);
    },
    onSuccess: () => {
      setErrores({});
      queryClient.invalidateQueries({ queryKey: ['cursos-lista'] });
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      router.back();
    },
    onError: (error) => {
      setErrores(erroresPorCampo(error));
      Alert.alert('No se pudo guardar', mensajeError(error));
    },
  });

  const borrar = useMutation({
    mutationFn: () => eliminarCurso(cursoId as number),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos-lista'] });
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      router.back();
    },
    onError: (error) => Alert.alert('No se pudo eliminar', mensajeError(error)),
  });

  const validar = () => {
    const nuevos: Record<string, string> = {};
    if (!nombre.trim()) nuevos.nombre = 'El nombre del curso es obligatorio.';
    if (!gradoId) nuevos.grado_id = 'Elige el grado al que pertenece.';

    const numeroHoras = Number(horas);
    if (!Number.isInteger(numeroHoras) || numeroHoras < 1 || numeroHoras > 20) {
      nuevos.horas_semanales = 'Indica un número entero entre 1 y 20.';
    }

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
        etiqueta="Nombre del curso"
        requerido
        valor={nombre}
        onCambiar={setNombre}
        error={errores.nombre}
        placeholder="Matemáticas, Comunicación..."
        autoCapitalize="words"
      />

      <Selector
        etiqueta="Grado"
        requerido
        valor={gradoId}
        cargando={cargandoGrados}
        error={errores.grado_id}
        onCambiar={setGradoId}
        opciones={grados.map((grado) => ({
          valor: grado.id,
          etiqueta: grado.nombre,
          descripcion: grado.nivel,
        }))}
      />
      <Text style={estilos.ayuda}>
        No puede haber dos cursos con el mismo nombre dentro de un grado.
      </Text>

      <Selector
        etiqueta="Docente a cargo"
        valor={docenteId}
        cargando={cargandoDocentes}
        placeholder="Sin docente asignado"
        onCambiar={setDocenteId}
        opciones={[
          { valor: null, etiqueta: 'Sin docente asignado' },
          ...(docentesPagina?.data ?? []).map((docente) => ({
            valor: docente.id as number | null,
            etiqueta: `${docente.apellidos}, ${docente.nombres}`,
            descripcion: docente.especialidad ?? undefined,
          })),
        ]}
      />

      <Campo
        etiqueta="Horas semanales"
        requerido
        valor={horas}
        onCambiar={setHoras}
        error={errores.horas_semanales}
        keyboardType="number-pad"
        maxLength={2}
      />

      <AreaTexto
        etiqueta="Descripción"
        valor={descripcion}
        onCambiar={setDescripcion}
        error={errores.descripcion}
        placeholder="Contenidos o notas del área"
      />

      <CampoInterruptor
        etiqueta="Curso activo"
        descripcion="Los cursos inactivos no se ofrecen al programar horarios ni registrar notas."
        valor={activo}
        onCambiar={setActivo}
      />

      <BotonPrimario
        texto={esEdicion ? 'Guardar cambios' : 'Crear curso'}
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
            Alert.alert(
              'Eliminar curso',
              'Se borrarán también sus notas y los bloques de horario que lo usen.',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: () => borrar.mutate() },
              ]
            )
          }
        >
          <Ionicons name="trash-outline" size={16} color={colores.peligro} />
          <Text style={estilos.eliminarTexto}>Eliminar curso</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.fondo },
  scroll: { padding: 16, paddingBottom: 40 },
  ayuda: {
    fontSize: 11,
    color: colores.textoSecundario,
    marginTop: -8,
    marginBottom: 14,
    lineHeight: 16,
  },
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
