import React, { useEffect, useState, useRef } from 'react';
import { Plus, Search, Pencil, Trash2, X, UserPlus, Unlink, Users, ChevronDown, ChevronUp, ImagePlus, Eye, FileImage } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  listarPadres,
  crearPadre,
  actualizarPadre,
  eliminarPadre,
  vincularAlumno,
  desvincularAlumno,
  obtenerPadre,
} from '../../api/padres';
import { listarAlumnos } from '../../api/alumnos';
import { pagosPorPadre, subirEvidenciaPago, eliminarEvidenciaPago } from '../../api/pagos';
import { usePermiso } from '../../hooks/usePermiso';
import type { Padre, Alumno, Pago } from '../../tipos';

type HijoResumen = Alumno & {
  seccion?: { id: number; nombre: string; grado?: string; nivel?: string } | null;
  promedio?: number | null;
  porcentaje_asistencia?: number | null;
};

const vacio = {
  dni: '',
  nombres: '',
  apellidos: '',
  relacion: '' as '' | 'padre' | 'madre' | 'tutor' | 'apoderado',
  telefono: '',
  email: '',
};

export const ListaPadres = () => {
  const puedeCrear = usePermiso('crear-padres');
  const puedeEditar = usePermiso('editar-padres');
  const puedeEliminar = usePermiso('eliminar-padres');
  const puedeVerPagos = usePermiso('ver-pagos');
  const puedeEditarPagos = usePermiso(['editar-pagos', 'crear-pagos']);

  const [padres, setPadres] = useState<(Padre & { alumnos_count?: number })[]>([]);
  const [buscar, setBuscar] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Padre | null>(null);
  const [form, setForm] = useState(vacio);
  const [guardando, setGuardando] = useState(false);
  const [erroresForm, setErroresForm] = useState<Record<string, string>>({});

  // Expandir detalle
  const [expandido, setExpandido] = useState<number | null>(null);
  const [padreDetalle, setPadreDetalle] = useState<(Padre & { alumnos?: HijoResumen[] }) | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [pagosPadre, setPagosPadre] = useState<Pago[]>([]);
  const [resumenPagos, setResumenPagos] = useState<{ total: number; pagados: number; pendientes: number; monto: number } | null>(null);
  const [cargandoPagos, setCargandoPagos] = useState(false);
  const [subiendoEvidencia, setSubiendoEvidencia] = useState<number | null>(null);
  const [evidenciaVista, setEvidenciaVista] = useState<{ url: string; titulo: string } | null>(null);
  const inputEvidenciaRef = useRef<HTMLInputElement>(null);
  const [pagoEvidenciaId, setPagoEvidenciaId] = useState<number | null>(null);

  // Vincular alumno
  const [modalVincular, setModalVincular] = useState(false);
  const [buscarAlumno, setBuscarAlumno] = useState('');
  const [alumnosResultado, setAlumnosResultado] = useState<Alumno[]>([]);
  const [buscandoAlumno, setBuscandoAlumno] = useState(false);

  // Paginación
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  // Confirmación de eliminación
  const [confirmEliminar, setConfirmEliminar] = useState<number | null>(null);

  const cargar = async (pag = pagina, termino = buscar) => {
    setCargando(true);
    setError('');
    try {
      const data = await listarPadres({ buscar: termino || undefined, page: pag });
      setPadres(data.data);
      setTotalPaginas(data.last_page);
    } catch {
      setError('No se pudieron cargar los padres de familia.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleBuscar = () => {
    setPagina(1);
    cargar(1, buscar);
  };

  const abrirCrear = () => {
    setEditando(null);
    setForm(vacio);
    setErroresForm({});
    setModalAbierto(true);
  };

  const abrirEditar = (padre: Padre) => {
    setEditando(padre);
    setForm({
      dni: padre.dni,
      nombres: padre.nombres,
      apellidos: padre.apellidos,
      relacion: padre.relacion,
      telefono: padre.telefono ?? '',
      email: padre.email ?? '',
    });
    setErroresForm({});
    setModalAbierto(true);
  };

  const validar = () => {
    const errores: Record<string, string> = {};
    if (!form.dni || form.dni.length !== 8 || !/^\d{8}$/.test(form.dni)) {
      errores.dni = 'El DNI debe tener exactamente 8 dígitos.';
    }
    if (!form.nombres.trim()) errores.nombres = 'Los nombres son requeridos.';
    if (!form.apellidos.trim()) errores.apellidos = 'Los apellidos son requeridos.';
    if (!form.relacion) errores.relacion = 'Seleccione la relación.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errores.email = 'El email no es válido.';
    }
    setErroresForm(errores);
    return Object.keys(errores).length === 0;
  };

  const guardar = async () => {
    if (!validar()) return;
    setGuardando(true);
    try {
      const datos = {
        dni: form.dni,
        nombres: form.nombres,
        apellidos: form.apellidos,
        relacion: form.relacion as 'padre' | 'madre' | 'tutor' | 'apoderado',
        telefono: form.telefono || null,
        email: form.email || null,
      };
      if (editando) {
        await actualizarPadre(editando.id, datos);
        toast.success('Padre/Apoderado actualizado correctamente.');
      } else {
        await crearPadre(datos);
        toast.success('Padre/Apoderado registrado correctamente.');
      }
      setModalAbierto(false);
      cargar();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al guardar.';
      toast.error(msg);
      if (err?.response?.data?.errors) {
        const backErrors: Record<string, string> = {};
        for (const [key, val] of Object.entries(err.response.data.errors)) {
          backErrors[key] = (val as string[])[0];
        }
        setErroresForm(backErrors);
      }
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id: number) => {
    try {
      await eliminarPadre(id);
      toast.success('Registro eliminado correctamente.');
      setConfirmEliminar(null);
      if (expandido === id) setExpandido(null);
      cargar();
    } catch {
      toast.error('Error al eliminar el registro.');
    }
  };

  const toggleExpandir = async (id: number) => {
    if (expandido === id) {
      setExpandido(null);
      setPadreDetalle(null);
      setPagosPadre([]);
      setResumenPagos(null);
      return;
    }
    setExpandido(id);
    setCargandoDetalle(true);
    setCargandoPagos(true);
    setPagosPadre([]);
    setResumenPagos(null);
    try {
      const detalle = await obtenerPadre(id);
      setPadreDetalle(detalle as Padre & { alumnos?: HijoResumen[] });
    } catch {
      toast.error('No se pudo cargar el detalle.');
    } finally {
      setCargandoDetalle(false);
    }
    if (puedeVerPagos) {
      try {
        const data = await pagosPorPadre(id);
        setPagosPadre(data.pagos);
        setResumenPagos(data.resumen);
      } catch {
        setPagosPadre([]);
      } finally {
        setCargandoPagos(false);
      }
    } else {
      setCargandoPagos(false);
    }
  };

  const buscarAlumnos = async () => {
    if (buscarAlumno.length < 2) return;
    setBuscandoAlumno(true);
    try {
      const data = await listarAlumnos({ buscar: buscarAlumno });
      setAlumnosResultado(data.data);
    } catch {
      setAlumnosResultado([]);
    } finally {
      setBuscandoAlumno(false);
    }
  };

  useEffect(() => {
    if (buscarAlumno.length >= 2) {
      const timer = setTimeout(buscarAlumnos, 400);
      return () => clearTimeout(timer);
    } else {
      setAlumnosResultado([]);
    }
  }, [buscarAlumno]);

  const handleVincular = async (alumnoId: number) => {
    if (!expandido) return;
    try {
      await vincularAlumno(expandido, alumnoId);
      toast.success('Alumno vinculado correctamente.');
      setModalVincular(false);
      setBuscarAlumno('');
      // Recargar detalle
      const detalle = await obtenerPadre(expandido);
      setPadreDetalle(detalle);
      cargar();
    } catch {
      toast.error('Error al vincular el alumno.');
    }
  };

  const handleDesvincular = async (alumnoId: number) => {
    if (!expandido) return;
    try {
      await desvincularAlumno(expandido, alumnoId);
      toast.success('Alumno desvinculado.');
      const detalle = await obtenerPadre(expandido);
      setPadreDetalle(detalle);
      cargar();
    } catch {
      toast.error('Error al desvincular.');
    }
  };

  const pedirEvidencia = (pagoId: number) => {
    setPagoEvidenciaId(pagoId);
    inputEvidenciaRef.current?.click();
  };

  const handleArchivoEvidencia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    const pagoId = pagoEvidenciaId;
    e.target.value = '';
    if (!archivo || !pagoId) return;

    if (archivo.size > 5 * 1024 * 1024) {
      toast.error('El archivo no debe superar 5 MB.');
      return;
    }

    setSubiendoEvidencia(pagoId);
    try {
      const actualizado = await subirEvidenciaPago(pagoId, archivo);
      setPagosPadre((prev) => prev.map((p) => (p.id === pagoId ? { ...p, ...actualizado } : p)));
      toast.success('Evidencia cargada correctamente.');
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string; message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      const msg = data?.errors?.evidencia?.[0] || data?.mensaje || data?.message || 'No se pudo subir la evidencia.';
      toast.error(msg);
    } finally {
      setSubiendoEvidencia(null);
      setPagoEvidenciaId(null);
    }
  };

  const handleQuitarEvidencia = async (pagoId: number) => {
    if (!confirm('¿Eliminar la evidencia de este pago?')) return;
    try {
      const actualizado = await eliminarEvidenciaPago(pagoId);
      setPagosPadre((prev) => prev.map((p) => (p.id === pagoId ? { ...p, ...actualizado } : p)));
      toast.success('Evidencia eliminada.');
    } catch {
      toast.error('No se pudo eliminar la evidencia.');
    }
  };

  const esImagen = (url?: string | null) =>
    !!url && /\.(jpe?g|png|webp)(\?|$)/i.test(url);

  const relacionLabel: Record<string, string> = {
    padre: 'Padre',
    madre: 'Madre',
    tutor: 'Tutor',
    apoderado: 'Apoderado',
  };

  const relacionColor: Record<string, string> = {
    padre: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    madre: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    tutor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    apoderado: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-primario-500" />
            Padres de Familia
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestión de padres, madres, tutores y apoderados
          </p>
        </div>
        {puedeCrear && (
          <button
            onClick={abrirCrear}
            className="flex items-center gap-2 px-4 py-2.5 bg-primario-600 hover:bg-primario-700 text-white rounded-xl font-medium transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Nuevo Registro
          </button>
        )}
      </div>

      {/* Barra de búsqueda */}
      <div className="tarjeta p-4 dark:bg-gray-800 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, apellido o DNI..."
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:border-primario-500 focus:ring-2 focus:ring-primario-200 dark:focus:ring-primario-800/30 text-gray-700 dark:text-gray-200 text-sm transition-all"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Tabla */}
      <div className="tarjeta dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">DNI</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre Completo</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Relación</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Teléfono</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">Hijos</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {cargando ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : padres.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No se encontraron registros</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      {buscar ? 'Intenta con otro término de búsqueda.' : 'Registra el primer padre o apoderado.'}
                    </p>
                  </td>
                </tr>
              ) : (
                padres.map((padre) => (
                  <React.Fragment key={padre.id}>
                    <tr
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                      onClick={() => toggleExpandir(padre.id)}
                    >
                      <td className="px-5 py-4 text-sm font-mono font-medium text-gray-800 dark:text-gray-200">
                        {padre.dni}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-800 dark:text-gray-200 font-medium">
                        {padre.apellidos}, {padre.nombres}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${relacionColor[padre.relacion] || 'bg-gray-100 text-gray-700'}`}>
                          {relacionLabel[padre.relacion] || padre.relacion}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {padre.telefono || '—'}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {padre.email || '—'}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                            (padre.alumnos_count ?? 0) > 0
                              ? 'bg-primario-100 text-primario-700 dark:bg-primario-900/30 dark:text-primario-300'
                              : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            <Users className="w-3 h-3" />
                            {padre.alumnos_count ?? padre.alumnos?.length ?? 0} {(padre.alumnos_count ?? 0) === 1 ? 'hijo' : 'hijos'}
                          </span>
                          {expandido === padre.id ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {puedeEditar && (
                            <button
                              onClick={() => abrirEditar(padre)}
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {puedeEliminar && (
                            <button
                              onClick={() => setConfirmEliminar(padre.id)}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Panel expandible: alumnos vinculados */}
                    {expandido === padre.id && (
                      <tr>
                        <td colSpan={7} className="px-5 py-4 bg-gray-50/50 dark:bg-gray-900/30">
                          <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-800">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-gray-800 dark:text-white text-sm flex items-center gap-2">
                                <Users className="w-4 h-4 text-gray-400" />
                                Alumnos Vinculados
                              </h4>
                              {puedeEditar && (
                                <button
                                  onClick={() => {
                                    setModalVincular(true);
                                    setBuscarAlumno('');
                                    setAlumnosResultado([]);
                                  }}
                                  className="flex items-center gap-1.5 text-xs font-medium text-primario-600 dark:text-primario-400 hover:text-primario-700 transition-colors"
                                >
                                  <UserPlus className="w-4 h-4" />
                                  Vincular Alumno
                                </button>
                              )}
                            </div>

                            {cargandoDetalle ? (
                              <div className="space-y-2">
                                {[1, 2].map((i) => (
                                  <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
                                ))}
                              </div>
                            ) : padreDetalle?.alumnos?.length ? (
                              <div className="space-y-2">
                                {(padreDetalle.alumnos as HijoResumen[]).map((alumno) => (
                                  <div
                                    key={alumno.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg"
                                  >
                                    <div>
                                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                        {alumno.apellidos}, {alumno.nombres}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        DNI: {alumno.dni}
                                        {(alumno.seccion || alumno.secciones?.[0]) && (
                                          <> • {(alumno.seccion?.grado || alumno.secciones?.[0]?.grado?.nombre)} — {(alumno.seccion?.nombre || alumno.secciones?.[0]?.nombre)}</>
                                        )}
                                      </p>
                                      <div className="flex gap-2 mt-1.5">
                                        {alumno.promedio != null && (
                                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                            Promedio: {alumno.promedio}
                                          </span>
                                        )}
                                        {alumno.porcentaje_asistencia != null && (
                                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                            Asistencia: {alumno.porcentaje_asistencia}%
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {puedeEditar && (
                                      <button
                                        onClick={() => handleDesvincular(alumno.id)}
                                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded-lg transition-colors"
                                      >
                                        <Unlink className="w-3.5 h-3.5" />
                                        Quitar
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                                Sin alumnos vinculados.
                              </p>
                            )}

                            {puedeVerPagos && (
                              <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <h4 className="font-semibold text-gray-800 dark:text-white text-sm mb-3 flex items-center gap-2">
                                  <FileImage className="w-4 h-4 text-gray-400" />
                                  Pagos de los hijos
                                </h4>
                                <input
                                  ref={inputEvidenciaRef}
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp,application/pdf"
                                  className="hidden"
                                  onChange={handleArchivoEvidencia}
                                />
                                {cargandoPagos ? (
                                  <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
                                ) : (
                                  <>
                                    {resumenPagos && (
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                                        <div className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-2 text-center">
                                          <p className="text-[10px] text-gray-500">Total</p>
                                          <p className="font-bold text-sm text-gray-800 dark:text-white">{resumenPagos.total}</p>
                                        </div>
                                        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-2 text-center">
                                          <p className="text-[10px] text-green-600">Pagados</p>
                                          <p className="font-bold text-sm text-green-700">{resumenPagos.pagados}</p>
                                        </div>
                                        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-2 text-center">
                                          <p className="text-[10px] text-amber-600">Pendientes</p>
                                          <p className="font-bold text-sm text-amber-700">{resumenPagos.pendientes}</p>
                                        </div>
                                        <div className="rounded-lg bg-primario-50 dark:bg-primario-900/20 p-2 text-center">
                                          <p className="text-[10px] text-primario-600">Monto</p>
                                          <p className="font-bold text-sm text-primario-700">S/ {Number(resumenPagos.monto).toFixed(2)}</p>
                                        </div>
                                      </div>
                                    )}
                                    {pagosPadre.length === 0 ? (
                                      <p className="text-sm text-gray-400 text-center py-2">Sin pagos registrados.</p>
                                    ) : (
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                          <thead>
                                            <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500">
                                              <th className="py-2 pr-2">Hijo</th>
                                              <th className="py-2 pr-2">Concepto</th>
                                              <th className="py-2 pr-2">Monto</th>
                                              <th className="py-2 pr-2">Estado</th>
                                              <th className="py-2 pr-2">Comprobante</th>
                                              <th className="py-2 text-right">Evidencia</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {pagosPadre.map((p) => (
                                              <tr key={p.id} className="border-b border-gray-100 dark:border-gray-700/50">
                                                <td className="py-2.5 pr-2 text-gray-800 dark:text-gray-200">
                                                  {p.alumno ? `${p.alumno.apellidos}, ${p.alumno.nombres}` : '—'}
                                                </td>
                                                <td className="py-2.5 pr-2 text-gray-600 dark:text-gray-400">
                                                  {p.concepto_pago?.nombre || p.evento?.titulo || '—'}
                                                </td>
                                                <td className="py-2.5 pr-2 font-medium">S/ {Number(p.monto).toFixed(2)}</td>
                                                <td className="py-2.5 pr-2">
                                                  <span className={`px-2 py-0.5 rounded-full font-medium ${
                                                    p.estado === 'pagado'
                                                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                      : p.estado === 'anulado'
                                                      ? 'bg-red-100 text-red-700'
                                                      : 'bg-amber-100 text-amber-700'
                                                  }`}>
                                                    {p.estado}
                                                  </span>
                                                </td>
                                                <td className="py-2.5 pr-2 font-mono text-gray-500">
                                                  {p.comprobante?.numero_comprobante || '—'}
                                                </td>
                                                <td className="py-2.5 text-right">
                                                  <div className="inline-flex items-center gap-1 justify-end">
                                                    {p.evidencia_url ? (
                                                      <>
                                                        <button
                                                          type="button"
                                                          onClick={() => setEvidenciaVista({
                                                            url: p.evidencia_url!,
                                                            titulo: p.concepto_pago?.nombre || `Pago #${p.id}`,
                                                          })}
                                                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-primario-700 dark:text-primario-300 bg-primario-50 dark:bg-primario-900/30 hover:bg-primario-100 transition-colors"
                                                          title="Ver evidencia"
                                                        >
                                                          <Eye className="w-3.5 h-3.5" />
                                                          Ver
                                                        </button>
                                                        {puedeEditarPagos && (
                                                          <>
                                                            <button
                                                              type="button"
                                                              onClick={() => pedirEvidencia(p.id)}
                                                              disabled={subiendoEvidencia === p.id}
                                                              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                              title="Cambiar evidencia"
                                                            >
                                                              <ImagePlus className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                              type="button"
                                                              onClick={() => handleQuitarEvidencia(p.id)}
                                                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                              title="Quitar evidencia"
                                                            >
                                                              <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                          </>
                                                        )}
                                                      </>
                                                    ) : puedeEditarPagos ? (
                                                      <button
                                                        type="button"
                                                        onClick={() => pedirEvidencia(p.id)}
                                                        disabled={subiendoEvidencia === p.id}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium bg-primario-600 hover:bg-primario-700 text-white disabled:opacity-60"
                                                      >
                                                        <ImagePlus className="w-3.5 h-3.5" />
                                                        {subiendoEvidencia === p.id ? 'Subiendo...' : 'Agregar'}
                                                      </button>
                                                    ) : (
                                                      <span className="text-gray-400">Sin evidencia</span>
                                                    )}
                                                  </div>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                    {puedeEditarPagos && pagosPadre.length > 0 && (
                                      <p className="text-[11px] text-gray-400 mt-2">
                                        Puedes adjuntar capturas o fotos (JPG, PNG, WEBP o PDF, máx. 5 MB) como evidencia de pago.
                                      </p>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Página {pagina} de {totalPaginas}
            </p>
            <div className="flex gap-2">
              <button
                disabled={pagina <= 1}
                onClick={() => { setPagina(pagina - 1); cargar(pagina - 1); }}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
              >
                Anterior
              </button>
              <button
                disabled={pagina >= totalPaginas}
                onClick={() => { setPagina(pagina + 1); cargar(pagina + 1); }}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Crear / Editar */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalAbierto(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {editando ? 'Editar Padre/Apoderado' : 'Nuevo Padre/Apoderado'}
              </h3>
              <button
                onClick={() => setModalAbierto(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <div className="p-5 space-y-4">
              {/* DNI */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">DNI *</label>
                <input
                  type="text"
                  maxLength={8}
                  value={form.dni}
                  onChange={(e) => setForm({ ...form, dni: e.target.value.replace(/\D/g, '') })}
                  className={`w-full px-3 py-2.5 rounded-xl border ${erroresForm.dni ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 outline-none focus:border-primario-500 focus:ring-2 focus:ring-primario-200 dark:focus:ring-primario-800/30 text-sm transition-all`}
                  placeholder="Ej: 12345678"
                />
                {erroresForm.dni && <p className="text-xs text-red-500 mt-1">{erroresForm.dni}</p>}
              </div>

              {/* Nombres y Apellidos */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombres *</label>
                  <input
                    type="text"
                    value={form.nombres}
                    onChange={(e) => setForm({ ...form, nombres: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl border ${erroresForm.nombres ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 outline-none focus:border-primario-500 focus:ring-2 focus:ring-primario-200 dark:focus:ring-primario-800/30 text-sm transition-all`}
                  />
                  {erroresForm.nombres && <p className="text-xs text-red-500 mt-1">{erroresForm.nombres}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellidos *</label>
                  <input
                    type="text"
                    value={form.apellidos}
                    onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl border ${erroresForm.apellidos ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 outline-none focus:border-primario-500 focus:ring-2 focus:ring-primario-200 dark:focus:ring-primario-800/30 text-sm transition-all`}
                  />
                  {erroresForm.apellidos && <p className="text-xs text-red-500 mt-1">{erroresForm.apellidos}</p>}
                </div>
              </div>

              {/* Relación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Relación *</label>
                <select
                  value={form.relacion}
                  onChange={(e) => setForm({ ...form, relacion: e.target.value as any })}
                  className={`w-full px-3 py-2.5 rounded-xl border ${erroresForm.relacion ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 outline-none focus:border-primario-500 focus:ring-2 focus:ring-primario-200 dark:focus:ring-primario-800/30 text-sm transition-all`}
                >
                  <option value="">Seleccionar...</option>
                  <option value="padre">Padre</option>
                  <option value="madre">Madre</option>
                  <option value="tutor">Tutor</option>
                  <option value="apoderado">Apoderado</option>
                </select>
                {erroresForm.relacion && <p className="text-xs text-red-500 mt-1">{erroresForm.relacion}</p>}
              </div>

              {/* Teléfono y Email */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 outline-none focus:border-primario-500 focus:ring-2 focus:ring-primario-200 dark:focus:ring-primario-800/30 text-sm transition-all"
                    placeholder="Ej: 987654321"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl border ${erroresForm.email ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 outline-none focus:border-primario-500 focus:ring-2 focus:ring-primario-200 dark:focus:ring-primario-800/30 text-sm transition-all`}
                  />
                  {erroresForm.email && <p className="text-xs text-red-500 mt-1">{erroresForm.email}</p>}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setModalAbierto(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={guardando}
                className="px-5 py-2.5 rounded-xl bg-primario-600 hover:bg-primario-700 text-white font-medium text-sm transition-colors disabled:opacity-50 shadow-sm"
              >
                {guardando ? 'Guardando...' : editando ? 'Actualizar' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Vincular Alumno */}
      {modalVincular && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalVincular(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primario-500" />
                Vincular Alumno
              </h3>
              <button
                onClick={() => setModalVincular(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar alumno por nombre o DNI..."
                  value={buscarAlumno}
                  onChange={(e) => setBuscarAlumno(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 text-sm outline-none focus:border-primario-500 focus:ring-2 focus:ring-primario-200 dark:focus:ring-primario-800/30 transition-all"
                  autoFocus
                />
              </div>

              <div className="max-h-60 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700/50">
                {buscarAlumno.length < 2 ? (
                  <p className="p-4 text-center text-sm text-gray-400">Escribe al menos 2 caracteres para buscar.</p>
                ) : buscandoAlumno ? (
                  <p className="p-4 text-center text-sm text-gray-400">Buscando...</p>
                ) : alumnosResultado.length === 0 ? (
                  <p className="p-4 text-center text-sm text-gray-400">No se encontraron alumnos.</p>
                ) : (
                  alumnosResultado.map((alumno) => (
                    <div key={alumno.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {alumno.apellidos}, {alumno.nombres}
                        </p>
                        <p className="text-xs text-gray-500">
                          DNI: {alumno.dni}
                          {alumno.secciones?.[0] && (
                            <> • {alumno.secciones[0].grado?.nombre} — {alumno.secciones[0].nombre}</>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => handleVincular(alumno.id)}
                        className="text-xs font-medium px-3 py-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                      >
                        Vincular
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {confirmEliminar !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmEliminar(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                <Trash2 className="w-8 h-8" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">¿Eliminar registro?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Esta acción eliminará al padre/apoderado y desvinculará todos los alumnos asociados. No se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmEliminar(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleEliminar(confirmEliminar)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ver evidencia */}
      {evidenciaVista && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEvidenciaVista(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-800 dark:text-white text-sm truncate pr-4">
                Evidencia — {evidenciaVista.titulo}
              </h3>
              <button onClick={() => setEvidenciaVista(null)} className="btn-icono">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 max-h-[75vh] overflow-auto flex items-center justify-center bg-gray-50 dark:bg-gray-900/40">
              {esImagen(evidenciaVista.url) ? (
                <img
                  src={evidenciaVista.url}
                  alt="Evidencia de pago"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow"
                />
              ) : (
                <a
                  href={evidenciaVista.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primario"
                >
                  Abrir archivo PDF
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
