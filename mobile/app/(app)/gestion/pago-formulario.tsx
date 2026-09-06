import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, Pressable } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { actualizarPago, crearPago, eliminarPago, obtenerPago } from '@/api/pagos';
import { SelectorAlumno } from '@/componentes/SelectorAlumno';
import {
  AreaTexto,
  BotonPrimario,
  Campo,
  CampoFecha,
  Selector,
} from '@/componentes/formulario';
import { erroresPorCampo, mensajeError } from '@/utils/errores';
import { colores } from '@/utils/colores';
import type { Alumno, MetodoPago } from '@/tipos';

const METODOS: { valor: MetodoPago; etiqueta: string; descripcion: string }[] = [
  { valor: 'efectivo', etiqueta: 'Efectivo', descripcion: 'Pago en caja' },
  { valor: 'yape', etiqueta: 'Yape', descripcion: 'Billetera móvil — anota el código de operación' },
  { valor: 'plin', etiqueta: 'Plin', descripcion: 'Billetera móvil — anota el código de operación' },
  { valor: 'tarjeta', etiqueta: 'Tarjeta', descripcion: 'Débito o crédito (POS)' },
];

/** Métodos en los que tiene sentido pedir un código de operación. */
const METODOS_CON_REFERENCIA: MetodoPago[] = ['yape', 'plin', 'tarjeta'];

const hoyISO = () => new Date().toISOString().slice(0, 10);

/**
 * Registro y edición de un pago.
 *
 * El concepto y el monto son campos libres a propósito: el colegio cobra por
 * cosas muy variadas (pensión, matrícula, materiales, uniforme, actividades) y
 * ambos quedan editables después de registrado el pago, que es justo lo que
 * permite corregir un cobro mal tipeado sin borrarlo y volver a crearlo.
 */
export default function FormularioPago() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const pagoId = id ? Number(id) : null;
  const esEdicion = pagoId !== null;

  const [alumno, setAlumno] = useState<Alumno | null>(null);
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(hoyISO());
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo');
  const [referencia, setReferencia] = useState('');
  const [observacion, setObservacion] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});

  useEffect(() => {
    navigation.setOptions({ title: esEdicion ? 'Editar pago' : 'Registrar pago' });
  }, [navigation, esEdicion]);

  const { data: pago, isLoading } = useQuery({
    queryKey: ['pago', pagoId],
    queryFn: () => obtenerPago(pagoId as number),
    enabled: esEdicion,
  });

  useEffect(() => {
    if (!pago) return;
    setAlumno(pago.alumno ?? null);
    setConcepto(pago.concepto ?? '');
    setMonto(String(pago.monto ?? ''));
    setFecha(pago.fecha.slice(0, 10));
    setMetodo(pago.metodo_pago);
    setReferencia(pago.referencia ?? '');
    setObservacion(pago.observacion ?? '');
  }, [pago]);

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['pagos-lista'] });
    queryClient.invalidateQueries({ queryKey: ['pagos-resumen-metodo'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
  };

  const guardar = useMutation({
    mutationFn: () => {
      const payload = {
        alumno_id: alumno?.id as number,
        monto: Number(monto.replace(',', '.')),
        concepto: concepto.trim(),
        fecha,
        metodo_pago: metodo,
        referencia: referencia.trim() || null,
        observacion: observacion.trim() || null,
      };

      return esEdicion ? actualizarPago(pagoId as number, payload) : crearPago(payload);
    },
    onSuccess: () => {
      setErrores({});
      invalidar();
      router.back();
    },
    onError: (error) => {
      setErrores(erroresPorCampo(error));
      Alert.alert('No se pudo guardar', mensajeError(error));
    },
  });

  const borrar = useMutation({
    mutationFn: () => eliminarPago(pagoId as number),
    onSuccess: () => {
      invalidar();
      router.back();
    },
    onError: (error) => Alert.alert('No se pudo eliminar', mensajeError(error)),
  });

  const validar = () => {
    const nuevos: Record<string, string> = {};
    if (!alumno) nuevos.alumno_id = 'Elige el alumno que realiza el pago.';
    if (!concepto.trim()) nuevos.concepto = 'Escribe el concepto del pago.';

    const valor = Number(monto.replace(',', '.'));
    if (!monto.trim() || Number.isNaN(valor) || valor <= 0) {
      nuevos.monto = 'Ingresa un monto mayor a 0.';
    } else if (valor > 99999.99) {
      nuevos.monto = 'El monto máximo por pago es S/ 99 999.99.';
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
      <SelectorAlumno
        requerido
        alumno={alumno}
        onSeleccionar={setAlumno}
        error={errores.alumno_id}
      />

      <Campo
        etiqueta="Concepto"
        requerido
        valor={concepto}
        onCambiar={setConcepto}
        error={errores.concepto}
        placeholder="Pensión de setiembre, materiales, uniforme..."
        maxLength={150}
      />

      <Campo
        etiqueta="Monto (S/)"
        requerido
        valor={monto}
        onCambiar={setMonto}
        error={errores.monto}
        keyboardType="decimal-pad"
        placeholder="0.00"
      />

      <Selector
        etiqueta="Método de pago"
        requerido
        valor={metodo}
        onCambiar={setMetodo}
        error={errores.metodo_pago}
        opciones={METODOS.map((item) => ({
          valor: item.valor,
          etiqueta: item.etiqueta,
          descripcion: item.descripcion,
        }))}
      />

      <CampoFecha etiqueta="Fecha del pago" requerido valor={fecha} onCambiar={setFecha} />

      {METODOS_CON_REFERENCIA.includes(metodo) && (
        <Campo
          etiqueta="Código de operación"
          valor={referencia}
          onCambiar={setReferencia}
          error={errores.referencia}
          placeholder="Número de operación o voucher"
          maxLength={50}
          autoCapitalize="characters"
        />
      )}

      <AreaTexto
        etiqueta="Observación"
        valor={observacion}
        onCambiar={setObservacion}
        error={errores.observacion}
        placeholder="Notas internas sobre este pago"
      />

      <BotonPrimario
        texto={esEdicion ? 'Guardar cambios' : 'Registrar pago'}
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
            Alert.alert('Eliminar pago', 'El registro se borrará de forma permanente.', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Eliminar', style: 'destructive', onPress: () => borrar.mutate() },
            ])
          }
        >
          <Ionicons name="trash-outline" size={16} color={colores.peligro} />
          <Text style={estilos.eliminarTexto}>Eliminar pago</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.fondo },
  scroll: { padding: 16, paddingBottom: 40 },
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
