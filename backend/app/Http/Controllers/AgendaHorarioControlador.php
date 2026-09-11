<?php

namespace App\Http\Controllers;

use App\Services\AgendaHorarioServicio;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;

/**
 * Consulta del horario ya resuelto: reglas recurrentes + excepciones aplicadas,
 * día por día. Es lo que consume la app móvil para pintar "hoy" y la semana.
 */
class AgendaHorarioControlador extends Controller
{
    public function __construct(private readonly AgendaHorarioServicio $agenda)
    {
    }

    /**
     * GET /horarios/agenda?seccion_id=&docente_id=&desde=&hasta=
     */
    public function agenda(Request $request)
    {
        $datos = $request->validate([
            'seccion_id' => 'nullable|exists:secciones,id',
            'docente_id' => 'nullable|exists:docentes,id',
            'desde'      => 'nullable|date',
            'hasta'      => 'nullable|date',
        ]);

        [$desde, $hasta] = $this->rango($datos);

        return response()->json([
            'desde'      => $desde,
            'hasta'      => $hasta,
            'seccion_id' => $datos['seccion_id'] ?? null,
            'docente_id' => $datos['docente_id'] ?? null,
            'dias'       => $this->agenda->resolver($desde, $hasta, [
                'seccion_id' => isset($datos['seccion_id']) ? (int) $datos['seccion_id'] : null,
                'docente_id' => isset($datos['docente_id']) ? (int) $datos['docente_id'] : null,
            ]),
        ]);
    }

    /**
     * GET /horarios/mi-agenda?desde=&hasta=
     *
     * Agenda del docente que está usando la app. Si el usuario no tiene un registro
     * de docente asociado (por `usuario_id` o por email), devuelve la agenda vacía
     * en vez de un error, para que la pantalla pueda explicar la situación.
     */
    public function miAgenda(Request $request)
    {
        $datos = $request->validate([
            'desde' => 'nullable|date',
            'hasta' => 'nullable|date',
        ]);

        [$desde, $hasta] = $this->rango($datos);

        $docente = $this->agenda->docenteDelUsuario($request->user());

        return response()->json([
            'desde'   => $desde,
            'hasta'   => $hasta,
            'docente' => $docente ? [
                'id'        => $docente->id,
                'nombres'   => $docente->nombres,
                'apellidos' => $docente->apellidos,
            ] : null,
            'dias' => $docente
                ? $this->agenda->resolver($desde, $hasta, ['docente_id' => $docente->id])
                : [],
        ]);
    }

    /**
     * Rango por defecto: la semana en curso (lunes a domingo).
     *
     * @param  array<string, mixed>  $datos
     * @return array{0:string, 1:string}
     */
    private function rango(array $datos): array
    {
        $hoy = CarbonImmutable::today();

        $desde = !empty($datos['desde'])
            ? CarbonImmutable::parse($datos['desde'])
            : $hoy->startOfWeek();

        $hasta = !empty($datos['hasta'])
            ? CarbonImmutable::parse($datos['hasta'])
            : $desde->endOfWeek();

        return [$desde->toDateString(), $hasta->toDateString()];
    }
}
