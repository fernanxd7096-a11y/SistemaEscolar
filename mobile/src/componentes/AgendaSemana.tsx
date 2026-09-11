import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { colores } from '@/utils/colores';
import type { AgendaBloque, AgendaDia } from '@/tipos';

/**
 * Pinta la agenda ya resuelta por el backend: un grupo por día, con los bloques
 * en orden y los que quedaron cancelados por un feriado, viaje o suspensión
 * marcados en gris y tachados (en vez de ocultarlos, para que el docente entienda
 * *por qué* no hay clase).
 */

const COLOR_POR_TIPO: Record<string, string> = {
  clase: colores.primario,
  recuperacion: colores.advertencia,
  extracurricular: colores.exito,
  taller: colores.exito,
  tutoria: colores.info,
  viaje: colores.advertencia,
  feriado: colores.peligro,
  suspension: colores.peligro,
  cambio_horario: colores.info,
  otro: colores.textoSecundario,
};

const ETIQUETA_TIPO: Record<string, string> = {
  clase: 'Clase',
  recuperacion: 'Recuperación',
  extracurricular: 'Extracurricular',
  taller: 'Taller',
  tutoria: 'Tutoría',
  viaje: 'Viaje',
  feriado: 'Feriado',
  suspension: 'Suspensión',
  cambio_horario: 'Cambio de horario',
  otro: 'Otro',
};

export const colorDeTipo = (tipo: string) => COLOR_POR_TIPO[tipo] ?? colores.textoSecundario;
export const etiquetaDeTipo = (tipo: string) => ETIQUETA_TIPO[tipo] ?? tipo;

export const BloqueAgenda = ({
  bloque,
  mostrarSeccion,
  onPress,
}: {
  bloque: AgendaBloque;
  mostrarSeccion?: boolean;
  onPress?: () => void;
}) => {
  const color = colorDeTipo(bloque.tipo);

  const contenido = (
    <View style={[estilos.bloque, bloque.cancelado && estilos.bloqueCancelado]}>
      <View style={[estilos.barra, { backgroundColor: bloque.cancelado ? '#c3cad6' : color }]} />
      <View style={estilos.horas}>
        <Text style={[estilos.hora, bloque.cancelado && estilos.textoApagado]}>
          {bloque.hora_inicio ?? '--:--'}
        </Text>
        <Text style={estilos.horaFin}>{bloque.hora_fin ?? ''}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[
            estilos.titulo,
            bloque.cancelado && estilos.textoTachado,
          ]}
          numberOfLines={1}
        >
          {bloque.titulo}
        </Text>
        <Text style={estilos.meta} numberOfLines={1}>
          {[
            mostrarSeccion ? bloque.seccion : null,
            bloque.docente,
            bloque.aula,
          ]
            .filter(Boolean)
            .join(' · ') || etiquetaDeTipo(bloque.tipo)}
        </Text>
        {bloque.cancelado && !!bloque.motivo_cancelacion && (
          <View style={estilos.motivo}>
            <Ionicons name="alert-circle-outline" size={12} color={colores.peligro} />
            <Text style={estilos.motivoTexto} numberOfLines={1}>
              {bloque.motivo_cancelacion}
            </Text>
          </View>
        )}
      </View>
      {bloque.tipo !== 'clase' && !bloque.cancelado && (
        <View style={[estilos.pastillaTipo, { backgroundColor: color + '1a' }]}>
          <Text style={[estilos.pastillaTipoTexto, { color }]}>{etiquetaDeTipo(bloque.tipo)}</Text>
        </View>
      )}
    </View>
  );

  return onPress ? <Pressable onPress={onPress}>{contenido}</Pressable> : contenido;
};

export const DiaAgenda = ({
  dia,
  mostrarSeccion,
  destacado,
}: {
  dia: AgendaDia;
  mostrarSeccion?: boolean;
  destacado?: boolean;
}) => (
  <View style={[estilos.dia, destacado && estilos.diaDestacado]}>
    <View style={estilos.cabeceraDia}>
      <Text style={[estilos.nombreDia, destacado && estilos.nombreDiaDestacado]}>
        {dia.etiqueta_dia} {format(parseISO(dia.fecha), 'd MMM', { locale: es })}
      </Text>
      {dia.es_no_lectivo && (
        <View style={estilos.pastillaNoLectivo}>
          <Text style={estilos.pastillaNoLectivoTexto} numberOfLines={1}>
            {dia.motivo_no_lectivo ?? 'No lectivo'}
          </Text>
        </View>
      )}
    </View>

    {dia.bloques.length === 0 ? (
      <Text style={estilos.sinBloques}>
        {dia.es_fin_semana ? 'Fin de semana' : 'Sin clases programadas'}
      </Text>
    ) : (
      dia.bloques.map((bloque, indice) => (
        <BloqueAgenda
          key={`${bloque.origen}-${bloque.regla_id ?? 0}-${bloque.excepcion_id ?? 0}-${indice}`}
          bloque={bloque}
          mostrarSeccion={mostrarSeccion}
        />
      ))
    )}
  </View>
);

const estilos = StyleSheet.create({
  dia: {
    backgroundColor: colores.tarjeta,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 12,
    marginBottom: 10,
  },
  diaDestacado: { borderColor: colores.primario, borderWidth: 1.5 },
  cabeceraDia: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  nombreDia: { fontSize: 13, fontWeight: '700', color: colores.texto },
  nombreDiaDestacado: { color: colores.primario },
  pastillaNoLectivo: {
    backgroundColor: '#fdecec',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    maxWidth: '58%',
  },
  pastillaNoLectivoTexto: { fontSize: 10, fontWeight: '700', color: colores.peligro },
  sinBloques: { fontSize: 12, color: colores.textoSecundario, paddingVertical: 6 },

  bloque: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  bloqueCancelado: { opacity: 0.75 },
  barra: { width: 3, alignSelf: 'stretch', borderRadius: 2 },
  horas: { width: 44 },
  hora: { fontSize: 12, fontWeight: '700', color: colores.texto },
  horaFin: { fontSize: 10, color: colores.textoSecundario, marginTop: 1 },
  titulo: { fontSize: 13, fontWeight: '600', color: colores.texto },
  textoApagado: { color: colores.textoSecundario },
  textoTachado: { textDecorationLine: 'line-through', color: colores.textoSecundario },
  meta: { fontSize: 11, color: colores.textoSecundario, marginTop: 2 },
  motivo: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  motivoTexto: { fontSize: 10, color: colores.peligro, flex: 1 },
  pastillaTipo: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  pastillaTipoTexto: { fontSize: 9, fontWeight: '700' },
});
