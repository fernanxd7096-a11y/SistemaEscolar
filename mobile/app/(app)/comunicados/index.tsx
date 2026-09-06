import { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { listarComunicados } from '@/api/comunicados';
import { BannerEstado } from '@/componentes/BannerEstado';
import { colores } from '@/utils/colores';
import type { Comunicado } from '@/tipos';

const ESTILO_TIPO: Record<string, { color: string; etiqueta: string }> = {
  urgente: { color: colores.peligro, etiqueta: 'Urgente' },
  informativo: { color: colores.info, etiqueta: 'Informativo' },
  general: { color: colores.textoSecundario, etiqueta: 'General' },
};

const TarjetaComunicado = ({ comunicado }: { comunicado: Comunicado }) => {
  const [expandido, setExpandido] = useState(false);
  const estiloTipo = ESTILO_TIPO[comunicado.tipo] ?? ESTILO_TIPO.general;

  return (
    <Pressable style={estilos.tarjeta} onPress={() => setExpandido((v) => !v)}>
      <View style={estilos.filaEncabezado}>
        <View style={[estilos.badge, { backgroundColor: estiloTipo.color }]}>
          <Text style={estilos.badgeTexto}>{estiloTipo.etiqueta}</Text>
        </View>
        <Text style={estilos.fecha}>
          {comunicado.fecha_publicacion?.slice(0, 10) ?? comunicado.created_at?.slice(0, 10) ?? ''}
        </Text>
      </View>
      <Text style={estilos.titulo}>{comunicado.titulo}</Text>
      <Text style={estilos.contenido} numberOfLines={expandido ? undefined : 2}>
        {comunicado.contenido}
      </Text>
      <View style={estilos.filaPie}>
        {comunicado.autor && (
          <Text style={estilos.autor}>
            {comunicado.autor.nombre} {comunicado.autor.apellido}
          </Text>
        )}
        <Ionicons
          name={expandido ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colores.textoSecundario}
        />
      </View>
    </Pressable>
  );
};

export default function ComunicadosIndice() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['comunicados'],
    queryFn: () => listarComunicados(),
  });

  return (
    <View style={estilos.contenedor}>
      <BannerEstado />
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 30 }} color={colores.primario} />
      ) : (
        <FlatList
          data={data?.data ?? []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={estilos.lista}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={<Text style={estilos.vacio}>No hay comunicados por ahora.</Text>}
          renderItem={({ item }) => <TarjetaComunicado comunicado={item} />}
        />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  lista: { padding: 16, gap: 10 },
  vacio: { textAlign: 'center', color: colores.textoSecundario, marginTop: 30 },
  tarjeta: {
    backgroundColor: colores.tarjeta,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 14,
  },
  filaEncabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  badgeTexto: { color: '#fff', fontSize: 11, fontWeight: '700' },
  fecha: { fontSize: 11, color: colores.textoSecundario },
  titulo: { fontSize: 15, fontWeight: '700', color: colores.texto, marginTop: 10 },
  contenido: { fontSize: 13, color: colores.textoSecundario, marginTop: 6, lineHeight: 19 },
  filaPie: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  autor: { fontSize: 11, color: colores.textoSecundario, fontStyle: 'italic' },
});
