import React, { useState, useEffect } from 'react';
import { Menu, Search, Sun, Moon, Bell, LogOut, User as UserIcon } from 'lucide-react';
import { useTema } from '../../tienda/tema';
import logo from '../../assets/logo.png';
import { useAuth } from '../../contexto/AuthContexto';
import { contadorPendientes } from '../../api/docentes';
import { useNavigate } from 'react-router-dom';

interface BarraSuperiorProps {
  onMenuClick: () => void;
  titulo?: string;
}

export const BarraSuperior = ({ onMenuClick, titulo = 'Sistema de Gestión' }: BarraSuperiorProps) => {
  const { modoOscuro, toggleModo } = useTema();
  const { usuario, logout } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [pendientes, setPendientes] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const cargar = () => {
      contadorPendientes()
        .then((r) => setPendientes(r.pendientes))
        .catch(() => {});
    };
    cargar();
    const interval = setInterval(cargar, 30000);
    return () => clearInterval(interval);
  }, []);
  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2.5">
          <img
            src={logo}
            alt="MSJT"
            className="w-8 h-8 object-contain hidden sm:block drop-shadow-sm"
            draggable={false}
          />
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100 hidden sm:block">
            {titulo}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="relative hidden md:block">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="pl-10 pr-4 py-2 w-48 lg:w-64 bg-gray-100 dark:bg-gray-700/50 border-transparent rounded-full focus:bg-white focus:border-primario-500 focus:ring-2 focus:ring-primario-200 dark:focus:ring-primario-800/30 outline-none text-sm transition-all text-gray-700 dark:text-gray-200"
          />
        </div>

        <button 
          onClick={toggleModo}
          className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400 transition-colors"
          title="Alternar tema"
        >
          {modoOscuro ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button
          onClick={() => navigate('/docentes')}
          className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400 transition-colors relative"
          title={pendientes > 0 ? `${pendientes} registro(s) pendiente(s)` : 'Sin notificaciones'}
        >
          <Bell className="w-5 h-5" />
          {pendientes > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
              {pendientes > 9 ? '9+' : pendientes}
            </span>
          )}
        </button>

        <div className="relative ml-2">
          <button 
            className="flex items-center gap-2 focus:outline-none"
            onClick={() => setMenuAbierto(!menuAbierto)}
          >
            <div className="w-9 h-9 rounded-full bg-primario-100 dark:bg-primario-900/30 flex items-center justify-center text-primario-600 dark:text-primario-400 border border-primario-200 dark:border-primario-800 overflow-hidden">
              {usuario?.foto ? (
                <img src={usuario.foto} alt={usuario.nombre} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-5 h-5" />
              )}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 line-clamp-1">{usuario?.nombre}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{usuario?.roles?.[0]?.name || 'Usuario'}</span>
            </div>
          </button>

          {menuAbierto && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuAbierto(false)}></div>
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-50">
                <button 
                  onClick={() => { setMenuAbierto(false); logout(); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
