import { View, Text, StyleSheet } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { colores } from '@/utils/colores';

/**
 * Gráfico de barras verticales, apiladas opcionalmente.
 *
 * Está construido sobre react-native-svg en vez de una librería de charts porque
 * react-native-svg viene incluido en Expo Go y lo versiona el propio SDK, mientras
 * que las alternativas habituales o arrastran módulos nativos que Expo Go no trae
 * (react-native-gifted-charts necesita react-native-linear-gradient) o llevan años
 * sin publicar una versión probada contra React 19 / RN 0.86 (react-native-chart-kit).
 * A cambio de escribir ~100 líneas, el gráfico usa exactamente la paleta de
 * src/utils/colores y no añade riesgo de compatibilidad.
 */

export interface SerieBarra {
  clave: string;
  etiqueta: string;
  color: string;
}

export interface DatoBarra {
  etiqueta: string;
  valores: Record<string, number>;
}

export const GraficoBarras = ({
  datos,
  series,
  alto = 170,
  ancho,
}: {
  datos: DatoBarra[];
  series: SerieBarra[];
  alto?: number;
  /** Ancho disponible; el gráfico se estira al contenedor cuando se le pasa. */
  ancho: number;
}) => {
  const margenIzq = 26;
  const margenInf = 22;
  const margenSup = 8;

  const anchoUtil = Math.max(ancho - margenIzq - 6, 40);
  const altoUtil = Math.max(alto - margenInf - margenSup, 30);

  const totales = datos.map((dato) =>
    series.reduce((suma, serie) => suma + (dato.valores[serie.clave] ?? 0), 0)
  );
  // Un máximo mínimo de 1 evita dividir entre cero cuando todavía no hay registros.
  const maximo = Math.max(1, ...totales);

  const pasoX = anchoUtil / Math.max(datos.length, 1);
  const anchoBarra = Math.min(pasoX * 0.6, 26);

  // Tres líneas guía: 0, la mitad y el máximo.
  const guias = [0, maximo / 2, maximo];

  return (
    <View>
      <Svg width={ancho} height={alto}>
        {guias.map((guia) => {
          const y = margenSup + altoUtil - (guia / maximo) * altoUtil;
          return (
            <G key={guia}>
              <Line
                x1={margenIzq}
                y1={y}
                x2={ancho - 4}
                y2={y}
                stroke={colores.borde}
                strokeWidth={1}
              />
              <SvgText x={0} y={y + 3.5} fontSize={9} fill={colores.textoSecundario}>
                {Math.round(guia)}
              </SvgText>
            </G>
          );
        })}

        {datos.map((dato, indice) => {
          const x = margenIzq + indice * pasoX + (pasoX - anchoBarra) / 2;
          let acumulado = 0;

          return (
            <G key={`${dato.etiqueta}-${indice}`}>
              {series.map((serie) => {
                const valor = dato.valores[serie.clave] ?? 0;
                if (valor <= 0) return null;

                const altoSegmento = (valor / maximo) * altoUtil;
                acumulado += altoSegmento;
                const y = margenSup + altoUtil - acumulado;

                return (
                  <Rect
                    key={serie.clave}
                    x={x}
                    y={y}
                    width={anchoBarra}
                    height={Math.max(altoSegmento, 1)}
                    fill={serie.color}
                    rx={2}
                  />
                );
              })}

              <SvgText
                x={x + anchoBarra / 2}
                y={alto - 6}
                fontSize={9}
                fill={colores.textoSecundario}
                textAnchor="middle"
              >
                {dato.etiqueta}
              </SvgText>
            </G>
          );
        })}
      </Svg>

      <View style={estilos.leyenda}>
        {series.map((serie) => (
          <View key={serie.clave} style={estilos.leyendaItem}>
            <View style={[estilos.punto, { backgroundColor: serie.color }]} />
            <Text style={estilos.leyendaTexto}>{serie.etiqueta}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const estilos = StyleSheet.create({
  leyenda: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  punto: { width: 9, height: 9, borderRadius: 3 },
  leyendaTexto: { fontSize: 11, color: colores.textoSecundario },
});
