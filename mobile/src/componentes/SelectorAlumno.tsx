import { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { listarAlumnos } from '@/api/alumnos';
import { BarraBusqueda } from '@/componentes/formulario';
import { colores } from '@/utils/colores';
import type { Alumno } from '@/tipos';

/**
 * Selector de alumno con búsqueda en vivo contra el servidor.
 *
 * Los `Selector` genéricos de src/componentes/formulario.tsx reciben una lista ya
 * cargada de opciones, lo que funciona bien para catálogos chicos (grados,
 * secciones, docentes). Un colegio puede tener cientos de alumnos: en vez de
 * traerlos todos de una vez, este componente pide `GET /alumnos?buscar=...` con
 * un debounce corto cada vez que el usuario escribe, igual que hace la pantalla
 * de listado de alumnos.
 */
export const SelectorAlumno = ({
  etiqueta = 'Alumno',
  alumno,
  onSeleccionar,
  error,
  requerido,
}: {
  etiqueta?: string;
  alumno: Alumno | null;
  onSeleccionar: (alumno: Alumno) => void;
  error?: string;
  requerido?: boolean;
}) => {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const { data, isFetching } = useQuery({
    queryKey: ['alumnos-selector', busqueda],
    queryFn: () => listarAlumnos({ buscar: busqueda || undefined, estado: true }),
    enabled: abierto,
  });

  return (
    <View style={estilos.grupo}>
      <Text style={estilos.etiqueta}>
        {etiqueta}
        {requerido && <Text style={estilos.asterisco}> *</Text>}
      </Text>

      <Pressable
        style={[estilos.input, !!error && estilos.inputError]}
        onPress={() => setAbierto(true)}
      >
        {alumno ? (
          <View style={{ flex: 1 }}>
            <Text style={estilos.textoSeleccionado}>
              {alumno.apellidos}, {alumno.nombres}
            </Text>
            <Text style={estilos.subtextoSeleccionado}>DNI {alumno.dni}</Text>
          </View>
        ) : (
          <Text style={estilos.placeholder}>Toca para elegir un alumno</Text>
        )}
        <Ionicons name="chevron-down" size={16} color={colores.textoSecundario} />
      </Pressable>

      {!!error && <Text style={estilos.error}>{error}</Text>}

      <Modal visible={abierto} transparent animationType="slide" onRequestClose={() => setAbierto(false)}>
        <Pressable style={estilos.fondoModal} onPress={() => setAbierto(false)}>
          <Pressable style={estilos.hojaModal} onPress={(evento) => evento.stopPropagation()}>
            <View style={estilos.cabeceraModal}>
              <Text style={estilos.tituloModal}>Elegir alumno</Text>
              <Pressable onPress={() => setAbierto(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={colores.textoSecundario} />
              </Pressable>
            </View>

            <View style={estilos.busquedaContenedor}>
              <BarraBusqueda
                valor={busqueda}
                onCambiar={setBusqueda}
                placeholder="Buscar por nombre, apellido o DNI"
              />
            </View>

            {isFetching ? (
              <ActivityIndicator style={{ marginVertical: 20 }} color={colores.primario} />
            ) : (
              <FlatList
                data={data?.data ?? []}
                keyExtractor={(item) => String(item.id)}
                ListEmptyComponent={
                  <Text style={estilos.vacioModal}>No se encontraron alumnos.</Text>
                }
                renderItem={({ item }) => (
                  <Pressable
                    style={[estilos.opcion, alumno?.id === item.id && estilos.opcionActiva]}
                    onPress={() => {
                      onSeleccionar(item);
                      setAbierto(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          estilos.opcionTexto,
                          alumno?.id === item.id && estilos.opcionTextoActivo,
                        ]}
                      >
                        {item.apellidos}, {item.nombres}
                      </Text>
                      <Text style={estilos.opcionDescripcion}>DNI {item.dni}</Text>
                    </View>
                    {alumno?.id === item.id && (
                      <Ionicons name="checkmark" size={18} color={colores.primario} />
                    )}
                  </Pressable>
                )}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const estilos = StyleSheet.create({
  grupo: { marginBottom: 14 },
  etiqueta: { fontSize: 12, fontWeight: '700', color: colores.textoSecundario, marginBottom: 6 },
  asterisco: { color: colores.peligro },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: colores.tarjeta,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  inputError: { borderColor: colores.peligro },
  error: { fontSize: 11, color: colores.peligro, marginTop: 4 },
  placeholder: { fontSize: 14, color: '#9aa3b0', flex: 1 },
  textoSeleccionado: { fontSize: 14, fontWeight: '700', color: colores.texto },
  subtextoSeleccionado: { fontSize: 11, color: colores.textoSecundario, marginTop: 1 },

  fondoModal: { flex: 1, backgroundColor: 'rgba(15,25,40,0.45)', justifyContent: 'flex-end' },
  hojaModal: {
    backgroundColor: colores.tarjeta,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: 24,
    maxHeight: '80%',
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
  busquedaContenedor: { padding: 16, paddingBottom: 8 },
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
});
