<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;

class PasswordControlador extends Controller
{
    public function enviarEnlace(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $estado = Password::broker('usuarios')->sendResetLink(
            $request->only('email')
        );

        if ($estado === Password::RESET_LINK_SENT) {
            return response()->json(['mensaje' => 'Enlace de restablecimiento enviado a tu correo.']);
        }

        return response()->json(['mensaje' => 'No encontramos un usuario con ese correo.'], 422);
    }

    public function reset(Request $request)
    {
        $request->validate([
            'email'                 => 'required|email',
            'password'              => 'required|min:8|confirmed',
            'token'                 => 'required',
        ]);

        $estado = Password::broker('usuarios')->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (Usuario $usuario, string $password) {
                // El cast 'hashed' en Usuario hashea automáticamente
                $usuario->forceFill(['password' => $password])->save();
            }
        );

        if ($estado === Password::PASSWORD_RESET) {
            return response()->json(['mensaje' => 'Contraseña restablecida exitosamente.']);
        }

        return response()->json(['mensaje' => 'El token es inválido o ha expirado.'], 422);
    }
}
