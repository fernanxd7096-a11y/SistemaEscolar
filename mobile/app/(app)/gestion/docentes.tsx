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
import { eliminarDocente, listarDocentes } from '@/api/docentes';
import { BannerEstado } from '@/componentes/BannerEstado';
import { BarraBusqueda, EstadoVacio } from '@/componentes/formulario';
import { mensajeError } from '@/utils/errores';
import { colores } from '@/utils/colores';
import type { Docente } from '@/tipos';

export default function ListaDocentes() {
  const [busqueda, setBusqueda] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [pagina, setPagina] = useState(1);
  const queryClient = useQueryClient();

  useEffect(() => {
    const id = setTimeout(() => {
      setBusquedaAplicada(busqueda.trim());
      setPagina(1);
    }, 350);
    return () => clearTimeout(id);
  }, [busqueda]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['docentes', busquedaAplicada, pagina],
    queryFn: () => listarDocentes({ buscar: busquedaAplicada || undefined, page: pagina }),
    placeholderData: keepPreviousData,
  });

  const borrar = useMutation({
    mutationFn: (id: number) => eliminarDocente(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['docentes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
    },
    onError: (error) => Alert.alert('No se pudo eliminar', mensajeError(error)),
  });

  const confirmarBorrado = (docente: Docente) => {
    Alert.alert(
      'Eliminar docente',
      `¿Eliminar a ${docente.nombres} ${docente.apellidos}? Los horarios y cursos que tenga asignados quedarán sin docente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => borrar.mutate(docente.id) },
      ]
    );
  };

  const docentes = data?.data ?? [];
  const totalPaginas = data?.last_page ?? 1;

  return (
    <View style={estilos.contenedor}>
      <BannerEstado />

      <View style={estilos.filtros}>
        <BarraBusqueda
          valor={busqueda}
          onCambiar={setBusqueda}
          placeholder="Buscar por nombre, DNI o especialidad"
        />
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 30 }} color={colores.primario} />
      ) : (
        <FlatList
          data={docentes}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={estilos.lista}
          refreshControl={
            <RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <EstadoVacio
              icono="person-outline"
              titulo="Sin docentes"
              descripcion={
                busquedaAplicada
                  ? 'Ningún docente coincide con la búsqueda.'
                  : 'Registra al personal docente con el botón +.'
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
                  Página {pagina} de {totalPaginas} · {data?.total ?? 0} docentes
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
                  pathname: '/(app)/gestion/docente-formulario',
                  params: { id: String(item.id) },
                })
              }
              onLongPress={() => confirmarBorrado(item)}
            >
              <View style={estilos.avatar}>
                <Text style={estilos.avatarTexto}>
                  {(item.apellidos?.[0] ?? '') + (item.nombres?.[0] ?? '')}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={estilos.nombre}>
                  {item.apellidos}, {item.nombres}
                </Text>
                <Text style={estilos.detalle}>
                  {item.especialidad || 'Sin especialidad'}
                  {item.secciones_tutor_count ? ` · Tutor de ${item.secciones_tutor_count}` : ''}
                </Text>
              </View>
              <Pressable hitSlop={10} onPress={() => confirmarBorrado(item)}>
                <Ionicons name="trash-outline" size={18} color={colores.peligro} />
              </Pressable>
            </Pressable>
          )}
        />
      )}

      <Pressable
        style={estilos.flotante}
        onPress={() => router.push('/(app)/gestion/docente-formulario')}
      >
        <Ionicons name="add" size={26} color="#fff" />
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  filtros: { padding: 16, paddingBottom: 0 },
  lista: { padding: 16, paddingTop: 10, gap: 8, paddingBottom: 90 },
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
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#eef2fb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: { fontSize: 13, fontWeight: '700', color: colores.info },
  nombre: { fontSize: 14, fontWeight: '700', color: colores.texto },
  detalle: { fontSize: 11, color: colores.textoSecundario, marginTop: 2 },
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
