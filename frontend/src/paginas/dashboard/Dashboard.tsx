import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, GraduationCap, Activity, ClipboardCheck, FileBarChart,
  ArrowRight, FileText, AlertTriangle, TrendingUp, CalendarCheck, UserCheck
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { useAuth } from '../../contexto/AuthContexto';
import cliente from '../../api/cliente';
import logo from '../../assets/logo.png';
import type { ResumenDashboard, GraficosDashboard } from '../../tipos';

const COLORES = {
  presente: '#10B981',
  tardanza: '#F59E0B',
  falta: '#EF4444',
  justificado: '#3B82F6',
};

const PIE_COLORS = [COLORES.presente, COLORES.tardanza, COLORES.falta, COLORES.justificado];

const getSaludo = () => {
  const hora = new Date().getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 18) return 'Buenas tardes';
  return 'Buenas noches';
};

export const Dashboard = () => {
  const { usuario } = useAuth();
  const [resumen, setResumen] = useState<ResumenDashboard | null>(null);
  const [graficos, setGraficos] = useState<GraficosDashboard | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resumenRes, graficosRes] = await Promise.all([
          cliente.get<ResumenDashboard>('/dashboard/resumen'),
          cliente.get<GraficosDashboard>('/dashboard/graficos'),
        ]);
        setResumen(resumenRes.data);
        setGraficos(graficosRes.data);
      } catch {
        setError('No se pudo cargar el dashboard.');
      } finally {
        setCargando(false);
      }
    };
    fetchData();
  }, []);

  const pieData = graficos ? [
    { name: 'Presente', value: graficos.distribucion_asistencia.presente },
    { name: 'Tardanza', value: graficos.distribucion_asistencia.tardanza },
    { name: 'Falta', value: graficos.distribucion_asistencia.falta },
    { name: 'Justificado', value: graficos.distribucion_asistencia.justificado },
  ].filter(d => d.value > 0) : [];

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
      icono: UserCheck,
      color: 'text-emerald-500',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      label: 'Usuarios Activos',
      valor: resumen?.total_usuarios_activos ?? 0,
      icono: Activity,
      color: 'text-amber-500',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
    },
  ];

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: '#1F2937',
      borderColor: '#374151',
      color: '#fff',
      borderRadius: '0.75rem',
      border: '1px solid #374151',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
    },
    itemStyle: { color: '#E5E7EB' },
  };

  // Skeleton loading
  if (cargando) {
    return (
      <div className="space-y-6 fade-in">
        <div className="h-12 w-72 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="tarjeta p-5 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-7 w-14 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 tarjeta p-6 dark:bg-gray-800 dark:border-gray-700 h-96 animate-pulse" />
          <div className="tarjeta p-6 dark:bg-gray-800 dark:border-gray-700 h-96 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={logo}
            alt="Escudo MSJT"
            className="w-14 h-14 object-contain drop-shadow-md hidden sm:block"
            draggable={false}
          />
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {getSaludo()}, {usuario?.nombre || 'Usuario'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1">
              <CalendarCheck className="w-4 h-4" />
              {resumen?.fecha_actual || '—'}
              {resumen?.año_escolar_actual != null && ` • Año Escolar ${resumen.año_escolar_actual}`}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Row 1: Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="tarjeta tarjeta-hover p-5 dark:bg-gray-800 dark:border-gray-700 hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icono className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{stat.valor}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: Asistencia Semanal + Distribución */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart - Asistencia Semanal */}
        <div className="lg:col-span-2 tarjeta p-6 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-gray-400" />
            Asistencia Semanal
          </h3>
          <div className="h-[300px]">
            {graficos?.asistencia_semanal?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graficos.asistencia_semanal} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="fecha" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ paddingTop: '12px' }} />
                  <Bar dataKey="presente" name="Presente" stackId="a" fill={COLORES.presente} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="tardanza" name="Tardanza" stackId="a" fill={COLORES.tardanza} />
                  <Bar dataKey="justificado" name="Justificado" stackId="a" fill={COLORES.justificado} />
                  <Bar dataKey="falta" name="Falta" stackId="a" fill={COLORES.falta} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>No hay datos de asistencia esta semana.</p>
              </div>
            )}
          </div>
        </div>

        {/* Pie Chart - Distribución */}
        <div className="tarjeta p-6 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-gray-400" />
            Distribución del Mes
          </h3>
          <div className="h-[300px]">
            {pieData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>Sin datos este mes.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Tendencia Mensual + Acciones Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart - Tendencia */}
        <div className="lg:col-span-2 tarjeta p-6 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            Tendencia de Asistencia (6 meses)
          </h3>
          <div className="h-[280px]">
            {graficos?.asistencia_mensual?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={graficos.asistencia_mensual} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="mes" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(value: number) => [`${value}%`, 'Asistencia']}
                  />
                  <Line
                    type="monotone"
                    dataKey="porcentaje_asistencia"
                    name="Asistencia"
                    stroke={COLORES.presente}
                    strokeWidth={3}
                    dot={{ r: 5, strokeWidth: 2, fill: '#1F2937' }}
                    activeDot={{ r: 7, stroke: COLORES.presente, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>No hay datos de tendencia disponibles.</p>
              </div>
            )}
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="tarjeta p-6 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Acciones Rápidas</h3>
          <div className="space-y-3">
            {[
              { to: '/asistencia', label: 'Tomar Asistencia', icono: ClipboardCheck, colorBg: 'bg-emerald-100 dark:bg-emerald-900/30', colorText: 'text-emerald-600 dark:text-emerald-400' },
              { to: '/reportes', label: 'Ver Reportes', icono: FileBarChart, colorBg: 'bg-blue-100 dark:bg-blue-900/30', colorText: 'text-blue-600 dark:text-blue-400' },
              { to: '/comunicados', label: 'Comunicados', icono: FileText, colorBg: 'bg-amber-100 dark:bg-amber-900/30', colorText: 'text-amber-600 dark:text-amber-400' },
              { to: '/alumnos', label: 'Gestionar Alumnos', icono: Users, colorBg: 'bg-purple-100 dark:bg-purple-900/30', colorText: 'text-purple-600 dark:text-purple-400' },
            ].map((accion) => (
              <Link
                key={accion.to}
                to={accion.to}
                className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${accion.colorBg}`}>
                    <accion.icono className={`w-5 h-5 ${accion.colorText}`} />
                  </div>
                  <span className="font-medium text-gray-700 dark:text-gray-200">{accion.label}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Promedios por Curso + Faltas + Comunicados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Promedios por Curso */}
        <div className="tarjeta p-6 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-400" />
            Promedios por Curso
          </h3>
          <div className="h-[320px]">
            {graficos?.promedios_por_curso?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graficos.promedios_por_curso} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#374151" opacity={0.2} />
                  <XAxis type="number" domain={[0, 20]} tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="curso" type="category" width={100} tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="promedio" name="Promedio" fill="#6366F1" radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>No hay notas registradas aún.</p>
              </div>
            )}
          </div>
        </div>

        {/* Alumnos con más faltas + Comunicados */}
        <div className="space-y-6">
          {/* Alumnos con más faltas */}
          <div className="tarjeta p-6 dark:bg-gray-800 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Alumnos con más faltas (este mes)
            </h3>
            {graficos?.alumnos_mas_faltas?.length ? (
              <div className="space-y-2">
                {graficos.alumnos_mas_faltas.map((alumno, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400 w-5">{idx + 1}</span>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {alumno.apellidos}, {alumno.nombres}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-red-500 bg-red-50 dark:bg-red-900/30 px-2.5 py-1 rounded-full">
                      {alumno.total_faltas} {alumno.total_faltas === 1 ? 'falta' : 'faltas'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-4 text-center">¡Excelente! No hay faltas registradas este mes.</p>
            )}
          </div>

          {/* Comunicados Recientes */}
          <div className="tarjeta p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Comunicados Recientes
              </h3>
              <Link to="/comunicados" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                Ver todos
              </Link>
            </div>
            {graficos?.comunicados_recientes?.length ? (
              <div className="space-y-3">
                {graficos.comunicados_recientes.slice(0, 3).map((com) => (
                  <div key={com.id} className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{com.titulo}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        com.tipo === 'urgente' 
                          ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                          : com.tipo === 'informativo'
                          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                          : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}>
                        {com.tipo}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {com.created_at ? new Date(com.created_at).toLocaleDateString('es-PE') : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-4 text-center">No hay comunicados recientes.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
