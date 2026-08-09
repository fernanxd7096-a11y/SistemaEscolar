import React, { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, X } from 'lucide-react';
import {
  actualizarDocente,
  crearDocente,
  eliminarDocente,
  listarDocentes,
} from '../../api/docentes';
import type { Docente } from '../../tipos';
import { usePermiso } from '../../hooks/usePermiso';

const vacio = {
  dni: '',
  nombres: '',
  apellidos: '',
  especialidad: '',
  titulo: '',
  telefono: '',
  email: '',
  estado: true,
};

export const ListaDocentes = () => {
  const puedeCrear = usePermiso('crear-docentes');
  const puedeEditar = usePermiso('editar-docentes');
  const puedeEliminar = usePermiso('eliminar-docentes');

  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [buscar, setBuscar] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Docente | null>(null);
  const [form, setForm] = useState(vacio);
  const [guardando, setGuardando] = useState(false);

  const cargar = async (termino = buscar) => {
    setCargando(true);
    setError('');
    try {
      const data = await listarDocentes({ buscar: termino || undefined });
      setDocentes(data.data);
    } catch {
      setError('No se pudieron cargar los docentes.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const abrirCrear = () => {
    setEditando(null);
    setForm(vacio);
    setModalAbierto(true);
  };

  const abrirEditar = (docente: Docente) => {
    setEditando(docente);
    setForm({
      dni: docente.dni,
      nombres: docente.nombres,
      apellidos: docente.apellidos,
      especialidad: docente.especialidad ?? '',
      titulo: docente.titulo ?? '',
      telefono: docente.telefono ?? '',
      email: docente.email ?? '',
      estado: docente.estado,
    });
    setModalAbierto(true);
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError('');
    const payload = {
      ...form,
      especialidad: form.especialidad || null,
      titulo: form.titulo || null,
      telefono: form.telefono || null,
      email: form.email || null,
    };
    try {
      if (editando) {
        await actualizarDocente(editando.id, payload);
      } else {
        await crearDocente(payload);
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

  const borrar = async (docente: Docente) => {
    if (!confirm(`¿Eliminar a ${docente.nombres} ${docente.apellidos}?`)) return;
    try {
      await eliminarDocente(docente.id);
      await cargar();
    } catch {
      setError('No se pudo eliminar el docente.');
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Docentes</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Personal docente de la institución</p>
        </div>
        {puedeCrear && (
          <button onClick={abrirCrear} className="btn-primario">
            <Plus className="w-4 h-4" /> Nuevo docente
          </button>
        )}
      </div>

      <div className="tarjeta p-4 dark:bg-gray-800 dark:border-gray-700">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="campo pl-9 dark:bg-gray-900 dark:border-gray-600 dark:text-white"
            placeholder="Buscar por nombre, DNI o especialidad..."
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
                <th className="px-4 py-3 font-medium">Docente</th>
                <th className="px-4 py-3 font-medium">Especialidad</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {cargando ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
              ) : docentes.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No hay docentes registrados.</td></tr>
              ) : docentes.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{d.dni}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800 dark:text-white">{d.apellidos}, {d.nombres}</div>
                    {d.email && <div className="text-xs text-gray-500">{d.email}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{d.especialidad || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${d.estado ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                      {d.estado ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    {puedeEditar && (
                      <button onClick={() => abrirEditar(d)} className="btn-icono text-primario-600"><Pencil className="w-4 h-4" /></button>
                    )}
                    {puedeEliminar && (
                      <button onClick={() => borrar(d)} className="btn-icono text-red-500"><Trash2 className="w-4 h-4" /></button>
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
                {editando ? 'Editar docente' : 'Nuevo docente'}
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
                  <label className="etiqueta dark:text-gray-300">Teléfono</label>
                  <input className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
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
                  <label className="etiqueta dark:text-gray-300">Especialidad</label>
                  <input className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={form.especialidad} onChange={(e) => setForm({ ...form, especialidad: e.target.value })} />
                </div>
                <div>
                  <label className="etiqueta dark:text-gray-300">Título</label>
                  <input className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label className="etiqueta dark:text-gray-300">Email</label>
                  <input type="email" className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
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
