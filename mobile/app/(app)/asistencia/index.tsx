import { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSecciones } from '@/hooks/useSecciones';
import { SelectorFecha } from '@/componentes/SelectorFecha';
import { BannerEstado } from '@/componentes/BannerEstado';
import { hoyISO } from '@/utils/fechas';
import { colores } from '@/utils/colores';

export default function AsistenciaIndice() {
  const [fecha, setFecha] = useState(hoyISO());
  const [verTodas, setVerTodas] = useState(false);
  const { todasLasSecciones, misSecciones, tieneSeccionesPropiasDetectadas, isLoading } =
    useSecciones();

  const lista = verTodas || !tieneSeccionesPropiasDetectadas ? todasLasSecciones : misSecciones;

  return (
    <View style={estilos.contenedor}>
      <BannerEstado />
      <View style={estilos.encabezado}>
        <Text style={estilos.titulo}>Selecciona sección y fecha</Text>
        <SelectorFecha fecha={fecha} onCambiar={setFecha} />
      </View>

      {tieneSeccionesPropiasDetectadas && (
        <Pressable style={estilos.toggle} onPress={() => setVerTodas((v) => !v)}>
          <Text style={estilos.toggleTexto}>
            {verTodas ? 'Mostrar solo mis secciones' : 'Ver todas las secciones'}
          </Text>
        </Pressable>
      )}

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 30 }} color={colores.primario} />
      ) : (
        <FlatList
          contentContainerStyle={estilos.listaContenido}
          data={lista}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <Text style={estilos.vacio}>
              No hay secciones con horario asignado todavía.
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={estilos.tarjeta}
              onPress={() =>
                router.push({
                  pathname: '/(app)/asistencia/registrar',
                  params: { seccionId: String(item.id), seccionNombre: `${item.grado?.nombre ?? ''} ${item.nombre}`, fecha },
                })
              }
            >
              <View style={estilos.tarjetaIcono}>
                <Ionicons name="people-outline" size={20} color={colores.primario} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={estilos.tarjetaTitulo}>
                  {item.grado?.nombre} — {item.nombre}
                </Text>
                <Text style={estilos.tarjetaSubtitulo}>
                  {item.cursos.map((c) => c.nombre).join(', ') || 'Sin cursos asignados'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colores.textoSecundario} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  encabezado: { padding: 16, gap: 10 },
  titulo: { fontSize: 15, fontWeight: '700', color: colores.texto },
  toggle: { paddingHorizontal: 16, marginBottom: 4 },
  toggleTexto: { fontSize: 13, color: colores.primario, fontWeight: '600' },
  listaContenido: { padding: 16, paddingTop: 4, gap: 10 },
  vacio: { textAlign: 'center', color: colores.textoSecundario, marginTop: 30 },
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colores.tarjeta,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 14,
  },
  tarjetaIcono: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e8f2fc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tarjetaTitulo: { fontSize: 14, fontWeight: '700', color: colores.texto },
  tarjetaSubtitulo: { fontSize: 12, color: colores.textoSecundario, marginTop: 2 },
});
