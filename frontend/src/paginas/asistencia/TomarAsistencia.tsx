import React, { useEffect, useState, useMemo } from 'react';
import { Check, Clock, XCircle, AlertCircle, Save, Users, CalendarDays } from 'lucide-react';
import {
  obtenerAsistenciaSeccionFecha,
  registrarAsistenciaMasiva,
  obtenerResumenAsistencia,
} from '../../api/asistencias';
import { listarGrados, listarSecciones } from '../../api/grados';
import type { Grado, Seccion, AlumnoAsistencia, ResumenAsistencia } from '../../tipos';
import { usePermiso } from '../../hooks/usePermiso';

type EstadoAsistencia = 'presente' | 'tardanza' | 'falta' | 'justificado';

const ESTADOS: { value: EstadoAsistencia; label: string; icon: React.ReactNode; color: string; bgColor: string }[] = [
  {
    value: 'presente',
    label: 'Presente',
    icon: <Check className="w-4 h-4" />,
    color: 'text-emerald-700 dark:text-emerald-300',
    bgColor: 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:hover:bg-emerald-900/70 border-emerald-300 dark:border-emerald-700',
  },
  {
    value: 'tardanza',
    label: 'Tardanza',
    icon: <Clock className="w-4 h-4" />,
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 dark:hover:bg-amber-900/70 border-amber-300 dark:border-amber-700',
  },
  {
    value: 'falta',
    label: 'Falta',
    icon: <XCircle className="w-4 h-4" />,
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900/70 border-red-300 dark:border-red-700',
  },
  {
    value: 'justificado',
    label: 'Justificado',
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 border-blue-300 dark:border-blue-700',
  },
];

