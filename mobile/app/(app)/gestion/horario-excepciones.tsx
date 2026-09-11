import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { eliminarExcepcion, listarExcepciones } from '@/api/horarios';
import { BannerEstado } from '@/componentes/BannerEstado';
import { EstadoVacio } from '@/componentes/formulario';
import { colorDeTipo, etiquetaDeTipo } from '@/componentes/AgendaSemana';
import { mensajeError } from '@/utils/errores';
import { colores } from '@/utils/colores';
import type { HorarioExcepcion } from '@/tipos';

/**
 * Excepciones del horario: feriados, suspensiones, viajes, recuperaciones y
 * actividades puntuales. Las que cancelan quitan bloques de la agenda; las que no,
 * agregan uno nuevo a esa fecha.
 */
export default function ExcepcionesHorario() {
  const queryClient = useQueryClient();

  const { data: excepciones = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['horario-excepciones'],
    queryFn: () => listarExcepciones(),
  });

  const borrar = useMutation({
    mutationFn: (id: number) => eliminarExcepcion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horario-excepciones'] });
      queryClient.invalidateQueries({ queryKey: ['agenda'] });
      queryClient.invalidateQueries({ queryKey: ['mi-agenda'] });
    },
    onError: (error) => Alert.alert('No se pudo eliminar', mensajeError(error)),
  });

  const confirmarBorrado = (excepcion: HorarioExcepcion) => {
    Alert.alert('Eliminar excepción', `Se eliminará "${excepcion.titulo}".`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => borrar.mutate(excepcion.id) },
    ]);
  };

  const fechaLegible = (excepcion: HorarioExcepcion) => {
    const desde = format(parseISO(excepcion.fecha), "d 'de' MMMM yyyy", { locale: es });
    if (!excepcion.fecha_fin || excepcion.fecha_fin === excepcion.fecha) return desde;
    return `${desde} → ${format(parseISO(excepcion.fecha_fin), "d 'de' MMMM yyyy", { locale: es })}`;
  };

  const alcanceLegible = (excepcion: HorarioExcepcion) => {
    if (excepcion.alcance === 'institucional') return 'Todo el colegio';
    if (excepcion.alcance === 'seccion') {
      return excepcion.seccion
        ? `${excepcion.seccion.grado?.nombre ?? ''} ${excepcion.seccion.nombre}`.trim()
        : 'Una sección';
    }
    return excepcion.docente
      ? `${excepcion.docente.nombres} ${excepcion.docente.apellidos}`
      : 'Un docente';
  };

  return (
    <View style={estilos.contenedor}>
      <BannerEstado />

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 30 }} color={colores.primario} />
      ) : (
        <FlatList
          data={excepciones}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={estilos.lista}
          refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} />}
          ListEmptyComponent={
            <EstadoVacio
              icono="alert-circle-outline"
              titulo="Sin excepciones"
              descripcion="Registra feriados, viajes de estudio o clases de recuperación con el botón +."
            />
          }
          renderItem={({ item }) => (
            <Pressable
              style={estilos.tarjeta}
              onPress={() =>
                router.push({
                  pathname: '/(app)/gestion/horario-excepcion-formulario',
                  params: { id: String(item.id) },
                })
              }
            >
              <View style={estilos.cabecera}>
                <View
                  style={[estilos.pastillaTipo, { backgroundColor: colorDeTipo(item.tipo) + '1a' }]}
                >
                  <Text style={[estilos.pastillaTipoTexto, { color: colorDeTipo(item.tipo) }]}>
                    {etiquetaDeTipo(item.tipo)}
                  </Text>
                </View>
                <View
                  style={[
                    estilos.pastillaEfecto,
                    item.cancela_clases ? estilos.efectoCancela : estilos.efectoAgrega,
                  ]}
                >
                  <Text
                    style={[
                      estilos.pastillaEfectoTexto,
                      { color: item.cancela_clases ? colores.peligro : colores.exito },
                    ]}
                  >
                    {item.cancela_clases ? 'Cancela clases' : 'Agrega bloque'}
                  </Text>
                </View>
                <View style={{ flex: 1 }} />
                <Pressable hitSlop={10} onPress={() => confirmarBorrado(item)}>
                  <Ionicons name="trash-outline" size={17} color={colores.peligro} />
                </Pressable>
              </View>

              <Text style={estilos.titulo}>{item.titulo}</Text>
              <Text style={estilos.subtitulo}>{alcanceLegible(item)}</Text>

              <View style={estilos.pie}>
                <Ionicons name="calendar-outline" size={12} color={colores.textoSecundario} />
                <Text style={estilos.pieTexto}>{fechaLegible(item)}</Text>
                {!!item.hora_inicio && (
                  <>
                    <Ionicons name="time-outline" size={12} color={colores.textoSecundario} />
                    <Text style={estilos.pieTexto}>
                      {item.hora_inicio.slice(0, 5)} – {item.hora_fin?.slice(0, 5)}
                    </Text>
                  </>
                )}
              </View>
            </Pressable>
          )}
        />
      )}

      <Pressable
        style={estilos.flotante}
        onPress={() => router.push('/(app)/gestion/horario-excepcion-formulario')}
      >
        <Ionicons name="add" size={26} color="#fff" />
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  lista: { padding: 16, gap: 10, paddingBottom: 90 },
  tarjeta: {
    backgroundColor: colores.tarjeta,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 13,
  },
  cabecera: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  pastillaTipo: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  pastillaTipoTexto: { fontSize: 9, fontWeight: '700' },
  pastillaEfecto: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  efectoCancela: { backgroundColor: '#fdecec' },
  efectoAgrega: { backgroundColor: '#e6f6ee' },
  pastillaEfectoTexto: { fontSize: 9, fontWeight: '700' },
  titulo: { fontSize: 14, fontWeight: '700', color: colores.texto },
  subtitulo: { fontSize: 11, color: colores.textoSecundario, marginTop: 2 },
  pie: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9, flexWrap: 'wrap' },
  pieTexto: { fontSize: 11, color: colores.textoSecundario, marginRight: 6 },
  flotante: {
    position: 'absolute',
    right: 18,
    bottom: 22,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colores.primario,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#0f2540',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
});
