import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  actualizarRegla,
  crearRegla,
  obtenerRegla,
  verificarConflictosRegla,
  type PayloadRegla,
} from '@/api/horarios';
import { listarSecciones } from '@/api/grados';
import { listarCursos } from '@/api/cursos';
import { listarDocentes } from '@/api/docentes';
import {
  AreaTexto,
  BotonPrimario,
  Campo,
  CampoFecha,
  CampoHora,
  CampoInterruptor,
  Selector,
  SelectorChips,
} from '@/componentes/formulario';
import { conflictosDeError, erroresPorCampo, mensajeError } from '@/utils/errores';
import { colores } from '@/utils/colores';
import type { ConflictoHorario, DiaSemana, TipoRegla } from '@/tipos';

const DIAS: { valor: DiaSemana; etiqueta: string }[] = [
  { valor: 'lunes', etiqueta: 'Lun' },
  { valor: 'martes', etiqueta: 'Mar' },
  { valor: 'miercoles', etiqueta: 'Mié' },
  { valor: 'jueves', etiqueta: 'Jue' },
  { valor: 'viernes', etiqueta: 'Vie' },
  { valor: 'sabado', etiqueta: 'Sáb' },
];

const TIPOS: { valor: TipoRegla; etiqueta: string; descripcion: string }[] = [
  { valor: 'clase', etiqueta: 'Clase', descripcion: 'Curso regular del plan de estudios' },
  { valor: 'taller', etiqueta: 'Taller', descripcion: 'Taller recurrente' },
  { valor: 'extracurricular', etiqueta: 'Extracurricular', descripcion: 'Actividad fuera del plan' },
  { valor: 'tutoria', etiqueta: 'Tutoría', descripcion: 'Acompañamiento del tutor' },
  { valor: 'recuperacion', etiqueta: 'Recuperación', descripcion: 'Refuerzo periódico' },
  { valor: 'otro', etiqueta: 'Otro', descripcion: 'Cualquier otro bloque' },
];

const hoyISO = () => new Date().toISOString().slice(0, 10);
const finDeAnio = () => `${new Date().getFullYear()}-12-31`;

/**
 * Alta y edición de una regla recurrente.
 *
 * La idea del modelo: en vez de crear "un lunes" a la vez, se guardan los días de
 * la semana + el rango de vigencia, y el backend expande las ocurrencias al
 * consultar la agenda. Antes de guardar se consulta
 * POST /horarios/reglas/verificar, que detecta si la sección o el docente ya
 * tienen otro bloque en esa franja; el usuario puede corregir o forzar.
 */
