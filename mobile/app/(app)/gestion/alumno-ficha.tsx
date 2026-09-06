import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { eliminarAlumno, obtenerAlumno } from '@/api/alumnos';
import { obtenerBoleta } from '@/api/reportes';
import { compartirBoletaPdf } from '@/api/boletas';
import { BotonPrimario, EstadoVacio } from '@/componentes/formulario';
import { mensajeError } from '@/utils/errores';
import { colores } from '@/utils/colores';

/**
 * Ficha del alumno: datos, historial de matrículas, resumen de notas y descarga
 * de la boleta en PDF.
 */
export default function FichaAlumno() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const alumnoId = Number(id);
  const queryClient = useQueryClient();
  const [descargando, setDescargando] = useState(false);

  const { data: alumno, isLoading } = useQuery({
    queryKey: ['alumno', alumnoId],
    queryFn: () => obtenerAlumno(alumnoId),
  });

  const { data: boleta } = useQuery({
    queryKey: ['boleta', alumnoId],
    queryFn: () => obtenerBoleta(alumnoId),
  });

  const borrar = useMutation({
    mutationFn: () => eliminarAlumno(alumnoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alumnos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      router.back();
    },
    onError: (error) => Alert.alert('No se pudo eliminar', mensajeError(error)),
  });

  const confirmarBorrado = () => {
    Alert.alert(
      'Eliminar alumno',
      `Se eliminará a ${alumno?.nombres} ${alumno?.apellidos} junto con sus matrículas, asistencias y notas. Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => borrar.mutate() },
      ]
    );
  };

  const descargarBoleta = async () => {
    setDescargando(true);
    try {
      await compartirBoletaPdf(alumnoId, {
        nombreArchivo: `boleta-${alumno?.apellidos ?? 'alumno'}-${alumnoId}.pdf`
          .toLowerCase()
          .replace(/\s+/g, '-'),
      });
    } catch (error) {
      Alert.alert('No se pudo generar la boleta', mensajeError(error));
    } finally {
      setDescargando(false);
    }
  };

  if (isLoading) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator color={colores.primario} />
      </View>
    );
  }

  if (!alumno) {
    return <EstadoVacio titulo="Alumno no encontrado" descripcion="Puede que haya sido eliminado." />;
  }

  const matriculas = alumno.secciones ?? [];

  return (
    <ScrollView style={estilos.contenedor} contentContainerStyle={estilos.scroll}>
      <View style={estilos.cabecera}>
        <View style={estilos.avatar}>
          <Text style={estilos.avatarTexto}>
            {(alumno.apellidos?.[0] ?? '') + (alumno.nombres?.[0] ?? '')}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={estilos.nombre}>
            {alumno.apellidos}, {alumno.nombres}
          </Text>
          <Text style={estilos.subtitulo}>DNI {alumno.dni}</Text>
          <View style={[estilos.pastilla, !alumno.estado && estilos.pastillaInactiva]}>
            <Text style={[estilos.pastillaTexto, !alumno.estado && estilos.pastillaTextoInactivo]}>
              {alumno.estado ? 'Activo' : 'Inactivo'}
            </Text>
          </View>
        </View>
      </View>

      <View style={estilos.acciones}>
        <BotonPrimario
          texto="Editar"
          icono="create-outline"
          variante="secundario"
          onPress={() =>
            router.push({
              pathname: '/(app)/gestion/alumno-formulario',
              params: { id: String(alumnoId) },
            })
          }
        />
        <BotonPrimario
          texto="Matricular"
          icono="school-outline"
          onPress={() =>
            router.push({
              pathname: '/(app)/gestion/alumno-matricula',
              params: { id: String(alumnoId) },
            })
          }
        />
      </View>

      <Text style={estilos.tituloSeccion}>Datos</Text>
      <View style={estilos.tarjeta}>
        <Dato etiqueta="Fecha de nacimiento" valor={alumno.fecha_nacimiento?.slice(0, 10)} />
        <Dato
          etiqueta="Género"
          valor={
            alumno.genero === 'M' ? 'Masculino' : alumno.genero === 'F' ? 'Femenino' : alumno.genero
          }
        />
        <Dato etiqueta="Teléfono" valor={alumno.telefono} />
        <Dato etiqueta="Dirección" valor={alumno.direccion} ultimo />
      </View>

      <Text style={estilos.tituloSeccion}>Matrículas</Text>
      {matriculas.length === 0 ? (
        <View style={estilos.tarjeta}>
          <Text style={estilos.vacioTexto}>
            El alumno todavía no está matriculado en ninguna sección.
          </Text>
        </View>
      ) : (
        <View style={estilos.tarjeta}>
          {matriculas.map((matricula, indice) => (
            <View
              key={`${matricula.id}-${matricula.pivot?.['año_escolar'] ?? indice}`}
              style={[estilos.filaDato, indice === matriculas.length - 1 && estilos.filaUltima]}
            >
              <View style={{ flex: 1 }}>
                <Text style={estilos.datoValor}>
                  {matricula.grado?.nombre} — Sección {matricula.nombre}
                </Text>
                <Text style={estilos.datoEtiqueta}>
                  Año escolar {matricula.pivot?.['año_escolar'] ?? '—'}
                </Text>
              </View>
              <Text style={estilos.estadoMatricula}>{matricula.pivot?.estado ?? 'activo'}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={estilos.tituloSeccion}>Boleta de notas</Text>
      <View style={estilos.tarjeta}>
        {boleta && boleta.cursos.length > 0 ? (
          <>
            {boleta.cursos.slice(0, 5).map((curso) => (
              <View key={curso.curso} style={estilos.filaDato}>
                <Text style={[estilos.datoValor, { flex: 1 }]} numberOfLines={1}>
                  {curso.curso}
                </Text>
                <Text
                  style={[
                    estilos.promedio,
                    curso.promedio_final < 11 && { color: colores.peligro },
                  ]}
                >
                  {curso.promedio_final.toFixed(1)}
                </Text>
              </View>
            ))}
            {boleta.cursos.length > 5 && (
              <Text style={estilos.masCursos}>
                y {boleta.cursos.length - 5} curso(s) más en el PDF
              </Text>
            )}
          </>
        ) : (
          <Text style={estilos.vacioTexto}>
            Todavía no hay notas registradas. La boleta se generará vacía.
          </Text>
        )}

        <View style={{ marginTop: 12 }}>
          <BotonPrimario
            texto={descargando ? 'Generando PDF...' : 'Ver / compartir boleta PDF'}
            icono="document-text-outline"
            cargando={descargando}
            onPress={descargarBoleta}
          />
        </View>
      </View>

      <Pressable style={estilos.eliminar} onPress={confirmarBorrado} disabled={borrar.isPending}>
        <Ionicons name="trash-outline" size={16} color={colores.peligro} />
        <Text style={estilos.eliminarTexto}>Eliminar alumno</Text>
      </Pressable>
    </ScrollView>
  );
}

const Dato = ({
  etiqueta,
  valor,
  ultimo,
}: {
  etiqueta: string;
  valor?: string | null;
  ultimo?: boolean;
}) => (
  <View style={[estilos.filaDato, ultimo && estilos.filaUltima]}>
    <Text style={estilos.datoEtiqueta}>{etiqueta}</Text>
    <Text style={estilos.datoValor}>{valor || '—'}</Text>
  </View>
);

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.fondo },
  scroll: { padding: 16, paddingBottom: 40 },
  cabecera: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colores.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: { color: '#fff', fontSize: 19, fontWeight: '700' },
  nombre: { fontSize: 17, fontWeight: '700', color: colores.texto },
  subtitulo: { fontSize: 12, color: colores.textoSecundario, marginTop: 2 },
  pastilla: {
    alignSelf: 'flex-start',
    backgroundColor: '#e6f6ee',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginTop: 6,
  },
  pastillaInactiva: { backgroundColor: '#f1f3f7' },
  pastillaTexto: { fontSize: 10, fontWeight: '700', color: colores.exito },
  pastillaTextoInactivo: { color: colores.textoSecundario },

  acciones: { flexDirection: 'row', gap: 10, marginTop: 16 },

  tituloSeccion: {
    fontSize: 12,
    fontWeight: '700',
    color: colores.textoSecundario,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 22,
    marginBottom: 8,
  },
  tarjeta: {
    backgroundColor: colores.tarjeta,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colores.borde,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  filaDato: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f7',
  },
  filaUltima: { borderBottomWidth: 0 },
  datoEtiqueta: { fontSize: 12, color: colores.textoSecundario },
  datoValor: { fontSize: 13, fontWeight: '600', color: colores.texto },
  estadoMatricula: {
    fontSize: 11,
    fontWeight: '700',
    color: colores.primario,
    textTransform: 'capitalize',
  },
  promedio: { fontSize: 14, fontWeight: '700', color: colores.exito },
  masCursos: { fontSize: 11, color: colores.textoSecundario, paddingVertical: 8 },
  vacioTexto: { fontSize: 12, color: colores.textoSecundario, paddingVertical: 12, lineHeight: 18 },

  eliminar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 26,
    paddingVertical: 12,
  },
  eliminarTexto: { fontSize: 13, fontWeight: '700', color: colores.peligro },
});
