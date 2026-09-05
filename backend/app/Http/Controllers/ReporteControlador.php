<?php

namespace App\Http\Controllers;

use App\Models\Alumno;
use App\Models\Asistencia;
use App\Models\Nota;
use App\Models\Seccion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

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

    // ==========================================
    // PDF EXPORTS
    // ==========================================

    /**
     * Exportar boleta / Informe Académico a PDF.
     * Guarda automáticamente en carpeta Boletas y devuelve el archivo.
     */
    public function boletaPdf(Request $request, Alumno $alumno)
    {
        $seccionId = $request->input('seccion_id');

        $query = Nota::where('alumno_id', $alumno->id)->with('curso');
        if ($seccionId) {
            $query->where('seccion_id', $seccionId);
        }

        $notas = $query->orderBy('curso_id')->orderBy('bimestre')->get();

        // Obtener TODOS los cursos de la sección (incluso sin notas)
        $seccion = $seccionId
            ? Seccion::with('grado')->find($seccionId)
            : $alumno->secciones()->with('grado')->first();

        $cursosSeccion = $seccion
            ? \App\Models\Curso::where('grado_id', $seccion->grado_id)->where('estado', true)->orderBy('nombre')->get()
            : collect();

        $cursos = $cursosSeccion->map(function ($curso) use ($notas) {
            $notasCurso = $notas->where('curso_id', $curso->id);
            $porBimestre = [];
            for ($b = 1; $b <= 4; $b++) {
                $del = $notasCurso->where('bimestre', $b);
                $porBimestre[$b] = $del->isEmpty() ? null : round($del->avg('calificacion'), 1);
            }
            $promedioFinal = $notasCurso->isEmpty() ? 0 : round($notasCurso->avg('calificacion'), 1);
            return [
                'curso'          => $curso->nombre,
                'bimestre_1'     => $porBimestre[1],
                'bimestre_2'     => $porBimestre[2],
                'bimestre_3'     => $porBimestre[3],
                'bimestre_4'     => $porBimestre[4],
                'promedio_final' => $promedioFinal,
            ];
        })->toArray();

        $anioEscolar = date('Y');
        try {
            $config = DB::table('configuraciones')->where('clave', 'anio_escolar')->first();
            if ($config) $anioEscolar = $config->valor;
        } catch (\Exception $e) {}

        // Logo como base64 para DomPDF
        $logoBase64 = null;
        $logoPath = base_path('../frontend/src/assets/logo.png');
        if (file_exists($logoPath)) {
            $logoData = file_get_contents($logoPath);
            $logoBase64 = 'data:image/png;base64,' . base64_encode($logoData);
        }

        $pdf = Pdf::loadView('pdf.boleta', [
            'alumno'          => $alumno,
            'seccion'         => $seccion,
            'cursos'          => $cursos,
            'anioEscolar'     => $anioEscolar,
            'logoBase64'      => $logoBase64,
            'observaciones'   => '',
            'fechaGeneracion' => Carbon::now()->locale('es')->isoFormat('D [de] MMMM [de] YYYY, HH:mm'),
        ]);

        $pdf->setPaper('A4', 'portrait');

        // Guardar en carpeta Boletas
        $boletasDir = base_path('../Boletas');
        if (!is_dir($boletasDir)) {
            mkdir($boletasDir, 0755, true);
        }

        $apellidosClean = preg_replace('/[^a-zA-Z0-9_]/', '_', $alumno->apellidos);
        $nombresClean = preg_replace('/[^a-zA-Z0-9_]/', '_', $alumno->nombres);
        $filename = "Informe_Academico_{$apellidosClean}_{$nombresClean}_{$anioEscolar}.pdf";
        $filepath = $boletasDir . DIRECTORY_SEPARATOR . $filename;

        file_put_contents($filepath, $pdf->output());

        // Devolver el PDF para descarga Y la ruta donde se guardó
        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
            'X-Boleta-Path' => $filepath,
            'X-Boleta-Dir' => $boletasDir,
        ]);
    }

    /**
     * Exportar consolidado de asistencia a PDF.
     */
    public function consolidadoAsistenciaPdf(Request $request)
    {
        $request->validate([
            'seccion_id'  => 'required|exists:secciones,id',
            'fecha_desde' => 'required|date',
            'fecha_hasta' => 'required|date|after_or_equal:fecha_desde',
        ]);

        $seccionId = $request->input('seccion_id');
        $desde = $request->input('fecha_desde');
        $hasta = $request->input('fecha_hasta');

        $seccion = Seccion::with('grado')->findOrFail($seccionId);

        $alumnosModel = Alumno::whereHas('secciones', fn ($q) => $q->where('secciones.id', $seccionId))
            ->where('estado', true)
            ->orderBy('apellidos')
            ->get();

        $asistencias = Asistencia::where('seccion_id', $seccionId)
            ->whereBetween('fecha', [$desde, $hasta])
            ->get();

        $alumnos = $alumnosModel->map(function ($alumno) use ($asistencias) {
            $del = $asistencias->where('alumno_id', $alumno->id);
            return [
                'nombres'     => $alumno->nombres,
                'apellidos'   => $alumno->apellidos,
                'presente'    => $del->where('estado', 'presente')->count(),
                'tardanza'    => $del->where('estado', 'tardanza')->count(),
                'falta'       => $del->where('estado', 'falta')->count(),
                'justificado' => $del->where('estado', 'justificado')->count(),
                'total_dias'  => $del->count(),
                'porcentaje'  => $del->count() > 0
                    ? round(($del->where('estado', 'presente')->count() + $del->where('estado', 'tardanza')->count()) / $del->count() * 100, 1)
                    : 0,
            ];
        })->toArray();

        $anioEscolar = date('Y');
        try {
            $config = DB::table('configuraciones')->where('clave', 'anio_escolar')->first();
            if ($config) $anioEscolar = $config->valor;
        } catch (\Exception $e) {}

        $pdf = Pdf::loadView('pdf.consolidado_asistencia', [
            'seccion'         => $seccion,
            'alumnos'         => $alumnos,
            'fechaDesde'      => $desde,
            'fechaHasta'      => $hasta,
            'anioEscolar'     => $anioEscolar,
            'fechaGeneracion' => Carbon::now()->locale('es')->isoFormat('D [de] MMMM [de] YYYY, HH:mm'),
        ]);

        $pdf->setPaper('A4', 'portrait');

        return $pdf->download("consolidado_asistencia_{$seccion->nombre}.pdf");
    }

    /**
     * Exportar consolidado de notas a PDF.
     */
    public function consolidadoNotasPdf(Request $request)
    {
        $request->validate([
            'seccion_id' => 'required|exists:secciones,id',
            'bimestre'   => 'nullable|integer|min:1|max:4',
        ]);

        $seccionId = $request->input('seccion_id');
        $bimestre = $request->input('bimestre');

        $seccion = Seccion::with('grado')->findOrFail($seccionId);

        $alumnosModel = Alumno::whereHas('secciones', fn ($q) => $q->where('secciones.id', $seccionId))
            ->where('estado', true)
            ->orderBy('apellidos')
            ->get();

        $query = Nota::where('seccion_id', $seccionId)->with('curso');
        if ($bimestre) $query->where('bimestre', $bimestre);
        $notas = $query->get();

        $cursos = $notas->pluck('curso')->unique('id')->sortBy('nombre')->values()->pluck('nombre')->toArray();

        $alumnosData = $alumnosModel->map(function ($alumno) use ($notas, $cursos) {
            $notasAlumno = $notas->where('alumno_id', $alumno->id);
            $porCurso = [];
            foreach ($cursos as $cursoNombre) {
                $cursoObj = $notas->pluck('curso')->firstWhere('nombre', $cursoNombre);
                $del = $cursoObj ? $notasAlumno->where('curso_id', $cursoObj->id) : collect();
                $porCurso[$cursoNombre] = $del->isEmpty() ? null : round($del->avg('calificacion'), 1);
            }
            return [
                'nombres'          => $alumno->nombres,
                'apellidos'        => $alumno->apellidos,
                'notas_por_curso'  => $porCurso,
                'promedio_general' => $notasAlumno->isEmpty() ? null : round($notasAlumno->avg('calificacion'), 1),
            ];
        })->toArray();

        $anioEscolar = date('Y');
        try {
            $config = DB::table('configuraciones')->where('clave', 'anio_escolar')->first();
            if ($config) $anioEscolar = $config->valor;
        } catch (\Exception $e) {}

        $pdf = Pdf::loadView('pdf.consolidado_notas', [
            'seccion'         => $seccion,
            'cursos'          => $cursos,
            'alumnosData'     => $alumnosData,
            'bimestre'        => $bimestre,
            'anioEscolar'     => $anioEscolar,
            'fechaGeneracion' => Carbon::now()->locale('es')->isoFormat('D [de] MMMM [de] YYYY, HH:mm'),
        ]);

        $pdf->setPaper('A4', 'landscape');

        return $pdf->download("consolidado_notas_{$seccion->nombre}.pdf");
    }
}

