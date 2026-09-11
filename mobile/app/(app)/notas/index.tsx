import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSecciones } from '@/hooks/useSecciones';
import { BannerEstado } from '@/componentes/BannerEstado';
import { colores } from '@/utils/colores';

const TIPOS = [
  { valor: 'examen', etiqueta: 'Examen' },
  { valor: 'practica', etiqueta: 'Práctica' },
  { valor: 'tarea', etiqueta: 'Tarea' },
  { valor: 'participacion', etiqueta: 'Participación' },
] as const;

export default function NotasIndice() {
  const { todasLasSecciones, misSecciones, tieneSeccionesPropiasDetectadas, isLoading } =
    useSecciones();
  const secciones = tieneSeccionesPropiasDetectadas ? misSecciones : todasLasSecciones;

  const [seccionId, setSeccionId] = useState<number | null>(null);
  const [cursoId, setCursoId] = useState<number | null>(null);
  const [bimestre, setBimestre] = useState<number>(1);
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]['valor']>('examen');

  const seccionSeleccionada = useMemo(
    () => secciones.find((s) => s.id === seccionId) ?? null,
    [secciones, seccionId]
  );

  const puedeContinuar = !!seccionId && !!cursoId;

  if (isLoading) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator color={colores.primario} />
      </View>
    );
  }

  return (
    <View style={estilos.contenedor}>
      <BannerEstado />
      <ScrollView contentContainerStyle={estilos.scroll}>
        <Text style={estilos.etiqueta}>Sección</Text>
        <View style={estilos.chips}>
          {secciones.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => {
                setSeccionId(s.id);
                setCursoId(null);
              }}
              style={[estilos.chip, seccionId === s.id && estilos.chipActivo]}
            >
              <Text style={[estilos.chipTexto, seccionId === s.id && estilos.chipTextoActivo]}>
                {s.grado?.nombre} — {s.nombre}
              </Text>
            </Pressable>
          ))}
          {secciones.length === 0 && (
            <Text style={estilos.vacio}>No hay secciones con horario asignado todavía.</Text>
          )}
        </View>

        {seccionSeleccionada && (
          <>
            <Text style={estilos.etiqueta}>Curso</Text>
            <View style={estilos.chips}>
              {seccionSeleccionada.cursos.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => setCursoId(c.id)}
                  style={[estilos.chip, cursoId === c.id && estilos.chipActivo]}
                >
                  <Text style={[estilos.chipTexto, cursoId === c.id && estilos.chipTextoActivo]}>
                    {c.nombre}
                  </Text>
                </Pressable>
              ))}
              {seccionSeleccionada.cursos.length === 0 && (
                <Text style={estilos.vacio}>Esta sección no tiene cursos con horario.</Text>
              )}
            </View>
          </>
        )}

        <Text style={estilos.etiqueta}>Bimestre</Text>
        <View style={estilos.chips}>
          {[1, 2, 3, 4].map((b) => (
            <Pressable
              key={b}
              onPress={() => setBimestre(b)}
              style={[estilos.chip, estilos.chipCorto, bimestre === b && estilos.chipActivo]}
            >
              <Text style={[estilos.chipTexto, bimestre === b && estilos.chipTextoActivo]}>{b}°</Text>
            </Pressable>
          ))}
        </View>

        <Text style={estilos.etiqueta}>Tipo de evaluación</Text>
        <View style={estilos.chips}>
          {TIPOS.map((t) => (
            <Pressable
              key={t.valor}
              onPress={() => setTipo(t.valor)}
              style={[estilos.chip, tipo === t.valor && estilos.chipActivo]}
            >
              <Text style={[estilos.chipTexto, tipo === t.valor && estilos.chipTextoActivo]}>
                {t.etiqueta}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[estilos.botonContinuar, !puedeContinuar && estilos.botonDeshabilitado]}
          disabled={!puedeContinuar}
          onPress={() =>
            router.push({
              pathname: '/(app)/notas/registrar',
              params: {
                seccionId: String(seccionId),
                cursoId: String(cursoId),
                seccionNombre: `${seccionSeleccionada?.grado?.nombre ?? ''} ${seccionSeleccionada?.nombre ?? ''}`,
                cursoNombre: seccionSeleccionada?.cursos.find((c) => c.id === cursoId)?.nombre ?? '',
                bimestre: String(bimestre),
                tipo,
              },
            })
          }
        >
          <Text style={estilos.botonContinuarTexto}>Continuar</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.fondo },
  scroll: { padding: 16, paddingBottom: 40 },
  etiqueta: { fontSize: 13, fontWeight: '700', color: colores.textoSecundario, marginTop: 18, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.tarjeta,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipCorto: { paddingHorizontal: 16 },
  chipActivo: { backgroundColor: colores.primario, borderColor: colores.primario },
  chipTexto: { fontSize: 13, color: colores.texto, fontWeight: '600' },
  chipTextoActivo: { color: '#fff' },
  vacio: { fontSize: 12, color: colores.textoSecundario },
  botonContinuar: {
    backgroundColor: colores.primario,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 30,
  },
  botonDeshabilitado: { opacity: 0.5 },
  botonContinuarTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