export const TomarAsistencia = () => {
  const puedeRegistrar = usePermiso('registrar-asistencias');

  const [grados, setGrados] = useState<Grado[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [filtroGrado, setFiltroGrado] = useState('');
  const [filtroSeccion, setFiltroSeccion] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [alumnos, setAlumnos] = useState<(AlumnoAsistencia & { estadoLocal: EstadoAsistencia; obsLocal: string })[]>([]);
  const [resumen, setResumen] = useState<ResumenAsistencia | null>(null);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const seccionesFiltradas = useMemo(
    () => (filtroGrado ? secciones.filter((s) => s.grado_id === Number(filtroGrado)) : secciones),
    [secciones, filtroGrado]
  );

  const conteos = useMemo(() => {
    const c: Record<EstadoAsistencia, number> = { presente: 0, tardanza: 0, falta: 0, justificado: 0 };
    alumnos.forEach((a) => { c[a.estadoLocal]++; });
    return c;
  }, [alumnos]);

  useEffect(() => {
    listarGrados().then(setGrados).catch(() => setGrados([]));
    listarSecciones().then(setSecciones).catch(() => setSecciones([]));
  }, []);

  useEffect(() => {
    if (filtroGrado) {
      const primera = secciones.find((s) => s.grado_id === Number(filtroGrado));
      setFiltroSeccion(primera ? String(primera.id) : '');
    } else {
      setFiltroSeccion('');
    }
  }, [filtroGrado, secciones]);

  const cargar = async () => {
    if (!filtroSeccion || !fecha) {
      setAlumnos([]);
      return;
    }
    setCargando(true);
    setError('');
    setExito('');
    try {
      const [asistData, resumenData] = await Promise.all([
        obtenerAsistenciaSeccionFecha({ seccion_id: Number(filtroSeccion), fecha }),
        obtenerResumenAsistencia({ seccion_id: Number(filtroSeccion), fecha_desde: fecha, fecha_hasta: fecha }),
      ]);
      setAlumnos(
        asistData.alumnos.map((a) => ({
          ...a,
          estadoLocal: a.estado ?? 'presente',
          obsLocal: a.observacion ?? '',
        }))
      );
      setResumen(resumenData);
    } catch {
      setError('No se pudo cargar la asistencia.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [filtroSeccion, fecha]);

  const cambiarEstado = (alumnoId: number, estado: EstadoAsistencia) => {
    setAlumnos((prev) =>
      prev.map((a) => (a.alumno_id === alumnoId ? { ...a, estadoLocal: estado } : a))
    );
  };

  const cambiarObs = (alumnoId: number, obs: string) => {
    setAlumnos((prev) =>
      prev.map((a) => (a.alumno_id === alumnoId ? { ...a, obsLocal: obs } : a))
    );
  };

  const marcarTodos = (estado: EstadoAsistencia) => {
    setAlumnos((prev) => prev.map((a) => ({ ...a, estadoLocal: estado })));
  };

  const guardar = async () => {
    if (!filtroSeccion || alumnos.length === 0) return;
    setGuardando(true);
    setError('');
    setExito('');
    try {
      const resultado = await registrarAsistenciaMasiva({
        seccion_id: Number(filtroSeccion),
        fecha,
        asistencias: alumnos.map((a) => ({
          alumno_id: a.alumno_id,
          estado: a.estadoLocal,
          observacion: a.obsLocal || null,
        })),
      });
      setExito(`${resultado.mensaje} (${resultado.total} alumnos)`);
      await cargar();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string; message?: string } } })?.response?.data;
      setError(data?.mensaje || data?.message || 'Error al guardar la asistencia.');
    } finally {
      setGuardando(false);
    }
  };

  const gradoActual = grados.find((g) => g.id === Number(filtroGrado));
  const seccionActual = secciones.find((s) => s.id === Number(filtroSeccion));
  const yaRegistrado = alumnos.length > 0 && alumnos.every((a) => a.registrado);

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Asistencia</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {gradoActual && seccionActual
              ? `${gradoActual.nombre} "${seccionActual.nombre}" — ${new Date(fecha + 'T12:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`
              : 'Registro diario de asistencia por sección'}
          </p>
        </div>
        {puedeRegistrar && alumnos.length > 0 && (
          <button onClick={guardar} disabled={guardando} className="btn-primario">
            <Save className="w-4 h-4" />
            {guardando ? 'Guardando...' : yaRegistrado ? 'Actualizar asistencia' : 'Guardar asistencia'}
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
                <option key={g.id} value={g.id}>{g.nombre} — {g.nivel}</option>
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
                <option key={s.id} value={s.id}>Sección {s.nombre}</option>
              ))}
            </select>
          </div>
          <div className="sm:w-48">
            <label className="etiqueta dark:text-gray-300">Fecha</label>
            <input
              type="date"
              className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Resumen rápido */}
      {alumnos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ESTADOS.map((e) => (
            <div key={e.value} className="tarjeta p-3 dark:bg-gray-800 dark:border-gray-700 text-center">
              <div className={`text-2xl font-bold ${e.color}`}>{conteos[e.value]}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-center gap-1">
                {e.icon} {e.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}
      {exito && (
        <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> {exito}
        </div>
      )}

      {/* Lista de alumnos */}
      {!filtroSeccion ? (
        <div className="tarjeta p-12 text-center dark:bg-gray-800 dark:border-gray-700">
          <CalendarDays className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">Selecciona un grado y sección para tomar asistencia</p>
        </div>
      ) : cargando ? (
        <div className="tarjeta p-12 text-center text-gray-400 dark:bg-gray-800">Cargando lista de alumnos...</div>
      ) : alumnos.length === 0 ? (
        <div className="tarjeta p-12 text-center dark:bg-gray-800 dark:border-gray-700">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-gray-400">No hay alumnos matriculados en esta sección.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Acciones rápidas */}
          {puedeRegistrar && (
            <div className="tarjeta p-3 dark:bg-gray-800 dark:border-gray-700 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Marcar todos:</span>
              {ESTADOS.map((e) => (
                <button
                  key={e.value}
                  onClick={() => marcarTodos(e.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 ${e.bgColor} ${e.color}`}
                >
                  {e.icon} {e.label}
                </button>
              ))}
            </div>
          )}

          {/* Tabla de alumnos */}
          <div className="tarjeta overflow-hidden dark:bg-gray-800 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium w-10">#</th>
                  <th className="px-4 py-3 font-medium">Alumno</th>
                  <th className="px-4 py-3 font-medium">DNI</th>
                  <th className="px-4 py-3 font-medium text-center">Estado</th>
                  <th className="px-4 py-3 font-medium">Observación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {alumnos.map((a, index) => (
                  <tr key={a.alumno_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                    <td className="px-4 py-3 text-gray-400 text-xs">{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">
                      {a.apellidos}, {a.nombres}
                      {a.registrado && (
                        <span className="ml-2 text-[10px] text-emerald-500 font-normal">● Registrado</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">{a.dni}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {ESTADOS.map((e) => {
                          const activo = a.estadoLocal === e.value;
                          return (
                            <button
                              key={e.value}
                              onClick={() => puedeRegistrar && cambiarEstado(a.alumno_id, e.value)}
                              disabled={!puedeRegistrar}
                              title={e.label}
                              className={`p-2 rounded-lg border transition-all ${
                                activo
                                  ? `${e.bgColor} ${e.color} border-current shadow-sm scale-110`
                                  : 'border-gray-200 dark:border-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                              }`}
                            >
                              {e.icon}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        className="campo text-xs py-1.5 dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                        placeholder="Observación..."
                        value={a.obsLocal}
                        onChange={(e) => cambiarObs(a.alumno_id, e.target.value)}
                        disabled={!puedeRegistrar}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
