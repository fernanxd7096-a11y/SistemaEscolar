import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useQuery, useMutation, useMutationState } from '@tanstack/react-query';
import { obtenerNotasSeccionCurso, registrarNotasMasivas } from '@/api/notas';
import { queryClient, CLAVE_MUTACION_NOTAS } from '@/offline/queryClient';
import { BannerEstado } from '@/componentes/BannerEstado';
import { colores } from '@/utils/colores';
import type { AlumnoNota } from '@/tipos';

export default function RegistrarNotasScreen() {
  const { seccionId, cursoId, seccionNombre, cursoNombre, bimestre, tipo } = useLocalSearchParams<{
    seccionId: string;
    cursoId: string;
    seccionNombre: string;
    cursoNombre: string;
    bimestre: string;
    tipo: string;
  }>();
  const navigation = useNavigation();
  const seccionIdNum = Number(seccionId);
  const cursoIdNum = Number(cursoId);
  const bimestreNum = Number(bimestre);

  useEffect(() => {
    navigation.setOptions({ title: cursoNombre || 'Registrar notas' });
  }, [navigation, cursoNombre]);

  const { data, isLoading } = useQuery({
    queryKey: ['notas-seccion-curso', seccionIdNum, cursoIdNum, bimestreNum, tipo],
    queryFn: () =>
      obtenerNotasSeccionCurso({ seccion_id: seccionIdNum, curso_id: cursoIdNum, bimestre: bimestreNum, tipo }),
  });

  const mutacionesEnCurso = useMutationState({
    filters: { mutationKey: CLAVE_MUTACION_NOTAS },
    select: (m) => m,
  });
  const pendienteLocal = mutacionesEnCurso.find((m) => {
    const vars = m.state.variables as
      | { seccion_id: number; curso_id: number; bimestre: number; tipo: string }
      | undefined;
    return (
      vars?.seccion_id === seccionIdNum &&
      vars?.curso_id === cursoIdNum &&
      vars?.bimestre === bimestreNum &&
      vars?.tipo === tipo &&
      m.state.isPaused
    );
  });

  const [calificaciones, setCalificaciones] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!data) return;
    const base: Record<number, string> = {};
    for (const a of data.alumnos) base[a.alumno_id] = a.calificacion != null ? String(a.calificacion) : '';

    const vars = pendienteLocal?.state.variables as
      | { notas: { alumno_id: number; calificacion: number }[] }
      | undefined;
    if (vars) {
      for (const item of vars.notas) base[item.alumno_id] = String(item.calificacion);
    }
    setCalificaciones(base);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const mutacion = useMutation({
    mutationKey: CLAVE_MUTACION_NOTAS,
    mutationFn: registrarNotasMasivas,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['notas-seccion-curso', seccionIdNum, cursoIdNum, bimestreNum, tipo],
      });
    },
  });

  const alumnos: AlumnoNota[] = data?.alumnos ?? [];
  const totalMarcados = useMemo(
    () => Object.values(calificaciones).filter((v) => v !== '').length,
    [calificaciones]
  );

  const guardar = () => {
    const notas: { alumno_id: number; calificacion: number }[] = [];
    for (const a of alumnos) {
      const texto = calificaciones[a.alumno_id];
      if (!texto) continue;
      const valor = Number(texto.replace(',', '.'));
      if (Number.isNaN(valor) || valor < 0 || valor > 20) {
        Alert.alert('Nota inválida', `La nota de ${a.nombres} ${a.apellidos} debe estar entre 0 y 20.`);
        return;
      }
      notas.push({ alumno_id: a.alumno_id, calificacion: valor });
    }

    if (notas.length === 0) {
      Alert.alert('Nada que guardar', 'Ingresa al menos una calificación.');
      return;
    }

    mutacion.mutate({ seccion_id: seccionIdNum, curso_id: cursoIdNum, bimestre: bimestreNum, tipo, notas });
  };

  if (isLoading) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator color={colores.primario} />
      </View>
    );
  }

  const guardadoLocalPendiente = mutacion.isPaused || !!pendienteLocal;

  return (
    <KeyboardAvoidingView
      style={estilos.contenedor}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <BannerEstado />
      <View style={estilos.encabezado}>
        <Text style={estilos.subtitulo}>
          {seccionNombre} · {bimestre}° bimestre · {tipo}
        </Text>
        <Text style={estilos.contador}>{totalMarcados} / {alumnos.length} con nota</Text>
      </View>

      <FlatList
        data={alumnos}
        keyExtractor={(item) => String(item.alumno_id)}
        contentContainerStyle={estilos.lista}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <View style={estilos.fila}>
            <View style={{ flex: 1 }}>
              <Text style={estilos.alumnoNombre}>
                {item.apellidos}, {item.nombres}
              </Text>
              <Text style={estilos.alumnoDni}>{item.dni}</Text>
            </View>
            <TextInput
              style={estilos.input}
              keyboardType="decimal-pad"
              maxLength={5}
              placeholder="—"
              placeholderTextColor={colores.textoSecundario}
              value={calificaciones[item.alumno_id] ?? ''}
              onChangeText={(texto) =>
                setCalificaciones((prev) => ({ ...prev, [item.alumno_id]: texto }))
              }
            />
          </View>
        )}
      />

      <View style={estilos.pie}>
        {guardadoLocalPendiente && (
          <Text style={estilos.avisoPendiente}>
            Guardado en el dispositivo. Se enviará automáticamente al recuperar la conexión.
          </Text>
        )}
        <Pressable
          style={[estilos.botonGuardar, mutacion.isPending && !mutacion.isPaused && estilos.botonDeshabilitado]}
          onPress={guardar}
          disabled={mutacion.isPending && !mutacion.isPaused}
        >
          {mutacion.isPending && !mutacion.isPaused ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={estilos.botonGuardarTexto}>Guardar notas</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.fondo },
  encabezado: { padding: 16, gap: 4 },
  subtitulo: { fontSize: 14, fontWeight: '700', color: colores.texto, textTransform: 'capitalize' },
  contador: { fontSize: 12, color: colores.textoSecundario },
  lista: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colores.tarjeta,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  alumnoNombre: { fontSize: 13, fontWeight: '700', color: colores.texto },
  alumnoDni: { fontSize: 11, color: colores.textoSecundario, marginTop: 2 },
  input: {
    width: 56,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 8,
    paddingVertical: 8,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: colores.texto,
    backgroundColor: '#fff',
  },
  pie: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colores.borde,
    backgroundColor: colores.fondo,
  },
  avisoPendiente: { fontSize: 12, color: colores.advertencia, marginBottom: 10, textAlign: 'center' },
  botonGuardar: {
    backgroundColor: colores.primario,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  botonDeshabilitado: { opacity: 0.6 },
  botonGuardarTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
