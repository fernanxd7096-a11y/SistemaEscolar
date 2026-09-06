import { useState } from 'react';
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
import { eliminarRegla, listarReglas } from '@/api/horarios';
import { listarSecciones } from '@/api/grados';
import { BannerEstado } from '@/componentes/BannerEstado';
import { EstadoVacio, Selector } from '@/componentes/formulario';
import { colorDeTipo, etiquetaDeTipo } from '@/componentes/AgendaSemana';
import { mensajeError } from '@/utils/errores';
import { colores } from '@/utils/colores';
import type { HorarioRegla } from '@/tipos';

const ABREVIATURA_DIA: Record<string, string> = {
  lunes: 'Lu',
  martes: 'Ma',
  miercoles: 'Mi',
  jueves: 'Ju',
  viernes: 'Vi',
  sabado: 'Sá',
  domingo: 'Do',
};

/**
 * Reglas recurrentes del horario: cada fila representa "estos días, de tal hora a
 * tal hora, entre estas dos fechas", sin necesidad de crear una entrada por día.
 */
export default function ReglasHorario() {
  const [seccionId, setSeccionId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: secciones = [], isLoading: cargandoSecciones } = useQuery({
    queryKey: ['secciones', null],
    queryFn: () => listarSecciones(),
  });

  const { data: reglas = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['horario-reglas', seccionId],
    queryFn: () => listarReglas(seccionId ? { seccion_id: seccionId } : undefined),
  });

  const borrar = useMutation({
    mutationFn: (id: number) => eliminarRegla(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horario-reglas'] });
      queryClient.invalidateQueries({ queryKey: ['agenda'] });
      queryClient.invalidateQueries({ queryKey: ['horarios'] });
    },
    onError: (error) => Alert.alert('No se pudo eliminar', mensajeError(error)),
  });

  const confirmarBorrado = (regla: HorarioRegla) => {
    Alert.alert(
      'Eliminar regla',
      `Se quitará "${regla.curso?.nombre ?? regla.titulo ?? 'la regla'}" de todas las fechas de su vigencia.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => borrar.mutate(regla.id) },
      ]
    );
  };

  const rangoLegible = (regla: HorarioRegla) =>
    `${format(parseISO(regla.fecha_inicio), 'd MMM yyyy', { locale: es })} → ${format(
      parseISO(regla.fecha_fin),
      'd MMM yyyy',
      { locale: es }
    )}`;

  return (
    <View style={estilos.contenedor}>
      <BannerEstado />

      <View style={estilos.filtros}>
        <Selector
          etiqueta="Filtrar por sección"
          valor={seccionId}
          cargando={cargandoSecciones}
          placeholder="Todas las secciones"
          onCambiar={setSeccionId}
          opciones={[
            { valor: null, etiqueta: 'Todas las secciones' },
            ...secciones.map((seccion) => ({
              valor: seccion.id as number | null,
              etiqueta: `${seccion.grado?.nombre ?? ''} — ${seccion.nombre}`.trim(),
            })),
          ]}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 30 }} color={colores.primario} />
      ) : (
        <FlatList
          data={reglas}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={estilos.lista}
          refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} />}
          ListEmptyComponent={
            <EstadoVacio
              icono="repeat-outline"
              titulo="Sin reglas"
              descripcion="Crea una regla para programar un curso en varios días de la semana durante un rango de fechas."
            />
          }
          renderItem={({ item }) => (
            <Pressable
              style={estilos.tarjeta}
              onPress={() =>
                router.push({
                  pathname: '/(app)/gestion/horario-regla-formulario',
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
                {!item.estado && (
                  <View style={estilos.pastillaInactiva}>
                    <Text style={estilos.pastillaInactivaTexto}>Inactiva</Text>
                  </View>
                )}
                <View style={{ flex: 1 }} />
                <Pressable hitSlop={10} onPress={() => confirmarBorrado(item)}>
                  <Ionicons name="trash-outline" size={17} color={colores.peligro} />
                </Pressable>
              </View>

              <Text style={estilos.titulo}>{item.curso?.nombre ?? item.titulo ?? 'Bloque'}</Text>
              <Text style={estilos.subtitulo}>
                {item.seccion
                  ? `${item.seccion.grado?.nombre ?? ''} ${item.seccion.nombre}`.trim()
                  : 'Sin sección'}
                {item.docente ? ` · ${item.docente.nombres} ${item.docente.apellidos}` : ''}
                {item.aula ? ` · ${item.aula}` : ''}
              </Text>

              <View style={estilos.dias}>
                {item.dias_semana.map((dia) => (
                  <View key={dia} style={estilos.dia}>
                    <Text style={estilos.diaTexto}>{ABREVIATURA_DIA[dia] ?? dia}</Text>
                  </View>
                ))}
                <Text style={estilos.horas}>
                  {item.hora_inicio.slice(0, 5)} – {item.hora_fin.slice(0, 5)}
                </Text>
              </View>

              <View style={estilos.vigencia}>
                <Ionicons name="calendar-outline" size={12} color={colores.textoSecundario} />
                <Text style={estilos.vigenciaTexto}>{rangoLegible(item)}</Text>
              </View>
            </Pressable>
          )}
        />
      )}

      <Pressable
        style={estilos.flotante}
        onPress={() =>
          router.push({
            pathname: '/(app)/gestion/horario-regla-formulario',
            params: seccionId ? { seccionId: String(seccionId) } : {},
          })
        }
      >
        <Ionicons name="add" size={26} color="#fff" />
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  filtros: { padding: 16, paddingBottom: 0 },
  lista: { padding: 16, paddingTop: 4, gap: 10, paddingBottom: 90 },
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
  pastillaInactiva: { backgroundColor: '#f1f3f7', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  pastillaInactivaTexto: { fontSize: 9, fontWeight: '700', color: colores.textoSecundario },
  titulo: { fontSize: 14, fontWeight: '700', color: colores.texto },
  subtitulo: { fontSize: 11, color: colores.textoSecundario, marginTop: 2 },
  dias: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5, marginTop: 9 },
  dia: {
    backgroundColor: '#e8f2fc',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  diaTexto: { fontSize: 10, fontWeight: '700', color: colores.primario },
  horas: { fontSize: 12, fontWeight: '700', color: colores.texto, marginLeft: 4 },
  vigencia: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  vigenciaTexto: { fontSize: 11, color: colores.textoSecundario },
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
