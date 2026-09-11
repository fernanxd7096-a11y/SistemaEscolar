<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use App\Models\Alumno;
use App\Models\Docente;
use App\Models\Seccion;
use App\Models\Curso;
use App\Models\Comunicado;
use App\Services\AgendaHorarioServicio;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;
use Carbon\CarbonImmutable;

class DashboardControlador extends Controller
{
    public function __construct(private readonly ?AgendaHorarioServicio $agenda = null)
    {
    }
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

    /**
     * KPIs y series para los gráficos del inicio de la app móvil.
     */
    public function kpis(Request $request)
    {
        $usuario = $request->user();
        $esGlobal = $usuario->hasAnyRole(['administrador', 'director', 'secretario']);

        $hoy = CarbonImmutable::today();

        $respuesta = [
            'rol_vista'          => $esGlobal ? 'global' : 'docente',
            'fecha_actual'       => Carbon::now()->locale('es')->isoFormat('dddd, D [de] MMMM [de] YYYY'),
            'año_escolar_actual' => $this->anioEscolar(),
        ];

        if ($esGlobal) {
            $respuesta += [
                'totales'             => $this->totales(),
                'asistencia_hoy'      => $this->asistenciaDelDia($hoy->toDateString()),
                'asistencia_semana'   => $this->asistenciaUltimosDias($hoy, 7),
                'alumnos_por_grado'   => $this->alumnosPorGrado(),
                'alumnos_por_nivel'   => $this->alumnosPorNivel(),
                'eventos_proximos'    => $this->eventosProximos($hoy),
                'pagos_del_mes'       => $this->pagosDelMes($hoy),
            ];
        }

        $respuesta['docente'] = $this->cargaDelDocente($usuario, $hoy);

        return response()->json($respuesta);
    }

    /** @return array<string, int> */
    private function totales(): array
    {
        return [
            'alumnos'          => Alumno::count(),
            'alumnos_activos'  => Alumno::where('estado', true)->count(),
            'docentes'         => Docente::count(),
            'docentes_activos' => Docente::where('estado', true)->count(),
            'secciones'        => Seccion::count(),
            'cursos'           => Curso::where('estado', true)->count(),
            'usuarios_activos' => Usuario::where('estado', true)->count(),
        ];
    }

    /**
     * Conteo de asistencia de una fecha por estado.
     * @return array<string, int|float|string>
     */
    private function asistenciaDelDia(string $fecha): array
    {
        $conteos = DB::table('asistencias')
            ->select('estado', DB::raw('COUNT(*) as total'))
            ->whereDate('fecha', $fecha)
            ->groupBy('estado')
            ->pluck('total', 'estado');

        $presente    = (int) ($conteos['presente'] ?? 0);
        $tardanza    = (int) ($conteos['tardanza'] ?? 0);
        $falta       = (int) ($conteos['falta'] ?? 0);
        $justificado = (int) ($conteos['justificado'] ?? 0);
        $total       = $presente + $tardanza + $falta + $justificado;

        return [
            'fecha'       => $fecha,
            'presente'    => $presente,
            'tardanza'    => $tardanza,
            'falta'       => $falta,
            'justificado' => $justificado,
            'total'       => $total,
            'porcentaje'  => $total > 0 ? round(($presente + $tardanza) / $total * 100, 1) : 0,
        ];
    }

    /**
     * Serie para el gráfico de barras: asistencia de los últimos días hábiles.
     * @return array<int, array<string, mixed>>
     */
    private function asistenciaUltimosDias(CarbonImmutable $hasta, int $cantidad): array
    {
        $serie = [];
        $fecha = $hasta;

        while (count($serie) < $cantidad) {
            if ($fecha->dayOfWeekIso <= 5) {
                $dia = $this->asistenciaDelDia($fecha->toDateString());
                $dia['etiqueta'] = $fecha->locale('es')->isoFormat('ddd D');
                $serie[] = $dia;
            }
            $fecha = $fecha->subDay();
        }

        return array_reverse($serie);
    }

    /**
     * Matriculados por grado/sección del año escolar en curso.
     * @return array<int, array<string, mixed>>
     */
    private function alumnosPorGrado(): array
    {
        $anio = (string) $this->anioEscolar();

        return DB::table('alumno_seccion')
            ->join('secciones', 'secciones.id', '=', 'alumno_seccion.seccion_id')
            ->join('grados', 'grados.id', '=', 'secciones.grado_id')
            ->where('alumno_seccion.año_escolar', $anio)
            ->where('alumno_seccion.estado', 'activo')
            ->select(
                'grados.id as grado_id',
                'grados.nombre as grado',
                'grados.nivel as nivel',
                'secciones.id as seccion_id',
                'secciones.nombre as seccion',
                DB::raw('COUNT(alumno_seccion.alumno_id) as total')
            )
            ->groupBy('grados.id', 'grados.nombre', 'grados.nivel', 'secciones.id', 'secciones.nombre')
            ->orderBy('grados.nombre')
            ->orderBy('secciones.nombre')
            ->get()
            ->map(fn ($fila) => [
                'grado_id'   => (int) $fila->grado_id,
                'grado'      => $fila->grado,
                'nivel'      => $fila->nivel,
                'seccion_id' => (int) $fila->seccion_id,
                'seccion'    => $fila->seccion,
                'etiqueta'   => $fila->grado . ' ' . $fila->seccion,
                'total'      => (int) $fila->total,
            ])
            ->all();
    }

