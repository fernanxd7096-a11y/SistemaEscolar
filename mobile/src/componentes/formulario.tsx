import { useState, type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { format, parse, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { colores } from '@/utils/colores';

/**
 * Piezas de formulario compartidas por las pantallas de gestión.
 *
 * React Native no trae un `<select>`: el selector se resuelve con un Modal y una
 * lista, que además funciona igual en Android e iOS (a diferencia del Picker
 * nativo, que se ve muy distinto en cada plataforma).
 */

export const Campo = ({
  etiqueta,
  valor,
  onCambiar,
  placeholder,
  error,
  requerido,
  alto,
  ...resto
}: {
  etiqueta: string;
  valor: string;
  onCambiar: (texto: string) => void;
  placeholder?: string;
  error?: string;
  requerido?: boolean;
  alto?: boolean;
} & Omit<ComponentProps<typeof TextInput>, 'value' | 'onChangeText' | 'style'>) => (
  <View style={estilos.grupo}>
    <Text style={estilos.etiqueta}>
      {etiqueta}
      {requerido && <Text style={estilos.asterisco}> *</Text>}
    </Text>
    <TextInput
      style={[estilos.input, alto && estilos.inputAlto, !!error && estilos.inputError]}
      value={valor}
      onChangeText={onCambiar}
      placeholder={placeholder}
      placeholderTextColor="#9aa3b0"
      {...resto}
    />
    {!!error && <Text style={estilos.error}>{error}</Text>}
  </View>
);

export const AreaTexto = (props: ComponentProps<typeof Campo>) => (
  <Campo {...props} alto multiline numberOfLines={4} textAlignVertical="top" />
);

export interface OpcionSelector<T> {
  valor: T;
  etiqueta: string;
  descripcion?: string;
}

export function Selector<T extends string | number | null>({
  etiqueta,
  valor,
  opciones,
  onCambiar,
  placeholder = 'Selecciona una opción',
  error,
  requerido,
  cargando,
  deshabilitado,
}: {
  etiqueta: string;
  valor: T;
  opciones: OpcionSelector<T>[];
  onCambiar: (valor: T) => void;
  placeholder?: string;
  error?: string;
  requerido?: boolean;
  cargando?: boolean;
  deshabilitado?: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const seleccionada = opciones.find((opcion) => opcion.valor === valor);

  return (
    <View style={estilos.grupo}>
      <Text style={estilos.etiqueta}>
        {etiqueta}
        {requerido && <Text style={estilos.asterisco}> *</Text>}
      </Text>

      <Pressable
        style={[
          estilos.input,
          estilos.selector,
          !!error && estilos.inputError,
          deshabilitado && estilos.deshabilitado,
        ]}
        onPress={() => !deshabilitado && setAbierto(true)}
      >
        {cargando ? (
          <ActivityIndicator size="small" color={colores.primario} />
        ) : (
          <Text style={[estilos.selectorTexto, !seleccionada && estilos.placeholder]}>
            {seleccionada?.etiqueta ?? placeholder}
          </Text>
        )}
        <Ionicons name="chevron-down" size={16} color={colores.textoSecundario} />
      </Pressable>

      {!!error && <Text style={estilos.error}>{error}</Text>}

      <Modal visible={abierto} transparent animationType="slide" onRequestClose={() => setAbierto(false)}>
        <Pressable style={estilos.fondoModal} onPress={() => setAbierto(false)}>
          <Pressable style={estilos.hojaModal} onPress={(evento) => evento.stopPropagation()}>
            <View style={estilos.cabeceraModal}>
              <Text style={estilos.tituloModal}>{etiqueta}</Text>
              <Pressable onPress={() => setAbierto(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={colores.textoSecundario} />
              </Pressable>
            </View>

            <FlatList
              data={opciones}
              keyExtractor={(opcion) => String(opcion.valor)}
              ListEmptyComponent={<Text style={estilos.vacioModal}>No hay opciones disponibles.</Text>}
              renderItem={({ item }) => {
                const activa = item.valor === valor;
                return (
                  <Pressable
                    style={[estilos.opcion, activa && estilos.opcionActiva]}
                    onPress={() => {
                      onCambiar(item.valor);
                      setAbierto(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[estilos.opcionTexto, activa && estilos.opcionTextoActivo]}>
                        {item.etiqueta}
                      </Text>
                      {!!item.descripcion && (
                        <Text style={estilos.opcionDescripcion}>{item.descripcion}</Text>
                      )}
                    </View>
                    {activa && <Ionicons name="checkmark" size={18} color={colores.primario} />}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/** Selección múltiple compacta: los días de la semana de una regla recurrente. */
export function SelectorChips<T extends string>({
  etiqueta,
  valores,
  opciones,
  onCambiar,
  error,
  requerido,
}: {
  etiqueta: string;
  valores: T[];
  opciones: { valor: T; etiqueta: string }[];
  onCambiar: (valores: T[]) => void;
  error?: string;
  requerido?: boolean;
}) {
  const alternar = (valor: T) =>
    onCambiar(valores.includes(valor) ? valores.filter((v) => v !== valor) : [...valores, valor]);

  return (
    <View style={estilos.grupo}>
      <Text style={estilos.etiqueta}>
        {etiqueta}
        {requerido && <Text style={estilos.asterisco}> *</Text>}
      </Text>
      <View style={estilos.chips}>
        {opciones.map((opcion) => {
          const activo = valores.includes(opcion.valor);
          return (
            <Pressable
              key={opcion.valor}
              style={[estilos.chip, activo && estilos.chipActivo]}
              onPress={() => alternar(opcion.valor)}
            >
              <Text style={[estilos.chipTexto, activo && estilos.chipTextoActivo]}>
                {opcion.etiqueta}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {!!error && <Text style={estilos.error}>{error}</Text>}
    </View>
  );
}

/** Fecha en formato ISO (yyyy-MM-dd), que es lo que espera el backend. */
export const CampoFecha = ({
  etiqueta,
  valor,
  onCambiar,
  error,
  requerido,
  minima,
}: {
  etiqueta: string;
  valor: string;
  onCambiar: (iso: string) => void;
  error?: string;
  requerido?: boolean;
  minima?: string;
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <View style={estilos.grupo}>
      <Text style={estilos.etiqueta}>
        {etiqueta}
        {requerido && <Text style={estilos.asterisco}> *</Text>}
      </Text>
      <Pressable
        style={[estilos.input, estilos.selector, !!error && estilos.inputError]}
        onPress={() => setVisible(true)}
      >
        <Text style={estilos.selectorTexto}>
          {valor ? format(parseISO(valor), "d 'de' MMMM yyyy", { locale: es }) : 'Selecciona la fecha'}
        </Text>
        <Ionicons name="calendar-outline" size={16} color={colores.primario} />
      </Pressable>
      {!!error && <Text style={estilos.error}>{error}</Text>}

      {visible && (
        <DateTimePicker
          value={valor ? parseISO(valor) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={minima ? parseISO(minima) : undefined}
          onChange={(evento, fecha) => {
            setVisible(Platform.OS === 'ios' && evento.type !== 'set');
            if (evento.type === 'set' && fecha) onCambiar(format(fecha, 'yyyy-MM-dd'));
          }}
        />
      )}
    </View>
  );
};

/** Hora en formato HH:mm, que es lo que valida el backend (date_format:H:i). */
export const CampoHora = ({
  etiqueta,
  valor,
  onCambiar,
  error,
  requerido,
}: {
  etiqueta: string;
  valor: string;
  onCambiar: (hora: string) => void;
  error?: string;
  requerido?: boolean;
}) => {
  const [visible, setVisible] = useState(false);

  const comoFecha = () => {
    try {
      return valor ? parse(valor.slice(0, 5), 'HH:mm', new Date()) : new Date();
    } catch {
      return new Date();
    }
  };

  return (
    <View style={estilos.grupo}>
      <Text style={estilos.etiqueta}>
        {etiqueta}
        {requerido && <Text style={estilos.asterisco}> *</Text>}
      </Text>
      <Pressable
        style={[estilos.input, estilos.selector, !!error && estilos.inputError]}
        onPress={() => setVisible(true)}
      >
        <Text style={[estilos.selectorTexto, !valor && estilos.placeholder]}>
          {valor ? valor.slice(0, 5) : '--:--'}
        </Text>
        <Ionicons name="time-outline" size={16} color={colores.primario} />
      </Pressable>
      {!!error && <Text style={estilos.error}>{error}</Text>}

      {visible && (
        <DateTimePicker
          value={comoFecha()}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(evento, fecha) => {
            setVisible(Platform.OS === 'ios' && evento.type !== 'set');
            if (evento.type === 'set' && fecha) onCambiar(format(fecha, 'HH:mm'));
          }}
        />
      )}
    </View>
  );
};

export const CampoInterruptor = ({
  etiqueta,
  descripcion,
  valor,
  onCambiar,
}: {
  etiqueta: string;
  descripcion?: string;
  valor: boolean;
  onCambiar: (valor: boolean) => void;
}) => (
  <View style={[estilos.grupo, estilos.filaInterruptor]}>
    <View style={{ flex: 1 }}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      {!!descripcion && <Text style={estilos.ayuda}>{descripcion}</Text>}
    </View>
    <Switch
      value={valor}
      onValueChange={onCambiar}
      trackColor={{ true: colores.primario, false: '#cbd2dc' }}
      thumbColor="#fff"
    />
  </View>
);

export const BotonPrimario = ({
  texto,
  onPress,
  cargando,
  deshabilitado,
  icono,
  variante = 'primario',
}: {
  texto: string;
  onPress: () => void;
  cargando?: boolean;
  deshabilitado?: boolean;
  icono?: ComponentProps<typeof Ionicons>['name'];
  variante?: 'primario' | 'secundario' | 'peligro';
}) => {
  const inactivo = cargando || deshabilitado;

  return (
    <Pressable
      style={[
        estilos.boton,
        variante === 'secundario' && estilos.botonSecundario,
        variante === 'peligro' && estilos.botonPeligro,
        inactivo && estilos.deshabilitado,
      ]}
      onPress={onPress}
      disabled={inactivo}
    >
      {cargando ? (
        <ActivityIndicator color={variante === 'secundario' ? colores.primario : '#fff'} size="small" />
      ) : (
        <>
          {!!icono && (
            <Ionicons
              name={icono}
              size={17}
              color={variante === 'secundario' ? colores.primario : '#fff'}
            />
          )}
          <Text style={[estilos.botonTexto, variante === 'secundario' && estilos.botonTextoSecundario]}>
            {texto}
          </Text>
        </>
      )}
    </Pressable>
  );
};

export const EstadoVacio = ({
  icono = 'file-tray-outline',
  titulo,
  descripcion,
  accion,
}: {
  icono?: ComponentProps<typeof Ionicons>['name'];
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
}) => (
  <View style={estilos.vacio}>
    <Ionicons name={icono} size={38} color="#c3cad6" />
    <Text style={estilos.vacioTitulo}>{titulo}</Text>
    {!!descripcion && <Text style={estilos.vacioTexto}>{descripcion}</Text>}
    {accion}
  </View>
);

export const BarraBusqueda = ({
  valor,
  onCambiar,
  placeholder = 'Buscar...',
}: {
  valor: string;
  onCambiar: (texto: string) => void;
  placeholder?: string;
}) => (
  <View style={estilos.busqueda}>
    <Ionicons name="search" size={16} color={colores.textoSecundario} />
    <TextInput
      style={estilos.busquedaInput}
      value={valor}
      onChangeText={onCambiar}
      placeholder={placeholder}
      placeholderTextColor="#9aa3b0"
      autoCorrect={false}
    />
    {!!valor && (
      <Pressable onPress={() => onCambiar('')} hitSlop={10}>
        <Ionicons name="close-circle" size={16} color={colores.textoSecundario} />
      </Pressable>
    )}
  </View>
);

const estilos = StyleSheet.create({
  grupo: { marginBottom: 14 },
  etiqueta: { fontSize: 12, fontWeight: '700', color: colores.textoSecundario, marginBottom: 6 },
  asterisco: { color: colores.peligro },
  ayuda: { fontSize: 11, color: colores.textoSecundario, marginTop: 2 },
  input: {
    backgroundColor: colores.tarjeta,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: colores.texto,
  },
  inputAlto: { minHeight: 92, paddingTop: 11 },
  inputError: { borderColor: colores.peligro },
  error: { fontSize: 11, color: colores.peligro, marginTop: 4 },
  deshabilitado: { opacity: 0.55 },

  selector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  selectorTexto: { fontSize: 14, color: colores.texto, flex: 1 },
  placeholder: { color: '#9aa3b0' },

  fondoModal: { flex: 1, backgroundColor: 'rgba(15,25,40,0.45)', justifyContent: 'flex-end' },
  hojaModal: {
    backgroundColor: colores.tarjeta,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: 24,
    maxHeight: '70%',
  },
  cabeceraModal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
  },
  tituloModal: { fontSize: 15, fontWeight: '700', color: colores.texto },
  vacioModal: { padding: 24, textAlign: 'center', color: colores.textoSecundario, fontSize: 13 },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f7',
  },
  opcionActiva: { backgroundColor: '#f2f8fd' },
  opcionTexto: { fontSize: 14, color: colores.texto },
  opcionTextoActivo: { fontWeight: '700', color: colores.primario },
  opcionDescripcion: { fontSize: 11, color: colores.textoSecundario, marginTop: 2 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.tarjeta,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  chipActivo: { backgroundColor: colores.primario, borderColor: colores.primario },
  chipTexto: { fontSize: 12, fontWeight: '600', color: colores.textoSecundario },
  chipTextoActivo: { color: '#fff' },

  filaInterruptor: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colores.primario,
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  botonSecundario: { backgroundColor: colores.tarjeta, borderWidth: 1, borderColor: colores.primario },
  botonPeligro: { backgroundColor: colores.peligro },
  botonTexto: { color: '#fff', fontWeight: '700', fontSize: 14 },
  botonTextoSecundario: { color: colores.primario },

  vacio: { alignItems: 'center', gap: 8, paddingVertical: 44, paddingHorizontal: 30 },
  vacioTitulo: { fontSize: 14, fontWeight: '700', color: colores.texto, textAlign: 'center' },
  vacioTexto: { fontSize: 12, color: colores.textoSecundario, textAlign: 'center', lineHeight: 18 },

  busqueda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colores.tarjeta,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 4,
  },
  busquedaInput: { flex: 1, fontSize: 14, color: colores.texto },
});
