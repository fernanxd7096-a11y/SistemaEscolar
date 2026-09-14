<?php

namespace App\Http\Controllers;

use App\Models\Alumno;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AlumnoControlador extends Controller
{
    public function index(Request $request)
    {
        $query = Alumno::query()->with(['secciones.grado']);

        if ($request->filled('buscar')) {
            $buscar = mb_strtolower($request->input('buscar'));
            $query->where(function ($q) use ($buscar) {
                $q->whereRaw('LOWER(nombres) LIKE ?', ["%{$buscar}%"])
                    ->orWhereRaw('LOWER(apellidos) LIKE ?', ["%{$buscar}%"])
                    ->orWhereRaw('LOWER(dni) LIKE ?', ["%{$buscar}%"]);
            });
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->boolean('estado'));
        }

        if ($request->filled('seccion_id')) {
            $seccionId = $request->input('seccion_id');
            $query->whereHas('secciones', function ($q) use ($seccionId) {
                $q->where('secciones.id', $seccionId);
            });
        }

        if ($request->boolean('all')) {
            return response()->json($query->orderBy('apellidos')->orderBy('nombres')->get());
        }

        $perPage = (int) $request->input('per_page', 15);
        return response()->json($query->orderBy('apellidos')->orderBy('nombres')->paginate($perPage));
    }

    public function store(Request $request)
    {
        $datos = $request->validate([
            'dni'               => 'required|string|max:20|unique:alumnos,dni',
            'nombres'           => 'required|string|max:100',
            'apellidos'         => 'required|string|max:100',
            'fecha_nacimiento'  => 'nullable|date',
            'genero'            => 'nullable|in:M,F,O',
            'direccion'         => 'nullable|string|max:255',
            'telefono'          => 'nullable|string|max:30',
            'estado'            => 'boolean',
            'seccion_id'        => 'nullable|exists:secciones,id',
            'año_escolar'       => 'nullable|string|max:20',
        ]);

        $datos['estado'] = $datos['estado'] ?? true;

        $alumno = Alumno::create(collect($datos)->except(['seccion_id', 'año_escolar'])->all());

        if (!empty($datos['seccion_id'])) {
            $alumno->secciones()->attach($datos['seccion_id'], [
                'año_escolar' => $datos['año_escolar'] ?? (string) date('Y'),
                'estado'      => 'activo',
            ]);
        }

        return response()->json($alumno->load(['secciones.grado']), 201);
    }

    public function show(Alumno $alumno)
    {
        return response()->json($alumno->load(['secciones.grado', 'padres']));
    }

    public function update(Request $request, Alumno $alumno)
    {
        $datos = $request->validate([
            'dni'               => 'sometimes|string|max:20|unique:alumnos,dni,' . $alumno->id,
            'nombres'           => 'sometimes|string|max:100',
            'apellidos'         => 'sometimes|string|max:100',
            'fecha_nacimiento'  => 'nullable|date',
            'genero'            => 'nullable|in:M,F,O',
            'direccion'         => 'nullable|string|max:255',
            'telefono'          => 'nullable|string|max:30',
            'estado'            => 'boolean',
            'seccion_id'        => 'nullable|exists:secciones,id',
            'año_escolar'       => 'nullable|string|max:20',
        ]);

        $alumno->update(collect($datos)->except(['seccion_id', 'año_escolar'])->all());

        if (array_key_exists('seccion_id', $datos) && $datos['seccion_id']) {
            $año = $datos['año_escolar'] ?? (string) date('Y');

            DB::table('alumno_seccion')
                ->where('alumno_id', $alumno->id)
                ->where('año_escolar', $año)
                ->delete();

            $alumno->secciones()->attach($datos['seccion_id'], [
                'año_escolar' => $año,
                'estado'      => 'activo',
            ]);
        }

        return response()->json($alumno->fresh()->load(['secciones.grado']));
    }

    public function destroy(Alumno $alumno)
    {
        $alumno->delete();
        return response()->json(null, 204);
    }

    public function matricular(Request $request, Alumno $alumno)
    {
        $datos = $request->validate([
            'seccion_id'  => 'required|exists:secciones,id',
            'año_escolar' => 'required|string|max:20',
            'estado'      => 'nullable|in:activo,retirado,trasladado',
        ]);

        DB::table('alumno_seccion')->updateOrInsert(
            [
                'alumno_id'   => $alumno->id,
                'seccion_id'  => $datos['seccion_id'],
                'año_escolar' => $datos['año_escolar'],
            ],
            [
                'estado'     => $datos['estado'] ?? 'activo',
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        return response()->json([
            'mensaje' => 'Alumno matriculado correctamente.',
            'alumno'  => $alumno->fresh()->load(['secciones.grado']),
        ]);
    }
}
