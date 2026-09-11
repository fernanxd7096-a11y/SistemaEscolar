<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;

/**
 * Autoservicio de perfil: cada usuario autenticado edita sus propios datos
 * (nombre, contraseña, foto), sin pasar por los permisos de administración de
 * usuarios (Admin\UsuarioControlador, reservado a administrador/director para
 * gestionar A OTROS usuarios). Por eso estas rutas no llevan middleware de rol:
 * cualquiera que tenga sesión puede tocar su propio registro.
 */
class PerfilControlador extends Controller
{
    /**
     * Actualiza nombre y apellido del usuario autenticado.
     */
    public function actualizar(Request $request)
    {
        $datos = $request->validate([
            'nombre'   => 'required|string|max:100',
            'apellido' => 'required|string|max:100',
        ]);

        $usuario = $request->user();
        $usuario->update($datos);

        return response()->json($usuario->fresh());
    }

    /**
     * Cambia la contraseña del usuario autenticado.
     *
     * Exige la contraseña actual (a diferencia del reset por correo de
     * PasswordControlador, que es para cuando el usuario la olvidó): aquí el
     * usuario ya tiene sesión activa, así que confirmar la contraseña vigente es
     * lo que evita que alguien con el celular desbloqueado se la cambie sin saberla.
     */
    public function cambiarPassword(Request $request)
    {
        $datos = $request->validate([
            'password_actual' => 'required|string',
            'password'        => ['required', 'confirmed', Password::min(8)],
        ]);

        $usuario = $request->user();

        if (!Hash::check($datos['password_actual'], $usuario->password)) {
            return response()->json([
                'message' => 'La contraseña actual no es correcta.',
                'errors'  => ['password_actual' => ['La contraseña actual no es correcta.']],
            ], 422);
        }

        // El cast 'hashed' del modelo Usuario hashea automáticamente al guardar.
        $usuario->forceFill(['password' => $datos['password']])->save();

        return response()->json(['mensaje' => 'Contraseña actualizada correctamente.']);
    }

    /**
     * Sube (o reemplaza) la foto de perfil del usuario autenticado.
     *
     * Se guarda en el disco "public" (storage/app/public/perfiles), que requiere
     * `php artisan storage:link` en el servidor para quedar accesible por HTTP en
     * `{APP_URL}/storage/perfiles/...`. La URL absoluta se expone en el JSON como
     * `foto_url` (accessor en el modelo Usuario), que es lo que consume la app.
     */
    public function subirFoto(Request $request)
    {
        $request->validate([
            'foto' => 'required|image|mimes:jpg,jpeg,png,webp|max:4096',
        ]);

        $usuario = $request->user();

        if ($usuario->foto) {
            Storage::disk('public')->delete($usuario->foto);
        }

        $ruta = $request->file('foto')->store('perfiles', 'public');
        $usuario->update(['foto' => $ruta]);

        return response()->json($usuario->fresh());
    }

    /**
     * Quita la foto de perfil del usuario autenticado (vuelve al avatar por defecto).
     */
    public function eliminarFoto(Request $request)
    {
        $usuario = $request->user();

        if ($usuario->foto) {
            Storage::disk('public')->delete($usuario->foto);
            $usuario->update(['foto' => null]);
        }

        return response()->json($usuario->fresh());
    }
}
