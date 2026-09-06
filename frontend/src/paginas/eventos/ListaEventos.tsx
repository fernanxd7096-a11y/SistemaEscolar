import React, { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, X, MapPin, Calendar, School, Trophy, Palette, Sparkles } from 'lucide-react';
import { actualizarEvento, crearEvento, eliminarEvento, listarEventos } from '../../api/eventos';
import type { Evento } from '../../tipos';
import { usePermiso } from '../../hooks/usePermiso';

const TIPOS = [
  { value: 'visita_estudio', label: 'Visita de estudio', icon: <MapPin className="w-4 h-4" />, color: 'insignia-info' },
  { value: 'olimpiada', label: 'Olimpiada', icon: <Trophy className="w-4 h-4" />, color: 'insignia-alerta' },
  { value: 'deportivo', label: 'Deportivo', icon: <School className="w-4 h-4" />, color: 'insignia-exito' },
  { value: 'cultural', label: 'Cultural', icon: <Palette className="w-4 h-4" />, color: 'insignia-peligro' },
  { value: 'otro', label: 'Otro', icon: <Sparkles className="w-4 h-4" />, color: 'insignia-gris' },
];

const ESTADOS = [
  { value: 'programado', label: 'Programado', color: 'insignia-info' },
  { value: 'en_curso', label: 'En curso', color: 'insignia-alerta' },
  { value: 'finalizado', label: 'Finalizado', color: 'insignia-gris' },
  { value: 'cancelado', label: 'Cancelado', color: 'insignia-peligro' },
];

const vacio = {
  titulo: '',
  descripcion: '',
  tipo: 'otro',
  lugar: '',
  fecha: new Date().toISOString().slice(0, 10),
  hora: '',
  estado: 'programado',
  visible: true,
};

export const ListaEventos = () => {
  const puedeCrear = usePermiso('crear-eventos');
  const puedeEditar = usePermiso('editar-eventos');
  const puedeEliminar = usePermiso('eliminar-eventos');

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [buscar, setBuscar] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Evento | null>(null);
  const [form, setForm] = useState(vacio);
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (buscar) params.buscar = buscar;
      if (filtroTipo) params.tipo = filtroTipo;
      if (filtroEstado) params.estado = filtroEstado;
      const data = await listarEventos(params);
      setEventos(data.data);
    } catch {
      setError('No se pudieron cargar los eventos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);
  useEffect(() => { cargar(); }, [filtroTipo, filtroEstado]);

  const abrirCrear = () => {
    setEditando(null);
    setForm(vacio);
    setModalAbierto(true);
  };

  const abrirEditar = (e: Evento) => {
    setEditando(e);
    setForm({
      titulo: e.titulo,
      descripcion: e.descripcion ?? '',
      tipo: e.tipo,
      lugar: e.lugar ?? '',
      fecha: e.fecha.slice(0, 10),
      hora: e.hora?.slice(0, 5) ?? '',
      estado: e.estado,
      visible: e.visible,
    });
    setModalAbierto(true);
  };

  const guardar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setGuardando(true);
    setError('');
    try {
      const payload = { ...form, hora: form.hora || null, lugar: form.lugar || null, descripcion: form.descripcion || null };
      if (editando) {
        await actualizarEvento(editando.id, payload);
      } else {
        await crearEvento(payload);
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

  const borrar = async (e: Evento) => {
    if (!confirm(`¿Eliminar el evento "${e.titulo}"?`)) return;
    try {
      await eliminarEvento(e.id);
      await cargar();
    } catch {
      setError('No se pudo eliminar.');
    }
  };

  const tipoInfo = (tipo: string) => TIPOS.find((t) => t.value === tipo) ?? TIPOS[4];
  const estadoInfo = (estado: string) => ESTADOS.find((s) => s.value === estado) ?? ESTADOS[0];

  const formatFecha = (fecha: string) =>
    new Date(fecha.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Eventos</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Actividades extracurriculares del colegio</p>
        </div>
        {puedeCrear && (
          <button onClick={abrirCrear} className="btn-primario">
            <Plus className="w-4 h-4" /> Nuevo evento
          </button>
        )}
      </div>

      <div className="tarjeta p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="campo pl-9"
              placeholder="Buscar por título o lugar..."
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && cargar()}
            />
          </div>
          <select className="campo w-auto min-w-[170px]" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
            <option value="">Todos los tipos</option>
            {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select className="campo w-auto min-w-[150px]" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            {ESTADOS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>}

      {cargando ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="tarjeta p-5 h-36 skeleton" />)}
        </div>
      ) : eventos.length === 0 ? (
        <div className="tarjeta p-12 text-center">
          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-gray-400">No hay eventos registrados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {eventos.map((e) => {
            const tp = tipoInfo(e.tipo);
            const es = estadoInfo(e.estado);
            return (
              <div key={e.id} className="tarjeta tarjeta-hover p-5 flex flex-col">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={tp.color}>{tp.icon} {tp.label}</span>
                  <span className={es.color}>{es.label}</span>
                  {!e.visible && <span className="insignia-gris">Oculto</span>}
                </div>
                <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-1 line-clamp-2">{e.titulo}</h3>
                {e.descripcion && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{e.descripcion}</p>
                )}
                <div className="mt-auto space-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatFecha(e.fecha)}{e.hora ? ` · ${e.hora.slice(0, 5)}` : ''}</div>
                  {e.lugar && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {e.lugar}</div>}
                </div>
                {(puedeEditar || puedeEliminar) && (
                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    {puedeEditar && (
                      <button onClick={() => abrirEditar(e)} className="btn-icono text-primario-600"><Pencil className="w-4 h-4" /></button>
                    )}
                    {puedeEliminar && (
                      <button onClick={() => borrar(e)} className="btn-icono text-red-500"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{editando ? 'Editar evento' : 'Nuevo evento'}</h3>
              <button onClick={() => setModalAbierto(false)} className="btn-icono"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={guardar} className="p-6 space-y-4">
              <div>
                <label className="etiqueta">Título</label>
                <input required className="campo" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
              </div>
              <div>
                <label className="etiqueta">Descripción</label>
                <textarea rows={3} className="campo resize-y" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="etiqueta">Tipo</label>
                  <select required className="campo" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                    {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="etiqueta">Estado</label>
                  <select required className="campo" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                    {ESTADOS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="etiqueta">Fecha</label>
                  <input type="date" required className="campo" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
                </div>
                <div>
                  <label className="etiqueta">Hora (opcional)</label>
                  <input type="time" className="campo" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="etiqueta">Lugar</label>
                <input className="campo" value={form.lugar} onChange={(e) => setForm({ ...form, lugar: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={form.visible} onChange={(e) => setForm({ ...form, visible: e.target.checked })} />
                Visible (aparece en el widget del dashboard)
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalAbierto(false)} className="btn-secundario">Cancelar</button>
                <button type="submit" disabled={guardando} className="btn-primario">{guardando ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
