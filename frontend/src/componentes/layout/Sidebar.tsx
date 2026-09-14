import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, GraduationCap, BookOpen, 
  BookMarked, Calendar, ClipboardCheck, FileText, 
  Bell, CalendarDays, BarChart2, Settings, ChevronLeft, ChevronRight,
  UsersRound, DollarSign
} from 'lucide-react';
import { useAuth } from '../../contexto/AuthContexto';
import { obtenerConfiguracion } from '../../api/configuracion';
import logo from '../../assets/logo.png';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/alumnos', label: 'Alumnos', icon: Users },
  { path: '/docentes', label: 'Docentes', icon: GraduationCap },
  { path: '/padres', label: 'Padres', icon: UsersRound },
  { path: '/grados', label: 'Grados', icon: BookOpen },
  { path: '/cursos', label: 'Cursos', icon: BookMarked },
  { path: '/horarios', label: 'Horarios', icon: Calendar },
  { path: '/asistencia', label: 'Asistencia', icon: ClipboardCheck },
  { path: '/notas', label: 'Notas', icon: FileText },
  { path: '/comunicados', label: 'Comunicados', icon: Bell },
  { path: '/eventos', label: 'Eventos', icon: CalendarDays },
  { path: '/pagos', label: 'Pagos', icon: DollarSign },
  { path: '/reportes', label: 'Reportes', icon: BarChart2 },
  { path: '/configuracion', label: 'Configuración', icon: Settings, soloAdmin: true },
];

export const Sidebar = ({ collapsed, onToggle, mobileOpen, setMobileOpen }: SidebarProps) => {
  const { usuario } = useAuth();
  const [config, setConfig] = useState<{
    nombre_colegio?: string;
    resolucion_directoral?: string;
    logo_url?: string | null;
  }>({});

  useEffect(() => {
    obtenerConfiguracion().then(setConfig).catch(() => {});
  }, []);

  const puedeVerConfig = 
    usuario?.roles?.some((r) => ['administrador', 'director'].includes(r.name)) ||
    usuario?.permisos?.includes('ver-configuracion') ||
    usuario?.permisos?.includes('editar-configuracion');

  const itemsVisibles = navItems.filter((item) => !item.soloAdmin || puedeVerConfig);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      
      <aside className={`fixed top-0 left-0 z-50 h-screen transition-all duration-300 flex flex-col gradiente-institucional
        ${collapsed ? 'w-20' : 'w-64'} 
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className={`flex items-center justify-center border-b border-white/10 shrink-0 ${collapsed ? 'h-16 px-2' : 'h-[4.5rem] px-4'}`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 w-full'}`}>
            <img
              src={config.logo_url || logo}
              alt="Logo"
              className={`object-contain shrink-0 drop-shadow-md ${collapsed ? 'w-10 h-10' : 'w-12 h-12'}`}
              draggable={false}
              onError={(e) => {
                (e.target as HTMLImageElement).src = logo;
              }}
            />
            {!collapsed && (
              <div className="flex flex-col truncate text-white min-w-0">
                <span className="text-[10px] text-acento-400 font-semibold tracking-wider uppercase">I.E.P.</span>
                <span className="text-sm font-bold truncate leading-tight" title={config.nombre_colegio || 'San Judas Tadeo'}>
                  {config.nombre_colegio || 'San Judas Tadeo'}
                </span>
                <span className="text-[10px] text-white/50 truncate" title={config.resolucion_directoral || 'UGEL 05 — S.J.L.'}>
                  {config.resolucion_directoral || 'UGEL 05 — S.J.L.'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <nav className="space-y-1 px-3">
            {itemsVisibles.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group relative
                  ${isActive 
                    ? 'bg-white/10 text-acento-400 font-medium' 
                    : 'text-white/80 hover:bg-white/5 hover:text-white'}`
                }
                title={collapsed ? item.label : undefined}
                onClick={() => setMobileOpen(false)}
              >
                <item.icon className={`w-5 h-5 shrink-0`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="border-t border-white/10 p-4 shrink-0 hidden lg:flex justify-end">
          <button 
            onClick={onToggle}
            className="p-1.5 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>
    </>
  );
};