    /**
     * Distribución de alumnos por nivel para el gráfico de dona.
     * @return array<int, array<string, mixed>>
     */
    private function alumnosPorNivel(): array
    {
        $porGrado = collect($this->alumnosPorGrado());

        return $porGrado
            ->groupBy('nivel')
            ->map(fn ($filas, $nivel) => [
                'nivel'    => $nivel,
                'etiqueta' => ucfirst($nivel),
                'total'    => (int) $filas->sum('total'),
            ])
            ->values()
            ->all();
    }

    /** @return array<int, array<string, mixed>> */
    private function eventosProximos(CarbonImmutable $hoy): array
    {
        if (!Schema::hasTable('eventos')) {
            return [];
        }

        $fechaCol = Schema::hasColumn('eventos', 'fecha_inicio') ? 'fecha_inicio' : 'fecha';
        $query = DB::table('eventos')
            ->whereDate($fechaCol, '>=', $hoy->toDateString());

        if (Schema::hasColumn('eventos', 'visible')) {
            $query->where('visible', true);
        } elseif (Schema::hasColumn('eventos', 'estado')) {
            $query->where('estado', 'activo');
        }

        return $query->orderBy($fechaCol)
            ->limit(5)
            ->get()
            ->map(fn ($e) => [
                'id'     => $e->id,
                'titulo' => $e->titulo,
                'tipo'   => $e->tipo,
                'fecha'  => $e->{$fechaCol},
                'lugar'  => $e->lugar ?? null,
            ])
            ->all();
    }

    /** @return array<string, float|int>|null */
    private function pagosDelMes(CarbonImmutable $hoy): ?array
    {
        if (!Schema::hasTable('pagos')) {
            return null;
        }

        $fechaCol = Schema::hasColumn('pagos', 'fecha_pago') ? 'fecha_pago' : 'fecha';

        $fila = DB::table('pagos')
            ->whereYear($fechaCol, $hoy->year)
            ->whereMonth($fechaCol, $hoy->month)
            ->selectRaw('COUNT(*) as cantidad, COALESCE(SUM(monto), 0) as monto')
            ->first();

        return [
            'cantidad' => (int) ($fila->cantidad ?? 0),
            'monto'    => round((float) ($fila->monto ?? 0), 2),
        ];
    }

    /**
     * Carga del docente.
     * @return array<string, mixed>|null
     */
    private function cargaDelDocente(?object $usuario, CarbonImmutable $hoy): ?array
    {
        if (!$this->agenda) {
            return null;
        }

        $docente = $this->agenda->docenteDelUsuario($usuario);

        if (!$docente) {
            return null;
        }

        $dia = $this->agenda->resolverFecha($hoy->toDateString(), ['docente_id' => $docente->id]);
        $bloques = $dia['bloques'] ?? [];

        $reglas = Schema::hasTable('horario_reglas')
            ? DB::table('horario_reglas')
                ->where('docente_id', $docente->id)
                ->where('estado', true)
                ->whereDate('fecha_inicio', '<=', $hoy->toDateString())
                ->whereDate('fecha_fin', '>=', $hoy->toDateString())
                ->get()
            : collect();

        return [
            'docente_id'      => $docente->id,
            'nombre'          => $docente->nombres . ' ' . $docente->apellidos,
            'total_secciones' => $reglas->pluck('seccion_id')->unique()->count(),
            'total_cursos'    => $reglas->pluck('curso_id')->filter()->unique()->count(),
            'clases_hoy'      => count(array_filter($bloques, fn ($b) => empty($b['cancelado']))),
            'clases_canceladas_hoy' => count(array_filter($bloques, fn ($b) => !empty($b['cancelado']))),
            'es_no_lectivo'   => $dia['es_no_lectivo'] ?? false,
            'bloques_hoy'     => $bloques,
        ];
    }

    /** Año escolar configurado. */
    private function anioEscolar(): string
    {
        try {
            $config = DB::table('configuraciones')->where('clave', 'anio_escolar')->first();
            if ($config) {
                return (string) $config->valor;
            }
        } catch (\Exception $e) {}

        return (string) date('Y');
    }
}

