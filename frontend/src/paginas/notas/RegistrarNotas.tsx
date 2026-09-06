import { useEffect, useState, useMemo } from 'react';
import { Save, Check, BookOpen, ClipboardList, GraduationCap } from 'lucide-react';
import {
  obtenerNotasSeccionCurso,
  registrarNotasMasivas,
} from '../../api/notas';
import { listarGrados, listarSecciones } from '../../api/grados';
import { listarCursos } from '../../api/cursos';
import type { Grado, Seccion, Curso, AlumnoNota } from '../../tipos';
import { usePermiso } from '../../hooks/usePermiso';

type TipoEval = 'examen' | 'practica' | 'tarea' | 'participacion';

const BIMESTRES = [
  { value: 1, label: 'I Bimestre' },
  { value: 2, label: 'II Bimestre' },
  { value: 3, label: 'III Bimestre' },
  { value: 4, label: 'IV Bimestre' },
];

const TIPOS: { value: TipoEval; label: string }[] = [
  { value: 'examen', label: 'Examen' },
  { value: 'practica', label: 'Práctica' },
  { value: 'tarea', label: 'Tarea' },
  { value: 'participacion', label: 'Participación' },
];

const colorNota = (nota: number | null): string => {
  if (nota === null) return '';
  if (nota >= 18) return 'text-emerald-600 dark:text-emerald-400 font-bold';
  if (nota >= 14) return 'text-blue-600 dark:text-blue-400 font-semibold';
  if (nota >= 11) return 'text-amber-600 dark:text-amber-400 font-medium';
  return 'text-red-600 dark:text-red-400 font-bold';
};

const badgeNota = (nota: number | null): string => {
  if (nota === null) return 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500';
  if (nota >= 18) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
  if (nota >= 14) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
  if (nota >= 11) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
  return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
};

