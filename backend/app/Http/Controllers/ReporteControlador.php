<?php

namespace App\Http\Controllers;

use App\Models\Alumno;
use App\Models\Asistencia;
use App\Models\Nota;
use App\Models\Seccion;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
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
        $boleta = $this->datosBoleta(
            $alumno,
            $request->input('seccion_id'),
            $request->input('bimestre')
        );

        return response()->json([
            'alumno'  => $boleta['alumno'],
            'seccion' => $boleta['seccion'],
            'cursos'  => $boleta['cursos'],
        ]);
    }

    /**
     * Boleta de notas en PDF con formato institucional.
     *
     * Se genera con barryvdh/laravel-dompdf sobre resources/views/reportes/boleta.blade.php.
     * Por defecto se devuelve en línea (`Content-Disposition: inline`) para que la app
     * móvil pueda guardarla y compartirla; con `?descargar=1` se fuerza la descarga.
     */
    public function boletaPdf(Request $request, Alumno $alumno)
    {
        $request->validate([
            'seccion_id'  => 'nullable|exists:secciones,id',
            'bimestre'    => 'nullable|integer|min:1|max:4',
            'año_escolar' => 'nullable|string|max:20',
        ]);

        $boleta = $this->datosBoleta(
            $alumno,
            $request->input('seccion_id'),
            $request->input('bimestre')
        );

        $pdf = Pdf::loadView('reportes.boleta', [
            'alumno'           => $boleta['alumno'],
            'seccion'          => $boleta['seccion'],
            'cursos'           => $boleta['cursos'],
            'promedio_general' => $boleta['promedio_general'],
            'cursos_aprobados' => $boleta['cursos_aprobados'],
            'condicion_final'  => $boleta['condicion_final'],
            'bimestre'         => $request->input('bimestre'),
            'año_escolar'      => $request->input('año_escolar') ?? $boleta['año_escolar'],
            'colegio'          => config('colegio'),
            'nota_maxima'      => config('colegio.nota_maxima'),
            'aprobado_desde'   => config('colegio.aprobado_desde'),
            'emitido_en'       => Carbon::now()->locale('es')->isoFormat('D [de] MMMM [de] YYYY, HH:mm'),
        ])->setPaper('a4');

        $nombreArchivo = 'boleta-' . str($alumno->apellidos . '-' . $alumno->nombres)->slug() . '.pdf';

        return $request->boolean('descargar')
            ? $pdf->download($nombreArchivo)
            : $pdf->stream($nombreArchivo);
    }

    /**
     * Notas del alumno agrupadas por curso, con los promedios ya calculados.
     * Es la fuente única de la boleta JSON y de la boleta PDF.
     *
     * @return array<string, mixed>
     */
    private function datosBoleta(Alumno $alumno, $seccionId = null, $bimestre = null): array
    {
        $query = Nota::where('alumno_id', $alumno->id)->with('curso');

        if ($seccionId) {
            $query->where('seccion_id', $seccionId);
        }
        if ($bimestre) {
            $query->where('bimestre', $bimestre);
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
        $seccion = $seccionId
            ? Seccion::with('grado')->find($seccionId)
            : $alumno->secciones()->with('grado')->first();

        $aprobadoDesde = (float) config('colegio.aprobado_desde', 11);
        $aprobados = $porCurso->where('promedio_final', '>=', $aprobadoDesde)->count();

        return [
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
            'cursos'           => $porCurso,
            'promedio_general' => $porCurso->isEmpty() ? null : round($porCurso->avg('promedio_final'), 1),
            'cursos_aprobados' => $aprobados,
            'condicion_final'  => $porCurso->isEmpty()
                ? '—'
                : ($aprobados === $porCurso->count() ? 'Aprobado' : 'En recuperación'),
            // El año escolar sale de la matrícula (pivot alumno_seccion); si el
            // alumno aún no está matriculado, se cae al año en curso.
            'año_escolar' => $alumno->secciones()
                ->when($seccionId, fn ($q) => $q->where('secciones.id', $seccionId))
                ->first()?->pivot?->getAttribute('año_escolar') ?? (string) date('Y'),
        ];
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
