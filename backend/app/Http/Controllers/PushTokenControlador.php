<?php

namespace App\Http\Controllers;

use App\Models\PushToken;
use App\Services\ExpoPushService;
use Illuminate\Http\Request;

class PushTokenControlador extends Controller
{
    /**
     * Registra (o reasigna, si el mismo dispositivo tuvo antes otro usuario) el
     * Expo Push Token del dispositivo del usuario autenticado.
     */
    public function store(Request $request)
    {
        $datos = $request->validate([
            'token'      => 'required|string|max:255',
            'plataforma' => 'nullable|in:ios,android',
        ]);

        $pushToken = PushToken::updateOrCreate(
            ['token' => $datos['token']],
            ['usuario_id' => $request->user()->id, 'plataforma' => $datos['plataforma'] ?? null]
        );

        return response()->json($pushToken, 201);
    }

    /**
     * Elimina el token del dispositivo (p. ej. al cerrar sesión).
     */
    public function destroy(Request $request)
    {
        $datos = $request->validate([
            'token' => 'required|string|max:255',
        ]);

        PushToken::where('token', $datos['token'])
            ->where('usuario_id', $request->user()->id)
            ->delete();

        return response()->json(null, 204);
    }

    /**
     * Envía una notificación de prueba a todos los dispositivos del usuario autenticado.
     */
    public function prueba(Request $request, ExpoPushService $expo)
    {
        $tokens = $request->user()->pushTokens()->pluck('token')->all();

        if (empty($tokens)) {
            return response()->json([
                'mensaje' => 'No tienes ningún dispositivo registrado para notificaciones.',
            ], 422);
        }

        $resultado = $expo->enviar(
            $tokens,
            'Sistema Escolar SJT',
            'Esta es una notificación de prueba. ¡Todo funciona correctamente!'
        );

        return response()->json(['mensaje' => 'Notificación de prueba enviada.', 'resultado' => $resultado]);
    }
}