export default function FormularioRegla() {
  const { id, seccionId: seccionInicial } = useLocalSearchParams<{
    id?: string;
    seccionId?: string;
  }>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const reglaId = id ? Number(id) : null;
  const esEdicion = reglaId !== null;

  const [seccionId, setSeccionId] = useState<number | null>(
    seccionInicial ? Number(seccionInicial) : null
  );
  const [cursoId, setCursoId] = useState<number | null>(null);
  const [docenteId, setDocenteId] = useState<number | null>(null);
  const [tipo, setTipo] = useState<TipoRegla>('clase');
  const [titulo, setTitulo] = useState('');
  const [dias, setDias] = useState<DiaSemana[]>([]);
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFin, setHoraFin] = useState('09:30');
  const [aula, setAula] = useState('');
  const [fechaInicio, setFechaInicio] = useState(hoyISO());
  const [fechaFin, setFechaFin] = useState(finDeAnio());
  const [observacion, setObservacion] = useState('');
  const [activa, setActiva] = useState(true);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [conflictos, setConflictos] = useState<ConflictoHorario[]>([]);

  useEffect(() => {
    navigation.setOptions({ title: esEdicion ? 'Editar regla' : 'Nueva regla' });
  }, [navigation, esEdicion]);

  const { data: regla, isLoading } = useQuery({
    queryKey: ['horario-regla', reglaId],
    queryFn: () => obtenerRegla(reglaId as number),
    enabled: esEdicion,
  });

  useEffect(() => {
    if (!regla) return;
    setSeccionId(regla.seccion_id);
    setCursoId(regla.curso_id ?? null);
    setDocenteId(regla.docente_id ?? null);
    setTipo(regla.tipo);
    setTitulo(regla.titulo ?? '');
    setDias(regla.dias_semana ?? []);
    setHoraInicio(regla.hora_inicio.slice(0, 5));
    setHoraFin(regla.hora_fin.slice(0, 5));
    setAula(regla.aula ?? '');
    setFechaInicio(regla.fecha_inicio.slice(0, 10));
    setFechaFin(regla.fecha_fin.slice(0, 10));
    setObservacion(regla.observacion ?? '');
    setActiva(regla.estado);
  }, [regla]);

  const { data: secciones = [], isLoading: cargandoSecciones } = useQuery({
    queryKey: ['secciones', null],
    queryFn: () => listarSecciones(),
  });

  const seccionElegida = secciones.find((seccion) => seccion.id === seccionId);

  // Los cursos se filtran por el grado de la sección: un curso pertenece a un
  // grado, así que ofrecer todos llevaría a combinaciones inválidas.
  const { data: cursosPagina, isLoading: cargandoCursos } = useQuery({
    queryKey: ['cursos', seccionElegida?.grado_id],
    queryFn: () => listarCursos({ grado_id: seccionElegida?.grado_id }),
    enabled: !!seccionElegida,
  });

  const { data: docentesPagina, isLoading: cargandoDocentes } = useQuery({
    queryKey: ['docentes', '', 1],
    queryFn: () => listarDocentes({ page: 1 }),
  });

  const construirPayload = (forzar = false): PayloadRegla => ({
    seccion_id: seccionId as number,
    curso_id: cursoId,
    docente_id: docenteId,
    tipo,
    titulo: titulo.trim() || null,
    dias_semana: dias,
    hora_inicio: horaInicio,
    hora_fin: horaFin,
    aula: aula.trim() || null,
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    'año_escolar': fechaInicio.slice(0, 4),
    observacion: observacion.trim() || null,
    estado: activa,
    ...(forzar ? { forzar: true } : {}),
  });

  const guardar = useMutation({
    mutationFn: (forzar: boolean) =>
      esEdicion
        ? actualizarRegla(reglaId as number, construirPayload(forzar))
        : crearRegla(construirPayload(forzar)),
    onSuccess: () => {
      setErrores({});
      setConflictos([]);
      queryClient.invalidateQueries({ queryKey: ['horario-reglas'] });
      queryClient.invalidateQueries({ queryKey: ['agenda'] });
      queryClient.invalidateQueries({ queryKey: ['horarios'] });
      queryClient.invalidateQueries({ queryKey: ['mi-agenda'] });
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
            {
              text: 'Guardar igual',
              style: 'destructive',
              onPress: () => guardar.mutate(true),
            },
          ]
        );
      }
    },
  });

  // Consulta de solo lectura para avisar del choque antes de intentar guardar.
  const verificar = useMutation({
    mutationFn: () =>
      verificarConflictosRegla({
        seccion_id: seccionId as number,
        docente_id: docenteId,
        dias_semana: dias,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        ...(esEdicion ? { ignorar_regla_id: reglaId as number } : {}),
      }),
    onSuccess: (respuesta) => {
      setConflictos(respuesta.conflictos);
      if (!respuesta.hay_conflictos) {
        Alert.alert('Sin conflictos', 'La franja está libre para la sección y el docente.');
      }
    },
    onError: (error) => Alert.alert('No se pudo verificar', mensajeError(error)),
  });

  const validar = () => {
    const nuevos: Record<string, string> = {};
    if (!seccionId) nuevos.seccion_id = 'Elige la sección.';
    if (tipo === 'clase' && !cursoId) nuevos.curso_id = 'Una clase necesita un curso.';
    if (tipo !== 'clase' && !cursoId && !titulo.trim()) {
      nuevos.titulo = 'Ponle un título al bloque o elige un curso.';
    }
    if (dias.length === 0) nuevos.dias_semana = 'Marca al menos un día.';
    if (horaFin <= horaInicio) nuevos.hora_fin = 'La hora de fin debe ser posterior al inicio.';
    if (fechaFin < fechaInicio) nuevos.fecha_fin = 'La vigencia termina antes de empezar.';

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

  const puedeVerificar = !!seccionId && dias.length > 0;

  return (
    <ScrollView style={estilos.contenedor} contentContainerStyle={estilos.scroll}>
      <View style={estilos.explicacion}>
        <Ionicons name="information-circle-outline" size={17} color={colores.primario} />
        <Text style={estilos.explicacionTexto}>
          Una regla programa el mismo bloque en varios días de la semana durante todo un rango de
          fechas. No hace falta crear cada semana por separado.
        </Text>
      </View>

      <Selector
        etiqueta="Sección"
        requerido
        valor={seccionId}
        cargando={cargandoSecciones}
        error={errores.seccion_id}
        onCambiar={(valor) => {
          setSeccionId(valor);
          setCursoId(null);
        }}
        opciones={secciones.map((seccion) => ({
          valor: seccion.id,
          etiqueta: `${seccion.grado?.nombre ?? ''} — ${seccion.nombre}`.trim(),
          descripcion: seccion.grado?.nivel,
        }))}
      />

      <Selector
        etiqueta="Tipo de bloque"
        valor={tipo}
        onCambiar={setTipo}
        opciones={TIPOS.map((item) => ({
          valor: item.valor,
          etiqueta: item.etiqueta,
          descripcion: item.descripcion,
        }))}
      />

      <Selector
        etiqueta="Curso"
        requerido={tipo === 'clase'}
        valor={cursoId}
        cargando={cargandoCursos}
        deshabilitado={!seccionId}
        error={errores.curso_id}
        placeholder={seccionId ? 'Selecciona el curso' : 'Elige primero la sección'}
        onCambiar={setCursoId}
        opciones={(cursosPagina?.data ?? []).map((curso) => ({
          valor: curso.id,
          etiqueta: curso.nombre,
          descripcion: curso.docente
            ? `${curso.docente.nombres} ${curso.docente.apellidos}`
            : undefined,
        }))}
      />

      {tipo !== 'clase' && (
        <Campo
          etiqueta="Título del bloque"
          valor={titulo}
          onCambiar={setTitulo}
          error={errores.titulo}
          placeholder="Taller de robótica, Tutoría..."
        />
      )}

      <Selector
        etiqueta="Docente"
        valor={docenteId}
        cargando={cargandoDocentes}
        placeholder="Sin docente asignado"
        onCambiar={setDocenteId}
        opciones={[
          { valor: null, etiqueta: 'Sin docente asignado' },
          ...(docentesPagina?.data ?? []).map((docente) => ({
            valor: docente.id as number | null,
            etiqueta: `${docente.apellidos}, ${docente.nombres}`,
            descripcion: docente.especialidad ?? undefined,
          })),
        ]}
      />

      <SelectorChips
        etiqueta="Días de la semana"
        requerido
        valores={dias}
        opciones={DIAS}
        onCambiar={setDias}
        error={errores.dias_semana}
      />

      <View style={estilos.fila}>
        <View style={{ flex: 1 }}>
          <CampoHora etiqueta="Hora de inicio" requerido valor={horaInicio} onCambiar={setHoraInicio} />
        </View>
        <View style={{ flex: 1 }}>
          <CampoHora
            etiqueta="Hora de fin"
            requerido
            valor={horaFin}
            onCambiar={setHoraFin}
            error={errores.hora_fin}
          />
        </View>
      </View>

      <Campo etiqueta="Aula" valor={aula} onCambiar={setAula} placeholder="Aula 1, Laboratorio..." />

      <Text style={estilos.seccionTitulo}>Vigencia</Text>
      <View style={estilos.fila}>
        <View style={{ flex: 1 }}>
          <CampoFecha etiqueta="Desde" requerido valor={fechaInicio} onCambiar={setFechaInicio} />
        </View>
        <View style={{ flex: 1 }}>
          <CampoFecha
            etiqueta="Hasta"
            requerido
            valor={fechaFin}
            onCambiar={setFechaFin}
            minima={fechaInicio}
            error={errores.fecha_fin}
          />
        </View>
      </View>

      <AreaTexto
        etiqueta="Observación"
        valor={observacion}
        onCambiar={setObservacion}
        placeholder="Notas internas sobre esta programación"
      />

      <CampoInterruptor
        etiqueta="Regla activa"
        descripcion="Al desactivarla deja de aparecer en la agenda sin borrar el historial."
        valor={activa}
        onCambiar={setActiva}
      />

      {conflictos.length > 0 && (
        <View style={estilos.conflictos}>
          <View style={estilos.conflictosCabecera}>
            <Ionicons name="warning-outline" size={16} color={colores.advertencia} />
            <Text style={estilos.conflictosTitulo}>
              {conflictos.length} conflicto(s) detectado(s)
            </Text>
          </View>
          {conflictos.slice(0, 5).map((conflicto, indice) => (
            <Text key={indice} style={estilos.conflictoTexto}>
              • {conflicto.detalle}
            </Text>
          ))}
        </View>
      )}

      <View style={{ gap: 10 }}>
        <BotonPrimario
          texto="Verificar conflictos"
          icono="search-outline"
          variante="secundario"
          cargando={verificar.isPending}
          deshabilitado={!puedeVerificar}
          onPress={() => verificar.mutate()}
        />
        <BotonPrimario
          texto={esEdicion ? 'Guardar cambios' : 'Crear regla'}
          icono="checkmark"
          cargando={guardar.isPending}
          onPress={() => {
            if (validar()) guardar.mutate(false);
          }}
        />
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.fondo },
  scroll: { padding: 16, paddingBottom: 40 },
  explicacion: {
    flexDirection: 'row',
    gap: 9,
    backgroundColor: '#f2f8fd',
    borderWidth: 1,
    borderColor: '#cfe3f5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  explicacionTexto: { flex: 1, fontSize: 12, color: colores.texto, lineHeight: 17 },
  fila: { flexDirection: 'row', gap: 12 },
  seccionTitulo: {
    fontSize: 12,
    fontWeight: '700',
    color: colores.textoSecundario,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 6,
    marginBottom: 10,
  },
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
