import React, { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, X, FileText, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  actualizarAlumno,
  crearAlumno,
  eliminarAlumno,
  listarAlumnos,
} from '../../api/alumnos';
import { listarSecciones } from '../../api/grados';
import { descargarBoletaPdf } from '../../api/reportes';
import { obtenerConfiguracion } from '../../api/configuracion';
import type { Alumno, Seccion } from '../../tipos';
import { usePermiso } from '../../hooks/usePermiso';

const vacio = {
  dni: '',
  nombres: '',
  apellidos: '',
  fecha_nacimiento: '',
  genero: '' as '' | 'M' | 'F' | 'O',
  telefono: '',
  direccion: '',
  estado: true,
  seccion_id: '',
  año_escolar: String(new Date().getFullYear()),
};

export const ListaAlumnos = () => {
  const puedeCrear = usePermiso('crear-alumnos');
  const puedeEditar = usePermiso('editar-alumnos');
  const puedeEliminar = usePermiso('eliminar-alumnos');

  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [buscar, setBuscar] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Alumno | null>(null);
  const [form, setForm] = useState(vacio);
  const [guardando, setGuardando] = useState(false);
  const [descargandoId, setDescargandoId] = useState<number | null>(null);

  const handleDescargarBoleta = async (alumno: Alumno) => {
    setDescargandoId(alumno.id);
    try {
      const seccionId = alumno.secciones?.[0]?.id;
      await descargarBoletaPdf(alumno.id, seccionId);
      toast.success(`Boleta de ${alumno.apellidos} descargada correctamente.`);
    } catch {
      toast.error('Error al descargar la boleta del alumno.');
    } finally {
      setDescargandoId(null);
    }
  };

  const cargar = async (termino = buscar) => {
    setCargando(true);
    setError('');
    try {
      const data = await listarAlumnos({ buscar: termino || undefined });
      setAlumnos(data.data);
    } catch {
      setError('No se pudieron cargar los alumnos.');
    } finally {
      setCargando(false);
    }
  };

  const [anioActivo, setAnioActivo] = useState(String(new Date().getFullYear()));

  useEffect(() => {
    cargar();
    listarSecciones().then(setSecciones).catch(() => setSecciones([]));
    obtenerConfiguracion().then((cfg) => {
      if (cfg?.anio_escolar) setAnioActivo(cfg.anio_escolar);
    }).catch(() => {});
  }, []);

  const abrirCrear = () => {
    setEditando(null);
    setForm({ ...vacio, año_escolar: anioActivo });
    setModalAbierto(true);
  };

  const abrirEditar = (alumno: Alumno) => {
    const seccionActual = alumno.secciones?.[0];
    setEditando(alumno);
    setForm({
      dni: alumno.dni,
      nombres: alumno.nombres,
      apellidos: alumno.apellidos,
      fecha_nacimiento: alumno.fecha_nacimiento?.slice(0, 10) ?? '',
      genero: alumno.genero ?? '',
      telefono: alumno.telefono ?? '',
      direccion: alumno.direccion ?? '',
      estado: alumno.estado,
      seccion_id: seccionActual ? String(seccionActual.id) : '',
      año_escolar: seccionActual?.pivot?.año_escolar ?? anioActivo,
    });
    setModalAbierto(true);
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError('');
    const payload = {
      dni: form.dni,
      nombres: form.nombres,
      apellidos: form.apellidos,
      fecha_nacimiento: form.fecha_nacimiento || null,
      genero: (form.genero || null) as 'M' | 'F' | 'O' | null,
      telefono: form.telefono || null,
      direccion: form.direccion || null,
      estado: form.estado,
      seccion_id: form.seccion_id ? Number(form.seccion_id) : undefined,
      año_escolar: form.año_escolar,
    };
    try {
      if (editando) {
        await actualizarAlumno(editando.id, payload);
      } else {
        await crearAlumno(payload);
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

  const borrar = async (alumno: Alumno) => {
    if (!confirm(`¿Eliminar a ${alumno.nombres} ${alumno.apellidos}?`)) return;
    try {
      await eliminarAlumno(alumno.id);
      await cargar();
    } catch {
      setError('No se pudo eliminar el alumno.');
    }
  };

  const etiquetaSeccion = (alumno: Alumno) => {
    const s = alumno.secciones?.[0];
    if (!s) return '—';
    return `${s.grado?.nombre ?? ''} ${s.nombre} (${s.grado?.nivel ?? ''})`.trim();
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Alumnos</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Gestión de matrícula estudiantil</p>
        </div>
        {puedeCrear && (
          <button onClick={abrirCrear} className="btn-primario">
            <Plus className="w-4 h-4" /> Nuevo alumno
          </button>
        )}
      </div>

      <div className="tarjeta p-4 dark:bg-gray-800 dark:border-gray-700">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="campo pl-9 dark:bg-gray-900 dark:border-gray-600 dark:text-white"
            placeholder="Buscar por nombre o DNI..."
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && cargar()}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      <div className="tarjeta overflow-hidden dark:bg-gray-800 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">DNI</th>
                <th className="px-4 py-3 font-medium">Alumno</th>
                <th className="px-4 py-3 font-medium">Sección</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {cargando ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
              ) : alumnos.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No hay alumnos registrados.</td></tr>
              ) : alumnos.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{a.dni}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{a.apellidos}, {a.nombres}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 capitalize">{etiquetaSeccion(a)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${a.estado ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                      {a.estado ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <button
                      onClick={() => handleDescargarBoleta(a)}
                      disabled={descargandoId === a.id}
                      className="btn-icono text-blue-600 hover:text-blue-800 disabled:opacity-50"
                      title="Descargar boleta PDF"
                    >
                      {descargandoId === a.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </button>
                    {puedeEditar && (
                      <button onClick={() => abrirEditar(a)} className="btn-icono text-primario-600" title="Editar"><Pencil className="w-4 h-4" /></button>
                    )}
                    {puedeEliminar && (
                      <button onClick={() => borrar(a)} className="btn-icono text-red-500" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {editando ? 'Editar alumno' : 'Nuevo alumno'}
              </h3>
              <button onClick={() => setModalAbierto(false)} className="btn-icono"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={guardar} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="etiqueta dark:text-gray-300">DNI</label>
                  <input required className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value })} />
                </div>
                <div>
                  <label className="etiqueta dark:text-gray-300">Género</label>
                  <select className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={form.genero} onChange={(e) => setForm({ ...form, genero: e.target.value as typeof form.genero })}>
                    <option value="">—</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="O">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="etiqueta dark:text-gray-300">Nombres</label>
                  <input required className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })} />
                </div>
                <div>
                  <label className="etiqueta dark:text-gray-300">Apellidos</label>
                  <input required className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={form.apellidos} onChange={(e) => setForm({ ...form, apellidos: e.target.value })} />
                </div>
                <div>
                  <label className="etiqueta dark:text-gray-300">Fecha nacimiento</label>
                  <input type="date" className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={form.fecha_nacimiento} onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })} />
                </div>
                <div>
                  <label className="etiqueta dark:text-gray-300">Teléfono</label>
                  <input className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="etiqueta dark:text-gray-300">Dirección</label>
                  <input className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
                </div>
                <div>
                  <label className="etiqueta dark:text-gray-300">Sección</label>
                  <select className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={form.seccion_id} onChange={(e) => setForm({ ...form, seccion_id: e.target.value })}>
                    <option value="">Sin asignar</option>
                    {secciones.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.grado?.nombre} {s.nombre} — {s.grado?.nivel}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="etiqueta dark:text-gray-300">Año escolar</label>
                  <input className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={form.año_escolar} onChange={(e) => setForm({ ...form, año_escolar: e.target.value })} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.checked })} />
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
