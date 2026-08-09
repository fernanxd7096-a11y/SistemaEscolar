import React, { useEffect, useState } from 'react';
import { Users, GraduationCap, Clock, Activity, ClipboardCheck, FileBarChart } from 'lucide-react';
import { useAuth } from '../../contexto/AuthContexto';
import cliente from '../../api/cliente';
import type { ResumenDashboard } from '../../tipos';

export const Dashboard = () => {
  const { usuario } = useAuth();
  const [resumen, setResumen] = useState<ResumenDashboard | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await cliente.get<ResumenDashboard>('/dashboard/resumen');
        setResumen(data);
      } catch {
        setError('No se pudo cargar el resumen del dashboard.');
        setResumen(null);
      } finally {
        setCargando(false);
      }
    };
    fetchDashboard();
  }, []);

  const stats = [
    {
      label: 'Total Alumnos',
      valor: resumen?.total_alumnos ?? 0,
      icono: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: 'Total Docentes',
      valor: resumen?.total_docentes ?? 0,
      icono: GraduationCap,
      color: 'text-purple-500',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      label: 'Asistencia Hoy',
      valor: resumen?.asistencia_hoy ?? 0,
      icono: Clock,
      color: 'text-green-500',
      bg: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      label: 'Usuarios Activos',
      valor: resumen?.total_usuarios_activos ?? 0,
      icono: Activity,
      color: 'text-acento-500',
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    },
  ];

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Buenos días, {usuario?.nombre || 'Usuario'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {resumen?.fecha_actual || (cargando ? 'Cargando fecha...' : '—')}
            {resumen?.año_escolar_actual != null && ` • Año Escolar ${resumen.año_escolar_actual}`}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="tarjeta tarjeta-hover p-5 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icono className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                {cargando ? (
                  <div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded mt-1 animate-pulse"></div>
                ) : (
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{stat.valor}</h3>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 tarjeta p-6 dark:bg-gray-800 dark:border-gray-700 flex flex-col min-h-[300px]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Resumen de Asistencia</h3>
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
            <div className="text-center text-gray-400">
              <FileBarChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>El gráfico estará disponible cuando exista el módulo de asistencia.</p>
            </div>
          </div>
        </div>

        <div className="tarjeta p-6 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Acciones Rápidas</h3>
          <div className="space-y-3">
            <div className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-left opacity-60">
              <ClipboardCheck className="w-5 h-5 text-primario-500" />
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-200">Tomar Asistencia</p>
                <p className="text-xs text-gray-500">Próximamente</p>
              </div>
            </div>
            <div className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-left opacity-60">
              <FileBarChart className="w-5 h-5 text-acento-500" />
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-200">Ver Reportes</p>
                <p className="text-xs text-gray-500">Próximamente</p>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mt-8 mb-4">Estado del sistema</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Fase 1 activa: autenticación, roles y dashboard. Los módulos académicos se habilitarán en las siguientes fases.
          </p>
        </div>
      </div>
    </div>
  );
};
