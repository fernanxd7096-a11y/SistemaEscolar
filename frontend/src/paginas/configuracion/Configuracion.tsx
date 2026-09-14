import React, { useEffect, useState, useRef } from 'react';
import { 
  Save, Check, Settings, School, Calendar, Palette, 
  Upload, Image as ImageIcon, Loader2, ShieldAlert, AlertCircle 
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexto/AuthContexto';
import { useTema } from '../../tienda/tema';
import { 
  obtenerConfiguracion, 
  actualizarConfiguracion, 
  subirLogoInstitucional 
} from '../../api/configuracion';
import type { ConfiguracionInstitucional } from '../../tipos';
import logoFallback from '../../assets/logo.png';

export const Configuracion = () => {
  const { usuario } = useAuth();
  const { tema, cambiarTema } = useTema();
  const inputLogoRef = useRef<HTMLInputElement>(null);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [exito, setExito] = useState('');
  const [error, setError] = useState('');

  const [archivoLogo, setArchivoLogo] = useState<File | null>(null);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);

  const [config, setConfig] = useState<ConfiguracionInstitucional>({
    nombre_colegio: 'Colegio Milagroso San Judas Tadeo',
    director: 'Fernando Martínez',
    direccion: 'Coop. Sagrada Familia Mz. K lote 11 - S.J.L.',
    telefono: '962359860',
    email: 'secretaria@sanjudastadeo.edu.pe',
    anio_escolar: '2026',
    lema: 'Educando con valores para la vida',
    resolucion_directoral: 'UGEL 05 S.J.L. - R.D. 05069 - R.D. 003839',
    logo_url: null,
  });

  // Verificación de permisos: solo administrador o director
  const esAutorizado = 
    usuario?.roles?.some((r) => ['administrador', 'director'].includes(r.name)) ||
    usuario?.permisos?.includes('ver-configuracion') ||
    usuario?.permisos?.includes('editar-configuracion');

  useEffect(() => {
    if (!esAutorizado) {
      setCargando(false);
      return;
    }

    const cargar = async () => {
      try {
        setCargando(true);
        const datos = await obtenerConfiguracion();
        if (datos) {
          setConfig(datos);
          if (datos.logo_url) {
            setPreviewLogo(datos.logo_url);
          }
        }
      } catch (err: any) {
        console.error('Error al cargar configuración:', err);
        setError('No se pudo cargar la configuración institucional.');
      } finally {
        setCargando(false);
      }
    };

    cargar();
  }, [esAutorizado]);

  const handleSeleccionarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor seleccione un archivo de imagen válido (PNG, JPG, WEBP).');
        return;
      }
      setArchivoLogo(file);
      const urlTemp = URL.createObjectURL(file);
      setPreviewLogo(urlTemp);
    }
  };

  const handleSubirLogo = async () => {
    if (!archivoLogo) return;
    setSubiendoLogo(true);
    try {
      const resp = await subirLogoInstitucional(archivoLogo);
      if (resp.logo_url || resp.logo_base64) {
        setPreviewLogo(resp.logo_url || resp.logo_base64);
        setConfig((prev) => ({ ...prev, logo_url: resp.logo_url || resp.logo_base64 }));
      }
      setArchivoLogo(null);
      toast.success('Logo institucional actualizado correctamente.');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Error al subir el logo institucional.');
    } finally {
      setSubiendoLogo(false);
    }
  };

  const handleGuardarConfiguracion = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError('');
    setExito('');
    try {
      const resp = await actualizarConfiguracion(config);
      setConfig(resp);
      toast.success('Configuración institucional guardada en la base de datos.');
      setExito('Configuración guardada correctamente.');
      setTimeout(() => setExito(''), 3000);
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || 'Error al guardar la configuración institucional.';
      setError(msg);
      toast.error(msg);
    } finally {
      setGuardando(false);
    }
  };

  if (!esAutorizado) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4 fade-in">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Acceso Restringido</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Esta pantalla de configuración institucional está reservada exclusivamente para la Dirección y Administración del colegio.
        </p>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin text-primario-600" />
        <p className="text-sm">Cargando configuración institucional...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleGuardarConfiguracion} className="space-y-6 fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Configuración Institucional</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Ajustes globales del colegio, año escolar activo, membretes de boletas y reportes oficiales.
          </p>
        </div>
        <button
          type="submit"
          disabled={guardando}
          className="btn-primario self-start sm:self-auto"
        >
          {guardando ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      {exito && (
        <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> {exito}
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* 1. Identidad y Logo */}
      <div className="tarjeta p-6 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <School className="w-5 h-5 text-primario-600" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Identidad Institucional</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Logo institucional */}
          <div className="flex flex-col items-center justify-center p-5 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-center">
            <div className="w-24 h-24 rounded-xl bg-white dark:bg-gray-800 p-2 shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden mb-3">
              <img
                src={previewLogo || logoFallback}
                alt="Logo Institucional"
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = logoFallback;
                }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Logo Institucional
            </span>
            <p className="text-[11px] text-gray-500 mb-3">
              Visible en el sistema, boletas y reportes PDF (PNG, JPG, SVG máx 4MB).
            </p>

            <input
              type="file"
              ref={inputLogoRef}
              accept="image/*"
              className="hidden"
              onChange={handleSeleccionarArchivo}
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => inputLogoRef.current?.click()}
                className="btn-secundario text-xs py-1.5 px-3"
              >
                <ImageIcon className="w-3.5 h-3.5" /> Elegir imagen
              </button>

              {archivoLogo && (
                <button
                  type="button"
                  onClick={handleSubirLogo}
                  disabled={subiendoLogo}
                  className="btn-primario text-xs py-1.5 px-3"
                >
                  {subiendoLogo ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  {subiendoLogo ? 'Subiendo...' : 'Guardar logo'}
                </button>
              )}
            </div>
          </div>

          {/* Datos de nombre y lema */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="etiqueta dark:text-gray-300">Nombre oficial de la institución</label>
              <input
                className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                value={config.nombre_colegio}
                onChange={(e) => setConfig({ ...config, nombre_colegio: e.target.value })}
                placeholder="Ej. Colegio Milagroso San Judas Tadeo"
                required
              />
            </div>

            <div>
              <label className="etiqueta dark:text-gray-300">Lema escolar</label>
              <input
                className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                value={config.lema}
                onChange={(e) => setConfig({ ...config, lema: e.target.value })}
                placeholder="Ej. Educando con valores para la vida"
              />
            </div>

            <div>
              <label className="etiqueta dark:text-gray-300">UGEL / DRE / Resoluciones Directorales</label>
              <input
                className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                value={config.resolucion_directoral}
                onChange={(e) => setConfig({ ...config, resolucion_directoral: e.target.value })}
                placeholder="Ej. UGEL 05 S.J.L. - R.D. 05069 - R.D. 003839"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Se imprime en el encabezado oficial de todas las boletas de notas emitidas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Dirección, Contacto y Autoridades */}
      <div className="tarjeta p-6 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-primario-600" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Dirección y Contacto Institucional</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="etiqueta dark:text-gray-300">Director(a) General</label>
            <input
              className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
              value={config.director}
              onChange={(e) => setConfig({ ...config, director: e.target.value })}
              placeholder="Nombre del director(a)"
              required
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Nombre impreso en el pie de firma de las boletas oficiales.
            </p>
          </div>

          <div>
            <label className="etiqueta dark:text-gray-300">Dirección de la sede</label>
            <input
              className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
              value={config.direccion}
              onChange={(e) => setConfig({ ...config, direccion: e.target.value })}
              placeholder="Dirección completa"
            />
          </div>

          <div>
            <label className="etiqueta dark:text-gray-300">Teléfono / Celular de contacto</label>
            <input
              className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
              value={config.telefono}
              onChange={(e) => setConfig({ ...config, telefono: e.target.value })}
              placeholder="Ej. 962359860"
            />
          </div>

          <div>
            <label className="etiqueta dark:text-gray-300">Correo electrónico de secretaría</label>
            <input
              type="email"
              className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
              value={config.email}
              onChange={(e) => setConfig({ ...config, email: e.target.value })}
              placeholder="secretaria@sanjudastadeo.edu.pe"
            />
          </div>
        </div>
      </div>

      {/* 3. Año Escolar Activo */}
      <div className="tarjeta p-6 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primario-600" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Año Escolar Activo</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="etiqueta dark:text-gray-300">Año lectivo vigente</label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={4}
                className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white font-bold text-base"
                value={config.anio_escolar}
                onChange={(e) => setConfig({ ...config, anio_escolar: e.target.value.replace(/\D/g, '') })}
                placeholder="2026"
                required
              />
              <div className="flex gap-1">
                {[
                  String(new Date().getFullYear()), 
                  String(new Date().getFullYear() + 1)
                ].map((anio) => (
                  <button
                    key={anio}
                    type="button"
                    onClick={() => setConfig({ ...config, anio_escolar: anio })}
                    className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors ${
                      config.anio_escolar === anio
                        ? 'bg-primario-600 text-white border-primario-600'
                        : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {anio}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Rige por defecto las boletas de notas, reportes, matrículas y cálculos del dashboard.
            </p>
          </div>

          <div>
            <label className="etiqueta dark:text-gray-300">Escala de calificación</label>
            <div className="campo bg-gray-50 dark:bg-gray-900 dark:border-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed">
              Vigesimal (0 - 20)
            </div>
          </div>

          <div>
            <label className="etiqueta dark:text-gray-300">Estructura bimestral</label>
            <div className="campo bg-gray-50 dark:bg-gray-900 dark:border-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed">
              4 Bimestres Oficiales
            </div>
          </div>
        </div>
      </div>

      {/* 4. Apariencia */}
      <div className="tarjeta p-6 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-primario-600" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Apariencia de la Interfaz</h3>
        </div>
        <div>
          <label className="etiqueta dark:text-gray-300 mb-3">Tema visual</label>
          <div className="flex flex-col sm:flex-row gap-3">
            {[
              { value: 'claro', label: '☀️ Claro', desc: 'Fondo claro institucional' },
              { value: 'oscuro', label: '🌙 Oscuro', desc: 'Contraste para baja luminosidad' },
              { value: 'sistema', label: '💻 Sistema', desc: 'Sigue la preferencia del sistema' },
            ].map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => cambiarTema(t.value as 'claro' | 'oscuro' | 'sistema')}
                className={`flex-1 p-4 rounded-xl border-2 transition-all text-center ${
                  tema === t.value
                    ? 'border-primario-500 bg-primario-50 dark:bg-primario-900/20 shadow-sm'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="text-2xl mb-1">{t.label.split(' ')[0]}</div>
                <div className="text-sm font-medium text-gray-800 dark:text-white">{t.label.split(' ').slice(1).join(' ')}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={guardando}
          className="btn-primario px-6 py-2.5"
        >
          {guardando ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {guardando ? 'Guardando en base de datos...' : 'Guardar Configuración'}
        </button>
      </div>
    </form>
  );
};
