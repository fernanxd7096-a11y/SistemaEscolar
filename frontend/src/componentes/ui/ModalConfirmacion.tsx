import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ModalConfirmacionProps {
  abierto: boolean;
  titulo?: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  tipo?: 'peligro' | 'advertencia' | 'info';
  cargando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export const ModalConfirmacion = ({
  abierto,
  titulo = '¿Estás seguro?',
  mensaje,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  tipo = 'peligro',
  cargando = false,
  onConfirmar,
  onCancelar,
}: ModalConfirmacionProps) => {
  if (!abierto) return null;

  const colores = {
    peligro: {
      icono: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
      boton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    },
    advertencia: {
      icono: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
      boton: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
    },
    info: {
      icono: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      boton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    },
  };

  const color = colores[tipo];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onCancelar}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md transform transition-all animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={onCancelar}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={`p-3 rounded-full ${color.icono}`}>
              <AlertTriangle className="w-8 h-8" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {titulo}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {mensaje}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancelar}
              disabled={cargando}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors disabled:opacity-50"
            >
              {textoCancelar}
            </button>
            <button
              onClick={onConfirmar}
              disabled={cargando}
              className={`flex-1 px-4 py-2.5 rounded-xl text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 ${color.boton}`}
            >
              {cargando ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Procesando...
                </span>
              ) : (
                textoConfirmar
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
