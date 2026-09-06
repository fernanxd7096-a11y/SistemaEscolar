import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';
import { colores } from '@/utils/colores';

/**
 * Gráfico de dona (anillo) para distribuciones: alumnos por nivel, asistencia
 * del día por estado, etc.
 *
 * Cada porción es un arco dibujado con `strokeDasharray` sobre un único círculo,
 * en vez de con paths: react-native-svg soporta el patrón sin cálculos de arco y
 * el resultado es idéntico. `strokeDashoffset` acumulado va rotando el inicio de
 * cada porción.
 */

export interface PorcionDona {
  clave: string;
  etiqueta: string;
  valor: number;
  color: string;
}

export const GraficoDona = ({
  porciones,
  tamano = 150,
  grosor = 22,
  titulo,
}: {
  porciones: PorcionDona[];
  tamano?: number;
  grosor?: number;
  /** Texto grande del centro; por defecto, el total. */
  titulo?: string;
}) => {
  const visibles = porciones.filter((porcion) => porcion.valor > 0);
  const total = visibles.reduce((suma, porcion) => suma + porcion.valor, 0);

  const radio = (tamano - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const centro = tamano / 2;

  let recorrido = 0;

  return (
    <View style={estilos.contenedor}>
      <Svg width={tamano} height={tamano}>
        {/* Rotar -90° hace que la primera porción empiece arriba y no a la derecha. */}
        <G rotation={-90} origin={`${centro}, ${centro}`}>
          <Circle
            cx={centro}
            cy={centro}
            r={radio}
            stroke={colores.borde}
            strokeWidth={grosor}
            fill="none"
          />

          {total > 0 &&
            visibles.map((porcion) => {
              const largo = (porcion.valor / total) * circunferencia;
              const desfase = -recorrido;
              recorrido += largo;

              return (
                <Circle
                  key={porcion.clave}
                  cx={centro}
                  cy={centro}
                  r={radio}
                  stroke={porcion.color}
                  strokeWidth={grosor}
                  fill="none"
                  strokeDasharray={`${largo} ${circunferencia - largo}`}
                  strokeDashoffset={desfase}
                  strokeLinecap="butt"
                />
              );
            })}
        </G>

        <SvgText
          x={centro}
          y={centro - 2}
          fontSize={20}
          fontWeight="700"
          fill={colores.texto}
          textAnchor="middle"
        >
          {titulo ?? String(total)}
        </SvgText>
        <SvgText
          x={centro}
          y={centro + 14}
          fontSize={10}
          fill={colores.textoSecundario}
          textAnchor="middle"
        >
          total
        </SvgText>
      </Svg>

      <View style={estilos.leyenda}>
        {porciones.map((porcion) => (
          <View key={porcion.clave} style={estilos.leyendaItem}>
            <View style={[estilos.punto, { backgroundColor: porcion.color }]} />
            <Text style={estilos.leyendaTexto} numberOfLines={1}>
              {porcion.etiqueta}
            </Text>
            <Text style={estilos.leyendaValor}>{porcion.valor}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const estilos = StyleSheet.create({
  contenedor: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  leyenda: { flex: 1, gap: 7 },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  punto: { width: 9, height: 9, borderRadius: 3 },
  leyendaTexto: { flex: 1, fontSize: 12, color: colores.textoSecundario },
  leyendaValor: { fontSize: 12, fontWeight: '700', color: colores.texto },
});
