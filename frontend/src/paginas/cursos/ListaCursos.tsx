import React, { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, X, BookMarked, Clock } from 'lucide-react';
import {
  actualizarCurso,
  crearCurso,
  eliminarCurso,
  listarCursos,
} from '../../api/cursos';
import { listarGrados } from '../../api/grados';
import { listarDocentes } from '../../api/docentes';
import type { Curso, Grado, Docente } from '../../tipos';
import { usePermiso } from '../../hooks/usePermiso';

const vacio = {
  nombre: '',
  descripcion: '',
  grado_id: '',
  docente_id: '',
  horas_semanales: '2',
  estado: true,
};

export const ListaCursos = () => {
  const puedeCrear = usePermiso('crear-cursos');
  const puedeEditar = usePermiso('editar-cursos');
  const puedeEliminar = usePermiso('eliminar-cursos');

  const [cursos, setCursos] = useState<Curso[]>([]);
  const [grados, setGrados] = useState<Grado[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [buscar, setBuscar] = useState('');
  const [filtroGrado, setFiltroGrado] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Curso | null>(null);
  const [form, setForm] = useState(vacio);
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    setError('');
    try {
      const params: Record<string, string | number | undefined> = {};
      if (buscar) params.buscar = buscar;
      if (filtroGrado) params.grado_id = Number(filtroGrado);
      const data = await listarCursos(params);
      setCursos(data.data);
    } catch {
      setError('No se pudieron cargar los cursos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    listarGrados().then(setGrados).catch(() => setGrados([]));
    listarDocentes({ page: 1 }).then((r) => setDocentes(r.data)).catch(() => setDocentes([]));
  }, []);

  useEffect(() => {
    cargar();
  }, [filtroGrado]);

  const abrirCrear = () => {
    setEditando(null);
    setForm(vacio);
    setModalAbierto(true);
  };

  const abrirEditar = (curso: Curso) => {
    setEditando(curso);
    setForm({
      nombre: curso.nombre,
      descripcion: curso.descripcion ?? '',
      grado_id: String(curso.grado_id),
      docente_id: curso.docente_id ? String(curso.docente_id) : '',
      horas_semanales: String(curso.horas_semanales),
      estado: curso.estado,
    });
    setModalAbierto(true);
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError('');
    const payload = {
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      grado_id: Number(form.grado_id),
      docente_id: form.docente_id ? Number(form.docente_id) : null,
      horas_semanales: Number(form.horas_semanales),
      estado: form.estado,
    };
    try {
      if (editando) {
        await actualizarCurso(editando.id, payload);
      } else {
        await crearCurso(payload);
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

  const borrar = async (curso: Curso) => {
    if (!confirm(`¿Eliminar el curso "${curso.nombre}"?`)) return;
    try {
      await eliminarCurso(curso.id);
      await cargar();
    } catch {
      setError('No se pudo eliminar el curso.');
    }
  };

  const etiquetaNivel = (nivel: string) => {
    const colores: Record<string, string> = {
      inicial: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
      primaria: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      secundaria: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    };
    return colores[nivel] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Cursos</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Gestión de materias por grado</p>
        </div>
        {puedeCrear && (
          <button onClick={abrirCrear} className="btn-primario">
            <Plus className="w-4 h-4" /> Nuevo curso
          </button>
        )}
      </div>

      <div className="tarjeta p-4 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="campo pl-9 dark:bg-gray-900 dark:border-gray-600 dark:text-white"
              placeholder="Buscar por nombre..."
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && cargar()}
            />
          </div>
          <select
            className="campo w-auto min-w-[180px] dark:bg-gray-900 dark:border-gray-600 dark:text-white"
            value={filtroGrado}
            onChange={(e) => setFiltroGrado(e.target.value)}
          >
            <option value="">Todos los grados</option>
            {grados.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nombre} — {g.nivel}
              </option>
            ))}
          </select>
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
                <th className="px-4 py-3 font-medium">Curso</th>
                <th className="px-4 py-3 font-medium">Grado</th>
                <th className="px-4 py-3 font-medium">Docente</th>
                <th className="px-4 py-3 font-medium">Horas/sem</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {cargando ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
              ) : cursos.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  <BookMarked className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  No hay cursos registrados.
                </td></tr>
              ) : cursos.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800 dark:text-white">{c.nombre}</div>
                    {c.descripcion && (
                      <div className="text-xs text-gray-500 truncate max-w-[200px]">{c.descripcion}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${etiquetaNivel(c.grado?.nivel ?? '')}`}>
                      {c.grado?.nombre} {c.grado?.nivel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {c.docente
                      ? `${c.docente.apellidos}, ${c.docente.nombres}`
                      : <span className="text-gray-400 italic">Sin asignar</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Clock className="w-3.5 h-3.5" />
                      {c.horas_semanales}h
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.estado ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                      {c.estado ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    {puedeEditar && (
                      <button onClick={() => abrirEditar(c)} className="btn-icono text-primario-600"><Pencil className="w-4 h-4" /></button>
                    )}
                    {puedeEliminar && (
                      <button onClick={() => borrar(c)} className="btn-icono text-red-500"><Trash2 className="w-4 h-4" /></button>
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
                {editando ? 'Editar curso' : 'Nuevo curso'}
              </h3>
              <button onClick={() => setModalAbierto(false)} className="btn-icono"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={guardar} className="p-6 space-y-4">
              <div>
                <label className="etiqueta dark:text-gray-300">Nombre del curso</label>
                <input
                  required
                  className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                  placeholder="Ej: Matemáticas"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </div>
              <div>
                <label className="etiqueta dark:text-gray-300">Descripción</label>
                <input
                  className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                  placeholder="Descripción opcional"
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="etiqueta dark:text-gray-300">Grado</label>
                  <select
                    required
                    className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                    value={form.grado_id}
                    onChange={(e) => setForm({ ...form, grado_id: e.target.value })}
                  >
                    <option value="">Seleccionar grado</option>
                    {grados.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nombre} — {g.nivel}
                      </option>
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
                      <option key={d.id} value={d.id}>
                        {d.apellidos}, {d.nombres}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="etiqueta dark:text-gray-300">Horas semanales</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                    value={form.horas_semanales}
                    onChange={(e) => setForm({ ...form, horas_semanales: e.target.value })}
                  />
                </div>
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
