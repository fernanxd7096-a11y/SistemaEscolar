import { useEffect, useState, type ComponentProps } from 'react';
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
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { eliminarPago, listarPagos, obtenerResumenMetodoPago } from '@/api/pagos';
import { BannerEstado } from '@/componentes/BannerEstado';
import { BarraBusqueda, EstadoVacio, Selector } from '@/componentes/formulario';
import { mensajeError } from '@/utils/errores';
import { colores } from '@/utils/colores';
import type { MetodoPago, Pago } from '@/tipos';

const ETIQUETA_METODO: Record<MetodoPago, string> = {
  yape: 'Yape',
  plin: 'Plin',
  tarjeta: 'Tarjeta',
  efectivo: 'Efectivo',
};

const ICONO_METODO: Record<MetodoPago, React.ComponentProps<typeof Ionicons>['name']> = {
  yape: 'phone-portrait-outline',
  plin: 'phone-portrait-outline',
  tarjeta: 'card-outline',
  efectivo: 'cash-outline',
};

const COLOR_METODO: Record<MetodoPago, string> = {
  yape: '#7c3aed',
  plin: '#0891b2',
  tarjeta: colores.info,
  efectivo: colores.exito,
};

export default function ListaPagos() {
  const [busqueda, setBusqueda] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [metodo, setMetodo] = useState<MetodoPago | null>(null);
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
    queryKey: ['pagos-lista', busquedaAplicada, metodo, pagina],
    queryFn: () =>
      listarPagos({
        buscar: busquedaAplicada || undefined,
        metodo_pago: metodo ?? undefined,
        page: pagina,
      }),
    placeholderData: keepPreviousData,
  });

  const { data: resumen } = useQuery({
    queryKey: ['pagos-resumen-metodo'],
    queryFn: () => obtenerResumenMetodoPago(),
  });

  const borrar = useMutation({
    mutationFn: (id: number) => eliminarPago(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pagos-lista'] });
      queryClient.invalidateQueries({ queryKey: ['pagos-resumen-metodo'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
    },
    onError: (error) => Alert.alert('No se pudo eliminar', mensajeError(error)),
  });

  const confirmarBorrado = (pago: Pago) => {
    Alert.alert(
      'Eliminar pago',
      `¿Eliminar el pago de S/ ${Number(pago.monto).toFixed(2)} por "${pago.concepto}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => borrar.mutate(pago.id) },
      ]
    );
  };

  const pagos = data?.data ?? [];
  const totalPaginas = data?.last_page ?? 1;
  const totalRecaudado = resumen
    ? resumen.yape.total + resumen.plin.total + resumen.tarjeta.total + resumen.efectivo.total
    : 0;

  return (
    <View style={estilos.contenedor}>
      <BannerEstado />

      {resumen && (
        <View style={estilos.resumen}>
          <Text style={estilos.resumenTotal}>S/ {totalRecaudado.toFixed(2)}</Text>
          <Text style={estilos.resumenEtiqueta}>Total recaudado</Text>
          <View style={estilos.resumenMetodos}>
            {(Object.keys(ETIQUETA_METODO) as MetodoPago[]).map((m) => (
              <View key={m} style={estilos.resumenChip}>
                <View style={[estilos.resumenPunto, { backgroundColor: COLOR_METODO[m] }]} />
                <Text style={estilos.resumenChipTexto}>
                  {ETIQUETA_METODO[m]} · S/ {resumen[m].total.toFixed(0)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={estilos.filtros}>
        <BarraBusqueda
          valor={busqueda}
          onCambiar={setBusqueda}
          placeholder="Buscar alumno por nombre o DNI"
        />
        <Selector
          etiqueta="Filtrar por método"
          valor={metodo}
          placeholder="Todos los métodos"
          onCambiar={(valor) => {
            setMetodo(valor);
            setPagina(1);
          }}
          opciones={[
            { valor: null, etiqueta: 'Todos los métodos' },
            ...(Object.keys(ETIQUETA_METODO) as MetodoPago[]).map((m) => ({
              valor: m as MetodoPago | null,
              etiqueta: ETIQUETA_METODO[m],
            })),
          ]}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 30 }} color={colores.primario} />
      ) : (
        <FlatList
          data={pagos}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={estilos.lista}
          refreshControl={
            <RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <EstadoVacio
              icono="cash-outline"
              titulo="Sin pagos registrados"
              descripcion={
                busquedaAplicada || metodo
                  ? 'Ningún pago coincide con los filtros.'
                  : 'Registra el primer pago con el botón +.'
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
                  Página {pagina} de {totalPaginas} · {data?.total ?? 0} pagos
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
                  pathname: '/(app)/gestion/pago-formulario',
                  params: { id: String(item.id) },
                })
              }
              onLongPress={() => confirmarBorrado(item)}
            >
              <View style={[estilos.icono, { backgroundColor: COLOR_METODO[item.metodo_pago] + '1a' }]}>
                <Ionicons
                  name={ICONO_METODO[item.metodo_pago]}
                  size={18}
                  color={COLOR_METODO[item.metodo_pago]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={estilos.concepto} numberOfLines={1}>
                  {item.concepto}
                </Text>
                <Text style={estilos.detalle} numberOfLines={1}>
                  {item.alumno ? `${item.alumno.apellidos}, ${item.alumno.nombres}` : 'Alumno'} ·{' '}
                  {format(parseISO(item.fecha), 'd MMM yyyy', { locale: es })}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={estilos.monto}>S/ {Number(item.monto).toFixed(2)}</Text>
                <Text style={[estilos.metodoTexto, { color: COLOR_METODO[item.metodo_pago] }]}>
                  {ETIQUETA_METODO[item.metodo_pago]}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}

      <Pressable
        style={estilos.flotante}
        onPress={() => router.push('/(app)/gestion/pago-formulario')}
      >
        <Ionicons name="add" size={26} color="#fff" />
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  resumen: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: colores.tarjeta,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 16,
    alignItems: 'center',
  },
  resumenTotal: { fontSize: 24, fontWeight: '700', color: colores.texto },
  resumenEtiqueta: { fontSize: 11, color: colores.textoSecundario, marginTop: 2 },
  resumenMetodos: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 12 },
  resumenChip: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  resumenPunto: { width: 8, height: 8, borderRadius: 4 },
  resumenChipTexto: { fontSize: 11, color: colores.textoSecundario },
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
  icono: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  concepto: { fontSize: 14, fontWeight: '700', color: colores.texto },
  detalle: { fontSize: 11, color: colores.textoSecundario, marginTop: 2 },
  monto: { fontSize: 14, fontWeight: '700', color: colores.texto },
  metodoTexto: { fontSize: 10, fontWeight: '700', marginTop: 2 },
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
