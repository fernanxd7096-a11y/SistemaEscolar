import { useEffect, useState } from 'react';
import { Users, GraduationCap, Clock, Activity, ClipboardCheck, FileBarChart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../../contexto/AuthContexto';
import cliente from '../../api/cliente';
import type { ResumenDashboard } from '../../tipos';
import { ProximosEventos } from '../../componentes/dashboard/ProximosEventos';

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
    { label: 'Total Alumnos', valor: resumen?.total_alumnos ?? 0, icono: Users, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Total Docentes', valor: resumen?.total_docentes ?? 0, icono: GraduationCap, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { label: 'Asistencia Hoy', valor: resumen?.asistencia_hoy ?? 0, icono: Clock, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { label: 'Usuarios Activos', valor: resumen?.total_usuarios_activos ?? 0, icono: Activity, color: 'text-acento-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  ];

  const totalAlumnos = resumen?.total_alumnos ?? 0;
  const presentesHoy = resumen?.asistencia_hoy ?? 0;
  const sinRegistrarHoy = Math.max(totalAlumnos - presentesHoy, 0);
  const datosAsistencia = [
    { name: 'Presentes hoy', value: presentesHoy, color: '#10B981' },
    { name: 'Sin registrar / ausentes', value: sinRegistrarHoy, color: '#e2e6ec' },
  ];
  const hayDatosAsistencia = totalAlumnos > 0;

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
          <div key={stat.label} className="tarjeta tarjeta-hover p-5">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icono className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{stat.label}</p>
                {cargando ? (
                  <div className="h-7 w-16 skeleton mt-1"></div>
                ) : (
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{stat.valor}</h3>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 tarjeta p-6 flex flex-col min-h-[320px]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Resumen de Asistencia de hoy</h3>
          {cargando ? (
            <div className="flex-1 skeleton" />
          ) : !hayDatosAsistencia ? (
            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
              <div className="text-center text-gray-400">
                <FileBarChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Aún no hay alumnos matriculados para mostrar asistencia.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col sm:flex-row items-center gap-4">
              <ResponsiveContainer width="100%" height={220} className="max-w-[260px]">
                <PieChart>
                  <Pie data={datosAsistencia} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
                    {datosAsistencia.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {datosAsistencia.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-sm border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0">
                    <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} /> {d.name}
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-white">{d.value}</span>
                  </div>
                ))}
                <Link to="/asistencia" className="btn-contorno w-full justify-center mt-2">
                  Tomar asistencia <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>

        <ProximosEventos />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/asistencia" className="tarjeta tarjeta-hover p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primario-50 dark:bg-primario-900/30">
            <ClipboardCheck className="w-5 h-5 text-primario-600 dark:text-primario-400" />
          </div>
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">Tomar Asistencia</p>
            <p className="text-xs text-gray-500">Registrar el día de hoy</p>
          </div>
        </Link>
        <Link to="/reportes" className="tarjeta tarjeta-hover p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-acento-500/10">
            <FileBarChart className="w-5 h-5 text-acento-500" />
          </div>
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">Ver Reportes</p>
            <p className="text-xs text-gray-500">Consolidados y boletas</p>
          </div>
        </Link>
        <Link to="/eventos" className="tarjeta tarjeta-hover p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
            <Activity className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">Eventos</p>
            <p className="text-xs text-gray-500">Actividades extracurriculares</p>
          </div>
        </Link>
      </div>
    </div>
  );
};
