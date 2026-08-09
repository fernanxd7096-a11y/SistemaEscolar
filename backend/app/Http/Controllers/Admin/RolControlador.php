<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolControlador extends Controller
{
    public function index()
    {
        return response()->json(Role::with('permissions')->get());
    }

    public function store(Request $request)
    {
        $datos = $request->validate([
            'name'        => 'required|unique:roles,name',
            'permissions' => 'array',
        ]);

        $rol = Role::create(['name' => $datos['name'], 'guard_name' => 'web']);

        if (!empty($datos['permissions'])) {
            $rol->syncPermissions($datos['permissions']);
        }

        return response()->json($rol->load('permissions'), 201);
    }

    public function show(Role $rol)
    {
        return response()->json($rol->load('permissions'));
    }

    public function update(Request $request, Role $rol)
    {
        $datos = $request->validate([
            'name'        => 'required|unique:roles,name,' . $rol->id,
            'permissions' => 'array',
        ]);

        $rol->update(['name' => $datos['name']]);

        if (isset($datos['permissions'])) {
            $rol->syncPermissions($datos['permissions']);
        }

        return response()->json($rol->load('permissions'));
    }

    public function destroy(Role $rol)
    {
        $rol->delete();
        return response()->json(null, 204);
    }
}
