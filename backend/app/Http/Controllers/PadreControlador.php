<?php

namespace App\Http\Controllers;

use App\Models\Alumno;
use App\Models\Padre;
use Illuminate\Http\Request;

class PadreControlador extends Controller
{
    /**
     * Listar padres con búsqueda y paginación.
     */
    public function index(Request $request)
    {
        $query = Padre::query()->withCount('alumnos');

        if ($request->filled('buscar')) {
            $termino = $request->input('buscar');
            $query->where(function ($q) use ($termino) {
                $q->where('nombres', 'ilike', "%{$termino}%")
                  ->orWhere('apellidos', 'ilike', "%{$termino}%")
                  ->orWhere('dni', 'ilike', "%{$termino}%");
            });
        }

        return response()->json(
            $query->orderBy('apellidos')->orderBy('nombres')->paginate(15)
        );
    }

    /**
     * Crear un nuevo padre de familia.
     */
    public function store(Request $request)
    {
        $request->validate([
            'dni'       => 'required|unique:padres,dni|digits:8',
            'nombres'   => 'required|string|max:100',
            'apellidos' => 'required|string|max:100',
            'relacion'  => 'required|in:padre,madre,tutor,apoderado',
            'telefono'  => 'nullable|string|max:20',
            'email'     => 'nullable|email|max:100',
        ]);

        $padre = Padre::create($request->only([
            'dni', 'nombres', 'apellidos', 'relacion', 'telefono', 'email',
        ]));

        return response()->json($padre, 201);
    }

    /**
     * Ver detalle de un padre con sus alumnos vinculados y resumen académico.
     */
    public function show(Padre $padre)
    {
        $padre->load(['alumnos' => function ($q) {
            $q->with(['secciones' => function ($sq) {
                $sq->with('grado')->orderByDesc('alumno_seccion.created_at');
            }])->orderBy('apellidos');
        }]);

        $hijos = $padre->alumnos->map(function ($alumno) {
            $seccion = $alumno->secciones->first();
            $promedio = \App\Models\Nota::where('alumno_id', $alumno->id)->avg('calificacion');
            $asistencia = \App\Models\Asistencia::where('alumno_id', $alumno->id)
                ->selectRaw("
                    COUNT(*) as total,
                    SUM(CASE WHEN estado IN ('presente','tardanza') THEN 1 ELSE 0 END) as asistidos
                ")
                ->first();
            $total = (int) ($asistencia->total ?? 0);
            $porcentaje = $total > 0
                ? round(((int) $asistencia->asistidos / $total) * 100, 1)
                : null;

            return [
                'id'         => $alumno->id,
                'dni'        => $alumno->dni,
                'nombres'    => $alumno->nombres,
                'apellidos'  => $alumno->apellidos,
                'estado'     => $alumno->estado,
                'seccion'    => $seccion ? [
                    'id'     => $seccion->id,
                    'nombre' => $seccion->nombre,
                    'grado'  => $seccion->grado?->nombre,
                    'nivel'  => $seccion->grado?->nivel,
                ] : null,
                'promedio'            => $promedio !== null ? round($promedio, 1) : null,
                'porcentaje_asistencia' => $porcentaje,
                'secciones'  => $alumno->secciones,
            ];
        });

        return response()->json([
            ...$padre->toArray(),
            'alumnos' => $hijos,
        ]);
    }

    /**
     * Actualizar datos de un padre.
     */
    public function update(Request $request, Padre $padre)
    {
        $request->validate([
            'dni'       => "required|digits:8|unique:padres,dni,{$padre->id}",
            'nombres'   => 'required|string|max:100',
            'apellidos' => 'required|string|max:100',
            'relacion'  => 'required|in:padre,madre,tutor,apoderado',
            'telefono'  => 'nullable|string|max:20',
            'email'     => 'nullable|email|max:100',
        ]);

        $padre->update($request->only([
            'dni', 'nombres', 'apellidos', 'relacion', 'telefono', 'email',
        ]));

        return response()->json($padre);
    }

    /**
     * Eliminar un padre de familia.
     */
    public function destroy(Padre $padre)
    {
        $padre->alumnos()->detach();
        $padre->delete();

        return response()->json(null, 204);
    }

    /**
     * Vincular un alumno al padre.
     */
    public function vincularAlumno(Request $request, Padre $padre)
    {
        $request->validate([
            'alumno_id' => 'required|exists:alumnos,id',
        ]);

        $padre->alumnos()->syncWithoutDetaching([$request->input('alumno_id')]);

        $padre->load('alumnos');

        return response()->json([
            'mensaje' => 'Alumno vinculado correctamente.',
            'padre'   => $padre,
        ]);
    }

    /**
     * Desvincular un alumno del padre.
     */
    public function desvincularAlumno(Padre $padre, Alumno $alumno)
    {
        $padre->alumnos()->detach($alumno->id);

        return response()->json([
            'mensaje' => 'Alumno desvinculado correctamente.',
        ]);
    }
}
