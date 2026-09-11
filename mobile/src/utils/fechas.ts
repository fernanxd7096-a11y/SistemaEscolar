import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export const hoyISO = () => format(new Date(), 'yyyy-MM-dd');

export const fechaLegible = (iso: string) =>
  format(parseISO(iso), "EEEE d 'de' MMMM", { locale: es });
