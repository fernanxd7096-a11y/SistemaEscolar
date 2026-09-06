import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuthStore } from '@/tienda/auth';

/**
 * Boleta de notas en PDF: descarga y compartición.
 *
 * Por qué no `Linking.openURL(url)`: el endpoint está detrás de `auth:sanctum` y
 * abrir la URL en el navegador del sistema no lleva el header `Authorization`,
 * así que devolvería 401.
 *
 * Por qué no un visor PDF embebido: Expo Go no incluye módulos nativos como
 * react-native-pdf. El PDF se descarga a disco y se entrega al sistema operativo
 * con expo-sharing (sí incluido en Expo Go), que deja al usuario abrirlo con su
 * lector, guardarlo o enviarlo por correo/WhatsApp.
 *
 * La descarga usa `File.downloadFileAsync`, que acepta headers y escribe el
 * binario en disco de forma nativa: evita pasar megabytes de PDF por el puente
 * JS, como pasaría con axios y `responseType: 'arraybuffer'`.
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api';

/** Subcarpeta de caché para no mezclar las boletas con otros archivos temporales. */
const CARPETA_BOLETAS = 'boletas';

export interface OpcionesBoleta {
  nombreArchivo?: string;
  seccion_id?: number;
  bimestre?: number;
  'año_escolar'?: string;
}

const construirUrl = (alumnoId: number, opciones: OpcionesBoleta): string => {
  const params = new URLSearchParams();

  if (opciones.seccion_id) params.append('seccion_id', String(opciones.seccion_id));
  if (opciones.bimestre) params.append('bimestre', String(opciones.bimestre));
  if (opciones['año_escolar']) params.append('año_escolar', opciones['año_escolar']);

  const consulta = params.toString();
  return `${BASE_URL}/reportes/boleta/${alumnoId}/pdf${consulta ? `?${consulta}` : ''}`;
};

/**
 * Descarga la boleta al almacenamiento de caché del dispositivo y devuelve su uri.
 * Se usa la caché porque el PDF siempre se puede volver a generar desde el servidor.
 */
export const descargarBoletaPdf = async (
  alumnoId: number,
  opciones: OpcionesBoleta = {}
): Promise<string> => {
  const token = useAuthStore.getState().token;

  const carpeta = new Directory(Paths.cache, CARPETA_BOLETAS);
  if (!carpeta.exists) {
    carpeta.create({ intermediates: true });
  }

  const destino = new File(carpeta, opciones.nombreArchivo ?? `boleta-${alumnoId}.pdf`);

  const archivo = await File.downloadFileAsync(construirUrl(alumnoId, opciones), destino, {
    headers: {
      Accept: 'application/pdf',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    // Sin esto, volver a descargar la boleta del mismo alumno falla porque el
    // archivo anterior sigue en caché.
    idempotent: true,
  });

  return archivo.uri;
};

/**
 * Descarga la boleta y abre el diálogo del sistema para verla o compartirla.
 * Devuelve el uri local por si la pantalla quiere reutilizarlo.
 */
export const compartirBoletaPdf = async (
  alumnoId: number,
  opciones: OpcionesBoleta = {}
): Promise<string> => {
  const uri = await descargarBoletaPdf(alumnoId, opciones);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Boleta de notas',
      UTI: 'com.adobe.pdf',
    });
  }

  return uri;
};
