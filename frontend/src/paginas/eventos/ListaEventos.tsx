import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, CalendarDays, MapPin, DollarSign, Users as UsersIcon, Receipt } from 'lucide-react';
import { listarEventos, crearEvento, actualizarEvento, eliminarEvento } from '../../api/eventos';
import { pagosPorEvento } from '../../api/pagos';
import type { Evento, Pago } from '../../tipos';
import { usePermiso } from '../../hooks/usePermiso';

const TIPOS: { value: Evento['tipo']; label: string; color: string }[] = [
  { value: 'institucional', label: 'Institucional', color: 'insignia-info' },
  { value: 'reunion', label: 'Reunión', color: 'insignia-alerta' },
  { value: 'celebracion', label: 'Celebración', color: 'insignia-exito' },
  { value: 'escolar', label: 'Escolar', color: 'insignia-gris' },
  { value: 'actividad', label: 'Actividad', color: 'insignia-info' },
];

const ESTADOS: { value: Evento['estado']; label: string }[] = [
  { value: 'activo', label: 'Activo' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'finalizado', label: 'Finalizado' },
];

const vacioForm = {
  titulo: '',
  descripcion: '',
  tipo: 'institucional' as Evento['tipo'],
  fecha_inicio: '',
  hora_inicio: '',
  fecha_fin: '',
  hora_fin: '',
  lugar: '',
  costo: '',
  cupo_maximo: '',
  estado: 'activo' as Evento['estado'],
};

type PagosEventoData = {
  evento: { id: number; titulo: string; costo?: number | null; fecha_inicio: string };
  resumen: { total_alumnos: number; pagados: number; pendientes: number; monto_recaudado: number };
  alumnos: Array<{ alumno: { id: number; nombres: string; apellidos: string; dni: string }; estado: string; pago: Pago | null }>;
};

