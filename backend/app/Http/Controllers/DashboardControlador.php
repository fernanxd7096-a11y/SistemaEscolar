<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use App\Models\Comunicado;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardControlador extends Controller
{
    public function resumen()
    {
        $totalAlumnos = 0;
        try {
            $totalAlumnos = DB::table('alumnos')->count();
        } catch (\Exception $e) {}

        $totalDocentes = 0;
        try {
            $totalDocentes = DB::table('docentes')->count();
        } catch (\Exception $e) {}

        $totalUsuariosActivos = Usuario::where('estado', true)->count();

        $anioEscolar = date('Y');
        try {
            $config = DB::table('configuraciones')->where('clave', 'anio_escolar')->first();
            if ($config) {
                $anioEscolar = $config->valor;
            }
        } catch (\Exception $e) {}

        $asistenciaHoy = 0;
        try {
            $asistenciaHoy = DB::table('asistencias')
                ->whereDate('fecha', Carbon::today())
                ->where('estado', 'presente')
                ->count();
        } catch (\Exception $e) {}

        return response()->json([
            'total_alumnos'         => $totalAlumnos,
            'total_docentes'        => $totalDocentes,
            'total_usuarios_activos' => $totalUsuariosActivos,
            'asistencia_hoy'        => $asistenciaHoy,
            'fecha_actual'          => Carbon::now()->locale('es')->isoFormat('dddd, D [de] MMMM [de] YYYY'),
            'año_escolar_actual'    => $anioEscolar,
        ]);
    }

    /**
     * Datos para gráficos del dashboard.
     */
    public function graficos()
    {
        // 1. Asistencia semanal (últimos 7 días)
        $asistenciaSemanal = [];
        try {
            $hace7Dias = Carbon::today()->subDays(6);
            $registros = DB::table('asistencias')
                ->select('fecha', 'estado', DB::raw('COUNT(*) as total'))
                ->whereDate('fecha', '>=', $hace7Dias)
                ->groupBy('fecha', 'estado')
                ->orderBy('fecha')
                ->get();

            $fechas = [];
            for ($i = 6; $i >= 0; $i--) {
                $f = Carbon::today()->subDays($i)->toDateString();
                $fechas[$f] = ['fecha' => Carbon::parse($f)->locale('es')->isoFormat('ddd D'), 'presente' => 0, 'tardanza' => 0, 'falta' => 0, 'justificado' => 0];
            }

            foreach ($registros as $r) {
                if (isset($fechas[$r->fecha]) && isset($fechas[$r->fecha][$r->estado])) {
                    $fechas[$r->fecha][$r->estado] = (int) $r->total;
                }
            }

            $asistenciaSemanal = array_values($fechas);
        } catch (\Exception $e) {}

        // 2. Distribución de asistencia del mes actual
        $distribucion = ['presente' => 0, 'tardanza' => 0, 'falta' => 0, 'justificado' => 0];
        try {
            $inicioMes = Carbon::now()->startOfMonth();
            $resumen = DB::table('asistencias')
                ->select('estado', DB::raw('COUNT(*) as total'))
                ->whereDate('fecha', '>=', $inicioMes)
                ->groupBy('estado')
                ->pluck('total', 'estado');

            $distribucion = [
                'presente'    => (int) ($resumen['presente'] ?? 0),
                'tardanza'    => (int) ($resumen['tardanza'] ?? 0),
                'falta'       => (int) ($resumen['falta'] ?? 0),
                'justificado' => (int) ($resumen['justificado'] ?? 0),
            ];
        } catch (\Exception $e) {}

        // 3. Promedios por curso
        $promediosCurso = [];
        try {
            $promediosCurso = DB::table('notas')
                ->join('cursos', 'notas.curso_id', '=', 'cursos.id')
                ->select('cursos.nombre as curso', DB::raw('ROUND(AVG(notas.calificacion)::numeric, 1) as promedio'))
                ->groupBy('cursos.nombre')
                ->orderBy('cursos.nombre')
                ->get()
                ->map(fn ($r) => ['curso' => $r->curso, 'promedio' => (float) $r->promedio])
                ->toArray();
        } catch (\Exception $e) {}

        // 4. Top 5 alumnos con más faltas este mes
        $alumnosFaltas = [];
        try {
            $inicioMes = Carbon::now()->startOfMonth();
            $alumnosFaltas = DB::table('asistencias')
                ->join('alumnos', 'asistencias.alumno_id', '=', 'alumnos.id')
                ->select('alumnos.nombres', 'alumnos.apellidos', DB::raw('COUNT(*) as total_faltas'))
                ->where('asistencias.estado', 'falta')
                ->whereDate('asistencias.fecha', '>=', $inicioMes)
                ->groupBy('alumnos.id', 'alumnos.nombres', 'alumnos.apellidos')
                ->orderByDesc('total_faltas')
                ->limit(5)
                ->get()
                ->toArray();
        } catch (\Exception $e) {}

        // 5. Comunicados recientes (últimos 5)
        $comunicados = [];
        try {
            $comunicados = DB::table('comunicados')
                ->select('id', 'titulo', 'tipo', 'created_at')
                ->where('estado', true)
                ->orderByDesc('created_at')
                ->limit(5)
                ->get()
                ->toArray();
        } catch (\Exception $e) {}

        // 6. Asistencia mensual (últimos 6 meses)
        $asistenciaMensual = [];
        try {
            for ($i = 5; $i >= 0; $i--) {
                $mes = Carbon::now()->subMonths($i);
                $inicio = $mes->copy()->startOfMonth();
                $fin = $mes->copy()->endOfMonth();

                $total = DB::table('asistencias')
                    ->whereBetween('fecha', [$inicio, $fin])
                    ->count();

                $presentes = DB::table('asistencias')
                    ->whereBetween('fecha', [$inicio, $fin])
                    ->whereIn('estado', ['presente', 'tardanza'])
                    ->count();

                $asistenciaMensual[] = [
                    'mes'                    => $mes->locale('es')->isoFormat('MMM YYYY'),
                    'porcentaje_asistencia'  => $total > 0 ? round($presentes / $total * 100, 1) : 0,
                    'total'                  => $total,
                ];
            }
        } catch (\Exception $e) {}

        return response()->json([
            'asistencia_semanal'     => $asistenciaSemanal,
            'distribucion_asistencia' => $distribucion,
            'promedios_por_curso'    => $promediosCurso,
            'alumnos_mas_faltas'     => $alumnosFaltas,
            'comunicados_recientes'  => $comunicados,
            'asistencia_mensual'     => $asistenciaMensual,
        ]);
    }
}

