import React, { useEffect, useRef, useState } from 'react';
import {
  Plus, X, DollarSign, Receipt, Search, ImagePlus, Eye, Trash2, Tags,
} from 'lucide-react';
import {
  listarPagos,
  crearPago,
  eliminarPago,
  listarConceptos,
  crearConcepto,
  eliminarConcepto,
  subirEvidenciaPago,
  eliminarEvidenciaPago,
} from '../../api/pagos';
import { listarAlumnos } from '../../api/alumnos';
import type { Pago, ConceptoPago, Alumno } from '../../tipos';
import { usePermiso } from '../../hooks/usePermiso';

const METODOS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'deposito', label: 'Depósito' },
];

const vacioForm = {
  alumno_id: '',
  concepto_pago_id: '',
  monto: '',
  fecha_pago: new Date().toISOString().slice(0, 10),
  metodo_pago: 'efectivo',
  referencia_pago: '',
  observacion: '',
};

const vacioConcepto = {
  nombre: '',
  descripcion: '',
  monto_base: '',
  año_escolar: String(new Date().getFullYear()),
};

export const ListaPagos = () => {
  const puedeCrear = usePermiso('crear-pagos');
  const puedeEditar = usePermiso(['editar-pagos', 'crear-pagos']);
  const puedeEliminar = usePermiso('eliminar-pagos');

  const [pagos, setPagos] = useState<Pago[]>([]);
  const [conceptos, setConceptos] = useState<ConceptoPago[]>([]);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalConceptos, setModalConceptos] = useState(false);
  const [form, setForm] = useState(vacioForm);
  const [formConcepto, setFormConcepto] = useState(vacioConcepto);
  const [archivoEvidencia, setArchivoEvidencia] = useState<File | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardandoConcepto, setGuardandoConcepto] = useState(false);
  const [buscarAlumno, setBuscarAlumno] = useState('');
  const [subiendoEvidencia, setSubiendoEvidencia] = useState<number | null>(null);
  const [evidenciaVista, setEvidenciaVista] = useState<{ url: string; titulo: string } | null>(null);
  const [pagoEvidenciaId, setPagoEvidenciaId] = useState<number | null>(null);
  const inputEvidenciaRef = useRef<HTMLInputElement>(null);

  const cargarConceptos = async () => {
    try {
      const r = await listarConceptos({ all: true });
      setConceptos(Array.isArray(r) ? r : r.data);
    } catch {
      setConceptos([]);
    }
  };

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await listarPagos({ estado: filtroEstado || undefined, page: pagina });
      setPagos(data.data);
      setTotalPaginas(data.last_page);
    } catch {
      setError('No se pudieron cargar los pagos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [pagina, filtroEstado]);
  useEffect(() => { cargarConceptos(); }, []);

  const buscarAlumnos = async () => {
    if (!buscarAlumno.trim()) return;
    try {
      const data = await listarAlumnos({ buscar: buscarAlumno, page: 1 });
      setAlumnos(data.data);
    } catch { /* ignore */ }
  };

  const abrirCrear = () => {
    setForm(vacioForm);
    setArchivoEvidencia(null);
    setAlumnos([]);
    setBuscarAlumno('');
    setModalAbierto(true);
  };

  const seleccionarConcepto = (id: string) => {
    const concepto = conceptos.find((c) => c.id === Number(id));
    setForm({
      ...form,
      concepto_pago_id: id,
      monto: concepto ? String(concepto.monto_base) : form.monto,
    });
  };

  const guardarConcepto = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoConcepto(true);
    setError('');
    try {
      await crearConcepto({
        nombre: formConcepto.nombre,
        descripcion: formConcepto.descripcion || null,
        monto_base: Number(formConcepto.monto_base),
        año_escolar: formConcepto.año_escolar || null,
        estado: true,
      });
      setFormConcepto(vacioConcepto);
      await cargarConceptos();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string; message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      setError(data?.errors ? Object.values(data.errors)[0][0] : data?.mensaje || data?.message || 'Error al crear concepto.');
    } finally {
      setGuardandoConcepto(false);
    }
  };

  const borrarConcepto = async (concepto: ConceptoPago) => {
    if (!confirm(`¿Eliminar el concepto "${concepto.nombre}"?`)) return;
    try {
      await eliminarConcepto(concepto.id);
      await cargarConceptos();
    } catch {
      setError('No se pudo eliminar el concepto. Puede estar usado en pagos.');
    }
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.concepto_pago_id) {
      setError('Debes seleccionar o crear un concepto de pago.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      const pago = await crearPago({
        alumno_id: Number(form.alumno_id),
        concepto_pago_id: Number(form.concepto_pago_id),
        monto: Number(form.monto),
        fecha_pago: form.fecha_pago,
        metodo_pago: form.metodo_pago,
        referencia_pago: form.referencia_pago || null,
        observacion: form.observacion || null,
      });

      if (archivoEvidencia) {
        await subirEvidenciaPago(pago.id, archivoEvidencia);
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

  const borrar = async (pago: Pago) => {
    if (!confirm('¿Eliminar este pago?')) return;
    try { await eliminarPago(pago.id); await cargar(); } catch { setError('No se pudo eliminar.'); }
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
      setError('El archivo no debe superar 5 MB.');
      return;
    }

    setSubiendoEvidencia(pagoId);
    setError('');
    try {
      const actualizado = await subirEvidenciaPago(pagoId, archivo);
      setPagos((prev) => prev.map((p) => (p.id === pagoId ? { ...p, ...actualizado } : p)));
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string; message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      setError(data?.errors?.evidencia?.[0] || data?.mensaje || data?.message || 'No se pudo subir la evidencia.');
    } finally {
      setSubiendoEvidencia(null);
      setPagoEvidenciaId(null);
    }
  };

  const handleQuitarEvidencia = async (pagoId: number) => {
    if (!confirm('¿Eliminar la captura/foto de este pago?')) return;
    try {
      const actualizado = await eliminarEvidenciaPago(pagoId);
      setPagos((prev) => prev.map((p) => (p.id === pagoId ? { ...p, ...actualizado } : p)));
    } catch {
      setError('No se pudo eliminar la evidencia.');
    }
  };

  const esImagen = (url?: string | null) => !!url && /\.(jpe?g|png|webp)(\?|$)/i.test(url);

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Pagos</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Registro de pagos, conceptos y evidencias (capturas/fotos)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {puedeCrear && (
            <button onClick={() => { setModalConceptos(true); setError(''); }} className="btn-secundario">
              <Tags className="w-4 h-4" /> Conceptos
            </button>
          )}
          {puedeCrear && (
            <button onClick={abrirCrear} className="btn-primario">
              <Plus className="w-4 h-4" /> Registrar pago
            </button>
          )}
        </div>
      </div>

      <div className="tarjeta p-4 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex gap-3">
          <select
            className="campo w-48 dark:bg-gray-900 dark:border-gray-600 dark:text-white"
            value={filtroEstado}
            onChange={(e) => { setFiltroEstado(e.target.value); setPagina(1); }}
          >
            <option value="">Todos los estados</option>
            <option value="pagado">Pagado</option>
            <option value="pendiente">Pendiente</option>
            <option value="anulado">Anulado</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      <input
        ref={inputEvidenciaRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        capture="environment"
        className="hidden"
        onChange={handleArchivoEvidencia}
      />

      {cargando ? (
        <div className="tarjeta p-12 text-center text-gray-400 dark:bg-gray-800">Cargando pagos...</div>
      ) : pagos.length === 0 ? (
        <div className="tarjeta p-12 text-center dark:bg-gray-800">
          <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">No hay pagos registrados</p>
          {conceptos.length === 0 && puedeCrear && (
            <p className="text-sm text-amber-600 mt-2">
              Primero crea un concepto (botón Conceptos) y luego registra el pago.
            </p>
          )}
        </div>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Alumno</th>
                <th>Concepto</th>
                <th>Monto</th>
                <th>Fecha</th>
                <th>Método</th>
                <th>Estado</th>
                <th>Comprobante</th>
                <th>Evidencia</th>
                {puedeEliminar && <th className="w-16"></th>}
              </tr>
            </thead>
            <tbody>
              {pagos.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium">
                    {p.alumno ? `${p.alumno.apellidos}, ${p.alumno.nombres}` : '—'}
                    <br /><span className="text-xs text-gray-400">{p.alumno?.dni}</span>
                  </td>
                  <td>{p.concepto_pago?.nombre ?? '—'}</td>
                  <td className="font-semibold text-primario-700 dark:text-primario-400">S/ {Number(p.monto).toFixed(2)}</td>
                  <td>{new Date(p.fecha_pago + 'T00:00:00').toLocaleDateString('es-PE')}</td>
                  <td className="capitalize">{p.metodo_pago}</td>
                  <td>
                    <span className={`insignia ${p.estado === 'pagado' ? 'insignia-exito' : p.estado === 'pendiente' ? 'insignia-alerta' : 'insignia-peligro'}`}>
                      {p.estado}
                    </span>
                  </td>
                  <td>
                    {p.comprobante ? (
                      <span className="flex items-center gap-1 text-xs text-primario-600 dark:text-primario-400">
                        <Receipt className="w-3.5 h-3.5" />{p.comprobante.numero_comprobante}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    <div className="inline-flex items-center gap-1">
                      {p.evidencia_url ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setEvidenciaVista({
                              url: p.evidencia_url!,
                              titulo: p.concepto_pago?.nombre || `Pago #${p.id}`,
                            })}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-primario-700 bg-primario-50 dark:bg-primario-900/30"
                          >
                            <Eye className="w-3.5 h-3.5" /> Ver
                          </button>
                          {puedeEditar && (
                            <>
                              <button type="button" onClick={() => pedirEvidencia(p.id)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100" title="Cambiar foto/captura">
                                <ImagePlus className="w-3.5 h-3.5" />
                              </button>
                              <button type="button" onClick={() => handleQuitarEvidencia(p.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50" title="Quitar">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </>
                      ) : puedeEditar ? (
                        <button
                          type="button"
                          onClick={() => pedirEvidencia(p.id)}
                          disabled={subiendoEvidencia === p.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-primario-600 hover:bg-primario-700 text-white disabled:opacity-60"
                        >
                          <ImagePlus className="w-3.5 h-3.5" />
                          {subiendoEvidencia === p.id ? 'Subiendo...' : 'Agregar foto'}
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">Sin evidencia</span>
                      )}
                    </div>
                  </td>
                  {puedeEliminar && (
                    <td>
                      <button onClick={() => borrar(p)} className="text-red-500 hover:text-red-700 text-xs">Eliminar</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="flex justify-center gap-2">
          <button disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)} className="btn-secundario text-sm">Anterior</button>
          <span className="flex items-center text-sm text-gray-500 dark:text-gray-400">Página {pagina} de {totalPaginas}</span>
          <button disabled={pagina >= totalPaginas} onClick={() => setPagina(pagina + 1)} className="btn-secundario text-sm">Siguiente</button>
        </div>
      )}

      {/* Modal conceptos */}
      {modalConceptos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Conceptos de pago</h3>
              <button onClick={() => setModalConceptos(false)} className="btn-icono"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <form onSubmit={guardarConcepto} className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Nuevo concepto</p>
                <input
                  required
                  className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                  placeholder="Ej: Pensión Mayo, Matrícula..."
                  value={formConcepto.nombre}
                  onChange={(e) => setFormConcepto({ ...formConcepto, nombre: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                    placeholder="Monto S/"
                    value={formConcepto.monto_base}
                    onChange={(e) => setFormConcepto({ ...formConcepto, monto_base: e.target.value })}
                  />
                  <input
                    className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                    placeholder="Año escolar"
                    value={formConcepto.año_escolar}
                    onChange={(e) => setFormConcepto({ ...formConcepto, año_escolar: e.target.value })}
                  />
                </div>
                <input
                  className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                  placeholder="Descripción (opcional)"
                  value={formConcepto.descripcion}
                  onChange={(e) => setFormConcepto({ ...formConcepto, descripcion: e.target.value })}
                />
                <button type="submit" disabled={guardandoConcepto} className="btn-primario w-full">
                  {guardandoConcepto ? 'Guardando...' : 'Agregar concepto'}
                </button>
              </form>

              <div className="space-y-2">
                {conceptos.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Aún no hay conceptos. Crea el primero arriba.</p>
                ) : conceptos.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white text-sm">{c.nombre}</p>
                      <p className="text-xs text-gray-500">S/ {Number(c.monto_base).toFixed(2)}{c.año_escolar ? ` · ${c.año_escolar}` : ''}</p>
                    </div>
                    {puedeEliminar && (
                      <button type="button" onClick={() => borrarConcepto(c)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal registrar pago */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Registrar Pago</h3>
              <button onClick={() => setModalAbierto(false)} className="btn-icono"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={guardar} className="p-6 space-y-4">
              <div>
                <label className="etiqueta dark:text-gray-300">Buscar alumno</label>
                <div className="flex gap-2">
                  <input className="campo flex-1 dark:bg-gray-900 dark:border-gray-600 dark:text-white" placeholder="DNI o nombre..." value={buscarAlumno} onChange={(e) => setBuscarAlumno(e.target.value)} />
                  <button type="button" onClick={buscarAlumnos} className="btn-secundario"><Search className="w-4 h-4" /></button>
                </div>
                {alumnos.length > 0 && (
                  <select required className="campo mt-2 dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={form.alumno_id} onChange={(e) => setForm({ ...form, alumno_id: e.target.value })}>
                    <option value="">Seleccionar alumno</option>
                    {alumnos.map((a) => <option key={a.id} value={a.id}>{a.apellidos}, {a.nombres} — {a.dni}</option>)}
                  </select>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <label className="etiqueta dark:text-gray-300">Concepto</label>
                  <button
                    type="button"
                    onClick={() => setModalConceptos(true)}
                    className="text-xs font-medium text-primario-600 hover:text-primario-700"
                  >
                    + Crear concepto
                  </button>
                </div>
                <select
                  required
                  className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                  value={form.concepto_pago_id}
                  onChange={(e) => seleccionarConcepto(e.target.value)}
                >
                  <option value="">
                    {conceptos.length === 0 ? 'No hay conceptos — créalos primero' : 'Seleccionar concepto'}
                  </option>
                  {conceptos.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre} — S/ {Number(c.monto_base).toFixed(2)}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="etiqueta dark:text-gray-300">Monto (S/)</label>
                  <input type="number" step="0.01" min="0.01" required className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} />
                </div>
                <div>
                  <label className="etiqueta dark:text-gray-300">Fecha</label>
                  <input type="date" required className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={form.fecha_pago} onChange={(e) => setForm({ ...form, fecha_pago: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="etiqueta dark:text-gray-300">Método de pago</label>
                <select required className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={form.metodo_pago} onChange={(e) => setForm({ ...form, metodo_pago: e.target.value })}>
                  {METODOS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>

              <div>
                <label className="etiqueta dark:text-gray-300">Referencia</label>
                <input className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" placeholder="Nro. operación, voucher..." value={form.referencia_pago} onChange={(e) => setForm({ ...form, referencia_pago: e.target.value })} />
              </div>

              <div>
                <label className="etiqueta dark:text-gray-300">Captura / foto del voucher</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  capture="environment"
                  className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-primario-50 file:text-primario-700"
                  onChange={(e) => setArchivoEvidencia(e.target.files?.[0] ?? null)}
                />
                {archivoEvidencia && (
                  <p className="text-xs text-gray-500 mt-1">Archivo: {archivoEvidencia.name}</p>
                )}
                <p className="text-[11px] text-gray-400 mt-1">JPG, PNG, WEBP o PDF · máx. 5 MB</p>
              </div>

              <div>
                <label className="etiqueta dark:text-gray-300">Observación</label>
                <textarea rows={2} className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white" value={form.observacion} onChange={(e) => setForm({ ...form, observacion: e.target.value })} />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalAbierto(false)} className="btn-secundario">Cancelar</button>
                <button type="submit" disabled={guardando || conceptos.length === 0} className="btn-primario">
                  {guardando ? 'Guardando...' : 'Registrar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal ver evidencia */}
      {evidenciaVista && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setEvidenciaVista(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-800 dark:text-white text-sm truncate pr-4">
                Evidencia — {evidenciaVista.titulo}
              </h3>
              <button onClick={() => setEvidenciaVista(null)} className="btn-icono"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 max-h-[75vh] overflow-auto flex items-center justify-center bg-gray-50 dark:bg-gray-900/40">
              {esImagen(evidenciaVista.url) ? (
                <img src={evidenciaVista.url} alt="Evidencia de pago" className="max-w-full max-h-[70vh] object-contain rounded-lg shadow" />
              ) : (
                <a href={evidenciaVista.url} target="_blank" rel="noreferrer" className="btn-primario">Abrir archivo</a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
