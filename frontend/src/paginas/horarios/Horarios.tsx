import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, X, Calendar, Clock, MapPin } from 'lucide-react';
import {
  actualizarHorario,
  crearHorario,
  eliminarHorario,
  listarHorarios,
} from '../../api/horarios';
import { listarGrados, listarSecciones } from '../../api/grados';
import { listarCursos } from '../../api/cursos';
import { listarDocentes } from '../../api/docentes';
import type { Horario, Grado, Seccion, Curso, Docente } from '../../tipos';
import { usePermiso } from '../../hooks/usePermiso';

const DIAS: { value: Horario['dia_semana']; label: string }[] = [
  { value: 'lunes', label: 'Lunes' },
  { value: 'martes', label: 'Martes' },
  { value: 'miercoles', label: 'Miércoles' },
  { value: 'jueves', label: 'Jueves' },
  { value: 'viernes', label: 'Viernes' },
];

const COLORES_CURSO = [
  'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-200',
  'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900/40 dark:border-emerald-700 dark:text-emerald-200',
  'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/40 dark:border-purple-700 dark:text-purple-200',
  'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-200',
  'bg-rose-100 border-rose-300 text-rose-800 dark:bg-rose-900/40 dark:border-rose-700 dark:text-rose-200',
  'bg-cyan-100 border-cyan-300 text-cyan-800 dark:bg-cyan-900/40 dark:border-cyan-700 dark:text-cyan-200',
  'bg-indigo-100 border-indigo-300 text-indigo-800 dark:bg-indigo-900/40 dark:border-indigo-700 dark:text-indigo-200',
  'bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/40 dark:border-orange-700 dark:text-orange-200',
  'bg-teal-100 border-teal-300 text-teal-800 dark:bg-teal-900/40 dark:border-teal-700 dark:text-teal-200',
  'bg-pink-100 border-pink-300 text-pink-800 dark:bg-pink-900/40 dark:border-pink-700 dark:text-pink-200',
];

const vacio = {
  curso_id: '',
  docente_id: '',
  dia_semana: 'lunes' as Horario['dia_semana'],
  hora_inicio: '08:00',
  hora_fin: '08:45',
  aula: '',
  estado: true,
};

