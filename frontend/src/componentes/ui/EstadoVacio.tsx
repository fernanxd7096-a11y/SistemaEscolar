import React from 'react';
import { FileQuestion, type LucideIcon } from 'lucide-react';

interface EstadoVacioProps {
  icono?: LucideIcon;
  titulo?: string;
  descripcion?: string;
  accion?: {
    texto: string;
    onClick: () => void;
  };
}

export const EstadoVacio = ({
  icono: Icono = FileQuestion,
  titulo = 'No hay datos',
  descripcion = 'No se encontraron registros para mostrar.',
  accion,
}: EstadoVacioProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-700/50 mb-4">
        <Icono className="w-12 h-12 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
        {titulo}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-4">
        {descripcion}
      </p>
      {accion && (
        <button
          onClick={accion.onClick}
          className="px-4 py-2 rounded-xl bg-primario-600 text-white font-medium hover:bg-primario-700 transition-colors text-sm"
        >
          {accion.texto}
        </button>
      )}
    </div>
  );
};
