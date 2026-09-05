import React, { useEffect, useState, useMemo } from 'react';
import { Users, BookOpen, GraduationCap, BarChart3, ClipboardList, Search, Printer, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  obtenerResumenGeneral,
  obtenerBoleta,
  obtenerConsolidadoAsistencia,
  obtenerConsolidadoNotas,
  descargarBoletaPdf,
  descargarAsistenciaPdf,
  descargarNotasPdf,
} from '../../api/reportes';
import { listarGrados, listarSecciones } from '../../api/grados';
import { listarAlumnos } from '../../api/alumnos';
import type { Grado, Seccion, Alumno } from '../../tipos';

type Tab = 'resumen' | 'boleta' | 'asistencia' | 'notas';

const TABS: { value: Tab; label: string; icon: React.ReactNode }[] = [
  { value: 'resumen', label: 'Resumen', icon: <BarChart3 className="w-4 h-4" /> },
  { value: 'boleta', label: 'Boleta', icon: <GraduationCap className="w-4 h-4" /> },
  { value: 'asistencia', label: 'Asistencia', icon: <ClipboardList className="w-4 h-4" /> },
  { value: 'notas', label: 'Notas', icon: <BookOpen className="w-4 h-4" /> },
];

const colorNota = (n: number | null) => {
  if (n === null) return 'text-gray-400';
  if (n >= 18) return 'text-emerald-600 dark:text-emerald-400 font-bold';
  if (n >= 14) return 'text-blue-600 dark:text-blue-400';
  if (n >= 11) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400 font-bold';
};

