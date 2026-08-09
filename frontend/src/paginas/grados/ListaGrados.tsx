import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, ChevronDown, ChevronRight } from 'lucide-react';
import {
  actualizarGrado,
  actualizarSeccion,
  crearGrado,
  crearSeccion,
  eliminarGrado,
  eliminarSeccion,
  listarGrados,
} from '../../api/grados';
import { listarDocentes } from '../../api/docentes';
import type { Docente, Grado, Seccion } from '../../tipos';
import { usePermiso } from '../../hooks/usePermiso';

export const ListaGrados = () => {
  const puedeCrear = usePermiso('crear-grados');
  const puedeEditar = usePermiso('editar-grados');
  const puedeEliminar = usePermiso('eliminar-grados');

  const [grados, setGrados] = useState<Grado[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [abiertos, setAbiertos] = useState<Record<number, boolean>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [modalGrado, setModalGrado] = useState(false);
  const [modalSeccion, setModalSeccion] = useState(false);
  const [gradoEdit, setGradoEdit] = useState<Grado | null>(null);
  const [seccionEdit, setSeccionEdit] = useState<Seccion | null>(null);
  const [gradoPadreId, setGradoPadreId] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [formGrado, setFormGrado] = useState({
    nombre: '',
    nivel: 'primaria' as Grado['nivel'],
    descripcion: '',
    estado: true,
  });

  const [formSeccion, setFormSeccion] = useState({
    nombre: '',
    capacidad: 30,
    docente_tutor_id: '',
    estado: true,
  });

  const cargar = async () => {
    setCargando(true);
    setError('');
    try {
      const data = await listarGrados();
      setGrados(data);
    } catch {
      setError('No se pudieron cargar los grados.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    listarDocentes({ page: 1 }).then((r) => setDocentes(r.data)).catch(() => setDocentes([]));
  }, []);

  const toggle = (id: number) => setAbiertos((prev) => ({ ...prev, [id]: !prev[id] }));

  const abrirCrearGrado = () => {
    setGradoEdit(null);
    setFormGrado({ nombre: '', nivel: 'primaria', descripcion: '', estado: true });
    setModalGrado(true);
  };

  const abrirEditarGrado = (grado: Grado) => {
    setGradoEdit(grado);
    setFormGrado({
      nombre: grado.nombre,
      nivel: grado.nivel,
      descripcion: grado.descripcion ?? '',
      estado: grado.estado,
    });
    setModalGrado(true);
  };

  const guardarGrado = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (gradoEdit) {
        await actualizarGrado(gradoEdit.id, formGrado);
      } else {
        await crearGrado(formGrado);
      }
      setModalGrado(false);
      await cargar();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string; message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      setError(data?.errors ? Object.values(data.errors)[0][0] : data?.mensaje || data?.message || 'Error al guardar grado.');
    } finally {
      setGuardando(false);
    }
  };

  const borrarGrado = async (grado: Grado) => {
    if (!confirm(`¿Eliminar el grado ${grado.nombre} (${grado.nivel}) y sus secciones?`)) return;
    try {
      await eliminarGrado(grado.id);
      await cargar();
    } catch {
      setError('No se pudo eliminar el grado.');
    }
  };

  const abrirCrearSeccion = (gradoId: number) => {
    setGradoPadreId(gradoId);
    setSeccionEdit(null);
    setFormSeccion({ nombre: '', capacidad: 30, docente_tutor_id: '', estado: true });
    setModalSeccion(true);
  };

  const abrirEditarSeccion = (seccion: Seccion) => {
    setGradoPadreId(seccion.grado_id);
    setSeccionEdit(seccion);
    setFormSeccion({
      nombre: seccion.nombre,
      capacidad: seccion.capacidad,
      docente_tutor_id: seccion.docente_tutor_id ? String(seccion.docente_tutor_id) : '',
      estado: seccion.estado,
    });
    setModalSeccion(true);
  };

  const guardarSeccion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradoPadreId) return;
    setGuardando(true);
    const payload = {
      nombre: formSeccion.nombre,
      capacidad: Number(formSeccion.capacidad),
      docente_tutor_id: formSeccion.docente_tutor_id ? Number(formSeccion.docente_tutor_id) : null,
      estado: formSeccion.estado,
    };
    try {
      if (seccionEdit) {
        await actualizarSeccion(seccionEdit.id, payload);
      } else {
        await crearSeccion(gradoPadreId, payload);
      }
      setModalSeccion(false);
      await cargar();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string; message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      setError(data?.errors ? Object.values(data.errors)[0][0] : data?.mensaje || data?.message || 'Error al guardar sección.');
    } finally {
      setGuardando(false);
    }
  };

  const borrarSeccion = async (seccion: Seccion) => {
    if (!confirm(`¿Eliminar la sección ${seccion.nombre}?`)) return;
    try {
      await eliminarSeccion(seccion.id);
      await cargar();
    } catch {
      setError('No se pudo eliminar la sección.');
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Grados y Secciones</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Estructura académica del colegio</p>
        </div>
        {puedeCrear && (
          <button onClick={abrirCrearGrado} className="btn-primario">
            <Plus className="w-4 h-4" /> Nuevo grado
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      <div className="space-y-3">
        {cargando ? (
          <div className="tarjeta p-8 text-center text-gray-400 dark:bg-gray-800">Cargando...</div>
        ) : grados.length === 0 ? (
          <div className="tarjeta p-8 text-center text-gray-400 dark:bg-gray-800">No hay grados registrados.</div>
        ) : grados.map((grado) => (
          <div key={grado.id} className="tarjeta dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <button onClick={() => toggle(grado.id)} className="btn-icono">
                {abiertos[grado.id] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 dark:text-white">
                  {grado.nombre} <span className="text-sm font-normal text-gray-500 capitalize">({grado.nivel})</span>
                </div>
                <div className="text-xs text-gray-500">
                  {grado.secciones?.length ?? grado.secciones_count ?? 0} secciones
                  {grado.descripcion ? ` · ${grado.descripcion}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {puedeCrear && (
                  <button onClick={() => abrirCrearSeccion(grado.id)} className="btn-secundario text-xs py-1.5">
                    + Sección
                  </button>
                )}
                {puedeEditar && (
                  <button onClick={() => abrirEditarGrado(grado)} className="btn-icono text-primario-600"><Pencil className="w-4 h-4" /></button>
                )}
                {puedeEliminar && (
                  <button onClick={() => borrarGrado(grado)} className="btn-icono text-red-500"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
            </div>

            {abiertos[grado.id] && (
              <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
                {(grado.secciones ?? []).length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-400">Sin secciones</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="text-left text-gray-500">
                      <tr>
                        <th className="px-4 py-2 font-medium">Sección</th>
                        <th className="px-4 py-2 font-medium">Capacidad</th>
                        <th className="px-4 py-2 font-medium">Tutor</th>
                        <th className="px-4 py-2 font-medium text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grado.secciones!.map((s) => (
                        <tr key={s.id} className="border-t border-gray-100 dark:border-gray-700">
                          <td className="px-4 py-2 font-medium text-gray-800 dark:text-white">{s.nombre}</td>
                          <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{s.capacidad}</td>
                          <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                            {s.docente_tutor
                              ? `${s.docente_tutor.apellidos}, ${s.docente_tutor.nombres}`
                              : '—'}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {puedeEditar && (
                              <button onClick={() => abrirEditarSeccion(s)} className="btn-icono text-primario-600"><Pencil className="w-4 h-4" /></button>
                            )}
                            {puedeEliminar && (
                              <button onClick={() => borrarSeccion(s)} className="btn-icono text-red-500"><Trash2 className="w-4 h-4" /></button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {modalGrado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {gradoEdit ? 'Editar grado' : 'Nuevo grado'}
              </h3>
              <button onClick={() => setModalGrado(false)} className="btn-icono"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={guardarGrado} className="p-6 space-y-4">
              <div>
                <label className="etiqueta dark:text-gray-300">Nombre</label>
                <input required className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" placeholder="1°" value={formGrado.nombre} onChange={(e) => setFormGrado({ ...formGrado, nombre: e.target.value })} />
              </div>
              <div>
                <label className="etiqueta dark:text-gray-300">Nivel</label>
                <select className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={formGrado.nivel} onChange={(e) => setFormGrado({ ...formGrado, nivel: e.target.value as Grado['nivel'] })}>
                  <option value="inicial">Inicial</option>
                  <option value="primaria">Primaria</option>
                  <option value="secundaria">Secundaria</option>
                </select>
              </div>
              <div>
                <label className="etiqueta dark:text-gray-300">Descripción</label>
                <input className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={formGrado.descripcion} onChange={(e) => setFormGrado({ ...formGrado, descripcion: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setModalGrado(false)} className="btn-secundario">Cancelar</button>
                <button type="submit" disabled={guardando} className="btn-primario">{guardando ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalSeccion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {seccionEdit ? 'Editar sección' : 'Nueva sección'}
              </h3>
              <button onClick={() => setModalSeccion(false)} className="btn-icono"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={guardarSeccion} className="p-6 space-y-4">
              <div>
                <label className="etiqueta dark:text-gray-300">Nombre</label>
                <input required className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" placeholder="A" value={formSeccion.nombre} onChange={(e) => setFormSeccion({ ...formSeccion, nombre: e.target.value })} />
              </div>
              <div>
                <label className="etiqueta dark:text-gray-300">Capacidad</label>
                <input type="number" min={1} className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={formSeccion.capacidad} onChange={(e) => setFormSeccion({ ...formSeccion, capacidad: Number(e.target.value) })} />
              </div>
              <div>
                <label className="etiqueta dark:text-gray-300">Docente tutor</label>
                <select className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={formSeccion.docente_tutor_id} onChange={(e) => setFormSeccion({ ...formSeccion, docente_tutor_id: e.target.value })}>
                  <option value="">Sin tutor</option>
                  {docentes.map((d) => (
                    <option key={d.id} value={d.id}>{d.apellidos}, {d.nombres}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setModalSeccion(false)} className="btn-secundario">Cancelar</button>
                <button type="submit" disabled={guardando} className="btn-primario">{guardando ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
