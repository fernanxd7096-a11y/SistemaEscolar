<?php

namespace App\Http\Controllers;

use App\Models\Alumno;
use App\Models\Curso;
use App\Models\Docente;
use App\Models\Seccion;
use App\Models\Usuario;
use App\Services\AgendaHorarioServicio;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;
use Carbon\CarbonImmutable;

class DashboardControlador extends Controller
{
    public function __construct(private readonly AgendaHorarioServicio $agenda)
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

        $anioEscolar = $this->anioEscolar();

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
     * KPIs y series para los gráficos del inicio de la app móvil.
     *
     * La respuesta se arma según el rol: administrador/director/secretario reciben
     * los datos globales del colegio, y el docente su propia carga (secciones,
     * cursos y clases de hoy resueltas desde la agenda). Las claves globales se
     * omiten para el docente en vez de devolverlas en cero, para que la pantalla
     * sepa qué tarjetas pintar.
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
     * Conteo de asistencia de una fecha por estado, con el porcentaje de
     * puntualidad (presentes sobre lo registrado).
     *
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
     *
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
     *
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
     * Distribución de alumnos por nivel (inicial/primaria/secundaria) para el
     * gráfico de dona.
     *
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

        return DB::table('eventos')
            ->where('visible', true)
            ->whereDate('fecha', '>=', $hoy->toDateString())
            ->orderBy('fecha')
            ->limit(5)
            ->get(['id', 'titulo', 'tipo', 'fecha', 'lugar'])
            ->map(fn ($e) => (array) $e)
            ->all();
    }

    /** @return array<string, float|int>|null */
    private function pagosDelMes(CarbonImmutable $hoy): ?array
    {
        if (!Schema::hasTable('pagos')) {
            return null;
        }

        $fila = DB::table('pagos')
            ->whereYear('fecha', $hoy->year)
            ->whereMonth('fecha', $hoy->month)
            ->selectRaw('COUNT(*) as cantidad, COALESCE(SUM(monto), 0) as monto')
            ->first();

        return [
            'cantidad' => (int) ($fila->cantidad ?? 0),
            'monto'    => round((float) ($fila->monto ?? 0), 2),
        ];
    }

    /**
     * Carga del docente que consulta: sus secciones y cursos (derivados de las
     * reglas del horario) y las clases que le tocan hoy, ya resueltas contra
     * feriados, viajes y recuperaciones.
     *
     * @return array<string, mixed>|null
     */
    private function cargaDelDocente(?object $usuario, CarbonImmutable $hoy): ?array
    {
        $docente = $this->agenda->docenteDelUsuario($usuario);

        if (!$docente) {
            return null;
        }

        $dia = $this->agenda->resolverFecha($hoy->toDateString(), ['docente_id' => $docente->id]);
        $bloques = $dia['bloques'] ?? [];

        $reglas = DB::table('horario_reglas')
            ->where('docente_id', $docente->id)
            ->where('estado', true)
            ->whereDate('fecha_inicio', '<=', $hoy->toDateString())
            ->whereDate('fecha_fin', '>=', $hoy->toDateString())
            ->get();

        return [
            'docente_id'      => $docente->id,
            'nombre'          => $docente->nombres . ' ' . $docente->apellidos,
            'total_secciones' => $reglas->pluck('seccion_id')->unique()->count(),
            'total_cursos'    => $reglas->pluck('curso_id')->filter()->unique()->count(),
            'clases_hoy'      => count(array_filter($bloques, fn ($b) => !$b['cancelado'])),
            'clases_canceladas_hoy' => count(array_filter($bloques, fn ($b) => $b['cancelado'])),
            'es_no_lectivo'   => $dia['es_no_lectivo'] ?? false,
            'bloques_hoy'     => $bloques,
        ];
    }

    /** Año escolar configurado, con el año calendario como respaldo. */
    private function anioEscolar(): string
    {
        try {
            $config = DB::table('configuraciones')->where('clave', 'anio_escolar')->first();
            if ($config) {
                return (string) $config->valor;
            }
        } catch (\Exception $e) {
            // La tabla de configuraciones es opcional en este despliegue.
        }

        return (string) date('Y');
    }
}