export const Reportes = () => {
  const [tab, setTab] = useState<Tab>('resumen');
  const [grados, setGrados] = useState<Grado[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [filtroGrado, setFiltroGrado] = useState('');
  const [filtroSeccion, setFiltroSeccion] = useState('');
  const [cargando, setCargando] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState('');

  // Resumen
  const [resumen, setResumen] = useState<{ total_alumnos: number; total_secciones: number; total_docentes: number; total_cursos: number } | null>(null);

  // Boleta
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [alumnoId, setAlumnoId] = useState('');
  const [boleta, setBoleta] = useState<Awaited<ReturnType<typeof obtenerBoleta>> | null>(null);

  // Asistencia
  const [fechaDesde, setFechaDesde] = useState(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().slice(0, 10));
  const [consAsistencia, setConsAsistencia] = useState<Awaited<ReturnType<typeof obtenerConsolidadoAsistencia>> | null>(null);

  // Notas
  const [bimestreNotas, setBimestreNotas] = useState('');
  const [consNotas, setConsNotas] = useState<Awaited<ReturnType<typeof obtenerConsolidadoNotas>> | null>(null);

  const seccionesFiltradas = useMemo(
    () => (filtroGrado ? secciones.filter((s) => s.grado_id === Number(filtroGrado)) : secciones),
    [secciones, filtroGrado]
  );

  useEffect(() => {
    listarGrados().then(setGrados).catch(() => {});
    listarSecciones().then(setSecciones).catch(() => {});
  }, []);

  useEffect(() => {
    if (filtroGrado) {
      const primera = secciones.find((s) => s.grado_id === Number(filtroGrado));
      setFiltroSeccion(primera ? String(primera.id) : '');
    } else {
      setFiltroSeccion('');
    }
  }, [filtroGrado, secciones]);

  // Cargar resumen
  useEffect(() => {
    if (tab === 'resumen') {
      setCargando(true);
      obtenerResumenGeneral().then(setResumen).catch(() => setError('Error')).finally(() => setCargando(false));
    }
  }, [tab]);

  // Cargar alumnos para boleta
  useEffect(() => {
    if (tab === 'boleta') {
      listarAlumnos({ page: 1 }).then((r) => setAlumnos(r.data)).catch(() => {});
    }
  }, [tab]);

  const cargarBoleta = async () => {
    if (!alumnoId) return;
    setCargando(true);
    setError('');
    try {
      const data = await obtenerBoleta(Number(alumnoId), filtroSeccion ? { seccion_id: Number(filtroSeccion) } : undefined);
      setBoleta(data);
    } catch { setError('Error al cargar boleta.'); }
    finally { setCargando(false); }
  };

  const cargarConsAsistencia = async () => {
    if (!filtroSeccion) return;
    setCargando(true);
    setError('');
    try {
      const data = await obtenerConsolidadoAsistencia({ seccion_id: Number(filtroSeccion), fecha_desde: fechaDesde, fecha_hasta: fechaHasta });
      setConsAsistencia(data);
    } catch { setError('Error al cargar consolidado.'); }
    finally { setCargando(false); }
  };

  const cargarConsNotas = async () => {
    if (!filtroSeccion) return;
    setCargando(true);
    setError('');
    try {
      const params: { seccion_id: number; bimestre?: number } = { seccion_id: Number(filtroSeccion) };
      if (bimestreNotas) params.bimestre = Number(bimestreNotas);
      const data = await obtenerConsolidadoNotas(params);
      setConsNotas(data);
    } catch { setError('Error al cargar consolidado.'); }
    finally { setCargando(false); }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Reportes</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Estadísticas, boletas y consolidados</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tarjeta p-1 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => { setTab(t.value); setError(''); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                tab === t.value
                  ? 'bg-primario-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>}

      {/* Tab: Resumen */}
      {tab === 'resumen' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Alumnos activos', value: resumen?.total_alumnos ?? '—', icon: <Users className="w-8 h-8" />, color: 'text-blue-600 dark:text-blue-400' },
            { label: 'Secciones', value: resumen?.total_secciones ?? '—', icon: <ClipboardList className="w-8 h-8" />, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Docentes activos', value: resumen?.total_docentes ?? '—', icon: <Users className="w-8 h-8" />, color: 'text-purple-600 dark:text-purple-400' },
            { label: 'Cursos activos', value: resumen?.total_cursos ?? '—', icon: <BookOpen className="w-8 h-8" />, color: 'text-amber-600 dark:text-amber-400' },
          ].map((item, i) => (
            <div key={i} className="tarjeta p-6 dark:bg-gray-800 dark:border-gray-700 text-center">
              <div className={`mx-auto mb-3 ${item.color}`}>{item.icon}</div>
              <div className={`text-3xl font-bold ${item.color}`}>{cargando ? '...' : item.value}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Boleta */}
      {tab === 'boleta' && (
        <div className="space-y-4">
          <div className="tarjeta p-4 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1">
                <label className="etiqueta dark:text-gray-300">Alumno</label>
                <select className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={alumnoId} onChange={(e) => setAlumnoId(e.target.value)}>
                  <option value="">Seleccionar alumno...</option>
                  {alumnos.map((a) => <option key={a.id} value={a.id}>{a.apellidos}, {a.nombres} — {a.dni}</option>)}
                </select>
              </div>
              <button onClick={cargarBoleta} disabled={!alumnoId || cargando} className="btn-primario">
                <Search className="w-4 h-4" /> {cargando ? 'Cargando...' : 'Generar boleta'}
              </button>
            </div>
          </div>
          {boleta && (
            <div className="tarjeta p-6 dark:bg-gray-800 dark:border-gray-700" id="boleta-print">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">Boleta de Notas</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{boleta.alumno.apellidos}, {boleta.alumno.nombres} — DNI: {boleta.alumno.dni}</p>
                  {boleta.seccion && <p className="text-xs text-gray-500">{boleta.seccion.grado} "{boleta.seccion.nombre}" — {boleta.seccion.nivel}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      setDescargando(true);
                      try {
                        await descargarBoletaPdf(Number(alumnoId), filtroSeccion ? Number(filtroSeccion) : undefined);
                        toast.success('Boleta descargada correctamente.');
                      } catch { toast.error('Error al descargar la boleta.'); }
                      finally { setDescargando(false); }
                    }}
                    disabled={descargando}
                    className="btn-primario text-xs"
                  >
                    <Download className="w-3.5 h-3.5" /> {descargando ? 'Descargando...' : 'Descargar PDF'}
                  </button>
                  <button onClick={() => window.print()} className="btn-secundario text-xs"><Printer className="w-3.5 h-3.5" /> Imprimir</button>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Curso</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-500">I Bim</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-500">II Bim</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-500">III Bim</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-500">IV Bim</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-500">Prom.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {boleta.cursos.map((c, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-medium text-gray-800 dark:text-white">{c.curso}</td>
                      {[c.bimestre_1, c.bimestre_2, c.bimestre_3, c.bimestre_4].map((n, j) => (
                        <td key={j} className={`px-3 py-2 text-center ${colorNota(n)}`}>{n ?? '—'}</td>
                      ))}
                      <td className={`px-3 py-2 text-center font-bold ${colorNota(c.promedio_final)}`}>{c.promedio_final}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Consolidado Asistencia */}
      {tab === 'asistencia' && (
        <div className="space-y-4">
          <div className="tarjeta p-4 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div>
                <label className="etiqueta dark:text-gray-300">Grado</label>
                <select className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={filtroGrado} onChange={(e) => setFiltroGrado(e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {grados.map((g) => <option key={g.id} value={g.id}>{g.nombre} — {g.nivel}</option>)}
                </select>
              </div>
              <div>
                <label className="etiqueta dark:text-gray-300">Sección</label>
                <select className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={filtroSeccion} onChange={(e) => setFiltroSeccion(e.target.value)} disabled={!filtroGrado}>
                  <option value="">Seleccionar...</option>
                  {seccionesFiltradas.map((s) => <option key={s.id} value={s.id}>Sección {s.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="etiqueta dark:text-gray-300">Desde</label>
                <input type="date" className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
              </div>
              <div>
                <label className="etiqueta dark:text-gray-300">Hasta</label>
                <input type="date" className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
              </div>
              <button onClick={cargarConsAsistencia} disabled={!filtroSeccion || cargando} className="btn-primario">
                <BarChart3 className="w-4 h-4" /> Generar
              </button>
            </div>
          </div>
          {consAsistencia && (
            <div className="tarjeta overflow-hidden dark:bg-gray-800 dark:border-gray-700">
              <div className="flex justify-end p-3 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={async () => {
                    setDescargando(true);
                    try {
                      await descargarAsistenciaPdf(Number(filtroSeccion), fechaDesde, fechaHasta);
                      toast.success('Consolidado descargado correctamente.');
                    } catch { toast.error('Error al descargar.'); }
                    finally { setDescargando(false); }
                  }}
                  disabled={descargando}
                  className="btn-primario text-xs"
                >
                  <Download className="w-3.5 h-3.5" /> {descargando ? 'Descargando...' : 'Descargar PDF'}
                </button>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">#</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Alumno</th>
                    <th className="px-3 py-2 text-center font-medium text-emerald-600">P</th>
                    <th className="px-3 py-2 text-center font-medium text-amber-600">T</th>
                    <th className="px-3 py-2 text-center font-medium text-red-600">F</th>
                    <th className="px-3 py-2 text-center font-medium text-blue-600">J</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-500">Total</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-500">% Asist.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {consAsistencia.alumnos.map((a, i) => (
                    <tr key={a.alumno_id}>
                      <td className="px-3 py-2 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-3 py-2 font-medium text-gray-800 dark:text-white">{a.apellidos}, {a.nombres}</td>
                      <td className="px-3 py-2 text-center text-emerald-600 dark:text-emerald-400">{a.presente}</td>
                      <td className="px-3 py-2 text-center text-amber-600 dark:text-amber-400">{a.tardanza}</td>
                      <td className="px-3 py-2 text-center text-red-600 dark:text-red-400">{a.falta}</td>
                      <td className="px-3 py-2 text-center text-blue-600 dark:text-blue-400">{a.justificado}</td>
                      <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">{a.total_dias}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          a.porcentaje >= 90 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : a.porcentaje >= 70 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                        }`}>
                          {a.porcentaje}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Consolidado Notas */}
      {tab === 'notas' && (
        <div className="space-y-4">
          <div className="tarjeta p-4 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div>
                <label className="etiqueta dark:text-gray-300">Grado</label>
                <select className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={filtroGrado} onChange={(e) => setFiltroGrado(e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {grados.map((g) => <option key={g.id} value={g.id}>{g.nombre} — {g.nivel}</option>)}
                </select>
              </div>
              <div>
                <label className="etiqueta dark:text-gray-300">Sección</label>
                <select className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={filtroSeccion} onChange={(e) => setFiltroSeccion(e.target.value)} disabled={!filtroGrado}>
                  <option value="">Seleccionar...</option>
                  {seccionesFiltradas.map((s) => <option key={s.id} value={s.id}>Sección {s.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="etiqueta dark:text-gray-300">Bimestre</label>
                <select className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={bimestreNotas} onChange={(e) => setBimestreNotas(e.target.value)}>
                  <option value="">Todos</option>
                  <option value="1">I Bimestre</option>
                  <option value="2">II Bimestre</option>
                  <option value="3">III Bimestre</option>
                  <option value="4">IV Bimestre</option>
                </select>
              </div>
              <button onClick={cargarConsNotas} disabled={!filtroSeccion || cargando} className="btn-primario">
                <BarChart3 className="w-4 h-4" /> Generar
              </button>
            </div>
          </div>
          {consNotas && (
            <div className="tarjeta overflow-hidden dark:bg-gray-800 dark:border-gray-700">
              <div className="flex justify-end p-3 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={async () => {
                    setDescargando(true);
                    try {
                      await descargarNotasPdf(Number(filtroSeccion), bimestreNotas ? Number(bimestreNotas) : undefined);
                      toast.success('Consolidado descargado correctamente.');
                    } catch { toast.error('Error al descargar.'); }
                    finally { setDescargando(false); }
                  }}
                  disabled={descargando}
                  className="btn-primario text-xs"
                >
                  <Download className="w-3.5 h-3.5" /> {descargando ? 'Descargando...' : 'Descargar PDF'}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">#</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Alumno</th>
                      {consNotas.cursos.map((c) => (
                        <th key={c} className="px-3 py-2 text-center font-medium text-gray-500 text-xs whitespace-nowrap">{c}</th>
                      ))}
                      <th className="px-3 py-2 text-center font-medium text-gray-500">Prom.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {consNotas.alumnos.map((a, i) => (
                      <tr key={a.alumno_id}>
                        <td className="px-3 py-2 text-gray-400 text-xs">{i + 1}</td>
                        <td className="px-3 py-2 font-medium text-gray-800 dark:text-white whitespace-nowrap">{a.apellidos}, {a.nombres}</td>
                        {consNotas.cursos.map((c) => (
                          <td key={c} className={`px-3 py-2 text-center ${colorNota(a.notas_por_curso[c])}`}>
                            {a.notas_por_curso[c] ?? '—'}
                          </td>
                        ))}
                        <td className={`px-3 py-2 text-center font-bold ${colorNota(a.promedio_general)}`}>
                          {a.promedio_general ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
