import cliente from './cliente';

export interface Evento {
  id: number;
  titulo: string;
  descripcion?: string | null;
  tipo: 'visita_estudio' | 'olimpiada' | 'deportivo' | 'cultural' | 'otro';
  lugar?: string | null;
  fecha: string;
  hora?: string | null;
  estado: 'programado' | 'en_curso' | 'finalizado' | 'cancelado';
  visible: boolean;
}

/**
 * Eventos extracurriculares del colegio (viajes, olimpiadas, actividades).
 *
 * Se usan para enlazar una excepción del horario con el evento que la origina,
 * de modo que un viaje de estudio no se registre dos veces.
 */
export const listarEventosProximos = async (): Promise<Evento[]> => {
  const { data } = await cliente.get('/eventos/proximos');
  // El backend devuelve una colección simple en /proximos y un paginador en /eventos.
  return Array.isArray(data) ? data : (data?.data ?? []);
};
