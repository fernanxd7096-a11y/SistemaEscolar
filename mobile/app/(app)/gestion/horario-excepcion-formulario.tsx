import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  actualizarExcepcion,
  crearExcepcion,
  listarExcepciones,
  type PayloadExcepcion,
} from '@/api/horarios';
import { listarSecciones } from '@/api/grados';
import { listarDocentes } from '@/api/docentes';
import { listarEventosProximos } from '@/api/eventos';
import {
  AreaTexto,
  BotonPrimario,
  Campo,
  CampoFecha,
  CampoHora,
  CampoInterruptor,
  Selector,
} from '@/componentes/formulario';
import { conflictosDeError, erroresPorCampo, mensajeError } from '@/utils/errores';
import { colores } from '@/utils/colores';
import type { AlcanceExcepcion, ConflictoHorario, TipoExcepcion } from '@/tipos';

const TIPOS: { valor: TipoExcepcion; etiqueta: string; descripcion: string }[] = [
  { valor: 'feriado', etiqueta: 'Feriado', descripcion: 'Día no lectivo, cancela las clases' },
  { valor: 'suspension', etiqueta: 'Suspensión', descripcion: 'Clases suspendidas ese día' },
  { valor: 'viaje', etiqueta: 'Viaje de estudio', descripcion: 'La sección sale, no hay clases' },
  { valor: 'recuperacion', etiqueta: 'Recuperación', descripcion: 'Agrega una clase de repaso' },
  { valor: 'extracurricular', etiqueta: 'Actividad', descripcion: 'Agrega una actividad puntual' },
  { valor: 'cambio_horario', etiqueta: 'Cambio de horario', descripcion: 'Bloque movido ese día' },
  { valor: 'otro', etiqueta: 'Otro', descripcion: 'Cualquier otro caso' },
];

/** Los mismos tipos que el backend marca como cancelantes por defecto. */
const TIPOS_QUE_CANCELAN: TipoExcepcion[] = ['feriado', 'suspension', 'viaje'];

const hoyISO = () => new Date().toISOString().slice(0, 10);

/**
 * Alta y edición de una excepción del horario.
 *
 * `cancela_clases` se preselecciona según el tipo (igual que hace el backend) pero
 * queda editable: hay casos mixtos, como una actividad institucional que además
 * suspende las clases de la tarde.
 */
