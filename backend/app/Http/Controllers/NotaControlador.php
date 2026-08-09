<?php

namespace App\Http\Controllers;

use App\Models\Alumno;
use App\Models\Nota;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotaControlador extends Controller
{
    /**
     * Listar notas con filtros.
     */
    public function index(Request $request)
    {
        $query = Nota::query()->with(['alumno', 'curso', 'seccion.grado']);

        if ($request->filled('seccion_id')) {
            $query->where('seccion_id', $request->input('seccion_id'));
        }

        if ($request->filled('curso_id')) {
            $query->where('curso_id', $request->input('curso_id'));
        }

        if ($request->filled('bimestre')) {
            $query->where('bimestre', $request->input('bimestre'));
        }

        if ($request->filled('alumno_id')) {
            $query->where('alumno_id', $request->input('alumno_id'));
        }

        if ($request->filled('tipo')) {
            $query->where('tipo', $request->input('tipo'));
        }

        return response()->json(
            $query->orderBy('alumno_id')->orderBy('bimestre')->orderBy('tipo')->paginate(50)
        );
    }

    /**
     * Registrar notas masivas para una sección/curso/bimestre.
     * Recibe array de { alumno_id, calificacion, observacion? }
     */
    public function registrarMasivo(Request $request)
    {
        $request->validate([
            'seccion_id'                  => 'required|exists:secciones,id',
            'curso_id'                    => 'required|exists:cursos,id',
            'bimestre'                    => 'required|integer|min:1|max:4',
            'tipo'                        => 'required|in:examen,practica,tarea,participacion',
            'notas'                       => 'required|array|min:1',
            'notas.*.alumno_id'           => 'required|exists:alumnos,id',
            'notas.*.calificacion'        => 'required|numeric|min:0|max:20',
            'notas.*.observacion'         => 'nullable|string|max:255',
        ]);

        $seccionId = $request->input('seccion_id');
        $cursoId = $request->input('curso_id');
        $bimestre = $request->input('bimestre');
        $tipo = $request->input('tipo');
        $userId = $request->user()?->id;

        $resultados = [];

        DB::transaction(function () use ($request, $seccionId, $cursoId, $bimestre, $tipo, $userId, &$resultados) {
            foreach ($request->input('notas') as $item) {
                $nota = Nota::updateOrCreate(
                    [
                        'alumno_id'  => $item['alumno_id'],
                        'curso_id'   => $cursoId,
                        'seccion_id' => $seccionId,
                        'bimestre'   => $bimestre,
                        'tipo'       => $tipo,
                    ],
                    [
                        'calificacion'   => $item['calificacion'],
                        'observacion'    => $item['observacion'] ?? null,
                        'registrado_por' => $userId,
                    ]
                );
                $resultados[] = $nota;
            }
        });

        return response()->json([
            'mensaje' => 'Notas registradas correctamente.',
            'total'   => count($resultados),
        ], 201);
    }

    /**
     * Obtener notas de alumnos por sección, curso y bimestre.
     * Devuelve la lista de alumnos con sus notas existentes.
     */
    public function porSeccionCurso(Request $request)
    {
        $request->validate([
            'seccion_id' => 'required|exists:secciones,id',
            'curso_id'   => 'required|exists:cursos,id',
            'bimestre'   => 'required|integer|min:1|max:4',
            'tipo'       => 'nullable|in:examen,practica,tarea,participacion',
        ]);

        $seccionId = $request->input('seccion_id');
        $cursoId = $request->input('curso_id');
        $bimestre = $request->input('bimestre');
        $tipo = $request->input('tipo', 'examen');

        $alumnos = Alumno::whereHas('secciones', function ($q) use ($seccionId) {
            $q->where('secciones.id', $seccionId);
        })
            ->where('estado', true)
            ->orderBy('apellidos')
            ->orderBy('nombres')
            ->get();

        $notas = Nota::where('seccion_id', $seccionId)
            ->where('curso_id', $cursoId)
            ->where('bimestre', $bimestre)
            ->where('tipo', $tipo)
            ->get()
            ->keyBy('alumno_id');

        $resultado = $alumnos->map(function ($alumno) use ($notas) {
            $nota = $notas->get($alumno->id);
            return [
                'alumno_id'    => $alumno->id,
                'dni'          => $alumno->dni,
                'nombres'      => $alumno->nombres,
                'apellidos'    => $alumno->apellidos,
                'calificacion' => $nota?->calificacion ?? null,
                'observacion'  => $nota?->observacion ?? null,
                'registrado'   => $nota !== null,
            ];
        });

        return response()->json([
            'seccion_id' => $seccionId,
            'curso_id'   => $cursoId,
            'bimestre'   => $bimestre,
            'tipo'       => $tipo,
            'alumnos'    => $resultado,
        ]);
    }

    /**
     * Libreta: Todas las notas de un alumno agrupadas por curso y bimestre.
     */
    public function libreta(Request $request, Alumno $alumno)
    {
        $request->validate([
            'seccion_id' => 'nullable|exists:secciones,id',
        ]);

        $query = Nota::where('alumno_id', $alumno->id)->with(['curso']);

        if ($request->filled('seccion_id')) {
            $query->where('seccion_id', $request->input('seccion_id'));
        }

        $notas = $query->orderBy('curso_id')->orderBy('bimestre')->orderBy('tipo')->get();

        // Agrupar por curso
        $porCurso = $notas->groupBy('curso_id')->map(function ($notasCurso) {
            $curso = $notasCurso->first()->curso;
            $porBimestre = $notasCurso->groupBy('bimestre')->map(function ($notasBimestre) {
                $porTipo = $notasBimestre->groupBy('tipo')->map(function ($notasTipo) {
                    return $notasTipo->avg('calificacion');
                });
                return [
                    'notas'    => $porTipo,
                    'promedio' => round($notasBimestre->avg('calificacion'), 2),
                ];
            });
            return [
                'curso_id'      => $curso->id,
                'curso_nombre'  => $curso->nombre,
                'bimestres'     => $porBimestre,
                'promedio_final' => round($notasCurso->avg('calificacion'), 2),
            ];
        })->values();

        return response()->json([
            'alumno' => [
                'id'        => $alumno->id,
                'nombres'   => $alumno->nombres,
                'apellidos' => $alumno->apellidos,
                'dni'       => $alumno->dni,
            ],
            'cursos' => $porCurso,
        ]);
    }

    public function destroy(Nota $nota)
    {
        $nota->delete();
        return response()->json(null, 204);
    }
}
