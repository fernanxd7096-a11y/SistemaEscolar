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
     * Formato consolidado: una tabla con todos los bimestres en una sola página.
     * Guarda automáticamente en carpeta Boletas y devuelve el archivo.
     */
    public function boletaPdf(Request $request, Alumno $alumno)
    {
        $seccionId = $request->input('seccion_id');

        // Obtener sección del alumno
        $seccion = $seccionId
            ? Seccion::with('grado', 'docenteTutor')->find($seccionId)
            : $alumno->secciones()->with('grado', 'docenteTutor')->first();

        // Obtener TODOS los cursos del grado
        $cursosSeccion = $seccion
            ? \App\Models\Curso::where('grado_id', $seccion->grado_id)->where('estado', true)->orderBy('nombre')->get()
            : collect();

        // Obtener todas las notas del alumno
        $query = Nota::where('alumno_id', $alumno->id)->with('curso');
        if ($seccionId) $query->where('seccion_id', $seccionId);
        $notas = $query->orderBy('curso_id')->orderBy('bimestre')->get();

        // Construir datos consolidados: una fila por curso con los 4 bimestres
        $cursosConsolidados = [];
        foreach ($cursosSeccion as $curso) {
            $notasCurso = $notas->where('curso_id', $curso->id);
            $bims = [];
            for ($b = 1; $b <= 4; $b++) {
                $del = $notasCurso->where('bimestre', $b);
                $bims[$b] = $del->isEmpty() ? null : round($del->avg('calificacion'), 0);
            }
            $conNotas = array_filter($bims, fn($v) => $v !== null);
            $promAnual = !empty($conNotas) ? round(array_sum($conNotas) / count($conNotas), 0) : null;

            $cursosConsolidados[] = [
                'nombre'        => $curso->nombre,
                'bim1'          => $bims[1],
                'bim2'          => $bims[2],
                'bim3'          => $bims[3],
                'bim4'          => $bims[4],
                'promedio_anual' => $promAnual,
            ];
        }

        // Tutor
        $tutor = '-';
        if ($seccion && $seccion->docenteTutor) {
            $dt = $seccion->docenteTutor;
            $tutor = trim("{$dt->nombres} {$dt->apellidos}");
        }

        $anioEscolar = date('Y');
        try {
            $config = DB::table('configuraciones')->where('clave', 'anio_escolar')->first();
            if ($config) $anioEscolar = $config->valor;
        } catch (\Exception $e) {}

        // Logo
        $logoBase64 = null;
        $logoPath = base_path('../frontend/src/assets/logo.png');
        if (file_exists($logoPath)) {
            $logoBase64 = 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath));
        }

        $pdf = Pdf::loadView('pdf.boleta', [
            'alumno'             => $alumno,
            'seccion'            => $seccion,
            'cursosConsolidados' => $cursosConsolidados,
            'tutor'              => $tutor,
            'anioEscolar'        => $anioEscolar,
            'logoBase64'         => $logoBase64,
            'comportamiento'     => null,
            'recomendaciones'    => '',
            'fechaGeneracion'    => Carbon::now()->locale('es')->isoFormat('D [de] MMMM [de] YYYY, HH:mm'),
        ]);

        $pdf->setPaper('A4', 'portrait');

        $limpiar = function($texto) {
            $texto = str_replace(
                ['á','é','í','ó','ú','ñ','Á','É','Í','Ó','Ú','Ñ','ü','Ü'],
                ['a','e','i','o','u','n','A','E','I','O','U','N','u','U'],
                $texto
            );
            return preg_replace('/[^a-zA-Z0-9_]/', '_', $texto);
        };
        $apellidosClean = $limpiar($alumno->apellidos);
        $nombresClean = $limpiar($alumno->nombres);
        $filename = "Informe_Academico_{$apellidosClean}_{$nombresClean}_{$anioEscolar}.pdf";

        // 1. Almacenamiento estándar y portable en el servidor (storage/app/boletas)
        $serverBoletasDir = storage_path('app/boletas');
        if (!is_dir($serverBoletasDir)) {
            @mkdir($serverBoletasDir, 0755, true);
        }
        $serverFilePath = $serverBoletasDir . DIRECTORY_SEPARATOR . $filename;
        @file_put_contents($serverFilePath, $pdf->output());

        // 2. Si existe o es modo local en Windows, guardar también en la carpeta raíz ../Boletas
        $localBoletasDir = base_path('../Boletas');
        $effectiveFilePath = $serverFilePath;
        $effectiveDir = $serverBoletasDir;

        try {
            if (!is_dir($localBoletasDir)) {
                @mkdir($localBoletasDir, 0755, true);
            }
            if (is_dir($localBoletasDir) && is_writable($localBoletasDir)) {
                $localFilePath = $localBoletasDir . DIRECTORY_SEPARATOR . $filename;
                @file_put_contents($localFilePath, $pdf->output());
                $effectiveFilePath = $localFilePath;
                $effectiveDir = $localBoletasDir;
            }
        } catch (\Throwable $e) {
            // En servidor Linux en la nube, continuar normalmente con el archivo en storage
        }

        // Devolver el PDF para descarga directa por Internet Y los encabezados informativos
        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
            'X-Boleta-Path' => $effectiveFilePath,
            'X-Boleta-Dir' => $effectiveDir,
            'Access-Control-Expose-Headers' => 'X-Boleta-Path, X-Boleta-Dir',
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

