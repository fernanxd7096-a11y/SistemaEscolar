import React from 'react';

interface SkeletonProps {
  className?: string;
  filas?: number;
  columnas?: number;
}

export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`} />
);

export const SkeletonTabla = ({ filas = 5, columnas = 4 }: SkeletonProps) => (
  <div className="space-y-3">
    {/* Header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columnas}, 1fr)` }}>
      {Array.from({ length: columnas }).map((_, i) => (
        <Skeleton key={`h-${i}`} className="h-4 w-3/4" />
      ))}
    </div>
    <div className="border-t border-gray-200 dark:border-gray-700" />
    {/* Rows */}
    {Array.from({ length: filas }).map((_, row) => (
      <div key={row} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columnas}, 1fr)` }}>
        {Array.from({ length: columnas }).map((_, col) => (
          <Skeleton key={`${row}-${col}`} className="h-4" />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonTarjeta = () => (
  <div className="tarjeta p-5 dark:bg-gray-800 dark:border-gray-700">
    <div className="flex items-center gap-4">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-16" />
      </div>
    </div>
  </div>
);

export const SkeletonGrafico = ({ className = 'h-64' }: { className?: string }) => (
  <div className={`tarjeta p-6 dark:bg-gray-800 dark:border-gray-700 ${className}`}>
    <Skeleton className="h-5 w-48 mb-4" />
    <div className="flex items-end gap-2 h-[calc(100%-40px)]">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex-1 flex flex-col justify-end">
          <Skeleton className="w-full rounded-t" style={{ height: `${Math.random() * 60 + 20}%` }} />
        </div>
      ))}
    </div>
  </div>
);
