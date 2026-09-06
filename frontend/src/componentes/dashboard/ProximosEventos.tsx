import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, ArrowRight, PartyPopper } from 'lucide-react';
import { listarEventosProximos } from '../../api/eventos';
import type { Evento } from '../../tipos';

const ETIQUETA_TIPO: Record<Evento['tipo'], { label: string; color: string }> = {
  visita_estudio: { label: 'Visita de estudio', color: 'insignia-info' },
  olimpiada: { label: 'Olimpiada', color: 'insignia-alerta' },
  deportivo: { label: 'Deportivo', color: 'insignia-exito' },
  cultural: { label: 'Cultural', color: 'insignia-peligro' },
  otro: { label: 'Actividad', color: 'insignia-gris' },
};

const formatFecha = (fecha: string) => {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const f = new Date(fecha.slice(0, 10) + 'T00:00:00');
  const dias = Math.round((f.getTime() - hoy.getTime()) / 86_400_000);
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Mañana';
  return f.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
};

export const ProximosEventos = () => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    listarEventosProximos(14)
      .then(setEventos)
      .catch(() => setEventos([]))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="tarjeta p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <PartyPopper className="w-5 h-5 text-acento-500" /> Próximos eventos
        </h3>
        <Link to="/eventos" className="text-xs font-medium text-primario-600 dark:text-primario-400 hover:underline flex items-center gap-1">
          Ver todos <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {cargando ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-14 skeleton" />)}
        </div>
      ) : eventos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6 text-gray-400">
          <Calendar className="w-10 h-10 mb-2 opacity-40" />
          <p className="text-sm">No hay eventos programados en los próximos 14 días.</p>
        </div>
      ) : (
        <ul className="space-y-1 -mx-2">
          {eventos.map((e) => {
            const info = ETIQUETA_TIPO[e.tipo] ?? ETIQUETA_TIPO.otro;
            return (
              <li key={e.id} className="flex items-start gap-3 px-2 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                <div className="w-11 shrink-0 text-center bg-primario-50 dark:bg-primario-900/30 rounded-lg py-1.5">
                  <div className="text-[10px] font-semibold text-primario-600 dark:text-primario-400 uppercase leading-none">
                    {formatFecha(e.fecha)}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{e.titulo}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`${info.color} !py-0`}>{info.label}</span>
                    {e.lugar && (
                      <span className="text-xs text-gray-400 flex items-center gap-0.5 truncate">
                        <MapPin className="w-3 h-3 shrink-0" /> {e.lugar}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
