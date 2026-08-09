<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerificarRol
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        if (!$request->user() || !$request->user()->hasAnyRole($roles)) {
            return response()->json([
                'mensaje' => 'Acceso denegado. No tienes los permisos necesarios.',
            ], 403);
        }

        return $next($request);
    }
}
