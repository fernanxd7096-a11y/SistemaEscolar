import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, X, Smartphone, Banknote, CreditCard, Wallet } from 'lucide-react';
import { crearPago, eliminarPago, listarPagos } from '../../api/pagos';
import { listarAlumnos } from '../../api/alumnos';
import type { Pago, Alumno } from '../../tipos';
import { usePermiso } from '../../hooks/usePermiso';

const METODOS = [
  { value: 'yape', label: 'Yape', icon: <Smartphone className="w-4 h-4" />, color: 'insignia-peligro', campoReferencia: 'N° de operación Yape' },
  { value: 'efectivo', label: 'Efectivo', icon: <Banknote className="w-4 h-4" />, color: 'insignia-exito', campoReferencia: null },
  { value: 'tarjeta', label: 'Tarjeta', icon: <CreditCard className="w-4 h-4" />, color: 'insignia-info', campoReferencia: 'Últimos 4 dígitos de la tarjeta' },
];

const vacio = {
  alumno_id: 0,
  monto: '',
  concepto: 'Pensión',
  fecha: new Date().toISOString().slice(0, 10),
  metodo_pago: 'efectivo',
  referencia: '',
  observacion: '',
};

export const ListaPagos = () => {
  const puedeCrear = usePermiso('crear-pagos');
  const puedeEliminar = usePermiso('eliminar-pagos');

  const [pagos, setPagos] = useState<Pago[]>([]);
  const [filtroMetodo, setFiltroMetodo] = useState('');
  const [buscar, setBuscar] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(vacio);
  const [guardando, setGuardando] = useState(false);

  // Búsqueda de alumno para el formulario
  const [buscarAlumno, setBuscarAlumno] = useState('');
  const [resultadosAlumnos, setResultadosAlumnos] = useState<Alumno[]>([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<Alumno | null>(null);

  const cargar = async () => {
    setCargando(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (buscar) params.buscar = buscar;
      if (filtroMetodo) params.metodo_pago = filtroMetodo;
      const data = await listarPagos(params);
      setPagos(data.data);
    } catch {
      setError('No se pudieron cargar los pagos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);
  useEffect(() => { cargar(); }, [filtroMetodo]);

  useEffect(() => {
    if (buscarAlumno.trim().length < 2) { setResultadosAlumnos([]); return; }
    const t = setTimeout(() => {
      listarAlumnos({ buscar: buscarAlumno }).then((d) => setResultadosAlumnos(d.data)).catch(() => setResultadosAlumnos([]));
    }, 300);
    return () => clearTimeout(t);
  }, [buscarAlumno]);

  const abrirCrear = () => {
    setForm(vacio);
    setAlumnoSeleccionado(null);
    setBuscarAlumno('');
    setResultadosAlumnos([]);
    setModalAbierto(true);
  };

  const guardar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!alumnoSeleccionado) {
      setError('Selecciona un alumno.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await crearPago({
        alumno_id: alumnoSeleccionado.id,
        monto: Number(form.monto),
        concepto: form.concepto,
        fecha: form.fecha,
        metodo_pago: form.metodo_pago,
        referencia: form.referencia || null,
        observacion: form.observacion || null,
      });
      setModalAbierto(false);
      await cargar();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string; message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      setError(data?.errors ? Object.values(data.errors)[0][0] : data?.mensaje || data?.message || 'Error al guardar.');
    } finally {
      setGuardando(false);
    }
  };

  const borrar = async (p: Pago) => {
    if (!confirm('¿Eliminar este registro de pago?')) return;
    try {
      await eliminarPago(p.id);
      await cargar();
    } catch {
      setError('No se pudo eliminar.');
    }
  };

  const metodoInfo = (m: string) => METODOS.find((x) => x.value === m) ?? METODOS[1];
  const formatMonto = (m: number) => `S/ ${Number(m).toFixed(2)}`;
  const formatFecha = (f: string) => new Date(f.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
  const metodoDelForm = METODOS.find((m) => m.value === form.metodo_pago)!;

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Pagos</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Registro de pensiones y otros cobros</p>
        </div>
        {puedeCrear && (
          <button onClick={abrirCrear} className="btn-primario">
            <Plus className="w-4 h-4" /> Registrar pago
          </button>
        )}
      </div>

      <div className="tarjeta p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="campo pl-9"
              placeholder="Buscar alumno por nombre o DNI..."
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && cargar()}
            />
          </div>
          <select className="campo w-auto min-w-[160px]" value={filtroMetodo} onChange={(e) => setFiltroMetodo(e.target.value)}>
            <option value="">Todos los métodos</option>
            {METODOS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>}

      <div className="tabla-contenedor">
        <table className="tabla">
          <thead>
            <tr>
              <th>Alumno</th>
              <th>Concepto</th>
              <th>Monto</th>
              <th>Método</th>
              <th>Referencia</th>
              <th>Fecha</th>
              {puedeEliminar && <th></th>}
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan={7}><div className="h-8 skeleton my-1" /></td></tr>
              ))
            ) : pagos.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  <Wallet className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No hay pagos registrados.
                </td>
              </tr>
            ) : (
              pagos.map((p) => {
                const mi = metodoInfo(p.metodo_pago);
                return (
                  <tr key={p.id}>
                    <td className="font-medium text-gray-800 dark:text-gray-100">
                      {p.alumno ? `${p.alumno.apellidos}, ${p.alumno.nombres}` : `Alumno #${p.alumno_id}`}
                    </td>
                    <td>{p.concepto}</td>
                    <td className="font-semibold">{formatMonto(p.monto)}</td>
                    <td><span className={mi.color}>{mi.icon} {mi.label}</span></td>
                    <td className="text-gray-500">{p.referencia || '—'}</td>
                    <td className="text-gray-500">{formatFecha(p.fecha)}</td>
                    {puedeEliminar && (
                      <td>
                        <button onClick={() => borrar(p)} className="btn-icono text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Registrar pago</h3>
              <button onClick={() => setModalAbierto(false)} className="btn-icono"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={guardar} className="p-6 space-y-4">
              <div>
                <label className="etiqueta">Alumno</label>
                {alumnoSeleccionado ? (
                  <div className="campo flex items-center justify-between">
                    <span>{alumnoSeleccionado.apellidos}, {alumnoSeleccionado.nombres} — {alumnoSeleccionado.dni}</span>
                    <button type="button" onClick={() => setAlumnoSeleccionado(null)} className="text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      className="campo"
                      placeholder="Buscar por nombre o DNI..."
                      value={buscarAlumno}
                      onChange={(e) => setBuscarAlumno(e.target.value)}
                    />
                    {resultadosAlumnos.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {resultadosAlumnos.map((a) => (
                          <button
                            type="button"
                            key={a.id}
                            onClick={() => { setAlumnoSeleccionado(a); setBuscarAlumno(''); setResultadosAlumnos([]); }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            {a.apellidos}, {a.nombres} — {a.dni}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="etiqueta">Concepto</label>
                  <input required className="campo" value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} />
                </div>
                <div>
                  <label className="etiqueta">Monto (S/)</label>
                  <input required type="number" min="0.01" step="0.01" className="campo" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} />
                </div>
                <div>
                  <label className="etiqueta">Fecha</label>
                  <input type="date" required className="campo" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
                </div>
                <div>
                  <label className="etiqueta">Método de pago</label>
                  <select required className="campo" value={form.metodo_pago} onChange={(e) => setForm({ ...form, metodo_pago: e.target.value, referencia: '' })}>
                    {METODOS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
              </div>

              {metodoDelForm.campoReferencia && (
                <div>
                  <label className="etiqueta">{metodoDelForm.campoReferencia}</label>
                  <input className="campo" value={form.referencia} onChange={(e) => setForm({ ...form, referencia: e.target.value })} />
                </div>
              )}

              <div>
                <label className="etiqueta">Observación (opcional)</label>
                <input className="campo" value={form.observacion} onChange={(e) => setForm({ ...form, observacion: e.target.value })} />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalAbierto(false)} className="btn-secundario">Cancelar</button>
                <button type="submit" disabled={guardando} className="btn-primario">{guardando ? 'Guardando...' : 'Registrar pago'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
