import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { BannerEstado } from '@/componentes/BannerEstado';
import { colores } from '@/utils/colores';

interface Seccion {
  icono: ComponentProps<typeof Ionicons>['name'];
  titulo: string;
  descripcion: string;
  ruta: Href;
  color: string;
}

const SECCIONES: Seccion[] = [
  {
    icono: 'people-outline',
    titulo: 'Alumnos',
    descripcion: 'Altas, edición, ficha y matrícula por sección y año escolar.',
    ruta: '/(app)/gestion/alumnos',
    color: colores.primario,
  },
  {
    icono: 'person-outline',
    titulo: 'Docentes',
    descripcion: 'Registro del personal docente, especialidad y contacto.',
    ruta: '/(app)/gestion/docentes',
    color: colores.info,
  },
  {
    icono: 'book-outline',
    titulo: 'Cursos',
    descripcion: 'Áreas del plan de estudios por grado, con docente y horas.',
    ruta: '/(app)/gestion/cursos',
    color: colores.exito,
  },
  {
    icono: 'calendar-outline',
    titulo: 'Horario',
    descripcion: 'Reglas recurrentes, feriados, viajes y recuperaciones.',
    ruta: '/(app)/gestion/horario',
    color: colores.advertencia,
  },
];

export default function GestionIndice() {
  return (
    <View style={estilos.contenedor}>
      <BannerEstado />
      <ScrollView contentContainerStyle={estilos.scroll}>
        <Text style={estilos.titulo}>Administración</Text>
        <Text style={estilos.subtitulo}>
          Módulos disponibles para los roles administrador y director.
        </Text>

        {SECCIONES.map((seccion) => (
          <Pressable
            key={seccion.titulo}
            style={estilos.tarjeta}
            onPress={() => router.push(seccion.ruta)}
          >
            <View style={[estilos.icono, { backgroundColor: seccion.color + '1a' }]}>
              <Ionicons name={seccion.icono} size={21} color={seccion.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={estilos.tarjetaTitulo}>{seccion.titulo}</Text>
              <Text style={estilos.tarjetaTexto}>{seccion.descripcion}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colores.textoSecundario} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  scroll: { padding: 16, gap: 12 },
  titulo: { fontSize: 20, fontWeight: '700', color: colores.texto },
  subtitulo: { fontSize: 13, color: colores.textoSecundario, marginTop: -6, marginBottom: 4 },
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: colores.tarjeta,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 15,
  },
  icono: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tarjetaTitulo: { fontSize: 15, fontWeight: '700', color: colores.texto },
  tarjetaTexto: { fontSize: 12, color: colores.textoSecundario, marginTop: 3, lineHeight: 17 },
});
