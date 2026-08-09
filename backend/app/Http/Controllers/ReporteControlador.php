<?php

namespace App\Http\Controllers;

use App\Models\Alumno;
use App\Models\Asistencia;
use App\Models\Nota;
use App\Models\Seccion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReporteControlador extends Controller
{
    /**
     * Resumen general del colegio: conteos rápidos.
     */
    public function resumenGeneral()
    {
        return response()->json([
            'total_alumnos'    => Alumno::where('estado', true)->count(),
            'total_secciones'  => Seccion::count(),
            'total_docentes'   => \App\Models\Docente::where('estado', true)->count(),
            'total_cursos'     => \App\Models\Curso::where('estado', true)->count(),
        ]);
    }

    /**
     * Boleta de notas de un alumno: todas las notas agrupadas por curso y bimestre.
     */
    public function boletaAlumno(Request $request, Alumno $alumno)
    {
        $seccionId = $request->input('seccion_id');

        $query = Nota::where('alumno_id', $alumno->id)->with('curso');

        if ($seccionId) {
            $query->where('seccion_id', $seccionId);
        }

        $notas = $query->orderBy('curso_id')->orderBy('bimestre')->orderBy('tipo')->get();

        $porCurso = $notas->groupBy('curso_id')->map(function ($notasCurso) {
            $curso = $notasCurso->first()->curso;
            $porBimestre = [];

            for ($b = 1; $b <= 4; $b++) {
                $delBimestre = $notasCurso->where('bimestre', $b);
                $porBimestre[$b] = $delBimestre->isEmpty() ? null : round($delBimestre->avg('calificacion'), 1);
            }

            return [
                'curso'          => $curso->nombre,
                'bimestre_1'     => $porBimestre[1],
                'bimestre_2'     => $porBimestre[2],
                'bimestre_3'     => $porBimestre[3],
                'bimestre_4'     => $porBimestre[4],
                'promedio_final' => round($notasCurso->avg('calificacion'), 1),
            ];
        })->values();

        // Sección del alumno
        $seccion = null;
        if ($seccionId) {
            $seccion = Seccion::with('grado')->find($seccionId);
        } else {
            $seccion = $alumno->secciones()->with('grado')->first();
        }

        return response()->json([
            'alumno' => [
                'id'        => $alumno->id,
                'nombres'   => $alumno->nombres,
                'apellidos' => $alumno->apellidos,
                'dni'       => $alumno->dni,
            ],
            'seccion' => $seccion ? [
                'nombre' => $seccion->nombre,
                'grado'  => $seccion->grado->nombre ?? '',
                'nivel'  => $seccion->grado->nivel ?? '',
            ] : null,
            'cursos' => $porCurso,
        ]);
    }

    /**
     * Consolidado de asistencia por sección y rango de fechas.
     */
    public function consolidadoAsistencia(Request $request)
    {
        $request->validate([
            'seccion_id'  => 'required|exists:secciones,id',
            'fecha_desde' => 'required|date',
            'fecha_hasta' => 'required|date|after_or_equal:fecha_desde',
        ]);

        $seccionId = $request->input('seccion_id');
        $desde = $request->input('fecha_desde');
        $hasta = $request->input('fecha_hasta');

        $alumnos = Alumno::whereHas('secciones', function ($q) use ($seccionId) {
            $q->where('secciones.id', $seccionId);
        })
            ->where('estado', true)
            ->orderBy('apellidos')
            ->get();

        $asistencias = Asistencia::where('seccion_id', $seccionId)
            ->whereBetween('fecha', [$desde, $hasta])
            ->get();

        $resultado = $alumnos->map(function ($alumno) use ($asistencias) {
            $del = $asistencias->where('alumno_id', $alumno->id);
            return [
                'alumno_id' => $alumno->id,
                'nombres'   => $alumno->nombres,
                'apellidos' => $alumno->apellidos,
                'presente'  => $del->where('estado', 'presente')->count(),
                'tardanza'  => $del->where('estado', 'tardanza')->count(),
                'falta'     => $del->where('estado', 'falta')->count(),
                'justificado' => $del->where('estado', 'justificado')->count(),
                'total_dias'  => $del->count(),
                'porcentaje'  => $del->count() > 0
                    ? round(($del->where('estado', 'presente')->count() + $del->where('estado', 'tardanza')->count()) / $del->count() * 100, 1)
                    : 0,
            ];
        });

        return response()->json([
            'seccion_id'  => $seccionId,
            'fecha_desde' => $desde,
            'fecha_hasta' => $hasta,
            'alumnos'     => $resultado,
        ]);
    }

    /**
     * Consolidado de notas por sección: promedio por alumno por curso.
     */
    public function consolidadoNotas(Request $request)
    {
        $request->validate([
            'seccion_id' => 'required|exists:secciones,id',
            'bimestre'   => 'nullable|integer|min:1|max:4',
        ]);

        $seccionId = $request->input('seccion_id');
        $bimestre = $request->input('bimestre');

        $alumnos = Alumno::whereHas('secciones', function ($q) use ($seccionId) {
            $q->where('secciones.id', $seccionId);
        })
            ->where('estado', true)
            ->orderBy('apellidos')
            ->get();

        $query = Nota::where('seccion_id', $seccionId)->with('curso');
        if ($bimestre) {
            $query->where('bimestre', $bimestre);
        }
        $notas = $query->get();

        $cursos = $notas->pluck('curso')->unique('id')->sortBy('nombre')->values();

        $resultado = $alumnos->map(function ($alumno) use ($notas, $cursos) {
            $notasAlumno = $notas->where('alumno_id', $alumno->id);
            $porCurso = [];
            foreach ($cursos as $curso) {
                $del = $notasAlumno->where('curso_id', $curso->id);
                $porCurso[$curso->nombre] = $del->isEmpty() ? null : round($del->avg('calificacion'), 1);
            }
            return [
                'alumno_id'       => $alumno->id,
                'nombres'         => $alumno->nombres,
                'apellidos'       => $alumno->apellidos,
                'notas_por_curso' => $porCurso,
                'promedio_general' => $notasAlumno->isEmpty() ? null : round($notasAlumno->avg('calificacion'), 1),
            ];
        });

        return response()->json([
            'seccion_id' => $seccionId,
            'cursos'     => $cursos->pluck('nombre'),
            'alumnos'    => $resultado,
        ]);
    }
}
