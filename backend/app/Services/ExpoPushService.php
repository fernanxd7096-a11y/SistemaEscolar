<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class ExpoPushService
{
    private const URL = 'https://exp.host/--/api/v2/push/send';

    /**
     * Envía una notificación a uno o varios Expo Push Tokens.
     * Ver https://docs.expo.dev/push-notifications/sending-notifications/
     *
     * @param string[] $tokens
     */
    public function enviar(array $tokens, string $titulo, string $cuerpo, array $datos = []): array
    {
        $tokens = array_values(array_filter($tokens, fn ($t) => str_starts_with($t, 'ExponentPushToken')));

        if (empty($tokens)) {
            return [];
        }

        $mensajes = array_map(fn ($token) => [
            'to'    => $token,
            'title' => $titulo,
            'body'  => $cuerpo,
            'data'  => $datos,
            'sound' => 'default',
        ], $tokens);

        $respuesta = Http::post(self::URL, $mensajes);

        return $respuesta->json('data', []);
    }
}
