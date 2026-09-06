import { useEffect, useState } from 'react';
import { Save, Check, Settings, School, Calendar, Palette } from 'lucide-react';
import { useTema } from '../../tienda/tema';

export const Configuracion = () => {
  const { modoOscuro, toggleModo } = useTema();
  const [exito, setExito] = useState('');

  // Datos del colegio (localStorage)
  const [colegio, setColegio] = useState({
    nombre: 'Colegio Milagroso San Judas Tadeo',
    director: 'Fernando Martínez',
    direccion: 'Av. Principal 123, Lima, Perú',
    telefono: '(01) 234-5678',
    email: 'secretaria@sanjudastadeo.edu.pe',
    año_escolar: '2026',
    lema: 'Educando con valores para la vida',
  });

  useEffect(() => {
    const guardado = localStorage.getItem('config_colegio');
    if (guardado) {
      try { setColegio(JSON.parse(guardado)); } catch { /* skip */ }
    }
  }, []);

  const guardarColegio = () => {
    localStorage.setItem('config_colegio', JSON.stringify(colegio));
    setExito('Configuración guardada correctamente.');
    setTimeout(() => setExito(''), 3000);
  };

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Configuración</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Ajustes generales del sistema escolar</p>
      </div>

      {exito && (
        <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> {exito}
        </div>
      )}

      {/* Datos del colegio */}
      <div className="tarjeta p-6 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <School className="w-5 h-5 text-primario-600" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Datos del Colegio</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="etiqueta dark:text-gray-300">Nombre de la institución</label>
            <input
              className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
              value={colegio.nombre}
              onChange={(e) => setColegio({ ...colegio, nombre: e.target.value })}
            />
          </div>
          <div>
            <label className="etiqueta dark:text-gray-300">Director(a)</label>
            <input
              className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
              value={colegio.director}
              onChange={(e) => setColegio({ ...colegio, director: e.target.value })}
            />
          </div>
          <div>
            <label className="etiqueta dark:text-gray-300">Dirección</label>
            <input
              className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
              value={colegio.direccion}
              onChange={(e) => setColegio({ ...colegio, direccion: e.target.value })}
            />
          </div>
          <div>
            <label className="etiqueta dark:text-gray-300">Teléfono</label>
            <input
              className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
              value={colegio.telefono}
              onChange={(e) => setColegio({ ...colegio, telefono: e.target.value })}
            />
          </div>
          <div>
            <label className="etiqueta dark:text-gray-300">Correo electrónico</label>
            <input
              type="email"
              className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
              value={colegio.email}
              onChange={(e) => setColegio({ ...colegio, email: e.target.value })}
            />
          </div>
          <div>
            <label className="etiqueta dark:text-gray-300">Lema</label>
            <input
              className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
              value={colegio.lema}
              onChange={(e) => setColegio({ ...colegio, lema: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={guardarColegio} className="btn-primario">
            <Save className="w-4 h-4" /> Guardar datos
          </button>
        </div>
      </div>

      {/* Año escolar */}
      <div className="tarjeta p-6 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primario-600" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Año Escolar</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="etiqueta dark:text-gray-300">Año escolar activo</label>
            <select
              className="campo dark:bg-gray-900 dark:border-gray-600 dark:text-white"
              value={colegio.año_escolar}
              onChange={(e) => setColegio({ ...colegio, año_escolar: e.target.value })}
            >
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>
          <div>
            <label className="etiqueta dark:text-gray-300">Escala de calificación</label>
            <div className="campo bg-gray-50 dark:bg-gray-900 dark:border-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed">
              Vigesimal (0-20)
            </div>
          </div>
          <div>
            <label className="etiqueta dark:text-gray-300">Bimestres</label>
            <div className="campo bg-gray-50 dark:bg-gray-900 dark:border-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed">
              4 bimestres
            </div>
          </div>
        </div>
      </div>

      {/* Apariencia */}
      <div className="tarjeta p-6 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-primario-600" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Apariencia</h3>
        </div>
        <div>
          <label className="etiqueta dark:text-gray-300 mb-3">Tema de la interfaz</label>
          <div className="flex gap-3">
            {[
              { value: false, label: '☀️ Claro', desc: 'Fondo blanco' },
              { value: true, label: '🌙 Oscuro', desc: 'Fondo oscuro' },
            ].map((t) => (
              <button
                key={t.label}
                onClick={() => { if (modoOscuro !== t.value) toggleModo(); }}
                className={`flex-1 p-4 rounded-xl border-2 transition-all text-center ${
                  modoOscuro === t.value
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

      {/* Info del sistema */}
      <div className="tarjeta p-6 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-primario-600" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Información del Sistema</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400 block">Versión</span>
            <span className="font-medium text-gray-800 dark:text-white">1.0.0</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 block">Backend</span>
            <span className="font-medium text-gray-800 dark:text-white">Laravel 12</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 block">Frontend</span>
            <span className="font-medium text-gray-800 dark:text-white">React + Vite</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 block">Base de datos</span>
            <span className="font-medium text-gray-800 dark:text-white">PostgreSQL 16</span>
          </div>
        </div>
      </div>
    </div>
  );
};
