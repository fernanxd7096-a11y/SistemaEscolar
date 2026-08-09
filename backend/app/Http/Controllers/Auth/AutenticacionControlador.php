<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AutenticacionControlador extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $usuario = Usuario::where('email', $request->email)->first();

        if (!$usuario || !Hash::check($request->password, $usuario->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales proporcionadas son incorrectas.'],
            ]);
        }

        if (!$usuario->estado) {
            throw ValidationException::withMessages([
                'email' => ['El usuario está inactivo. Por favor, contacte al administrador.'],
            ]);
        }

        $usuario->load('roles');
        $token = $usuario->createToken('token-acceso')->plainTextToken;

        return response()->json([
            'usuario' => array_merge($usuario->toArray(), [
                'permisos' => $usuario->getAllPermissions()->pluck('name'),
            ]),
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'mensaje' => 'Sesión cerrada exitosamente.',
        ]);
    }

    public function usuarioActual(Request $request)
    {
        $usuario = $request->user();
        $usuario->load('roles');

        return response()->json([
            'usuario'  => $usuario,
            'permisos' => $usuario->getAllPermissions()->pluck('name'),
        ]);
    }
}
