import { useState } from 'react';
import { Pressable, Text, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { fechaLegible } from '@/utils/fechas';
import { colores } from '@/utils/colores';

export const SelectorFecha = ({
  fecha,
  onCambiar,
}: {
  fecha: string;
  onCambiar: (fechaISO: string) => void;
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Pressable style={estilos.boton} onPress={() => setVisible(true)}>
        <Ionicons name="calendar-outline" size={16} color={colores.primario} />
        <Text style={estilos.texto}>{fechaLegible(fecha)}</Text>
      </Pressable>

      {visible && (
        <DateTimePicker
          value={parseISO(fecha)}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          maximumDate={new Date()}
          onChange={(evento, fechaSeleccionada) => {
            setVisible(Platform.OS === 'ios');
            if (evento.type === 'set' && fechaSeleccionada) {
              onCambiar(format(fechaSeleccionada, 'yyyy-MM-dd'));
            }
            if (Platform.OS === 'android') setVisible(false);
          }}
        />
      )}
    </>
  );
};

const estilos = StyleSheet.create({
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  texto: { fontSize: 13, fontWeight: '600', color: colores.texto, textTransform: 'capitalize' },
});
