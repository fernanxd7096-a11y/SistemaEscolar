import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  type LayoutChangeEvent,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { obtenerKpis } from '@/api/dashboard';
import { useAuthStore } from '@/tienda/auth';
import { useRol } from '@/hooks/useRol';
import { BannerEstado } from '@/componentes/BannerEstado';
import { TarjetaKpi } from '@/componentes/TarjetaKpi';
import { GraficoBarras } from '@/componentes/graficos/GraficoBarras';
import { GraficoDona } from '@/componentes/graficos/GraficoDona';
import { BloqueAgenda } from '@/componentes/AgendaSemana';
import { colores } from '@/utils/colores';

/**
 * Inicio: KPIs y gráficos según el rol.
 *
 * El backend (GET /dashboard/kpis) decide qué manda: administrador, director y
 * secretario reciben los totales del colegio; el docente recibe solo su carga y
 * sus clases de hoy. La pantalla se guía por `rol_vista` para no pintar tarjetas
 * vacías a quien no tiene esos datos.
 */
export default function DashboardScreen() {
  const usuario = useAuthStore((state) => state.usuario);
  const { esAdministrativo } = useRol();
  const [anchoGrafico, setAnchoGrafico] = useState(0);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: obtenerKpis,
  });

  const medir = (evento: LayoutChangeEvent) =>
    setAnchoGrafico(evento.nativeEvent.layout.width - 26);

  const totales = data?.totales;
  const asistenciaHoy = data?.asistencia_hoy;
  const docente = data?.docente;
  const vistaGlobal = data?.rol_vista === 'global';

  const clasesDeHoy = (docente?.bloques_hoy ?? []).filter((bloque) => !bloque.cancelado);

  return (
    <View style={estilos.contenedor}>
      <BannerEstado />
      <ScrollView
        contentContainerStyle={estilos.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <Text style={estilos.saludo}>Hola, {usuario?.nombre ?? 'docente'} 👋</Text>
        <Text style={estilos.fecha}>{data?.fecha_actual ?? '—'}</Text>

        {/* --- Vista global: administrador, director, secretario --- */}
        {vistaGlobal && (
          <>
            {/*
              Primera fila: las tres entidades que tienen CRUD en Gestión. Cada
              tarjeta abre su listado, y solo es tocable para administrador o
              director — el resto de roles no tiene esas pantallas.
            */}
            <View style={estilos.tarjetas}>
              <TarjetaKpi
                icono="people-outline"
                etiqueta="Alumnos"
                valor={isLoading ? '—' : (totales?.alumnos ?? 0)}
                detalle={totales ? `${totales.alumnos_activos} activos` : undefined}
                onPress={esAdministrativo ? () => router.push('/(app)/gestion/alumnos') : undefined}
              />
              <TarjetaKpi
                icono="person-outline"
                etiqueta="Docentes"
                valor={isLoading ? '—' : (totales?.docentes ?? 0)}
                color={colores.info}
                detalle={totales ? `${totales.docentes_activos} activos` : undefined}
                onPress={esAdministrativo ? () => router.push('/(app)/gestion/docentes') : undefined}
              />
              <TarjetaKpi
                icono="book-outline"
                etiqueta="Cursos"
                // El backend cuenta solo los cursos con estado activo.
                valor={isLoading ? '—' : (totales?.cursos ?? 0)}
                color={colores.exito}
                detalle={totales ? 'activos' : undefined}
                onPress={esAdministrativo ? () => router.push('/(app)/gestion/cursos') : undefined}
              />
            </View>

            <View style={estilos.tarjetas}>
              <TarjetaKpi
                icono="grid-outline"
                etiqueta="Secciones"
                valor={isLoading ? '—' : (totales?.secciones ?? 0)}
                color={colores.primario}
              />
              <TarjetaKpi
                icono="checkmark-circle-outline"
                etiqueta="Asistencia de hoy"
                valor={isLoading ? '—' : `${asistenciaHoy?.porcentaje ?? 0}%`}
                color={colores.exito}
                detalle={
                  asistenciaHoy
                    ? `${asistenciaHoy.presente} presentes de ${asistenciaHoy.total}`
                    : undefined
                }
              />
              <TarjetaKpi
                icono="alert-circle-outline"
                etiqueta="Faltas de hoy"
                valor={isLoading ? '—' : (asistenciaHoy?.falta ?? 0)}
                color={colores.peligro}
                detalle={asistenciaHoy ? `${asistenciaHoy.tardanza} tardanzas` : undefined}
              />
            </View>

            <View style={estilos.panel} onLayout={medir}>
              <Text style={estilos.panelTitulo}>Asistencia de los últimos días</Text>
              {anchoGrafico > 0 && (
                <GraficoBarras
                  ancho={anchoGrafico}
                  datos={(data?.asistencia_semana ?? []).map((dia) => ({
                    etiqueta: dia.etiqueta ?? dia.fecha.slice(5),
                    valores: {
                      presente: dia.presente,
                      tardanza: dia.tardanza,
                      falta: dia.falta,
                    },
                  }))}
                  series={[
                    { clave: 'presente', etiqueta: 'Presentes', color: colores.exito },
                    { clave: 'tardanza', etiqueta: 'Tardanzas', color: colores.advertencia },
                    { clave: 'falta', etiqueta: 'Faltas', color: colores.peligro },
                  ]}
                />
              )}
            </View>

            {(data?.alumnos_por_nivel?.length ?? 0) > 0 && (
              <View style={estilos.panel}>
                <Text style={estilos.panelTitulo}>Matriculados por nivel</Text>
                <GraficoDona
                  porciones={(data?.alumnos_por_nivel ?? []).map((nivel, indice) => ({
                    clave: nivel.nivel,
                    etiqueta: nivel.etiqueta,
                    valor: nivel.total,
                    color: [colores.primario, colores.exito, colores.info][indice % 3],
                  }))}
                />
              </View>
            )}

            {(data?.alumnos_por_grado?.length ?? 0) > 0 && (
              <View style={estilos.panel}>
                <Text style={estilos.panelTitulo}>Matriculados por sección</Text>
                {(data?.alumnos_por_grado ?? []).slice(0, 8).map((fila) => (
                  <View key={`${fila.seccion_id}`} style={estilos.filaBarra}>
                    <Text style={estilos.filaEtiqueta} numberOfLines={1}>
                      {fila.etiqueta}
                    </Text>
                    <View style={estilos.barraFondo}>
                      <View
                        style={[
                          estilos.barraRelleno,
                          {
                            width: `${
                              (fila.total /
                                Math.max(
                                  ...(data?.alumnos_por_grado ?? []).map((f) => f.total),
                                  1
                                )) *
                              100
                            }%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={estilos.filaValor}>{fila.total}</Text>
                  </View>
                ))}
              </View>
            )}

            {(data?.eventos_proximos?.length ?? 0) > 0 && (
              <View style={estilos.panel}>
                <Text style={estilos.panelTitulo}>Próximos eventos</Text>
                {(data?.eventos_proximos ?? []).map((evento) => (
                  <View key={evento.id} style={estilos.evento}>
                    <Ionicons name="calendar-outline" size={15} color={colores.primario} />
                    <View style={{ flex: 1 }}>
                      <Text style={estilos.eventoTitulo} numberOfLines={1}>
                        {evento.titulo}
                      </Text>
                      <Text style={estilos.eventoFecha}>
                        {evento.fecha}
                        {evento.lugar ? ` · ${evento.lugar}` : ''}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* --- Carga del docente (también se muestra a un admin que sea docente) --- */}
        {docente && (
          <>
            <View style={estilos.tarjetas}>
              <TarjetaKpi
                icono="calendar-outline"
                etiqueta="Clases hoy"
                valor={docente.clases_hoy}
                detalle={
                  docente.clases_canceladas_hoy > 0
                    ? `${docente.clases_canceladas_hoy} canceladas`
                    : undefined
                }
                color={colores.primario}
                onPress={() => router.push('/(app)/horario')}
              />
              <TarjetaKpi
                icono="grid-outline"
                etiqueta="Mis secciones"
                valor={docente.total_secciones}
                color={colores.exito}
              />
              <TarjetaKpi
                icono="book-outline"
                etiqueta="Mis cursos"
                valor={docente.total_cursos}
                color={colores.info}
              />
            </View>

            <View style={estilos.panel}>
              <View style={estilos.panelCabecera}>
                <Text style={estilos.panelTitulo}>Mi horario de hoy</Text>
                <Pressable onPress={() => router.push('/(app)/horario')} hitSlop={8}>
                  <Text style={estilos.enlace}>Ver semana</Text>
                </Pressable>
              </View>

              {docente.es_no_lectivo ? (
                <Text style={estilos.sinClases}>Hoy es día no lectivo.</Text>
              ) : clasesDeHoy.length === 0 ? (
                <Text style={estilos.sinClases}>No tienes clases programadas para hoy.</Text>
              ) : (
                clasesDeHoy.map((bloque, indice) => (
                  <BloqueAgenda
                    key={`${bloque.regla_id ?? 0}-${bloque.excepcion_id ?? 0}-${indice}`}
                    bloque={bloque}
                    mostrarSeccion
                  />
                ))
              )}
            </View>
          </>
        )}

        {/*
          Acceso al horario para quien no tiene tarjeta de docente (esa ya trae su
          propio enlace "Ver semana"). El destino depende del rol: el personal
          administrativo va al calendario de gestión, y el resto a "Mi horario",
          que además vive fuera de la barra de pestañas y no tendría otra entrada.
        */}
        {!docente && (
          <Pressable
            style={estilos.accesoHorario}
            onPress={() =>
              router.push(esAdministrativo ? '/(app)/gestion/horario' : '/(app)/horario')
            }
          >
            <Ionicons name="calendar-outline" size={18} color={colores.primario} />
            <Text style={estilos.accesoHorarioTexto}>
              {esAdministrativo ? 'Horarios del colegio' : 'Ver mi horario'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colores.textoSecundario} />
          </Pressable>
        )}

        <View style={estilos.rolesBox}>
          <Text style={estilos.rolesTitulo}>Rol(es)</Text>
          <Text style={estilos.rolesTexto}>
            {usuario?.roles?.map((r) => r.name).join(', ') || 'Sin rol asignado'}
          </Text>
          <Text style={estilos.anioEscolar}>
            Año escolar {data?.['año_escolar_actual'] ?? '—'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  scroll: { padding: 20, paddingBottom: 34 },
  saludo: { fontSize: 22, fontWeight: '700', color: colores.texto },
  fecha: {
    fontSize: 14,
    color: colores.textoSecundario,
    marginTop: 4,
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  tarjetas: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },

  panel: {
    backgroundColor: colores.tarjeta,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 13,
    marginTop: 10,
  },
  panelCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  panelTitulo: { fontSize: 13, fontWeight: '700', color: colores.texto, marginBottom: 10 },
  enlace: { fontSize: 12, fontWeight: '700', color: colores.primario, marginBottom: 10 },

  filaBarra: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 8 },
  filaEtiqueta: { width: 74, fontSize: 11, color: colores.textoSecundario },
  barraFondo: { flex: 1, height: 8, borderRadius: 4, backgroundColor: '#eef1f6' },
  barraRelleno: { height: 8, borderRadius: 4, backgroundColor: colores.primario },
  filaValor: { width: 26, textAlign: 'right', fontSize: 12, fontWeight: '700', color: colores.texto },

  evento: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 7 },
  eventoTitulo: { fontSize: 13, fontWeight: '600', color: colores.texto },
  eventoFecha: { fontSize: 11, color: colores.textoSecundario, marginTop: 1 },

  sinClases: { fontSize: 12, color: colores.textoSecundario, paddingVertical: 8 },

  accesoHorario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colores.tarjeta,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 15,
    marginTop: 10,
  },
  accesoHorarioTexto: { flex: 1, fontSize: 14, fontWeight: '700', color: colores.texto },

  rolesBox: {
    marginTop: 16,
    backgroundColor: colores.tarjeta,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 16,
  },
  rolesTitulo: { fontSize: 13, fontWeight: '600', color: colores.textoSecundario },
  rolesTexto: { fontSize: 15, color: colores.texto, marginTop: 4, textTransform: 'capitalize' },
  anioEscolar: { fontSize: 12, color: colores.textoSecundario, marginTop: 8 },
});
