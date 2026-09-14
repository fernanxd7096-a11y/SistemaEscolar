import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  Alert,
  type LayoutChangeEvent,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { obtenerKpis } from '@/api/dashboard';
import { compartirBoletaPdf } from '@/api/boletas';
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
 * secretario reciben los totales del colegio; el docente recibe su carga y
 * sus clases de hoy; el padre recibe las métricas de sus hijos, boleta y pagos.
 */
export default function DashboardScreen() {
  const usuario = useAuthStore((state) => state.usuario);
  const { esAdministrativo, esPadre } = useRol();
  const [anchoGrafico, setAnchoGrafico] = useState(0);
  const [hijoSeleccionadoId, setHijoSeleccionadoId] = useState<number | null>(null);
  const [descargandoBoletaId, setDescargandoBoletaId] = useState<number | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: obtenerKpis,
  });

  const medir = (evento: LayoutChangeEvent) =>
    setAnchoGrafico(evento.nativeEvent.layout.width - 26);

  const totales = data?.totales;
  const asistenciaHoy = data?.asistencia_hoy;
  const docente = data?.docente;
  const padre = data?.padre;
  const vistaGlobal = data?.rol_vista === 'global';
  const vistaPadre = data?.rol_vista === 'padre' || (!vistaGlobal && !docente && !!padre);

  const hijos = padre?.hijos ?? [];
  const hijoActivo = hijos.find((h) => h.id === hijoSeleccionadoId) ?? hijos[0];

  const handleCompartirBoleta = async (alumnoId: number, nombreAlumno: string) => {
    try {
      setDescargandoBoletaId(alumnoId);
      await compartirBoletaPdf(alumnoId, {
        nombreArchivo: `boleta-${nombreAlumno.toLowerCase().replace(/\s+/g, '-')}.pdf`,
      });
    } catch (err: any) {
      Alert.alert(
        'No se pudo obtener la boleta',
        err?.response?.data?.mensaje ?? 'Ocurrió un error al descargar la boleta oficial.'
      );
    } finally {
      setDescargandoBoletaId(null);
    }
  };

  const clasesDeHoy = (docente?.bloques_hoy ?? []).filter((bloque) => !bloque.cancelado);

  return (
    <View style={estilos.contenedor}>
      <BannerEstado />
      <ScrollView
        contentContainerStyle={estilos.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <Text style={estilos.saludo}>Hola, {usuario?.nombre ?? (esPadre ? 'padre' : 'docente')} 👋</Text>
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

        {/* --- Vista Padre de Familia --- */}
        {vistaPadre && padre && (
          <>
            {hijos.length === 0 ? (
              <View style={estilos.panel}>
                <Ionicons name="information-circle-outline" size={32} color={colores.advertencia} />
                <Text style={estilos.sinClases}>No tiene hijos vinculados en el sistema actualmente.</Text>
              </View>
            ) : (
              <>
                {/* Selector de hijos si hay más de 1 */}
                {hijos.length > 1 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={estilos.selectorHijos}
                  >
                    {hijos.map((hijo) => {
                      const activo = hijo.id === hijoActivo?.id;
                      return (
                        <Pressable
                          key={hijo.id}
                          style={[estilos.tabHijo, activo && estilos.tabHijoActivo]}
                          onPress={() => setHijoSeleccionadoId(hijo.id)}
                        >
                          <Ionicons
                            name="person"
                            size={14}
                            color={activo ? '#fff' : colores.textoSecundario}
                          />
                          <Text style={[estilos.tabHijoTexto, activo && estilos.tabHijoTextoActivo]}>
                            {hijo.nombres.split(' ')[0]}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                )}

                {/* Tarjeta del hijo seleccionado */}
                {hijoActivo && (
                  <>
                    <View style={estilos.tarjetaAlumnoHeader}>
                      <View style={estilos.avatarHijo}>
                        <Ionicons name="school" size={20} color="#fff" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={estilos.hijoNombre}>
                          {hijoActivo.nombres} {hijoActivo.apellidos}
                        </Text>
                        <Text style={estilos.hijoDetalle}>
                          {hijoActivo.grado} · Sección {hijoActivo.seccion} ({hijoActivo.nivel})
                        </Text>
                      </View>
                    </View>

                    {/* KPIs del hijo */}
                    <View style={estilos.tarjetas}>
                      <TarjetaKpi
                        icono="checkmark-circle-outline"
                        etiqueta="Asistencia hoy"
                        valor={
                          hijoActivo.asistencia_hoy?.estado
                            ? hijoActivo.asistencia_hoy.estado.toUpperCase()
                            : 'Sin registro'
                        }
                        color={
                          hijoActivo.asistencia_hoy?.estado === 'presente'
                            ? colores.exito
                            : hijoActivo.asistencia_hoy?.estado === 'tardanza'
                            ? colores.advertencia
                            : hijoActivo.asistencia_hoy?.estado === 'falta'
                            ? colores.peligro
                            : colores.info
                        }
                      />
                      <TarjetaKpi
                        icono="calendar-outline"
                        etiqueta="Asistencia mes"
                        valor={`${hijoActivo.asistencia_mes?.porcentaje ?? 100}%`}
                        color={colores.primario}
                        detalle={
                          hijoActivo.asistencia_mes
                            ? `${hijoActivo.asistencia_mes.presentes}P / ${hijoActivo.asistencia_mes.tardanzas}T / ${hijoActivo.asistencia_mes.faltas}F`
                            : undefined
                        }
                      />
                      <TarjetaKpi
                        icono="ribbon-outline"
                        etiqueta="Promedio"
                        valor={
                          hijoActivo.promedio_general !== null && hijoActivo.promedio_general !== undefined
                            ? Number(hijoActivo.promedio_general).toFixed(1)
                            : '—'
                        }
                        color={
                          (hijoActivo.promedio_general ?? 0) >= 14
                            ? colores.exito
                            : (hijoActivo.promedio_general ?? 0) >= 11
                            ? colores.advertencia
                            : colores.peligro
                        }
                        detalle="Calificación"
                      />
                    </View>

                    {/* Botón Destacado Boleta de Notas */}
                    <Pressable
                      style={estilos.botonBoleta}
                      onPress={() =>
                        handleCompartirBoleta(
                          hijoActivo.id,
                          `${hijoActivo.nombres} ${hijoActivo.apellidos}`
                        )
                      }
                      disabled={descargandoBoletaId === hijoActivo.id}
                    >
                      {descargandoBoletaId === hijoActivo.id ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Ionicons name="document-text-outline" size={20} color="#fff" />
                      )}
                      <Text style={estilos.botonBoletaTexto}>
                        {descargandoBoletaId === hijoActivo.id
                          ? 'Descargando boleta oficial...'
                          : 'Ver / Compartir Boleta Oficial'}
                      </Text>
                      <Ionicons name="share-social-outline" size={18} color="rgba(255,255,255,0.8)" />
                    </Pressable>

                    {/* Horario de hoy del hijo */}
                    <View style={estilos.panel}>
                      <View style={estilos.panelCabecera}>
                        <Text style={estilos.panelTitulo}>Horario de clases de hoy</Text>
                      </View>
                      {(hijoActivo.clases_hoy?.length ?? 0) === 0 ? (
                        <Text style={estilos.sinClases}>No hay clases programadas para hoy.</Text>
                      ) : (
                        hijoActivo.clases_hoy?.map((clase, idx) => (
                          <View key={idx} style={estilos.filaClase}>
                            <View style={estilos.horaClaseBox}>
                              <Text style={estilos.horaClase}>{clase.hora_inicio}</Text>
                              <Text style={estilos.horaClaseFin}>{clase.hora_fin}</Text>
                            </View>
                            <View style={estilos.infoClase}>
                              <Text style={estilos.cursoClase}>{clase.curso}</Text>
                              <Text style={estilos.docenteClase}>
                                {clase.docente ? `Prof. ${clase.docente}` : 'Docente por asignar'}
                                {clase.aula ? ` · Aula ${clase.aula}` : ''}
                              </Text>
                            </View>
                          </View>
                        ))
                      )}
                    </View>
                  </>
                )}

                {/* Pagos pendientes */}
                {(padre.pagos_pendientes?.length ?? 0) > 0 && (
                  <View style={[estilos.panel, { borderColor: colores.advertencia }]}>
                    <View style={estilos.panelCabecera}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="alert-circle" size={18} color={colores.peligro} />
                        <Text style={[estilos.panelTitulo, { marginBottom: 0, color: colores.peligro }]}>
                          Pagos Pendientes
                        </Text>
                      </View>
                      <Text style={estilos.totalDeudaTexto}>
                        Total: S/ {Number(padre.total_deuda).toFixed(2)}
                      </Text>
                    </View>
                    <View style={{ marginTop: 8 }}>
                      {padre.pagos_pendientes.map((pago) => (
                        <View key={pago.id} style={estilos.filaPago}>
                          <View style={{ flex: 1 }}>
                            <Text style={estilos.conceptoPago}>{pago.concepto}</Text>
                            <Text style={estilos.alumnoPago}>{pago.alumno_nombre}</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={estilos.montoPago}>S/ {Number(pago.monto).toFixed(2)}</Text>
                            <Text style={estilos.fechaPago}>{pago.fecha_pago}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Comunicados recientes */}
                {(padre.comunicados_recientes?.length ?? 0) > 0 && (
                  <View style={estilos.panel}>
                    <Text style={estilos.panelTitulo}>Avisos y Comunicados</Text>
                    {padre.comunicados_recientes.map((c) => (
                      <View key={c.id} style={estilos.comunicadoItem}>
                        <Ionicons name="megaphone-outline" size={16} color={colores.primario} />
                        <View style={{ flex: 1 }}>
                          <Text style={estilos.comunicadoTitulo}>{c.titulo}</Text>
                          <Text style={estilos.comunicadoFecha}>{c.fecha}</Text>
                          <Text style={estilos.comunicadoContenido} numberOfLines={2}>
                            {c.contenido}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </>
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

        {/* Acceso al horario solo si no es docente ni padre (docente tiene su panel y padre ve el de su hijo) */}
        {!docente && !vistaPadre && (
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

  /* --- Estilos para vista de Padre --- */
  selectorHijos: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tabHijo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colores.tarjeta,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  tabHijoActivo: {
    backgroundColor: colores.primario,
    borderColor: colores.primario,
  },
  tabHijoTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: colores.textoSecundario,
  },
  tabHijoTextoActivo: {
    color: '#fff',
  },

  tarjetaAlumnoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colores.tarjeta,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: 14,
    marginBottom: 10,
  },
  avatarHijo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colores.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hijoNombre: {
    fontSize: 15,
    fontWeight: '700',
    color: colores.texto,
  },
  hijoDetalle: {
    fontSize: 12,
    color: colores.textoSecundario,
    marginTop: 2,
  },

  botonBoleta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colores.primario,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: 6,
    shadowColor: colores.primario,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  botonBoletaTexto: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  filaClase: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f3f8',
  },
  horaClaseBox: {
    width: 52,
    alignItems: 'center',
  },
  horaClase: {
    fontSize: 12,
    fontWeight: '700',
    color: colores.primario,
  },
  horaClaseFin: {
    fontSize: 10,
    color: colores.textoSecundario,
  },
  infoClase: {
    flex: 1,
  },
  cursoClase: {
    fontSize: 13,
    fontWeight: '600',
    color: colores.texto,
  },
  docenteClase: {
    fontSize: 11,
    color: colores.textoSecundario,
    marginTop: 2,
  },

  totalDeudaTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: colores.peligro,
  },
  filaPago: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f9f0f0',
  },
  conceptoPago: {
    fontSize: 13,
    fontWeight: '600',
    color: colores.texto,
  },
  alumnoPago: {
    fontSize: 11,
    color: colores.textoSecundario,
    marginTop: 2,
  },
  montoPago: {
    fontSize: 13,
    fontWeight: '700',
    color: colores.peligro,
  },
  fechaPago: {
    fontSize: 10,
    color: colores.textoSecundario,
    marginTop: 2,
  },

  comunicadoItem: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f3f8',
  },
  comunicadoTitulo: {
    fontSize: 13,
    fontWeight: '600',
    color: colores.texto,
  },
  comunicadoFecha: {
    fontSize: 10,
    color: colores.textoSecundario,
    marginTop: 1,
  },
  comunicadoContenido: {
    fontSize: 12,
    color: colores.textoSecundario,
    marginTop: 3,
  },
});
