<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use Illuminate\Http\Request;

class UsuarioControlador extends Controller
{
    public function index(Request $request)
    {
        $query = Usuario::query()->with('roles');

        if ($request->filled('buscar')) {
            $buscar = $request->input('buscar');
            $query->where(function ($q) use ($buscar) {
                $q->where('nombre', 'ilike', "%{$buscar}%")
                  ->orWhere('apellido', 'ilike', "%{$buscar}%")
                  ->orWhere('email', 'ilike', "%{$buscar}%");
            });
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->boolean('estado'));
        }

        return response()->json($query->orderBy('nombre')->paginate(15));
    }

    public function store(Request $request)
    {
        $datos = $request->validate([
            'nombre'   => 'required|string|max:100',
            'apellido' => 'required|string|max:100',
            'email'    => 'required|string|email|max:255|unique:usuarios',
            'password' => 'required|string|min:8',
            'estado'   => 'boolean',
            'roles'    => 'array',
        ]);

        // El cast 'hashed' en Usuario hashea automáticamente
        $datos['estado'] = $datos['estado'] ?? true;

        $usuario = Usuario::create($datos);

        if (!empty($datos['roles'])) {
            $usuario->syncRoles($datos['roles']);
        }

        return response()->json($usuario->load('roles'), 201);
    }

    public function show(Usuario $usuario)
    {
        return response()->json($usuario->load('roles'));
    }

    public function update(Request $request, Usuario $usuario)
    {
        $datos = $request->validate([
            'nombre'   => 'sometimes|string|max:100',
            'apellido' => 'sometimes|string|max:100',
            'email'    => 'sometimes|string|email|max:255|unique:usuarios,email,' . $usuario->id,
            'password' => 'nullable|string|min:8',
            'estado'   => 'boolean',
            'roles'    => 'array',
        ]);

        if (empty($datos['password'])) {
            unset($datos['password']);
        }

        $usuario->update($datos);

        if (isset($datos['roles'])) {
            $usuario->syncRoles($datos['roles']);
        }

        return response()->json($usuario->load('roles'));
    }

    public function destroy(Usuario $usuario)
    {
        $usuario->delete();
        return response()->json(null, 204);
    }

    public function asignarRol(Request $request, Usuario $usuario)
    {
        $request->validate([
            'roles' => 'required|array',
        ]);

        $usuario->syncRoles($request->roles);

        return response()->json([
            'mensaje'  => 'Roles asignados exitosamente.',
            'usuario'  => $usuario->load('roles'),
        ]);
    }
}
