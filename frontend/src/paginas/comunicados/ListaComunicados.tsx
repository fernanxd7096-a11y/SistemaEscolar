import React, { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, X, Megaphone, AlertTriangle, Info, Users, Eye } from 'lucide-react';
import {
  actualizarComunicado,
  crearComunicado,
  eliminarComunicado,
  listarComunicados,
} from '../../api/comunicados';
import type { Comunicado } from '../../tipos';
import { usePermiso } from '../../hooks/usePermiso';

const TIPOS = [
  { value: 'general', label: 'General', icon: <Megaphone className="w-4 h-4" />, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { value: 'urgente', label: 'Urgente', icon: <AlertTriangle className="w-4 h-4" />, color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  { value: 'informativo', label: 'Informativo', icon: <Info className="w-4 h-4" />, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
];

const DESTINATARIOS = [
  { value: 'todos', label: 'Todos', icon: '🏫' },
  { value: 'padres', label: 'Padres', icon: '👨‍👩‍👧' },
  { value: 'docentes', label: 'Docentes', icon: '👨‍🏫' },
  { value: 'alumnos', label: 'Alumnos', icon: '🎒' },
];

const vacio = {
  titulo: '',
  contenido: '',
  tipo: 'general',
  destinatarios: 'todos',
  fecha_publicacion: new Date().toISOString().slice(0, 10),
  estado: true,
};

export const ListaComunicados = () => {
  const puedeCrear = usePermiso('crear-comunicados');
  const puedeEditar = usePermiso('editar-comunicados');
  const puedeEliminar = usePermiso('eliminar-comunicados');

  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [buscar, setBuscar] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroDestinatarios, setFiltroDestinatarios] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [vistaPrevia, setVistaPrevia] = useState<Comunicado | null>(null);
  const [editando, setEditando] = useState<Comunicado | null>(null);
  const [form, setForm] = useState(vacio);
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (buscar) params.buscar = buscar;
      if (filtroTipo) params.tipo = filtroTipo;
      if (filtroDestinatarios) params.destinatarios = filtroDestinatarios;
      const data = await listarComunicados(params);
      setComunicados(data.data);
    } catch {
      setError('No se pudieron cargar los comunicados.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);
  useEffect(() => { cargar(); }, [filtroTipo, filtroDestinatarios]);

  const abrirCrear = () => {
    setEditando(null);
    setForm(vacio);
    setModalAbierto(true);
  };

  const abrirEditar = (c: Comunicado) => {
    setEditando(c);
    setForm({
      titulo: c.titulo,
      contenido: c.contenido,
      tipo: c.tipo,
      destinatarios: c.destinatarios,
      fecha_publicacion: c.fecha_publicacion?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      estado: c.estado,
    });
    setModalAbierto(true);
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError('');
    try {
      if (editando) {
        await actualizarComunicado(editando.id, form);
      } else {
        await crearComunicado(form);
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

  const borrar = async (c: Comunicado) => {
    if (!confirm(`¿Eliminar el comunicado "${c.titulo}"?`)) return;
    try {
      await eliminarComunicado(c.id);
      await cargar();
    } catch {
      setError('No se pudo eliminar.');
    }
  };

  const tipoInfo = (tipo: string) => TIPOS.find((t) => t.value === tipo) ?? TIPOS[0];
  const destInfo = (dest: string) => DESTINATARIOS.find((d) => d.value === dest) ?? DESTINATARIOS[0];

  const formatFecha = (fecha?: string | null) => {
    if (!fecha) return '';
    return new Date(fecha + 'T12:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Comunicados</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Anuncios para la comunidad educativa</p>
        </div>
        {puedeCrear && (
          <button onClick={abrirCrear} className="btn-primario">
            <Plus className="w-4 h-4" /> Nuevo comunicado
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="tarjeta p-4 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="campo pl-9 dark:bg-gray-900 dark:border-gray-600 dark:text-white"
              placeholder="Buscar por título..."
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && cargar()}
            />
          </div>
          <select
            className="campo w-auto min-w-[150px] dark:bg-gray-900 dark:border-gray-600 dark:text-white"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
          >
            <option value="">Todos los tipos</option>
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select
            className="campo w-auto min-w-[160px] dark:bg-gray-900 dark:border-gray-600 dark:text-white"
            value={filtroDestinatarios}
            onChange={(e) => setFiltroDestinatarios(e.target.value)}
          >
            <option value="">Todos los destinatarios</option>
            {DESTINATARIOS.map((d) => (
              <option key={d.value} value={d.value}>{d.icon} {d.label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      {/* Lista de comunicados como tarjetas */}
      {cargando ? (
        <div className="tarjeta p-12 text-center text-gray-400 dark:bg-gray-800">Cargando...</div>
      ) : comunicados.length === 0 ? (
        <div className="tarjeta p-12 text-center dark:bg-gray-800 dark:border-gray-700">
          <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-gray-400">No hay comunicados publicados.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comunicados.map((c) => {
            const tp = tipoInfo(c.tipo);
            const ds = destInfo(c.destinatarios);
            return (
              <div
                key={c.id}
                className={`tarjeta p-5 dark:bg-gray-800 dark:border-gray-700 transition-all hover:shadow-md ${
                  c.tipo === 'urgente' ? 'border-l-4 border-l-red-500' : c.tipo === 'informativo' ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-blue-500'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${tp.color}`}>
                        {tp.icon} {tp.label}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        {ds.icon} {ds.label}
                      </span>
                      {!c.estado && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-400">
                          Borrador
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">{c.titulo}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 whitespace-pre-line">{c.contenido}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-400 dark:text-gray-500">
                      <span>📅 {formatFecha(c.fecha_publicacion)}</span>
                      {c.autor && <span>✍️ {c.autor.nombre} {c.autor.apellido}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setVistaPrevia(c)} className="btn-icono text-gray-500 hover:text-primario-600">
                      <Eye className="w-4 h-4" />
                    </button>
                    {puedeEditar && (
                      <button onClick={() => abrirEditar(c)} className="btn-icono text-primario-600">
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    {puedeEliminar && (
                      <button onClick={() => borrar(c)} className="btn-icono text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal vista previa */}
      {vistaPrevia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                {tipoInfo(vistaPrevia.tipo).icon}
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tipoInfo(vistaPrevia.tipo).color}`}>
                  {tipoInfo(vistaPrevia.tipo).label}
                </span>
              </div>
              <button onClick={() => setVistaPrevia(null)} className="btn-icono"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{vistaPrevia.titulo}</h3>
              <div className="flex items-center gap-3 mb-4 text-xs text-gray-400">
                <span>📅 {formatFecha(vistaPrevia.fecha_publicacion)}</span>
                <span>👥 {destInfo(vistaPrevia.destinatarios).icon} {destInfo(vistaPrevia.destinatarios).label}</span>
              </div>
              <div className="prose dark:prose-invert max-w-none text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                {vistaPrevia.contenido}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear/editar */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {editando ? 'Editar comunicado' : 'Nuevo comunicado'}
              </h3>
              <button onClick={() => setModalAbierto(false)} className="btn-icono"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={guardar} className="p-6 space-y-4">
              <div>
                <label className="etiqueta dark:text-gray-300">Título</label>
                <input
                  required
                  className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                  placeholder="Título del comunicado"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                />
              </div>
              <div>
                <label className="etiqueta dark:text-gray-300">Contenido</label>
                <textarea
                  required
                  rows={6}
                  className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white resize-y"
                  placeholder="Escribe el contenido del comunicado..."
                  value={form.contenido}
                  onChange={(e) => setForm({ ...form, contenido: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="etiqueta dark:text-gray-300">Tipo</label>
                  <select
                    required
                    className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  >
                    {TIPOS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="etiqueta dark:text-gray-300">Destinatarios</label>
                  <select
                    required
                    className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                    value={form.destinatarios}
                    onChange={(e) => setForm({ ...form, destinatarios: e.target.value })}
                  >
                    {DESTINATARIOS.map((d) => (
                      <option key={d.value} value={d.value}>{d.icon} {d.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="etiqueta dark:text-gray-300">Fecha publicación</label>
                  <input
                    type="date"
                    className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                    value={form.fecha_publicacion}
                    onChange={(e) => setForm({ ...form, fecha_publicacion: e.target.value })}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.checked })}
                />
                Publicar (visible para destinatarios)
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
