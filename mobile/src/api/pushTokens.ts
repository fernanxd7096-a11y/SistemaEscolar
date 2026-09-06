import cliente from './cliente';

// Nuevo módulo (no existe equivalente en frontend/src/api porque la web no registra
// push tokens). Sigue la misma convención que el resto de mobile/src/api: wrapper
// fino sobre `cliente`. Corresponde a las rutas nuevas en backend/routes/api.php
// (POST/DELETE /push-tokens, POST /push-tokens/prueba) — ver PushTokenControlador.
export const registrarPushToken = async (payload: {
  token: string;
  plataforma?: 'ios' | 'android';
}): Promise<void> => {
  await cliente.post('/push-tokens', payload);
};

export const eliminarPushToken = async (token: string): Promise<void> => {
  await cliente.delete('/push-tokens', { data: { token } });
};

export const enviarNotificacionPrueba = async (): Promise<{ mensaje: string }> => {
  const { data } = await cliente.post('/push-tokens/prueba');
  return data;
};