export default function FormularioExcepcion() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const excepcionId = id ? Number(id) : null;
  const esEdicion = excepcionId !== null;

  const [tipo, setTipo] = useState<TipoExcepcion>('feriado');
  const [alcance, setAlcance] = useState<AlcanceExcepcion>('institucional');
  const [seccionId, setSeccionId] = useState<number | null>(null);
  const [docenteId, setDocenteId] = useState<number | null>(null);
  const [eventoId, setEventoId] = useState<number | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(hoyISO());
  const [fechaFin, setFechaFin] = useState('');
  const [todoElDia, setTodoElDia] = useState(true);
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('11:00');
  const [aula, setAula] = useState('');
  const [cancela, setCancela] = useState(true);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [conflictos, setConflictos] = useState<ConflictoHorario[]>([]);

  useEffect(() => {
    navigation.setOptions({ title: esEdicion ? 'Editar excepción' : 'Nueva excepción' });
  }, [navigation, esEdicion]);

  // El listado ya trae todas las excepciones; se reutiliza en vez de pedir el
  // detalle, para que abrir la edición sea instantáneo con la caché de la lista.
  const { data: excepciones, isLoading } = useQuery({
    queryKey: ['horario-excepciones'],
    queryFn: () => listarExcepciones(),
    enabled: esEdicion,
  });

  const excepcion = excepciones?.find((item) => item.id === excepcionId);

  useEffect(() => {
    if (!excepcion) return;
    setTipo(excepcion.tipo);
    setAlcance(excepcion.alcance);
    setSeccionId(excepcion.seccion_id ?? null);
    setDocenteId(excepcion.docente_id ?? null);
    setEventoId(excepcion.evento_id ?? null);
    setTitulo(excepcion.titulo);
    setDescripcion(excepcion.descripcion ?? '');
    setFecha(excepcion.fecha.slice(0, 10));
    setFechaFin(excepcion.fecha_fin?.slice(0, 10) ?? '');
    setTodoElDia(!excepcion.hora_inicio);
    if (excepcion.hora_inicio) setHoraInicio(excepcion.hora_inicio.slice(0, 5));
    if (excepcion.hora_fin) setHoraFin(excepcion.hora_fin.slice(0, 5));
    setAula(excepcion.aula ?? '');
    setCancela(excepcion.cancela_clases);
  }, [excepcion]);

  const { data: secciones = [], isLoading: cargandoSecciones } = useQuery({
    queryKey: ['secciones', null],
    queryFn: () => listarSecciones(),
  });

  const { data: docentesPagina, isLoading: cargandoDocentes } = useQuery({
    queryKey: ['docentes', '', 1],
    queryFn: () => listarDocentes({ page: 1 }),
  });

  const { data: eventos = [] } = useQuery({
    queryKey: ['eventos-proximos'],
    queryFn: () => listarEventosProximos(),
  });

  const cambiarTipo = (nuevo: TipoExcepcion) => {
    setTipo(nuevo);
    const cancelaPorDefecto = TIPOS_QUE_CANCELAN.includes(nuevo);
    setCancela(cancelaPorDefecto);
    // Una recuperación o actividad necesita franja horaria: se abre el detalle.
    setTodoElDia(cancelaPorDefecto);
    if (nuevo === 'viaje' && alcance === 'institucional') setAlcance('seccion');
  };

  const construirPayload = (forzar = false): PayloadExcepcion => ({
    tipo,
    alcance,
    seccion_id: alcance === 'seccion' ? seccionId : null,
    docente_id: docenteId,
    evento_id: eventoId,
    titulo: titulo.trim(),
    descripcion: descripcion.trim() || null,
    fecha,
    fecha_fin: fechaFin || null,
    hora_inicio: todoElDia ? null : horaInicio,
    hora_fin: todoElDia ? null : horaFin,
    aula: aula.trim() || null,
    cancela_clases: cancela,
    ...(forzar ? { forzar: true } : {}),
  });

  const guardar = useMutation({
    mutationFn: (forzar: boolean) =>
      esEdicion
        ? actualizarExcepcion(excepcionId as number, construirPayload(forzar))
        : crearExcepcion(construirPayload(forzar)),
    onSuccess: () => {
      setErrores({});
      setConflictos([]);
      queryClient.invalidateQueries({ queryKey: ['horario-excepciones'] });
      queryClient.invalidateQueries({ queryKey: ['agenda'] });
      queryClient.invalidateQueries({ queryKey: ['mi-agenda'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      router.back();
    },
    onError: (error) => {
      setErrores(erroresPorCampo(error));
      const choques = conflictosDeError(error);
      setConflictos(choques);

      if (choques.length === 0) {
        Alert.alert('No se pudo guardar', mensajeError(error));
      } else {
        Alert.alert(
          'Conflicto de horario',
          `${choques[0].detalle}${choques.length > 1 ? `\n\ny ${choques.length - 1} más.` : ''}`,
          [
            { text: 'Corregir', style: 'cancel' },
            { text: 'Guardar igual', style: 'destructive', onPress: () => guardar.mutate(true) },
          ]
        );
      }
    },
  });

  const validar = () => {
    const nuevos: Record<string, string> = {};
    if (!titulo.trim()) nuevos.titulo = 'Ponle un título a la excepción.';
    if (alcance === 'seccion' && !seccionId) nuevos.seccion_id = 'Elige la sección afectada.';
    if (alcance === 'docente' && !docenteId) nuevos.docente_id = 'Elige el docente afectado.';
    if (!todoElDia && horaFin <= horaInicio) {
      nuevos.hora_fin = 'La hora de fin debe ser posterior al inicio.';
    }
    if (!cancela && todoElDia) {
      nuevos.hora_inicio = 'Un bloque que se agrega necesita una franja horaria.';
    }
    if (fechaFin && fechaFin < fecha) nuevos.fecha_fin = 'La fecha final es anterior al inicio.';

    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  if (esEdicion && isLoading) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator color={colores.primario} />
      </View>
    );
  }

  return (
    <ScrollView style={estilos.contenedor} contentContainerStyle={estilos.scroll}>
      <Selector
        etiqueta="Tipo"
        requerido
        valor={tipo}
        onCambiar={cambiarTipo}
        opciones={TIPOS.map((item) => ({
          valor: item.valor,
          etiqueta: item.etiqueta,
          descripcion: item.descripcion,
        }))}
      />

      <Campo
        etiqueta="Título"
        requerido
        valor={titulo}
        onCambiar={setTitulo}
        error={errores.titulo}
        placeholder="Fiestas Patrias, Visita al museo..."
      />

      <Selector
        etiqueta="A quién afecta"
        requerido
        valor={alcance}
        onCambiar={setAlcance}
        opciones={[
          { valor: 'institucional', etiqueta: 'Todo el colegio' },
          { valor: 'seccion', etiqueta: 'Una sección' },
          { valor: 'docente', etiqueta: 'Un docente' },
        ]}
      />

      {alcance === 'seccion' && (
        <Selector
          etiqueta="Sección"
          requerido
          valor={seccionId}
          cargando={cargandoSecciones}
          error={errores.seccion_id}
          onCambiar={setSeccionId}
          opciones={secciones.map((seccion) => ({
            valor: seccion.id,
            etiqueta: `${seccion.grado?.nombre ?? ''} — ${seccion.nombre}`.trim(),
          }))}
        />
      )}

      <Selector
        etiqueta={alcance === 'docente' ? 'Docente' : 'Docente a cargo (opcional)'}
        requerido={alcance === 'docente'}
        valor={docenteId}
        cargando={cargandoDocentes}
        error={errores.docente_id}
        placeholder="Sin docente"
        onCambiar={setDocenteId}
        opciones={[
          { valor: null, etiqueta: 'Sin docente' },
          ...(docentesPagina?.data ?? []).map((docente) => ({
            valor: docente.id as number | null,
            etiqueta: `${docente.apellidos}, ${docente.nombres}`,
          })),
        ]}
      />

      <View style={estilos.fila}>
        <View style={{ flex: 1 }}>
          <CampoFecha etiqueta="Fecha" requerido valor={fecha} onCambiar={setFecha} />
        </View>
        <View style={{ flex: 1 }}>
          <CampoFecha
            etiqueta="Hasta (opcional)"
            valor={fechaFin}
            onCambiar={setFechaFin}
            minima={fecha}
            error={errores.fecha_fin}
          />
        </View>
      </View>

      <CampoInterruptor
        etiqueta="Todo el día"
        descripcion="Si lo desactivas, la excepción solo cubre una franja horaria."
        valor={todoElDia}
        onCambiar={setTodoElDia}
      />

      {!todoElDia && (
        <View style={estilos.fila}>
          <View style={{ flex: 1 }}>
            <CampoHora
              etiqueta="Desde"
              requerido
              valor={horaInicio}
              onCambiar={setHoraInicio}
              error={errores.hora_inicio}
            />
          </View>
          <View style={{ flex: 1 }}>
            <CampoHora
              etiqueta="Hasta"
              requerido
              valor={horaFin}
              onCambiar={setHoraFin}
              error={errores.hora_fin}
            />
          </View>
        </View>
      )}

      <CampoInterruptor
        etiqueta="Cancela las clases regulares"
        descripcion={
          cancela
            ? 'Los bloques que caigan dentro se marcarán como cancelados.'
            : 'Se agregará un bloque nuevo a la agenda de esa fecha.'
        }
        valor={cancela}
        onCambiar={(valor) => {
          setCancela(valor);
          if (!valor) setTodoElDia(false);
        }}
      />

      {!cancela && (
        <Campo etiqueta="Aula" valor={aula} onCambiar={setAula} placeholder="Aula 1, Auditorio..." />
      )}

      {eventos.length > 0 && (
        <Selector
          etiqueta="Enlazar con un evento"
          valor={eventoId}
          placeholder="Sin evento asociado"
          onCambiar={setEventoId}
          opciones={[
            { valor: null, etiqueta: 'Sin evento asociado' },
            ...eventos.map((evento) => ({
              valor: evento.id as number | null,
              etiqueta: evento.titulo,
              descripcion: evento.fecha,
            })),
          ]}
        />
      )}

      <AreaTexto
        etiqueta="Descripción"
        valor={descripcion}
        onCambiar={setDescripcion}
        placeholder="Detalles para docentes y familias"
      />

      {conflictos.length > 0 && (
        <View style={estilos.conflictos}>
          <View style={estilos.conflictosCabecera}>
            <Ionicons name="warning-outline" size={16} color={colores.advertencia} />
            <Text style={estilos.conflictosTitulo}>
              {conflictos.length} conflicto(s) con clases ya programadas
            </Text>
          </View>
          {conflictos.slice(0, 5).map((conflicto, indice) => (
            <Text key={indice} style={estilos.conflictoTexto}>
              • {conflicto.detalle}
            </Text>
          ))}
        </View>
      )}

      <BotonPrimario
        texto={esEdicion ? 'Guardar cambios' : 'Crear excepción'}
        icono="checkmark"
        cargando={guardar.isPending}
        onPress={() => {
          if (validar()) guardar.mutate(false);
        }}
      />
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.fondo },
  scroll: { padding: 16, paddingBottom: 40 },
  fila: { flexDirection: 'row', gap: 12 },
  conflictos: {
    backgroundColor: '#fff8ec',
    borderWidth: 1,
    borderColor: '#f3ddb4',
    borderRadius: 12,
    padding: 13,
    marginBottom: 16,
  },
  conflictosCabecera: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 7 },
  conflictosTitulo: { fontSize: 12, fontWeight: '700', color: colores.advertencia },
  conflictoTexto: { fontSize: 12, color: colores.texto, lineHeight: 18 },
});
