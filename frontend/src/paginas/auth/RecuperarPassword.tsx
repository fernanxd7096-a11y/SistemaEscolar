import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock, School, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { enviarEnlacePassword, resetearPassword } from '../../api/auth';

export const RecuperarPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const emailParam = searchParams.get('email') ?? '';

  const modoReset = Boolean(token);

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [cargando, setCargando] = useState(false);

  const mensajeError = (err: unknown): string => {
    const data = (err as { response?: { data?: { mensaje?: string; message?: string; errors?: Record<string, string[]> } } })?.response?.data;
    if (data?.errors) {
      const primero = Object.values(data.errors)[0]?.[0];
      if (primero) return primero;
    }
    if (data?.mensaje) return data.mensaje;
    if (data?.message) return data.message;
    return 'No se pudo completar la solicitud. Intente de nuevo.';
  };

  const handleEnviarEnlace = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setExito('');
    setCargando(true);
    try {
      const mensaje = await enviarEnlacePassword(email);
      setExito(mensaje);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setExito('');

    if (password !== passwordConfirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);
    try {
      const mensaje = await resetearPassword({
        email,
        password,
        password_confirmation: passwordConfirmation,
        token,
      });
      setExito(mensaje);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
      <div className="w-full max-w-md space-y-8 fade-in">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-primario-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
            <School className="w-8 h-8 text-primario-600 dark:text-primario-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {modoReset ? 'Nueva contraseña' : 'Recuperar contraseña'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {modoReset
              ? 'Ingresa tu nueva contraseña para restablecer el acceso.'
              : 'Te enviaremos un enlace a tu correo para restablecer la contraseña.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {exito && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl text-sm flex items-start gap-3">
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{exito}</p>
          </div>
        )}

        {modoReset ? (
          <form onSubmit={handleReset} className="space-y-5">
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
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="etiqueta dark:text-gray-300">Nueva contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="campo pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white w-full"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="etiqueta dark:text-gray-300">Confirmar contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  className="campo pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white w-full"
                />
              </div>
            </div>
            <button type="submit" disabled={cargando} className="btn-primario w-full flex justify-center py-2.5">
              {cargando ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Restablecer contraseña'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleEnviarEnlace} className="space-y-5">
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
            <button type="submit" disabled={cargando} className="btn-primario w-full flex justify-center py-2.5">
              {cargando ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Enviar enlace'
              )}
            </button>
          </form>
        )}

        <Link
          to="/login"
          className="flex items-center justify-center gap-2 text-sm text-primario-600 hover:text-primario-700 dark:text-primario-400 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
};
