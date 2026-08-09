<?php

namespace App\Http\Controllers;

use App\Models\Grado;
use Illuminate\Http\Request;

class GradoControlador extends Controller
{
    public function index(Request $request)
    {
        $query = Grado::query()->with(['secciones.docenteTutor'])->withCount('secciones');

        if ($request->filled('buscar')) {
            $buscar = mb_strtolower($request->input('buscar'));
            $query->where(function ($q) use ($buscar) {
                $q->whereRaw('LOWER(nombre) LIKE ?', ["%{$buscar}%"])
                    ->orWhereRaw('LOWER(nivel) LIKE ?', ["%{$buscar}%"]);
            });
        }

        if ($request->filled('nivel')) {
            $query->where('nivel', $request->input('nivel'));
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->boolean('estado'));
        }

        return response()->json($query->orderBy('nivel')->orderBy('nombre')->get());
    }

    public function store(Request $request)
    {
        $datos = $request->validate([
            'nombre'      => 'required|string|max:50',
            'nivel'       => 'required|in:inicial,primaria,secundaria',
            'descripcion' => 'nullable|string|max:255',
            'estado'      => 'boolean',
        ]);

        $datos['estado'] = $datos['estado'] ?? true;

        $grado = Grado::create($datos);

        return response()->json($grado->load('secciones'), 201);
    }

    public function show(Grado $grado)
    {
        return response()->json($grado->load(['secciones.docenteTutor']));
    }

    public function update(Request $request, Grado $grado)
    {
        $datos = $request->validate([
            'nombre'      => 'sometimes|string|max:50',
            'nivel'       => 'sometimes|in:inicial,primaria,secundaria',
            'descripcion' => 'nullable|string|max:255',
            'estado'      => 'boolean',
        ]);

        $grado->update($datos);

        return response()->json($grado->load('secciones'));
    }

    public function destroy(Grado $grado)
    {
        $grado->delete();
        return response()->json(null, 204);
    }
}