export const Horarios = () => {
  const puedeCrear = usePermiso('crear-horarios');
  const puedeEditar = usePermiso('editar-horarios');
  const puedeEliminar = usePermiso('eliminar-horarios');

  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [grados, setGrados] = useState<Grado[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);

  const [filtroGrado, setFiltroGrado] = useState('');
  const [filtroSeccion, setFiltroSeccion] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Horario | null>(null);
  const [form, setForm] = useState(vacio);
  const [guardando, setGuardando] = useState(false);

  // Filtrar secciones por grado seleccionado
  const seccionesFiltradas = useMemo(
    () => (filtroGrado ? secciones.filter((s) => s.grado_id === Number(filtroGrado)) : secciones),
    [secciones, filtroGrado]
  );

  // Filtrar cursos por grado seleccionado
  const cursosFiltrados = useMemo(
    () => (filtroGrado ? cursos.filter((c) => c.grado_id === Number(filtroGrado)) : cursos),
    [cursos, filtroGrado]
  );

  // Mapa de color por curso
  const colorCurso = useMemo(() => {
    const map: Record<number, string> = {};
    const cursosUnicos = [...new Set(horarios.map((h) => h.curso_id))];
    cursosUnicos.forEach((id, i) => {
      map[id] = COLORES_CURSO[i % COLORES_CURSO.length];
    });
    return map;
  }, [horarios]);

  // Extraer bloques horarios únicos ordenados
  const bloquesHorarios = useMemo(() => {
    const set = new Set<string>();
    horarios.forEach((h) => set.add(`${h.hora_inicio}-${h.hora_fin}`));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [horarios]);

  const cargar = async () => {
    if (!filtroSeccion) {
      setHorarios([]);
      setCargando(false);
      return;
    }
    setCargando(true);
    setError('');
    try {
      const data = await listarHorarios({ seccion_id: Number(filtroSeccion) });
      setHorarios(data);
    } catch {
      setError('No se pudieron cargar los horarios.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    listarGrados().then(setGrados).catch(() => setGrados([]));
    listarSecciones().then(setSecciones).catch(() => setSecciones([]));
    listarCursos().then((r) => setCursos(r.data)).catch(() => setCursos([]));
    listarDocentes({ page: 1 }).then((r) => setDocentes(r.data)).catch(() => setDocentes([]));
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [filtroSeccion]);

  // Auto-seleccionar primera sección cuando cambia grado
  useEffect(() => {
    if (filtroGrado) {
      const primera = secciones.find((s) => s.grado_id === Number(filtroGrado));
      setFiltroSeccion(primera ? String(primera.id) : '');
    } else {
      setFiltroSeccion('');
    }
  }, [filtroGrado, secciones]);

  const abrirCrear = (dia?: Horario['dia_semana'], hora?: string) => {
    setEditando(null);
    setForm({
      ...vacio,
      dia_semana: dia ?? 'lunes',
      hora_inicio: hora?.split('-')[0] ?? '08:00',
      hora_fin: hora?.split('-')[1] ?? '08:45',
    });
    setModalAbierto(true);
  };

  const abrirEditar = (horario: Horario) => {
    setEditando(horario);
    setForm({
      curso_id: String(horario.curso_id),
      docente_id: horario.docente_id ? String(horario.docente_id) : '',
      dia_semana: horario.dia_semana,
      hora_inicio: horario.hora_inicio.slice(0, 5),
      hora_fin: horario.hora_fin.slice(0, 5),
      aula: horario.aula ?? '',
      estado: horario.estado,
    });
    setModalAbierto(true);
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filtroSeccion) return;
    setGuardando(true);
    setError('');
    const payload = {
      seccion_id: Number(filtroSeccion),
      curso_id: Number(form.curso_id),
      docente_id: form.docente_id ? Number(form.docente_id) : null,
      dia_semana: form.dia_semana,
      hora_inicio: form.hora_inicio,
      hora_fin: form.hora_fin,
      aula: form.aula || null,
      estado: form.estado,
    };
    try {
      if (editando) {
        await actualizarHorario(editando.id, payload);
      } else {
        await crearHorario(payload);
      }
      setModalAbierto(false);
      await cargar();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string; message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      setError(data?.errors ? Object.values(data.errors)[0][0] : data?.mensaje || data?.message || 'Error al guardar.');
    } finally {
      setGuardando(false);
    }
  };

  const borrar = async (horario: Horario) => {
    if (!confirm(`¿Eliminar esta clase del horario?`)) return;
    try {
      await eliminarHorario(horario.id);
      await cargar();
    } catch {
      setError('No se pudo eliminar la clase.');
    }
  };

  const obtenerClase = (dia: string, bloque: string) => {
    return horarios.find(
      (h) => h.dia_semana === dia && `${h.hora_inicio.slice(0, 5)}-${h.hora_fin.slice(0, 5)}` === bloque
    );
  };

  const seccionActual = secciones.find((s) => s.id === Number(filtroSeccion));
  const gradoActual = grados.find((g) => g.id === Number(filtroGrado));

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Horarios</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {gradoActual && seccionActual
              ? `${gradoActual.nombre} "${seccionActual.nombre}" — ${gradoActual.nivel}`
              : 'Selecciona un grado y sección para ver el horario'}
          </p>
        </div>
        {puedeCrear && filtroSeccion && (
          <button onClick={() => abrirCrear()} className="btn-primario">
            <Plus className="w-4 h-4" /> Nueva clase
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="tarjeta p-4 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="etiqueta dark:text-gray-300">Grado</label>
            <select
              className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
              value={filtroGrado}
              onChange={(e) => setFiltroGrado(e.target.value)}
            >
              <option value="">Seleccionar grado...</option>
              {grados.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nombre} — {g.nivel}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="etiqueta dark:text-gray-300">Sección</label>
            <select
              className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
              value={filtroSeccion}
              onChange={(e) => setFiltroSeccion(e.target.value)}
              disabled={!filtroGrado}
            >
              <option value="">Seleccionar sección...</option>
              {seccionesFiltradas.map((s) => (
                <option key={s.id} value={s.id}>
                  Sección {s.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      {/* Grilla semanal */}
      {!filtroSeccion ? (
        <div className="tarjeta p-12 text-center dark:bg-gray-800 dark:border-gray-700">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">Selecciona un grado y sección para ver el horario semanal</p>
        </div>
      ) : cargando ? (
        <div className="tarjeta p-12 text-center text-gray-400 dark:bg-gray-800">Cargando horario...</div>
      ) : (
        <div className="tarjeta overflow-hidden dark:bg-gray-800 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50">
                  <th className="px-3 py-3 text-left font-semibold text-gray-500 dark:text-gray-400 w-24 border-r border-gray-100 dark:border-gray-700">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Hora
                  </th>
                  {DIAS.map((dia) => (
                    <th key={dia.value} className="px-3 py-3 text-center font-semibold text-gray-700 dark:text-gray-300 min-w-[160px]">
                      {dia.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bloquesHorarios.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      No hay clases programadas para esta sección.
                      {puedeCrear && (
                        <div className="mt-2">
                          <button onClick={() => abrirCrear()} className="text-primario-600 hover:underline text-sm font-medium">
                            + Agregar primera clase
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  bloquesHorarios.map((bloque) => (
                    <tr key={bloque} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="px-3 py-2 text-xs font-mono text-gray-500 dark:text-gray-400 border-r border-gray-100 dark:border-gray-700 whitespace-nowrap align-top pt-3">
                        {bloque.replace('-', '\n→ ').split('\n').map((l, i) => (
                          <div key={i}>{l}</div>
                        ))}
                      </td>
                      {DIAS.map((dia) => {
                        const clase = obtenerClase(dia.value, bloque);
                        return (
                          <td key={dia.value} className="px-2 py-2 align-top">
                            {clase ? (
                              <div
                                className={`rounded-lg border p-2.5 transition-all hover:shadow-md cursor-pointer group ${colorCurso[clase.curso_id] ?? COLORES_CURSO[0]}`}
                                onClick={() => puedeEditar && abrirEditar(clase)}
                              >
                                <div className="font-semibold text-xs leading-tight">{clase.curso?.nombre ?? 'Curso'}</div>
                                {clase.docente && (
                                  <div className="text-[11px] opacity-75 mt-1 truncate">
                                    {clase.docente.apellidos}, {clase.docente.nombres}
                                  </div>
                                )}
                                {clase.aula && (
                                  <div className="text-[11px] opacity-60 mt-0.5 flex items-center gap-0.5">
                                    <MapPin className="w-3 h-3" />
                                    {clase.aula}
                                  </div>
                                )}
                                {puedeEliminar && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); borrar(clase); }}
                                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-black/10 transition-opacity"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              puedeCrear && (
                                <button
                                  onClick={() => abrirCrear(dia.value, bloque)}
                                  className="w-full h-full min-h-[60px] rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primario-400 dark:hover:border-primario-500 hover:bg-primario-50/50 dark:hover:bg-primario-900/20 transition-all flex items-center justify-center"
                                >
                                  <Plus className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                                </button>
                              )
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leyenda de colores */}
      {filtroSeccion && horarios.length > 0 && (
        <div className="tarjeta p-4 dark:bg-gray-800 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Leyenda de cursos:</p>
          <div className="flex flex-wrap gap-2">
            {[...new Set(horarios.map((h) => h.curso_id))].map((cursoId) => {
              const curso = horarios.find((h) => h.curso_id === cursoId)?.curso;
              return (
                <span key={cursoId} className={`px-2.5 py-1 rounded-full text-xs font-medium border ${colorCurso[cursoId]}`}>
                  {curso?.nombre ?? 'Curso'}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal crear/editar */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {editando ? 'Editar clase' : 'Nueva clase'}
              </h3>
              <button onClick={() => setModalAbierto(false)} className="btn-icono"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={guardar} className="p-6 space-y-4">
              <div>
                <label className="etiqueta dark:text-gray-300">Curso</label>
                <select
                  required
                  className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                  value={form.curso_id}
                  onChange={(e) => setForm({ ...form, curso_id: e.target.value })}
                >
                  <option value="">Seleccionar curso</option>
                  {cursosFiltrados.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="etiqueta dark:text-gray-300">Docente</label>
                <select
                  className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                  value={form.docente_id}
                  onChange={(e) => setForm({ ...form, docente_id: e.target.value })}
                >
                  <option value="">Sin asignar</option>
                  {docentes.map((d) => (
                    <option key={d.id} value={d.id}>{d.apellidos}, {d.nombres}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="etiqueta dark:text-gray-300">Día</label>
                  <select
                    required
                    className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                    value={form.dia_semana}
                    onChange={(e) => setForm({ ...form, dia_semana: e.target.value as Horario['dia_semana'] })}
                  >
                    {DIAS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="etiqueta dark:text-gray-300">Hora inicio</label>
                  <input
                    type="time"
                    required
                    className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                    value={form.hora_inicio}
                    onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
                  />
                </div>
                <div>
                  <label className="etiqueta dark:text-gray-300">Hora fin</label>
                  <input
                    type="time"
                    required
                    className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                    value={form.hora_fin}
                    onChange={(e) => setForm({ ...form, hora_fin: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="etiqueta dark:text-gray-300">Aula</label>
                <input
                  className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                  placeholder="Ej: Aula 101"
                  value={form.aula}
                  onChange={(e) => setForm({ ...form, aula: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.checked })}
                />
                Activo
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalAbierto(false)} className="btn-secundario">Cancelar</button>
                <button type="submit" disabled={guardando} className="btn-primario">
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