export const RegistrarNotas = () => {
  const puedeRegistrar = usePermiso('registrar-notas');

  const [grados, setGrados] = useState<Grado[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [filtroGrado, setFiltroGrado] = useState('');
  const [filtroSeccion, setFiltroSeccion] = useState('');
  const [filtroCurso, setFiltroCurso] = useState('');
  const [bimestre, setBimestre] = useState(1);
  const [tipo, setTipo] = useState<TipoEval>('examen');
  const [alumnos, setAlumnos] = useState<(AlumnoNota & { notaLocal: string; obsLocal: string })[]>([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const seccionesFiltradas = useMemo(
    () => (filtroGrado ? secciones.filter((s) => s.grado_id === Number(filtroGrado)) : secciones),
    [secciones, filtroGrado]
  );

  const cursosFiltrados = useMemo(
    () => (filtroGrado ? cursos.filter((c) => c.grado_id === Number(filtroGrado)) : cursos),
    [cursos, filtroGrado]
  );

  const estadisticas = useMemo(() => {
    const notasValidas = alumnos.filter((a) => a.notaLocal !== '').map((a) => Number(a.notaLocal));
    if (notasValidas.length === 0) return null;
    return {
      promedio: (notasValidas.reduce((s, n) => s + n, 0) / notasValidas.length).toFixed(1),
      max: Math.max(...notasValidas),
      min: Math.min(...notasValidas),
      aprobados: notasValidas.filter((n) => n >= 11).length,
      desaprobados: notasValidas.filter((n) => n < 11).length,
    };
  }, [alumnos]);

  useEffect(() => {
    listarGrados().then(setGrados).catch(() => setGrados([]));
    listarSecciones().then(setSecciones).catch(() => setSecciones([]));
    listarCursos().then((r) => setCursos(r.data)).catch(() => setCursos([]));
  }, []);

  useEffect(() => {
    if (filtroGrado) {
      const primera = secciones.find((s) => s.grado_id === Number(filtroGrado));
      setFiltroSeccion(primera ? String(primera.id) : '');
      const primerCurso = cursos.find((c) => c.grado_id === Number(filtroGrado));
      setFiltroCurso(primerCurso ? String(primerCurso.id) : '');
    } else {
      setFiltroSeccion('');
      setFiltroCurso('');
    }
  }, [filtroGrado, secciones, cursos]);

  const cargar = async () => {
    if (!filtroSeccion || !filtroCurso) {
      setAlumnos([]);
      return;
    }
    setCargando(true);
    setError('');
    setExito('');
    try {
      const data = await obtenerNotasSeccionCurso({
        seccion_id: Number(filtroSeccion),
        curso_id: Number(filtroCurso),
        bimestre,
        tipo,
      });
      setAlumnos(
        data.alumnos.map((a) => ({
          ...a,
          notaLocal: a.calificacion !== null ? String(a.calificacion) : '',
          obsLocal: a.observacion ?? '',
        }))
      );
    } catch {
      setError('No se pudieron cargar las notas.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [filtroSeccion, filtroCurso, bimestre, tipo]);

  const cambiarNota = (alumnoId: number, valor: string) => {
    // Permitir vacío, números enteros y decimales 0-20
    if (valor !== '' && !/^\d{0,2}(\.\d{0,2})?$/.test(valor)) return;
    const num = Number(valor);
    if (valor !== '' && num > 20) return;
    setAlumnos((prev) =>
      prev.map((a) => (a.alumno_id === alumnoId ? { ...a, notaLocal: valor } : a))
    );
  };

  const cambiarObs = (alumnoId: number, obs: string) => {
    setAlumnos((prev) =>
      prev.map((a) => (a.alumno_id === alumnoId ? { ...a, obsLocal: obs } : a))
    );
  };

  const guardar = async () => {
    if (!filtroSeccion || !filtroCurso || alumnos.length === 0) return;

    const notasConValor = alumnos.filter((a) => a.notaLocal !== '');
    if (notasConValor.length === 0) {
      setError('Ingresa al menos una calificación.');
      return;
    }

    setGuardando(true);
    setError('');
    setExito('');
    try {
      const resultado = await registrarNotasMasivas({
        seccion_id: Number(filtroSeccion),
        curso_id: Number(filtroCurso),
        bimestre,
        tipo,
        notas: notasConValor.map((a) => ({
          alumno_id: a.alumno_id,
          calificacion: Number(a.notaLocal),
          observacion: a.obsLocal || null,
        })),
      });
      setExito(`${resultado.mensaje} (${resultado.total} notas)`);
      await cargar();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string; message?: string } } })?.response?.data;
      setError(data?.mensaje || data?.message || 'Error al guardar las notas.');
    } finally {
      setGuardando(false);
    }
  };

  const gradoActual = grados.find((g) => g.id === Number(filtroGrado));
  const seccionActual = secciones.find((s) => s.id === Number(filtroSeccion));
  const cursoActual = cursos.find((c) => c.id === Number(filtroCurso));
  const listoParaCargar = filtroSeccion && filtroCurso;

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Notas</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {gradoActual && seccionActual && cursoActual
              ? `${cursoActual.nombre} — ${gradoActual.nombre} "${seccionActual.nombre}" — ${BIMESTRES[bimestre - 1]?.label}`
              : 'Registro de calificaciones por curso y bimestre'}
          </p>
        </div>
        {puedeRegistrar && alumnos.length > 0 && (
          <button onClick={guardar} disabled={guardando} className="btn-primario">
            <Save className="w-4 h-4" />
            {guardando ? 'Guardando...' : 'Guardar notas'}
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="tarjeta p-4 dark:bg-gray-800 dark:border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="etiqueta dark:text-gray-300">Grado</label>
            <select
              className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
              value={filtroGrado}
              onChange={(e) => setFiltroGrado(e.target.value)}
            >
              <option value="">Seleccionar...</option>
              {grados.map((g) => (
                <option key={g.id} value={g.id}>{g.nombre} — {g.nivel}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="etiqueta dark:text-gray-300">Sección</label>
            <select
              className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
              value={filtroSeccion}
              onChange={(e) => setFiltroSeccion(e.target.value)}
              disabled={!filtroGrado}
            >
              <option value="">Seleccionar...</option>
              {seccionesFiltradas.map((s) => (
                <option key={s.id} value={s.id}>Sección {s.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="etiqueta dark:text-gray-300">Curso</label>
            <select
              className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
              value={filtroCurso}
              onChange={(e) => setFiltroCurso(e.target.value)}
              disabled={!filtroGrado}
            >
              <option value="">Seleccionar...</option>
              {cursosFiltrados.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="etiqueta dark:text-gray-300">Bimestre</label>
            <select
              className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
              value={bimestre}
              onChange={(e) => setBimestre(Number(e.target.value))}
            >
              {BIMESTRES.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="etiqueta dark:text-gray-300">Tipo evaluación</label>
            <select
              className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoEval)}
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="tarjeta p-3 dark:bg-gray-800 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-primario-600 dark:text-primario-400">{estadisticas.promedio}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Promedio</div>
          </div>
          <div className="tarjeta p-3 dark:bg-gray-800 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{estadisticas.max}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Nota máxima</div>
          </div>
          <div className="tarjeta p-3 dark:bg-gray-800 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-red-500 dark:text-red-400">{estadisticas.min}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Nota mínima</div>
          </div>
          <div className="tarjeta p-3 dark:bg-gray-800 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{estadisticas.aprobados}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-center gap-1">
              <Check className="w-3 h-3" /> Aprobados
            </div>
          </div>
          <div className="tarjeta p-3 dark:bg-gray-800 dark:border-gray-700 text-center">
            <div className="text-2xl font-bold text-red-500 dark:text-red-400">{estadisticas.desaprobados}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Desaprobados</div>
          </div>
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

      {/* Tabla de notas */}
      {!listoParaCargar ? (
        <div className="tarjeta p-12 text-center dark:bg-gray-800 dark:border-gray-700">
          <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">Selecciona grado, sección y curso para registrar notas</p>
        </div>
      ) : cargando ? (
        <div className="tarjeta p-12 text-center text-gray-400 dark:bg-gray-800">Cargando...</div>
      ) : alumnos.length === 0 ? (
        <div className="tarjeta p-12 text-center dark:bg-gray-800 dark:border-gray-700">
          <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-gray-400">No hay alumnos matriculados en esta sección.</p>
        </div>
      ) : (
        <div className="tarjeta overflow-hidden dark:bg-gray-800 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium w-10">#</th>
                <th className="px-4 py-3 font-medium">Alumno</th>
                <th className="px-4 py-3 font-medium">DNI</th>
                <th className="px-4 py-3 font-medium text-center w-32">Nota (0-20)</th>
                <th className="px-4 py-3 font-medium text-center w-20">Estado</th>
                <th className="px-4 py-3 font-medium">Observación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {alumnos.map((a, index) => {
                const notaNum = a.notaLocal !== '' ? Number(a.notaLocal) : null;
                return (
                  <tr key={a.alumno_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                    <td className="px-4 py-3 text-gray-400 text-xs">{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">
                      {a.apellidos}, {a.nombres}
                      {a.registrado && (
                        <span className="ml-2 text-[10px] text-emerald-500 font-normal">● Registrado</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">{a.dni}</td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="text"
                        inputMode="decimal"
                        className={`campo text-center w-20 mx-auto py-1.5 text-lg dark:bg-gray-900 dark:border-gray-600 dark:text-white ${colorNota(notaNum)}`}
                        value={a.notaLocal}
                        onChange={(e) => cambiarNota(a.alumno_id, e.target.value)}
                        placeholder="—"
                        disabled={!puedeRegistrar}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${badgeNota(notaNum)}`}>
                        {notaNum === null ? '—' : notaNum >= 11 ? 'A' : 'D'}
                      </span>
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Escala de calificación */}
      {listoParaCargar && alumnos.length > 0 && (
        <div className="tarjeta p-4 dark:bg-gray-800 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" /> Escala vigesimal (0-20):
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-medium">18-20 Excelente (AD)</span>
            <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium">14-17 Bueno (A)</span>
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 font-medium">11-13 Regular (B)</span>
            <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 font-medium">0-10 Desaprobado (C)</span>
          </div>
        </div>
      )}
    </div>
  );
};
