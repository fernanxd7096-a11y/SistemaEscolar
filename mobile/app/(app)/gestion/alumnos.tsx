import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { listarAlumnos } from '@/api/alumnos';
import { BannerEstado } from '@/componentes/BannerEstado';
import { BarraBusqueda, EstadoVacio, Selector } from '@/componentes/formulario';
import { colores } from '@/utils/colores';
import type { Alumno } from '@/tipos';

type FiltroEstado = 'todos' | 'activos' | 'inactivos';

export default function ListaAlumnos() {
  const [busqueda, setBusqueda] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [estado, setEstado] = useState<FiltroEstado>('todos');
  const [pagina, setPagina] = useState(1);

  // El backend pagina de 15 en 15 y filtra en SQL: se manda `buscar` al servidor
  // en vez de filtrar en memoria, para que la búsqueda alcance a todo el padrón y
  // no solo a la página cargada. Un debounce corto evita una petición por tecla.
  useEffect(() => {
    const id = setTimeout(() => {
      setBusquedaAplicada(busqueda.trim());
      setPagina(1);
    }, 350);
    return () => clearTimeout(id);
  }, [busqueda]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['alumnos', busquedaAplicada, estado, pagina],
    queryFn: () =>
      listarAlumnos({
        buscar: busquedaAplicada || undefined,
        estado: estado === 'todos' ? undefined : estado === 'activos',
        page: pagina,
      }),
    // Mantener la página anterior mientras llega la nueva evita que la lista
    // parpadee a vacío al paginar o al cambiar el filtro.
    placeholderData: keepPreviousData,
  });

  const alumnos = data?.data ?? [];
  const totalPaginas = data?.last_page ?? 1;

  const opcionesEstado = useMemo(
    () => [
      { valor: 'todos' as const, etiqueta: 'Todos los estados' },
      { valor: 'activos' as const, etiqueta: 'Solo activos' },
      { valor: 'inactivos' as const, etiqueta: 'Solo inactivos' },
    ],
    []
  );

  const seccionActual = (alumno: Alumno) => {
    const matricula = alumno.secciones?.[alumno.secciones.length - 1];
    if (!matricula) return 'Sin matrícula';
    return `${matricula.grado?.nombre ?? ''} ${matricula.nombre}`.trim();
  };

  return (
    <View style={estilos.contenedor}>
      <BannerEstado />

      <View style={estilos.filtros}>
        <BarraBusqueda
          valor={busqueda}
          onCambiar={setBusqueda}
          placeholder="Buscar por nombre, apellido o DNI"
        />
        <Selector
          etiqueta="Estado"
          valor={estado}
          opciones={opcionesEstado}
          onCambiar={(valor) => {
            setEstado(valor);
            setPagina(1);
          }}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 30 }} color={colores.primario} />
      ) : (
        <FlatList
          data={alumnos}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={estilos.lista}
          refreshControl={
            <RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <EstadoVacio
              icono="people-outline"
              titulo="Sin alumnos"
              descripcion={
                busquedaAplicada
                  ? 'Ningún alumno coincide con la búsqueda.'
                  : 'Todavía no hay alumnos registrados. Usa el botón + para crear el primero.'
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
                  Página {pagina} de {totalPaginas} · {data?.total ?? 0} alumnos
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
                  pathname: '/(app)/gestion/alumno-ficha',
                  params: { id: String(item.id) },
                })
              }
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
                  DNI {item.dni} · {seccionActual(item)}
                </Text>
              </View>
              <View style={[estilos.pastilla, !item.estado && estilos.pastillaInactiva]}>
                <Text style={[estilos.pastillaTexto, !item.estado && estilos.pastillaTextoInactivo]}>
                  {item.estado ? 'Activo' : 'Inactivo'}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}

      <Pressable
        style={estilos.flotante}
        onPress={() => router.push('/(app)/gestion/alumno-formulario')}
      >
        <Ionicons name="add" size={26} color="#fff" />
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  filtros: { padding: 16, paddingBottom: 0, gap: 10 },
  lista: { padding: 16, paddingTop: 6, gap: 8, paddingBottom: 90 },
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
    backgroundColor: '#e8f2fc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: { fontSize: 13, fontWeight: '700', color: colores.primario },
  nombre: { fontSize: 14, fontWeight: '700', color: colores.texto },
  detalle: { fontSize: 11, color: colores.textoSecundario, marginTop: 2 },
  pastilla: {
    backgroundColor: '#e6f6ee',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  pastillaInactiva: { backgroundColor: '#f1f3f7' },
  pastillaTexto: { fontSize: 10, fontWeight: '700', color: colores.exito },
  pastillaTextoInactivo: { color: colores.textoSecundario },
  paginacion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 14,
  },
  paginaBoton: {
    borderWidth: 1,
    borderColor: colores.primario,
    borderRadius: 8,
    padding: 8,
  },
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
