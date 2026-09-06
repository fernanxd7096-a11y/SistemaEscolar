import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useQuery, useMutation, useMutationState } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { obtenerAsistenciaSeccionFecha, registrarAsistenciaMasiva } from '@/api/asistencias';
import { queryClient, CLAVE_MUTACION_ASISTENCIA } from '@/offline/queryClient';
import { BannerEstado } from '@/componentes/BannerEstado';
import { fechaLegible } from '@/utils/fechas';
import { colores } from '@/utils/colores';
import type { AlumnoAsistencia } from '@/tipos';

type Estado = 'presente' | 'tardanza' | 'falta' | 'justificado';

const OPCIONES: { estado: Estado; etiqueta: string; color: string }[] = [
  { estado: 'presente', etiqueta: 'P', color: colores.exito },
  { estado: 'tardanza', etiqueta: 'T', color: colores.advertencia },
  { estado: 'falta', etiqueta: 'F', color: colores.peligro },
  { estado: 'justificado', etiqueta: 'J', color: colores.info },
];

export default function RegistrarAsistenciaScreen() {
  const { seccionId, seccionNombre, fecha } = useLocalSearchParams<{
    seccionId: string;
    seccionNombre: string;
    fecha: string;
  }>();
  const navigation = useNavigation();
  const seccionIdNum = Number(seccionId);

  useEffect(() => {
    navigation.setOptions({ title: seccionNombre || 'Registrar asistencia' });
  }, [navigation, seccionNombre]);

  const { data, isLoading } = useQuery({
    queryKey: ['asistencia-seccion-fecha', seccionIdNum, fecha],
    queryFn: () => obtenerAsistenciaSeccionFecha({ seccion_id: seccionIdNum, fecha }),
  });

  // Si ya existe una mutación encolada (offline) para esta misma sección+fecha, sus
  // valores reflejan lo último que el docente guardó localmente y deben pisar los
  // que vengan del GET (que puede estar sirviendo caché vieja sin conexión).
  const mutacionesEnCurso = useMutationState({
    filters: { mutationKey: CLAVE_MUTACION_ASISTENCIA },
    select: (m) => m,
  });
  const pendienteLocal = mutacionesEnCurso.find((m) => {
    const vars = m.state.variables as { seccion_id: number; fecha: string } | undefined;
    return vars?.seccion_id === seccionIdNum && vars?.fecha === fecha && m.state.isPaused;
  });

  const [estados, setEstados] = useState<Record<number, Estado | null>>({});

  useEffect(() => {
    if (!data) return;
    const base: Record<number, Estado | null> = {};
    for (const a of data.alumnos) base[a.alumno_id] = (a.estado as Estado) ?? null;

    const vars = pendienteLocal?.state.variables as
      | { asistencias: { alumno_id: number; estado: Estado }[] }
      | undefined;
    if (vars) {
      for (const item of vars.asistencias) base[item.alumno_id] = item.estado;
    }
    setEstados(base);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const mutacion = useMutation({
    mutationKey: CLAVE_MUTACION_ASISTENCIA,
    mutationFn: registrarAsistenciaMasiva,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asistencia-seccion-fecha', seccionIdNum, fecha] });
    },
  });

  const alumnos: AlumnoAsistencia[] = data?.alumnos ?? [];
  const totalMarcados = useMemo(
    () => Object.values(estados).filter(Boolean).length,
    [estados]
  );

  const marcarTodosPresentes = () => {
    const nuevo: Record<number, Estado | null> = {};
    for (const a of alumnos) nuevo[a.alumno_id] = 'presente';
    setEstados(nuevo);
  };

  const guardar = () => {
    const asistencias = alumnos
      .filter((a) => estados[a.alumno_id])
      .map((a) => ({ alumno_id: a.alumno_id, estado: estados[a.alumno_id] as Estado }));

    if (asistencias.length === 0) {
      Alert.alert('Nada que guardar', 'Marca al menos un alumno antes de guardar.');
      return;
    }

    mutacion.mutate({ seccion_id: seccionIdNum, fecha, asistencias });
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
    <View style={estilos.contenedor}>
      <BannerEstado />
      <View style={estilos.encabezado}>
        <Text style={estilos.fecha}>{fechaLegible(fecha)}</Text>
        <Text style={estilos.contador}>
          {totalMarcados} / {alumnos.length} marcados
        </Text>
        <Pressable style={estilos.accionRapida} onPress={marcarTodosPresentes}>
          <Ionicons name="checkmark-done" size={14} color={colores.primario} />
          <Text style={estilos.accionRapidaTexto}>Marcar todos presentes</Text>
        </Pressable>
      </View>

      <FlatList
        data={alumnos}
        keyExtractor={(item) => String(item.alumno_id)}
        contentContainerStyle={estilos.lista}
        renderItem={({ item }) => (
          <View style={estilos.fila}>
            <View style={{ flex: 1 }}>
              <Text style={estilos.alumnoNombre}>
                {item.apellidos}, {item.nombres}
              </Text>
              <Text style={estilos.alumnoDni}>{item.dni}</Text>
            </View>
            <View style={estilos.opciones}>
              {OPCIONES.map((op) => {
                const activo = estados[item.alumno_id] === op.estado;
                return (
                  <Pressable
                    key={op.estado}
                    onPress={() =>
                      setEstados((prev) => ({ ...prev, [item.alumno_id]: op.estado }))
                    }
                    style={[
                      estilos.opcionBoton,
                      { borderColor: op.color },
                      activo && { backgroundColor: op.color },
                    ]}
                  >
                    <Text style={[estilos.opcionTexto, activo && { color: '#fff' }, !activo && { color: op.color }]}>
                      {op.etiqueta}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
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
            <Text style={estilos.botonGuardarTexto}>Guardar asistencia</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.fondo },
  encabezado: { padding: 16, gap: 6 },
  fecha: { fontSize: 15, fontWeight: '700', color: colores.texto, textTransform: 'capitalize' },
  contador: { fontSize: 12, color: colores.textoSecundario },
  accionRapida: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  accionRapidaTexto: { fontSize: 12, fontWeight: '600', color: colores.primario },
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
  opciones: { flexDirection: 'row', gap: 6 },
  opcionBoton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opcionTexto: { fontSize: 13, fontWeight: '700' },
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
