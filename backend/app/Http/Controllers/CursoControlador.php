<?php

namespace App\Http\Controllers;

use App\Models\Curso;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CursoControlador extends Controller
{
    public function index(Request $request)
    {
        $query = Curso::query()->with(['grado', 'docente']);

        if ($request->filled('buscar')) {
            $buscar = mb_strtolower($request->input('buscar'));
            $query->where(function ($q) use ($buscar) {
                $q->whereRaw('LOWER(nombre) LIKE ?', ["%{$buscar}%"])
                    ->orWhereRaw('LOWER(descripcion) LIKE ?', ["%{$buscar}%"]);
            });
        }

        if ($request->filled('grado_id')) {
            $query->where('grado_id', $request->input('grado_id'));
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->boolean('estado'));
        }

        return response()->json($query->orderBy('grado_id')->orderBy('nombre')->paginate(15));
    }

    public function store(Request $request)
    {
        $datos = $request->validate([
            // La tabla tiene unique(nombre, grado_id): sin esta regla, repetir un
            // curso en el mismo grado revienta con un error de integridad (500)
            // en vez de devolver un 422 que el formulario pueda mostrar.
            'nombre'           => [
                'required', 'string', 'max:100',
                Rule::unique('cursos', 'nombre')->where(
                    fn ($q) => $q->where('grado_id', $request->input('grado_id'))
                ),
            ],
            'descripcion'      => 'nullable|string|max:255',
            'grado_id'         => 'required|exists:grados,id',
            'docente_id'       => 'nullable|exists:docentes,id',
            'horas_semanales'  => 'nullable|integer|min:1|max:20',
            'estado'           => 'boolean',
        ], [
            'nombre.unique' => 'Ya existe un curso con ese nombre en el grado seleccionado.',
        ]);

        $datos['estado'] = $datos['estado'] ?? true;
        $datos['horas_semanales'] = $datos['horas_semanales'] ?? 2;

        $curso = Curso::create($datos);

        return response()->json($curso->load(['grado', 'docente']), 201);
    }

    public function show(Curso $curso)
    {
        return response()->json($curso->load(['grado', 'docente']));
    }

    public function update(Request $request, Curso $curso)
    {
        $datos = $request->validate([
            'nombre'           => [
                'sometimes', 'string', 'max:100',
                Rule::unique('cursos', 'nombre')
                    ->ignore($curso->id)
                    ->where(fn ($q) => $q->where(
                        'grado_id',
                        $request->input('grado_id', $curso->grado_id)
                    )),
            ],
            'descripcion'      => 'nullable|string|max:255',
            'grado_id'         => 'sometimes|exists:grados,id',
            'docente_id'       => 'nullable|exists:docentes,id',
            'horas_semanales'  => 'nullable|integer|min:1|max:20',
            'estado'           => 'boolean',
        ], [
            'nombre.unique' => 'Ya existe un curso con ese nombre en el grado seleccionado.',
        ]);

        $curso->update($datos);

        return response()->json($curso->fresh()->load(['grado', 'docente']));
    }

    public function destroy(Curso $curso)
    {
        $curso->delete();
        return response()->json(null, 204);
    }
}
