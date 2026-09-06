import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  BookMarked, Calendar, ClipboardCheck, FileText,
  Bell, BarChart2, Settings, ChevronLeft, ChevronRight,
  School, PartyPopper, Wallet
} from 'lucide-react';
import { usePermiso } from '../../hooks/usePermiso';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permiso: null },
  { path: '/alumnos', label: 'Alumnos', icon: Users, permiso: null },
  { path: '/docentes', label: 'Docentes', icon: GraduationCap, permiso: null },
  { path: '/grados', label: 'Grados', icon: BookOpen, permiso: null },
  { path: '/cursos', label: 'Cursos', icon: BookMarked, permiso: null },
  { path: '/horarios', label: 'Horarios', icon: Calendar, permiso: null },
  { path: '/asistencia', label: 'Asistencia', icon: ClipboardCheck, permiso: null },
  { path: '/notas', label: 'Notas', icon: FileText, permiso: null },
  { path: '/eventos', label: 'Eventos', icon: PartyPopper, permiso: null },
  { path: '/pagos', label: 'Pagos', icon: Wallet, permiso: 'ver-pagos' },
  { path: '/comunicados', label: 'Comunicados', icon: Bell, permiso: null },
  { path: '/reportes', label: 'Reportes', icon: BarChart2, permiso: null },
  { path: '/configuracion', label: 'Configuración', icon: Settings, permiso: null },
];

export const Sidebar = ({ collapsed, onToggle, mobileOpen, setMobileOpen }: SidebarProps) => {
  // Nota: los ítems históricos de este menú no filtraban por permiso (se apoyaban
  // en que las rutas ya estaban protegidas por rol a nivel de backend). Los nuevos
  // (Pagos) sí se ocultan si el usuario no tiene el permiso, porque a diferencia de
  // Eventos, no todos los roles pueden verlo.
  const puedeVerPagos = usePermiso('ver-pagos');
  const itemsVisibles = navItems.filter((item) => item.permiso !== 'ver-pagos' || puedeVerPagos);

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
        <div className="flex h-16 items-center justify-center border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 px-4">
            <School className="w-8 h-8 text-acento-500 shrink-0" />
            {!collapsed && (
              <div className="flex flex-col truncate text-white">
                <span className="text-xs text-white/70 font-medium">Milagroso</span>
                <span className="text-sm font-bold truncate">San Judas Tadeo</span>
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
                    ? 'bg-white/10 text-acento-500 font-medium' 
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
