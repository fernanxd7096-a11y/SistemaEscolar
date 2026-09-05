import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexto/AuthContexto';
import logo from '../../assets/logo.png';

export const Login = () => {
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const mensajeError = (err: unknown): string => {
    const data = (err as { response?: { data?: { mensaje?: string; message?: string; errors?: Record<string, string[]> } } })?.response?.data;
    if (data?.errors?.email?.[0]) return data.errors.email[0];
    if (data?.mensaje) return data.mensaje;
    if (data?.message) return data.message;
    return 'Error al iniciar sesión. Verifique sus credenciales.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-gray-50 dark:bg-gray-900">
      <div className="hidden lg:flex w-1/2 gradiente-institucional text-white flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,rgba(212,160,23,0.35)_0%,transparent_65%)]" />
        <div className="z-10 flex flex-col items-center text-center space-y-8 max-w-md">
          <div className="relative">
            <div className="absolute inset-0 blur-2xl bg-acento-500/25 rounded-full scale-110" />
            <img
              src={logo}
              alt="Escudo I.E.P. Milagroso San Judas Tadeo"
              className="relative w-56 h-auto drop-shadow-[0_12px_28px_rgba(0,0,0,0.45)] select-none"
              draggable={false}
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold font-sans tracking-tight leading-tight">
              Milagroso<br />San Judas Tadeo
            </h1>
            <p className="text-primario-100/90 text-base font-light pt-3 border-t border-white/20">
              Formando líderes para el futuro con excelencia académica y valores.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-8 fade-in">
          <div className="text-center lg:text-left space-y-2">
            <div className="lg:hidden flex flex-col items-center mb-6">
              <img
                src={logo}
                alt="Escudo MSJT"
                className="w-24 h-auto object-contain mb-3 drop-shadow-md"
                draggable={false}
              />
              <span className="text-sm font-semibold text-primario-700 dark:text-primario-400">
                I.E.P. Milagroso San Judas Tadeo
              </span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Bienvenido</h2>
            <p className="text-gray-500 dark:text-gray-400">Inicia sesión en tu cuenta para continuar</p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="etiqueta dark:text-gray-300">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="campo pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white w-full"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="etiqueta dark:text-gray-300">Contraseña</label>
                <Link to="/recuperar-password" className="text-sm text-primario-600 hover:text-primario-700 dark:text-primario-400 font-medium">
                  ¿Olvidé mi contraseña?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="campo pl-10 pr-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white w-full"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                >
                  {mostrarPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="btn-primario w-full flex justify-center py-2.5"
            >
              {cargando ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
