import { View, Text, StyleSheet, Pressable, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { colores } from '@/utils/colores';

/** Tarjeta de indicador del Inicio: icono, valor grande y etiqueta. */
export const TarjetaKpi = ({
  icono,
  etiqueta,
  valor,
  detalle,
  color = colores.primario,
  onPress,
  estilo,
}: {
  icono: ComponentProps<typeof Ionicons>['name'];
  etiqueta: string;
  valor: string | number;
  detalle?: string;
  color?: string;
  onPress?: () => void;
  estilo?: ViewStyle;
}) => {
  const contenido = (
    <>
      <View style={[estilos.icono, { backgroundColor: color + '1a' }]}>
        <Ionicons name={icono} size={17} color={color} />
      </View>
      <Text style={estilos.valor}>{valor}</Text>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      {!!detalle && <Text style={[estilos.detalle, { color }]}>{detalle}</Text>}
    </>
  );

  if (onPress) {
    return (
      <Pressable style={[estilos.tarjeta, estilo]} onPress={onPress}>
        {contenido}
      </Pressable>
    );
  }

  return <View style={[estilos.tarjeta, estilo]}>{contenido}</View>;
};

const estilos = StyleSheet.create({
  tarjeta: {
    flexGrow: 1,
    flexBasis: '30%',
    backgroundColor: colores.tarjeta,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 13,
    gap: 5,
  },
  icono: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  valor: { fontSize: 21, fontWeight: '700', color: colores.texto },
  etiqueta: { fontSize: 11, color: colores.textoSecundario },
  detalle: { fontSize: 10, fontWeight: '700' },
});
