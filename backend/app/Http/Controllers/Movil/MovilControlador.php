<?php

namespace App\Http\Controllers\Movil;

use App\Http\Controllers\Controller;
use App\Models\Alumno;
use App\Models\Asistencia;
use App\Models\Comunicado;
use App\Models\Nota;
use App\Models\Padre;
use App\Models\Horario;
use App\Models\Pago;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MovilControlador extends Controller
{
    /**
     * Perfil del padre autenticado con sus hijos.
     * GET /api/movil/perfil
     */
    public function perfil(Request $request)
    {
        $usuario = $request->user();

        $padre = $this->obtenerPadreAutenticado($usuario);

        if (!$padre) {
            return response()->json([
                'error' => 'No se encontró un perfil de padre asociado a este usuario.',
            ], 404);
        }

        $padre->load(['alumnos' => function ($q) {
            $q->where('estado', true)
              ->with(['secciones' => function ($sq) {
                  $sq->with('grado')->latest('alumno_seccion.created_at');
              }]);
        }]);

        $hijos = $padre->alumnos->map(function ($alumno) {
            $seccionActual = $alumno->secciones->first();
            return [
                'id'               => $alumno->id,
                'nombres'          => $alumno->nombres,
                'apellidos'        => $alumno->apellidos,
                'dni'              => $alumno->dni,
                'foto'             => $alumno->foto ?? null,
                'grado'            => $seccionActual?->grado?->nombre,
                'nivel'            => $seccionActual?->grado?->nivel,
                'seccion'          => $seccionActual?->nombre,
                'seccion_id'       => $seccionActual?->id,
            ];
        });

        return response()->json([
            'padre' => [
                'id'       => $padre->id,
                'nombres'  => $padre->nombres,
                'apellidos' => $padre->apellidos,
                'dni'      => $padre->dni,
                'relacion' => $padre->relacion,
                'telefono' => $padre->telefono,
                'email'    => $padre->email,
            ],
            'hijos' => $hijos,
        ]);
    }

    /**
     * Resumen del hijo: asistencia del mes, último promedio, próximas clases.
     * GET /api/movil/hijo/{alumno}/resumen
     */
    public function resumenHijo(Request $request, Alumno $alumno)
    {
        $this->verificarAccesoHijo($request, $alumno);

        $seccion = $alumno->secciones()->with('grado')->first();
        $inicioMes = Carbon::now()->startOfMonth();

        // Asistencia del mes
        $asistenciaMes = Asistencia::where('alumno_id', $alumno->id)
            ->whereDate('fecha', '>=', $inicioMes)
            ->selectRaw("
                COUNT(*) as total,
                SUM(CASE WHEN estado = 'presente' THEN 1 ELSE 0 END) as presentes,
                SUM(CASE WHEN estado = 'tardanza' THEN 1 ELSE 0 END) as tardanzas,
                SUM(CASE WHEN estado = 'falta' THEN 1 ELSE 0 END) as faltas,
                SUM(CASE WHEN estado = 'justificado' THEN 1 ELSE 0 END) as justificados
            ")
            ->first();

        $totalAsist = (int) $asistenciaMes->total;
        $porcentaje = $totalAsist > 0
            ? round(((int) $asistenciaMes->presentes + (int) $asistenciaMes->tardanzas) / $totalAsist * 100, 1)
            : 0;

        // Promedio general de notas
        $promedioGeneral = Nota::where('alumno_id', $alumno->id)
            ->avg('calificacion');

        // Asistencia de hoy
        $asistenciaHoy = Asistencia::where('alumno_id', $alumno->id)
            ->whereDate('fecha', Carbon::today())
            ->first();

        // Próximas clases de hoy
        $diaHoy = Carbon::now()->locale('es')->dayName;
        $diasMap = [
            'lunes' => 'lunes', 'martes' => 'martes', 'miércoles' => 'miercoles',
            'jueves' => 'jueves', 'viernes' => 'viernes',
        ];
        $diaSemana = $diasMap[$diaHoy] ?? null;

        $horarioHoy = [];
        if ($seccion && $diaSemana) {
            $horarioHoy = Horario::where('seccion_id', $seccion->id)
                ->where('dia_semana', $diaSemana)
                ->where('estado', true)
                ->with('curso', 'docente')
                ->orderBy('hora_inicio')
                ->get()
                ->map(fn ($h) => [
                    'curso'      => $h->curso?->nombre,
                    'docente'    => $h->docente ? "{$h->docente->nombres} {$h->docente->apellidos}" : null,
                    'hora_inicio' => $h->hora_inicio,
                    'hora_fin'   => $h->hora_fin,
                    'aula'       => $h->aula,
                ]);
        }

        return response()->json([
            'alumno' => [
                'id'        => $alumno->id,
                'nombres'   => $alumno->nombres,
                'apellidos' => $alumno->apellidos,
                'grado'     => $seccion?->grado?->nombre,
                'seccion'   => $seccion?->nombre,
            ],
            'asistencia_mes' => [
                'presentes'    => (int) $asistenciaMes->presentes,
                'tardanzas'    => (int) $asistenciaMes->tardanzas,
                'faltas'       => (int) $asistenciaMes->faltas,
                'justificados' => (int) $asistenciaMes->justificados,
                'total'        => $totalAsist,
                'porcentaje'   => $porcentaje,
            ],
            'asistencia_hoy' => $asistenciaHoy ? [
                'estado'      => $asistenciaHoy->estado,
                'observacion' => $asistenciaHoy->observacion,
            ] : null,
            'promedio_general' => $promedioGeneral ? round($promedioGeneral, 1) : null,
            'horario_hoy'      => $horarioHoy,
        ]);
    }

    /**
     * Notas del hijo agrupadas por curso y bimestre.
     * GET /api/movil/hijo/{alumno}/notas
     */
    public function notasHijo(Request $request, Alumno $alumno)
    {
        $this->verificarAccesoHijo($request, $alumno);

        $seccion = $alumno->secciones()->first();
        $notas = Nota::where('alumno_id', $alumno->id)
            ->with('curso')
            ->orderBy('curso_id')
            ->orderBy('bimestre')
            ->get();

        $porCurso = $notas->groupBy('curso_id')->map(function ($notasCurso) {
            $curso = $notasCurso->first()->curso;
            $bimestres = [];
            for ($b = 1; $b <= 4; $b++) {
                $del = $notasCurso->where('bimestre', $b);
                $bimestres["bimestre_{$b}"] = $del->isEmpty() ? null : round($del->avg('calificacion'), 1);
            }
            return [
                'curso'          => $curso->nombre,
                'promedio_final' => round($notasCurso->avg('calificacion'), 1),
                ...$bimestres,
            ];
        })->values();

        return response()->json([
            'alumno_id' => $alumno->id,
            'cursos'    => $porCurso,
        ]);
    }

    /**
     * Historial de asistencia del hijo (últimos 30 días por defecto).
     * GET /api/movil/hijo/{alumno}/asistencia
     */
    public function asistenciaHijo(Request $request, Alumno $alumno)
    {
        $this->verificarAccesoHijo($request, $alumno);

        $dias = $request->input('dias', 30);
        $desde = Carbon::today()->subDays($dias);

        $asistencias = Asistencia::where('alumno_id', $alumno->id)
            ->whereDate('fecha', '>=', $desde)
            ->orderByDesc('fecha')
            ->get()
            ->map(fn ($a) => [
                'fecha'       => $a->fecha,
                'estado'      => $a->estado,
                'observacion' => $a->observacion,
            ]);

        // Resumen
        $resumen = [
            'presente'    => $asistencias->where('estado', 'presente')->count(),
            'tardanza'    => $asistencias->where('estado', 'tardanza')->count(),
            'falta'       => $asistencias->where('estado', 'falta')->count(),
            'justificado' => $asistencias->where('estado', 'justificado')->count(),
        ];

        return response()->json([
            'alumno_id'   => $alumno->id,
            'desde'       => $desde->toDateString(),
            'resumen'     => $resumen,
            'detalle'     => $asistencias,
        ]);
    }

    /**
     * Horario semanal del hijo.
     * GET /api/movil/hijo/{alumno}/horario
     */
    public function horarioHijo(Request $request, Alumno $alumno)
    {
        $this->verificarAccesoHijo($request, $alumno);

        $seccion = $alumno->secciones()->first();

        if (!$seccion) {
            return response()->json(['horario' => []]);
        }

        $horarios = Horario::where('seccion_id', $seccion->id)
            ->where('estado', true)
            ->with('curso', 'docente')
            ->orderByRaw("CASE dia_semana 
                WHEN 'lunes' THEN 1 WHEN 'martes' THEN 2 WHEN 'miercoles' THEN 3 
                WHEN 'jueves' THEN 4 WHEN 'viernes' THEN 5 ELSE 6 END")
            ->orderBy('hora_inicio')
            ->get()
            ->groupBy('dia_semana')
            ->map(function ($horariosDia) {
                return $horariosDia->map(fn ($h) => [
                    'curso'       => $h->curso?->nombre,
                    'docente'     => $h->docente ? "{$h->docente->apellidos}, {$h->docente->nombres}" : null,
                    'hora_inicio' => $h->hora_inicio,
                    'hora_fin'    => $h->hora_fin,
                    'aula'        => $h->aula,
                ]);
            });

        return response()->json([
            'alumno_id' => $alumno->id,
            'seccion'   => $seccion->nombre,
            'grado'     => $seccion->grado?->nombre,
            'horario'   => $horarios,
        ]);
    }

    /**
     * Comunicados (últimos 20, filtrable por tipo).
     * GET /api/movil/comunicados
     */
    public function comunicados(Request $request)
    {
        $query = Comunicado::where('estado', true)
            ->orderByDesc('created_at');

        if ($request->filled('tipo')) {
            $query->where('tipo', $request->input('tipo'));
        }

        $comunicados = $query->limit(20)->get()->map(fn ($c) => [
            'id'         => $c->id,
            'titulo'     => $c->titulo,
            'contenido'  => $c->contenido,
            'tipo'       => $c->tipo,
            'fecha'      => $c->created_at?->toDateTimeString(),
        ]);

        return response()->json(['comunicados' => $comunicados]);
    }

    /**
     * Detalle de un comunicado.
     * GET /api/movil/comunicados/{comunicado}
     */
    public function comunicadoDetalle(Comunicado $comunicado)
    {
        return response()->json([
            'id'            => $comunicado->id,
            'titulo'        => $comunicado->titulo,
            'contenido'     => $comunicado->contenido,
            'tipo'          => $comunicado->tipo,
            'destinatarios' => $comunicado->destinatarios,
            'fecha'         => $comunicado->created_at?->toDateTimeString(),
        ]);
    }

    /**
     * Pagos del hijo (matrícula, eventos, etc.).
     * GET /api/movil/hijo/{alumno}/pagos
     */
    public function pagosHijo(Request $request, Alumno $alumno)
    {
        $this->verificarAccesoHijo($request, $alumno);

        $query = Pago::where('alumno_id', $alumno->id)
            ->with(['conceptoPago:id,nombre', 'evento:id,titulo', 'comprobante:id,pago_id,numero_comprobante,tipo'])
            ->orderByDesc('fecha_pago');

        if ($request->filled('tipo') && $request->input('tipo') === 'evento') {
            $query->whereNotNull('evento_id');
        } elseif ($request->filled('tipo') && $request->input('tipo') === 'matricula') {
            $query->whereNull('evento_id');
        }

        $pagos = $query->get()->map(fn ($p) => [
            'id'                 => $p->id,
            'monto'              => $p->monto,
            'fecha_pago'         => $p->fecha_pago,
            'metodo_pago'        => $p->metodo_pago,
            'estado'             => $p->estado,
            'concepto'           => $p->conceptoPago?->nombre,
            'evento'             => $p->evento?->titulo,
            'comprobante'        => $p->comprobante?->numero_comprobante,
        ]);

        return response()->json([
            'alumno_id' => $alumno->id,
            'pagos'     => $pagos,
            'resumen'   => [
                'total'   => $pagos->count(),
                'pagados' => $pagos->where('estado', 'pagado')->count(),
                'monto'   => $pagos->where('estado', 'pagado')->sum('monto'),
            ],
        ]);
    }

    /**
     * Verificar que el padre tiene acceso al alumno.
     */
    private function verificarAccesoHijo(Request $request, Alumno $alumno): void
    {
        $usuario = $request->user();

        // Administradores siempre tienen acceso
        if ($usuario->hasRole('administrador') || $usuario->hasRole('director')) {
            return;
        }

        $padre = $this->obtenerPadreAutenticado($usuario);

        if (!$padre || !$padre->alumnos()->where('alumnos.id', $alumno->id)->exists()) {
            abort(403, 'No tienes permiso para ver la información de este alumno.');
        }
    }

    /**
     * Resolver padre autenticado por usuario_id o por email institucional.
     */
    private function obtenerPadreAutenticado($usuario): ?Padre
    {
        $padre = Padre::where('usuario_id', $usuario->id)->first();
        if (!$padre && $usuario->email) {
            $padre = Padre::where('email', $usuario->email)->first();
            if ($padre && !$padre->usuario_id) {
                $padre->usuario_id = $usuario->id;
                $padre->save();
            }
        }
        return $padre;
    }
}
