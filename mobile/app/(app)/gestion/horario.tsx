import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { addWeeks, format, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { obtenerAgenda } from '@/api/horarios';
import { listarSecciones } from '@/api/grados';
import { listarDocentes } from '@/api/docentes';
import { BannerEstado } from '@/componentes/BannerEstado';
import { DiaAgenda } from '@/componentes/AgendaSemana';
import { EstadoVacio, Selector } from '@/componentes/formulario';
import { colores } from '@/utils/colores';

type Vista = 'seccion' | 'docente';

/**
 * Calendario semanal de una sección o de un docente, con la agenda ya resuelta
 * (reglas recurrentes + feriados, viajes y recuperaciones aplicados) y accesos a
 * la gestión de reglas y excepciones.
 */
export default function HorarioGestion() {
  const [vista, setVista] = useState<Vista>('seccion');
  const [seccionId, setSeccionId] = useState<number | null>(null);
  const [docenteId, setDocenteId] = useState<number | null>(null);
  const [semana, setSemana] = useState(0);

  const rango = useMemo(() => {
    const base = addWeeks(new Date(), semana);
    return {
      desde: format(startOfWeek(base, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      hasta: format(endOfWeek(base, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    };
  }, [semana]);

  const { data: secciones = [], isLoading: cargandoSecciones } = useQuery({
    queryKey: ['secciones', null],
    queryFn: () => listarSecciones(),
  });

  const { data: docentesPagina, isLoading: cargandoDocentes } = useQuery({
    queryKey: ['docentes', '', 1],
    queryFn: () => listarDocentes({ page: 1 }),
  });

  const objetivoId = vista === 'seccion' ? seccionId : docenteId;

  const { data: agenda, isLoading: cargandoAgenda } = useQuery({
    queryKey: ['agenda', vista, objetivoId, rango.desde, rango.hasta],
    queryFn: () =>
      obtenerAgenda({
        ...(vista === 'seccion'
          ? { seccion_id: seccionId as number }
          : { docente_id: docenteId as number }),
        desde: rango.desde,
        hasta: rango.hasta,
      }),
    enabled: objetivoId !== null,
  });

  const hoy = format(new Date(), 'yyyy-MM-dd');

  return (
    <View style={estilos.contenedor}>
      <BannerEstado />
      <ScrollView contentContainerStyle={estilos.scroll}>
        <View style={estilos.accesos}>
          <Pressable
            style={estilos.acceso}
            onPress={() => router.push('/(app)/gestion/horario-reglas')}
          >
            <Ionicons name="repeat-outline" size={18} color={colores.primario} />
            <Text style={estilos.accesoTexto}>Reglas recurrentes</Text>
          </Pressable>
          <Pressable
            style={estilos.acceso}
            onPress={() => router.push('/(app)/gestion/horario-excepciones')}
          >
            <Ionicons name="alert-circle-outline" size={18} color={colores.advertencia} />
            <Text style={estilos.accesoTexto}>Feriados y excepciones</Text>
          </Pressable>
        </View>

        <View style={estilos.conmutador}>
          {(['seccion', 'docente'] as const).map((opcion) => (
            <Pressable
              key={opcion}
              style={[estilos.conmutadorBoton, vista === opcion && estilos.conmutadorActivo]}
              onPress={() => setVista(opcion)}
            >
              <Text
                style={[estilos.conmutadorTexto, vista === opcion && estilos.conmutadorTextoActivo]}
              >
                Por {opcion === 'seccion' ? 'sección' : 'docente'}
              </Text>
            </Pressable>
          ))}
        </View>

        {vista === 'seccion' ? (
          <Selector
            etiqueta="Sección"
            valor={seccionId}
            cargando={cargandoSecciones}
            onCambiar={setSeccionId}
            opciones={secciones.map((seccion) => ({
              valor: seccion.id,
              etiqueta: `${seccion.grado?.nombre ?? ''} — ${seccion.nombre}`.trim(),
              descripcion: seccion.grado?.nivel,
            }))}
          />
        ) : (
          <Selector
            etiqueta="Docente"
            valor={docenteId}
            cargando={cargandoDocentes}
            onCambiar={setDocenteId}
            opciones={(docentesPagina?.data ?? []).map((docente) => ({
              valor: docente.id,
              etiqueta: `${docente.apellidos}, ${docente.nombres}`,
              descripcion: docente.especialidad ?? undefined,
            }))}
          />
        )}

        <View style={estilos.navegacionSemana}>
          <Pressable style={estilos.flecha} onPress={() => setSemana((s) => s - 1)}>
            <Ionicons name="chevron-back" size={18} color={colores.primario} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={estilos.semanaTexto}>
              {semana === 0 ? 'Esta semana' : semana === 1 ? 'Próxima semana' : `Semana ${semana > 0 ? '+' : ''}${semana}`}
            </Text>
            <Text style={estilos.semanaRango}>
              {format(new Date(rango.desde), 'd MMM', { locale: es })} —{' '}
              {format(new Date(rango.hasta), 'd MMM yyyy', { locale: es })}
            </Text>
          </View>
          <Pressable style={estilos.flecha} onPress={() => setSemana((s) => s + 1)}>
            <Ionicons name="chevron-forward" size={18} color={colores.primario} />
          </Pressable>
        </View>

        {objetivoId === null ? (
          <EstadoVacio
            icono="calendar-outline"
            titulo="Elige una sección o un docente"
            descripcion="El horario se calcula al vuelo a partir de las reglas recurrentes vigentes y las excepciones de esas fechas."
          />
        ) : cargandoAgenda ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={colores.primario} />
        ) : (
          (agenda?.dias ?? [])
            .filter((dia) => !dia.es_fin_semana || dia.bloques.length > 0 || dia.es_no_lectivo)
            .map((dia) => (
              <DiaAgenda
                key={dia.fecha}
                dia={dia}
                mostrarSeccion={vista === 'docente'}
                destacado={dia.fecha === hoy}
              />
            ))
        )}
      </ScrollView>

      <Pressable
        style={estilos.flotante}
        onPress={() =>
          router.push({
            pathname: '/(app)/gestion/horario-regla-formulario',
            params: seccionId ? { seccionId: String(seccionId) } : {},
          })
        }
      >
        <Ionicons name="add" size={26} color="#fff" />
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  scroll: { padding: 16, paddingBottom: 90 },
  accesos: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  acceso: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    backgroundColor: colores.tarjeta,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colores.borde,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  accesoTexto: { fontSize: 11, fontWeight: '700', color: colores.texto, textAlign: 'center' },

  conmutador: {
    flexDirection: 'row',
    backgroundColor: '#e9edf3',
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
  },
  conmutadorBoton: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  conmutadorActivo: { backgroundColor: colores.tarjeta },
  conmutadorTexto: { fontSize: 12, fontWeight: '600', color: colores.textoSecundario },
  conmutadorTextoActivo: { color: colores.primario },

  navegacionSemana: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  flecha: { borderWidth: 1, borderColor: colores.borde, borderRadius: 8, padding: 8, backgroundColor: colores.tarjeta },
  semanaTexto: { fontSize: 13, fontWeight: '700', color: colores.texto },
  semanaRango: { fontSize: 11, color: colores.textoSecundario, marginTop: 1 },

  flotante: {
    position: 'absolute',
    right: 18,
    bottom: 22,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colores.primario,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#0f2540',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
});
