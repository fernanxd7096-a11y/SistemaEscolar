<?php

namespace App\Http\Controllers;

use App\Models\Docente;
use Illuminate\Http\Request;

class DocenteControlador extends Controller
{
    public function index(Request $request)
    {
        $query = Docente::query()->withCount('seccionesTutor');

        if ($request->filled('buscar')) {
            $buscar = mb_strtolower($request->input('buscar'));
            $query->where(function ($q) use ($buscar) {
                $q->whereRaw('LOWER(nombres) LIKE ?', ["%{$buscar}%"])
                    ->orWhereRaw('LOWER(apellidos) LIKE ?', ["%{$buscar}%"])
                    ->orWhereRaw('LOWER(dni) LIKE ?', ["%{$buscar}%"])
                    ->orWhereRaw('LOWER(especialidad) LIKE ?', ["%{$buscar}%"]);
            });
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->boolean('estado'));
        }

        if ($request->boolean('all')) {
            return response()->json($query->orderBy('apellidos')->orderBy('nombres')->get());
        }

        return response()->json($query->orderBy('apellidos')->orderBy('nombres')->paginate(15));
    }

    public function store(Request $request)
    {
        $datos = $request->validate([
            'dni'          => 'required|string|max:20|unique:docentes,dni',
            'nombres'      => 'required|string|max:100',
            'apellidos'    => 'required|string|max:100',
            'especialidad' => 'nullable|string|max:150',
            'titulo'       => 'nullable|string|max:150',
            'telefono'     => 'nullable|string|max:30',
            'email'        => 'nullable|email|max:255',
            'estado'       => 'boolean',
        ]);

        $datos['estado'] = $datos['estado'] ?? true;

        $docente = Docente::create($datos);

        return response()->json($docente, 201);
    }

    public function show(Docente $docente)
    {
        return response()->json($docente->load('seccionesTutor.grado'));
    }

    public function update(Request $request, Docente $docente)
    {
        $datos = $request->validate([
            'dni'          => 'sometimes|string|max:20|unique:docentes,dni,' . $docente->id,
            'nombres'      => 'sometimes|string|max:100',
            'apellidos'    => 'sometimes|string|max:100',
            'especialidad' => 'nullable|string|max:150',
            'titulo'       => 'nullable|string|max:150',
            'telefono'     => 'nullable|string|max:30',
            'email'        => 'nullable|email|max:255',
            'estado'       => 'boolean',
        ]);

        $docente->update($datos);

        return response()->json($docente);
    }

    public function destroy(Docente $docente)
    {
        $docente->delete();
        return response()->json(null, 204);
    }
}
