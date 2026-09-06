import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BarraSuperior } from './BarraSuperior';

export const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const getTitulo = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Panel Principal';
    if (path.startsWith('/alumnos')) return 'Gestión de Alumnos';
    if (path.startsWith('/docentes')) return 'Gestión de Docentes';
    const parts = path.split('/');
    const main = parts[1] || '';
    return main.charAt(0).toUpperCase() + main.slice(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors flex">
      <Sidebar 
        collapsed={collapsed} 
        onToggle={() => setCollapsed(!collapsed)} 
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <BarraSuperior 
          onMenuClick={() => setMobileOpen(true)} 
          titulo={getTitulo()}
        />
        
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
