import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { addWeeks, endOfWeek, format, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { obtenerMiAgenda } from '@/api/horarios';
import { BannerEstado } from '@/componentes/BannerEstado';
import { DiaAgenda } from '@/componentes/AgendaSemana';
import { EstadoVacio } from '@/componentes/formulario';
import { colores } from '@/utils/colores';

type Vista = 'hoy' | 'semana';

/**
 * "Mi horario" del docente: la agenda del usuario autenticado, con feriados,
 * viajes y recuperaciones ya aplicados por el backend (GET /horarios/mi-agenda).
 */
export default function MiHorario() {
  const [vista, setVista] = useState<Vista>('hoy');
  const [semana, setSemana] = useState(0);

  const rango = useMemo(() => {
    if (vista === 'hoy') {
      const hoy = format(new Date(), 'yyyy-MM-dd');
      return { desde: hoy, hasta: hoy };
    }
    const base = addWeeks(new Date(), semana);
    return {
      desde: format(startOfWeek(base, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      hasta: format(endOfWeek(base, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    };
  }, [vista, semana]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['mi-agenda', rango.desde, rango.hasta],
    queryFn: () => obtenerMiAgenda(rango),
  });

  const hoy = format(new Date(), 'yyyy-MM-dd');
  const dias = (data?.dias ?? []).filter(
    (dia) => !dia.es_fin_semana || dia.bloques.length > 0 || dia.es_no_lectivo
  );

  return (
    <View style={estilos.contenedor}>
      <BannerEstado />
      <ScrollView
        contentContainerStyle={estilos.scroll}
        refreshControl={
          <RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} />
        }
      >
        <View style={estilos.conmutador}>
          {(['hoy', 'semana'] as const).map((opcion) => (
            <Pressable
              key={opcion}
              style={[estilos.conmutadorBoton, vista === opcion && estilos.conmutadorActivo]}
              onPress={() => {
                setVista(opcion);
                setSemana(0);
              }}
            >
              <Text
                style={[estilos.conmutadorTexto, vista === opcion && estilos.conmutadorTextoActivo]}
              >
                {opcion === 'hoy' ? 'Hoy' : 'Semana'}
              </Text>
            </Pressable>
          ))}
        </View>

        {vista === 'semana' && (
          <View style={estilos.navegacion}>
            <Pressable style={estilos.flecha} onPress={() => setSemana((s) => s - 1)}>
              <Ionicons name="chevron-back" size={18} color={colores.primario} />
            </Pressable>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={estilos.semanaTexto}>
                {semana === 0 ? 'Esta semana' : semana === 1 ? 'Próxima semana' : `Semana ${semana > 0 ? '+' : ''}${semana}`}
              </Text>
              <Text style={estilos.semanaRango}>
                {format(new Date(rango.desde), 'd MMM', { locale: es })} —{' '}
                {format(new Date(rango.hasta), 'd MMM', { locale: es })}
              </Text>
            </View>
            <Pressable style={estilos.flecha} onPress={() => setSemana((s) => s + 1)}>
              <Ionicons name="chevron-forward" size={18} color={colores.primario} />
            </Pressable>
          </View>
        )}

        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 30 }} color={colores.primario} />
        ) : !data?.docente ? (
          <EstadoVacio
            icono="person-circle-outline"
            titulo="Tu usuario no está vinculado a un docente"
            descripcion="Pide a la administración que registre tu correo en la ficha de docente para ver aquí tu horario."
          />
        ) : dias.length === 0 || dias.every((dia) => dia.bloques.length === 0) ? (
          <EstadoVacio
            icono="calendar-outline"
            titulo={vista === 'hoy' ? 'Hoy no tienes clases' : 'Sin clases esta semana'}
            descripcion="Cuando la administración programe tus bloques, aparecerán aquí."
          />
        ) : (
          dias.map((dia) => (
            <DiaAgenda key={dia.fecha} dia={dia} mostrarSeccion destacado={dia.fecha === hoy} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  scroll: { padding: 16, paddingBottom: 30 },
  conmutador: {
    flexDirection: 'row',
    backgroundColor: '#e9edf3',
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
  },
  conmutadorBoton: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  conmutadorActivo: { backgroundColor: colores.tarjeta },
  conmutadorTexto: { fontSize: 13, fontWeight: '600', color: colores.textoSecundario },
  conmutadorTextoActivo: { color: colores.primario },
  navegacion: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  flecha: {
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 8,
    padding: 8,
    backgroundColor: colores.tarjeta,
  },
  semanaTexto: { fontSize: 13, fontWeight: '700', color: colores.texto },
  semanaRango: { fontSize: 11, color: colores.textoSecundario, marginTop: 1 },
});
