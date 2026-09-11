import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { eliminarCurso, listarCursos } from '@/api/cursos';
import { listarGrados } from '@/api/grados';
import { BannerEstado } from '@/componentes/BannerEstado';
import { BarraBusqueda, EstadoVacio, Selector } from '@/componentes/formulario';
import { mensajeError } from '@/utils/errores';
import { colores } from '@/utils/colores';
import type { Curso } from '@/tipos';

export default function ListaCursos() {
  const [busqueda, setBusqueda] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [gradoId, setGradoId] = useState<number | null>(null);
  const [pagina, setPagina] = useState(1);
  const queryClient = useQueryClient();

  // Búsqueda contra el servidor (el backend filtra en SQL y pagina de 15 en 15),
  // con un debounce corto para no lanzar una petición por tecla.
  useEffect(() => {
    const id = setTimeout(() => {
      setBusquedaAplicada(busqueda.trim());
      setPagina(1);
    }, 350);
    return () => clearTimeout(id);
  }, [busqueda]);

  const { data: grados = [], isLoading: cargandoGrados } = useQuery({
    queryKey: ['grados'],
    queryFn: () => listarGrados(),
  });

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['cursos-lista', busquedaAplicada, gradoId, pagina],
    queryFn: () =>
      listarCursos({
        buscar: busquedaAplicada || undefined,
        grado_id: gradoId ?? undefined,
        page: pagina,
      }),
    placeholderData: keepPreviousData,
  });

  const borrar = useMutation({
    mutationFn: (id: number) => eliminarCurso(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos-lista'] });
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
    },
    onError: (error) => Alert.alert('No se pudo eliminar', mensajeError(error)),
  });

  const confirmarBorrado = (curso: Curso) => {
    Alert.alert(
      'Eliminar curso',
      `¿Eliminar "${curso.nombre}"? Se borrarán también sus notas y los bloques de horario que lo usen.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => borrar.mutate(curso.id) },
      ]
    );
  };

  const cursos = data?.data ?? [];
  const totalPaginas = data?.last_page ?? 1;

  return (
    <View style={estilos.contenedor}>
      <BannerEstado />

      <View style={estilos.filtros}>
        <BarraBusqueda
          valor={busqueda}
          onCambiar={setBusqueda}
          placeholder="Buscar por nombre o descripción"
        />
        <Selector
          etiqueta="Filtrar por grado"
          valor={gradoId}
          cargando={cargandoGrados}
          placeholder="Todos los grados"
          onCambiar={(valor) => {
            setGradoId(valor);
            setPagina(1);
          }}
          opciones={[
            { valor: null, etiqueta: 'Todos los grados' },
            ...grados.map((grado) => ({
              valor: grado.id as number | null,
              etiqueta: grado.nombre,
              descripcion: grado.nivel,
            })),
          ]}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 30 }} color={colores.primario} />
      ) : (
        <FlatList
          data={cursos}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={estilos.lista}
          refreshControl={
            <RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <EstadoVacio
              icono="book-outline"
              titulo="Sin cursos"
              descripcion={
                busquedaAplicada || gradoId
                  ? 'Ningún curso coincide con los filtros.'
                  : 'Registra las áreas del plan de estudios con el botón +.'
              }
            />
          }
          ListFooterComponent={
            totalPaginas > 1 ? (
              <View style={estilos.paginacion}>
                <Pressable
                  style={[estilos.paginaBoton, pagina <= 1 && estilos.paginaDeshabilitada]}
                  disabled={pagina <= 1}
                  onPress={() => setPagina((p) => p - 1)}
                >
                  <Ionicons name="chevron-back" size={16} color={colores.primario} />
                </Pressable>
                <Text style={estilos.paginaTexto}>
                  Página {pagina} de {totalPaginas} · {data?.total ?? 0} cursos
                </Text>
                <Pressable
                  style={[estilos.paginaBoton, pagina >= totalPaginas && estilos.paginaDeshabilitada]}
                  disabled={pagina >= totalPaginas}
                  onPress={() => setPagina((p) => p + 1)}
                >
                  <Ionicons name="chevron-forward" size={16} color={colores.primario} />
                </Pressable>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              style={estilos.fila}
              onPress={() =>
                router.push({
                  pathname: '/(app)/gestion/curso-formulario',
                  params: { id: String(item.id) },
                })
              }
              onLongPress={() => confirmarBorrado(item)}
            >
              <View style={estilos.icono}>
                <Ionicons name="book-outline" size={18} color={colores.exito} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={estilos.nombre}>{item.nombre}</Text>
                <Text style={estilos.detalle} numberOfLines={1}>
                  {item.grado?.nombre ?? 'Sin grado'} · {item.horas_semanales} h/sem
                  {item.docente ? ` · ${item.docente.apellidos}` : ' · sin docente'}
                </Text>
              </View>
              {!item.estado && (
                <View style={estilos.pastillaInactiva}>
                  <Text style={estilos.pastillaInactivaTexto}>Inactivo</Text>
                </View>
              )}
              <Pressable hitSlop={10} onPress={() => confirmarBorrado(item)}>
                <Ionicons name="trash-outline" size={18} color={colores.peligro} />
              </Pressable>
            </Pressable>
          )}
        />
      )}

      <Pressable
        style={estilos.flotante}
        onPress={() =>
          router.push({
            pathname: '/(app)/gestion/curso-formulario',
            params: gradoId ? { gradoId: String(gradoId) } : {},
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
  filtros: { padding: 16, paddingBottom: 0, gap: 10 },
  lista: { padding: 16, paddingTop: 4, gap: 8, paddingBottom: 90 },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colores.tarjeta,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 12,
  },
  icono: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#e6f6ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nombre: { fontSize: 14, fontWeight: '700', color: colores.texto },
  detalle: { fontSize: 11, color: colores.textoSecundario, marginTop: 2 },
  pastillaInactiva: {
    backgroundColor: '#f1f3f7',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  pastillaInactivaTexto: { fontSize: 10, fontWeight: '700', color: colores.textoSecundario },
  paginacion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 14,
  },
  paginaBoton: { borderWidth: 1, borderColor: colores.primario, borderRadius: 8, padding: 8 },
  paginaDeshabilitada: { opacity: 0.35 },
  paginaTexto: { fontSize: 12, color: colores.textoSecundario },
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