export const ListaEventos = () => {
  const puedeCrear = usePermiso('crear-eventos');
  const puedeEditar = usePermiso('editar-eventos');
  const puedeEliminar = usePermiso('eliminar-eventos');
  const puedeVerPagos = usePermiso('ver-pagos');

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [buscar, setBuscar] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Evento | null>(null);
  const [form, setForm] = useState(vacioForm);
  const [guardando, setGuardando] = useState(false);

  const [modalPagos, setModalPagos] = useState(false);
  const [pagosData, setPagosData] = useState<PagosEventoData | null>(null);
  const [cargandoPagos, setCargandoPagos] = useState(false);

  const cargar = async () => {
    setCargando(true);
    setError('');
    try {
      const data = await listarEventos({
        buscar: buscar || undefined,
        tipo: filtroTipo || undefined,
        estado: filtroEstado || undefined,
        page: pagina,
      });
      setEventos(data.data);
      setTotalPaginas(data.last_page);
    } catch {
      setError('No se pudieron cargar los eventos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [pagina, filtroTipo, filtroEstado]);

  const buscarHandler = (e: React.FormEvent) => {
    e.preventDefault();
    setPagina(1);
    cargar();
  };

  const abrirCrear = () => {
    setEditando(null);
    setForm(vacioForm);
    setModalAbierto(true);
  };

  const abrirEditar = (evento: Evento) => {
    setEditando(evento);
    setForm({
      titulo: evento.titulo,
      descripcion: evento.descripcion ?? '',
      tipo: evento.tipo,
      fecha_inicio: evento.fecha_inicio?.slice(0, 10) ?? '',
      hora_inicio: evento.hora_inicio?.slice(0, 5) ?? '',
      fecha_fin: evento.fecha_fin?.slice(0, 10) ?? '',
      hora_fin: evento.hora_fin?.slice(0, 5) ?? '',
      lugar: evento.lugar ?? '',
      costo: evento.costo != null ? String(evento.costo) : '',
      cupo_maximo: evento.cupo_maximo != null ? String(evento.cupo_maximo) : '',
      estado: evento.estado,
    });
    setModalAbierto(true);
  };

  const verPagos = async (evento: Evento) => {
    setModalPagos(true);
    setCargandoPagos(true);
    setPagosData(null);
    try {
      const data = await pagosPorEvento(evento.id);
      setPagosData(data);
    } catch {
      setError('No se pudieron cargar los pagos del evento.');
      setModalPagos(false);
    } finally {
      setCargandoPagos(false);
    }
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError('');
    const payload = {
      titulo: form.titulo,
      descripcion: form.descripcion || null,
      tipo: form.tipo,
      fecha_inicio: form.fecha_inicio,
      hora_inicio: form.hora_inicio || null,
      fecha_fin: form.fecha_fin || null,
      hora_fin: form.hora_fin || null,
      lugar: form.lugar || null,
      costo: form.costo ? Number(form.costo) : null,
      cupo_maximo: form.cupo_maximo ? Number(form.cupo_maximo) : null,
      estado: form.estado,
    };
    try {
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

  const borrar = async (evento: Evento) => {
    if (!confirm(`¿Eliminar el evento "${evento.titulo}"?`)) return;
    try {
      await eliminarEvento(evento.id);
      await cargar();
    } catch {
      setError('No se pudo eliminar el evento.');
    }
  };

  const tipoInfo = (tipo: string) => TIPOS.find((t) => t.value === tipo);

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Eventos</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Gestión de eventos institucionales</p>
        </div>
        {puedeCrear && (
          <button onClick={abrirCrear} className="btn-primario">
            <Plus className="w-4 h-4" /> Nuevo evento
          </button>
        )}
      </div>

      <div className="tarjeta p-4 dark:bg-gray-800 dark:border-gray-700">
        <form onSubmit={buscarHandler} className="flex flex-col sm:flex-row gap-3">
          <input
            className="campo flex-1 dark:bg-gray-900 dark:border-gray-600 dark:text-white"
            placeholder="Buscar evento..."
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
          />
          <select
            className="campo w-full sm:w-40 dark:bg-gray-900 dark:border-gray-600 dark:text-white"
            value={filtroTipo}
            onChange={(e) => { setFiltroTipo(e.target.value); setPagina(1); }}
          >
            <option value="">Todos los tipos</option>
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select
            className="campo w-full sm:w-36 dark:bg-gray-900 dark:border-gray-600 dark:text-white"
            value={filtroEstado}
            onChange={(e) => { setFiltroEstado(e.target.value); setPagina(1); }}
          >
            <option value="">Todo estado</option>
            {ESTADOS.map((e) => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
          <button type="submit" className="btn-primario">Buscar</button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      {cargando ? (
        <div className="tarjeta p-12 text-center text-gray-400 dark:bg-gray-800">Cargando eventos...</div>
      ) : eventos.length === 0 ? (
        <div className="tarjeta p-12 text-center dark:bg-gray-800">
          <CalendarDays className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">No se encontraron eventos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {eventos.map((evento) => {
            const tipo = tipoInfo(evento.tipo);
            const conCosto = evento.costo != null && Number(evento.costo) > 0;
            return (
              <div key={evento.id} className="tarjeta-hover p-5 dark:bg-gray-800 dark:border-gray-700 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <span className={tipo?.color ?? 'insignia-gris'}>{tipo?.label}</span>
                  <span className={`insignia ${evento.estado === 'activo' ? 'insignia-exito' : evento.estado === 'cancelado' ? 'insignia-peligro' : 'insignia-gris'}`}>
                    {evento.estado}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">{evento.titulo}</h3>
                {evento.descripcion && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{evento.descripcion}</p>
                )}
                <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400 mt-auto">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-primario-600 dark:text-primario-400" />
                    <span>{new Date(evento.fecha_inicio + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    {evento.hora_inicio && <span className="text-xs text-gray-400">• {evento.hora_inicio.slice(0, 5)}</span>}
                  </div>
                  {evento.lugar && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primario-600 dark:text-primario-400" />
                      <span>{evento.lugar}</span>
                    </div>
                  )}
                  {conCosto && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-acento-600 dark:text-acento-400" />
                      <span className="font-medium">S/ {Number(evento.costo).toFixed(2)}</span>
                    </div>
                  )}
                  {evento.cupo_maximo && (
                    <div className="flex items-center gap-2">
                      <UsersIcon className="w-4 h-4 text-gray-400" />
                      <span>Cupo: {evento.cupo_maximo}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                  {conCosto && puedeVerPagos && (
                    <button onClick={() => verPagos(evento)} className="btn-secundario text-xs flex-1">
                      <Receipt className="w-3.5 h-3.5" /> Ver pagos
                    </button>
                  )}
                  {puedeEditar && (
                    <button onClick={() => abrirEditar(evento)} className="btn-secundario text-xs flex-1">
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </button>
                  )}
                  {puedeEliminar && (
                    <button onClick={() => borrar(evento)} className="btn-peligro text-xs">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="flex justify-center gap-2">
          <button disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)} className="btn-secundario text-sm">Anterior</button>
          <span className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            Página {pagina} de {totalPaginas}
          </span>
          <button disabled={pagina >= totalPaginas} onClick={() => setPagina(pagina + 1)} className="btn-secundario text-sm">Siguiente</button>
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                {editando ? 'Editar evento' : 'Nuevo evento'}
              </h3>
              <button onClick={() => setModalAbierto(false)} className="btn-icono"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={guardar} className="p-6 space-y-4">
              <div>
                <label className="etiqueta dark:text-gray-300">Título</label>
                <input required className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
              </div>
              <div>
                <label className="etiqueta dark:text-gray-300">Descripción</label>
                <textarea rows={3} className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="etiqueta dark:text-gray-300">Tipo</label>
                  <select required className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as Evento['tipo'] })}>
                    {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="etiqueta dark:text-gray-300">Estado</label>
                  <select className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value as Evento['estado'] })}>
                    {ESTADOS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="etiqueta dark:text-gray-300">Fecha inicio</label>
                  <input type="date" required className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} />
                </div>
                <div>
                  <label className="etiqueta dark:text-gray-300">Hora inicio</label>
                  <input type="time" className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={form.hora_inicio} onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="etiqueta dark:text-gray-300">Fecha fin</label>
                  <input type="date" className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} />
                </div>
                <div>
                  <label className="etiqueta dark:text-gray-300">Hora fin</label>
                  <input type="time" className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={form.hora_fin} onChange={(e) => setForm({ ...form, hora_fin: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="etiqueta dark:text-gray-300">Lugar</label>
                <input className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" placeholder="Ej: Auditorio principal" value={form.lugar} onChange={(e) => setForm({ ...form, lugar: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="etiqueta dark:text-gray-300">Costo (S/)</label>
                  <input type="number" step="0.01" min="0" className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" placeholder="0.00" value={form.costo} onChange={(e) => setForm({ ...form, costo: e.target.value })} />
                </div>
                <div>
                  <label className="etiqueta dark:text-gray-300">Cupo máximo</label>
                  <input type="number" min="1" className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" placeholder="Sin límite" value={form.cupo_maximo} onChange={(e) => setForm({ ...form, cupo_maximo: e.target.value })} />
                </div>
              </div>
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

      {modalPagos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Pagos del evento</h3>
                {pagosData && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{pagosData.evento.titulo}</p>
                )}
              </div>
              <button onClick={() => setModalPagos(false)} className="btn-icono"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              {cargandoPagos ? (
                <p className="text-center text-gray-400 py-8">Cargando pagos...</p>
              ) : pagosData ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-900/50 p-3 text-center">
                      <p className="text-xs text-gray-500">Alumnos</p>
                      <p className="text-xl font-bold text-gray-800 dark:text-white">{pagosData.resumen.total_alumnos}</p>
                    </div>
                    <div className="rounded-xl bg-green-50 dark:bg-green-900/20 p-3 text-center">
                      <p className="text-xs text-green-600">Pagados</p>
                      <p className="text-xl font-bold text-green-700 dark:text-green-400">{pagosData.resumen.pagados}</p>
                    </div>
                    <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 p-3 text-center">
                      <p className="text-xs text-amber-600">Pendientes</p>
                      <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{pagosData.resumen.pendientes}</p>
                    </div>
                    <div className="rounded-xl bg-primario-50 dark:bg-primario-900/20 p-3 text-center">
                      <p className="text-xs text-primario-600">Recaudado</p>
                      <p className="text-xl font-bold text-primario-700 dark:text-primario-400">S/ {Number(pagosData.resumen.monto_recaudado).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {pagosData.alumnos.map((item) => (
                      <div key={item.alumno.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/40">
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {item.alumno.apellidos}, {item.alumno.nombres}
                          </p>
                          <p className="text-xs text-gray-500">DNI: {item.alumno.dni}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          item.estado === 'pagado'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                        }`}>
                          {item.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
