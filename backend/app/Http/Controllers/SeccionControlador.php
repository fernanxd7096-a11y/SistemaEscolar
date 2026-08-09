<?php

namespace App\Http\Controllers;

use App\Models\Grado;
use App\Models\Seccion;
use Illuminate\Http\Request;

class SeccionControlador extends Controller
{
    public function index(Request $request)
    {
        $query = Seccion::query()->with(['grado', 'docenteTutor'])->withCount('alumnos');

        if ($request->filled('grado_id')) {
            $query->where('grado_id', $request->input('grado_id'));
        }

        return response()->json($query->orderBy('nombre')->get());
    }

    public function store(Request $request, Grado $grado)
    {
        $datos = $request->validate([
            'nombre'            => 'required|string|max:20',
            'capacidad'         => 'nullable|integer|min:1|max:100',
            'docente_tutor_id'  => 'nullable|exists:docentes,id',
            'estado'            => 'boolean',
        ]);

        $datos['grado_id'] = $grado->id;
        $datos['capacidad'] = $datos['capacidad'] ?? 30;
        $datos['estado'] = $datos['estado'] ?? true;

        $seccion = Seccion::create($datos);

        return response()->json($seccion->load(['grado', 'docenteTutor']), 201);
    }

    public function update(Request $request, Seccion $seccion)
    {
        $datos = $request->validate([
            'nombre'            => 'sometimes|string|max:20',
            'capacidad'         => 'nullable|integer|min:1|max:100',
            'docente_tutor_id'  => 'nullable|exists:docentes,id',
            'estado'            => 'boolean',
            'grado_id'          => 'sometimes|exists:grados,id',
        ]);

        $seccion->update($datos);

        return response()->json($seccion->load(['grado', 'docenteTutor']));
    }

    public function destroy(Seccion $seccion)
    {
        $seccion->delete();
        return response()->json(null, 204);
    }
}
