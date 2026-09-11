<?php

namespace App\Http\Controllers;

use App\Models\HorarioExcepcion;
use App\Services\AgendaHorarioServicio;
use Illuminate\Http\Request;

/**
 * CRUD de excepciones del horario: feriados, suspensiones, viajes, clases de
 * recuperación y actividades extracurriculares puntuales.
 *
 * Los tipos feriado/suspension/viaje cancelan los bloques regulares que caen
 * dentro de su ventana; el resto agrega bloques nuevos a esa fecha.
 */
class HorarioExcepcionControlador extends Controller
{
    public function __construct(private readonly AgendaHorarioServicio $agenda)
    {
    }

    public function index(Request $request)
    {
        $query = HorarioExcepcion::query()->with(['seccion.grado', 'curso', 'docente', 'evento']);

        if ($request->filled('seccion_id')) {
            $seccionId = $request->input('seccion_id');
            $query->where(function ($q) use ($seccionId) {
                $q->where('alcance', 'institucional')->orWhere('seccion_id', $seccionId);
            });
        }
        if ($request->filled('docente_id')) {
            $docenteId = $request->input('docente_id');
            $query->where(function ($q) use ($docenteId) {
                $q->where('alcance', 'institucional')->orWhere('docente_id', $docenteId);
            });
        }
        if ($request->filled('tipo')) {
            $query->where('tipo', $request->input('tipo'));
        }
        if ($request->filled('desde')) {
            $desde = $request->input('desde');
            $query->where(function ($q) use ($desde) {
                $q->whereDate('fecha_fin', '>=', $desde)
                    ->orWhere(function ($q2) use ($desde) {
                        $q2->whereNull('fecha_fin')->whereDate('fecha', '>=', $desde);
                    });
            });
        }
        if ($request->filled('hasta')) {
            $query->whereDate('fecha', '<=', $request->input('hasta'));
        }

        return response()->json($query->orderBy('fecha')->get());
    }

    public function store(Request $request)
    {
        $datos = $this->validar($request);

        $conflictos = $this->agenda->conflictosDeExcepcion($datos);
        if ($conflictos && !$request->boolean('forzar')) {
            return $this->respuestaConflicto($conflictos);
        }

        $datos['creado_por'] = $request->user()?->id;

        $excepcion = HorarioExcepcion::create($datos);

        return response()->json(
            $excepcion->load(['seccion.grado', 'curso', 'docente', 'evento']),
            201
        );
    }

    public function show(HorarioExcepcion $excepcion)
    {
        return response()->json($excepcion->load(['seccion.grado', 'curso', 'docente', 'evento', 'regla']));
    }

    public function update(Request $request, HorarioExcepcion $excepcion)
    {
        $datos = $this->validar($request, $excepcion);

        $conflictos = $this->agenda->conflictosDeExcepcion(array_merge([
            'seccion_id'     => $excepcion->seccion_id,
            'docente_id'     => $excepcion->docente_id,
            'fecha'          => $excepcion->fecha->toDateString(),
            'fecha_fin'      => $excepcion->fecha_fin?->toDateString(),
            'hora_inicio'    => $excepcion->hora_inicio,
            'hora_fin'       => $excepcion->hora_fin,
            'cancela_clases' => $excepcion->cancela_clases,
        ], $datos), $excepcion->id);

        if ($conflictos && !$request->boolean('forzar')) {
            return $this->respuestaConflicto($conflictos);
        }

        $excepcion->update($datos);

        return response()->json(
            $excepcion->fresh()->load(['seccion.grado', 'curso', 'docente', 'evento'])
        );
    }

    public function destroy(HorarioExcepcion $excepcion)
    {
        $excepcion->delete();

        return response()->json(null, 204);
    }

    /** @return array<string, mixed> */
    private function validar(Request $request, ?HorarioExcepcion $excepcion = null): array
    {
        $obligatorio = $excepcion ? 'sometimes' : 'required';

        $datos = $request->validate([
            'tipo'           => $obligatorio . '|in:feriado,suspension,viaje,recuperacion,extracurricular,cambio_horario,otro',
            'alcance'        => 'nullable|in:institucional,seccion,docente',
            'seccion_id'     => 'nullable|exists:secciones,id',
            'docente_id'     => 'nullable|exists:docentes,id',
            'curso_id'       => 'nullable|exists:cursos,id',
            'regla_id'       => 'nullable|exists:horario_reglas,id',
            'evento_id'      => 'nullable|exists:eventos,id',
            'titulo'         => $obligatorio . '|string|max:200',
            'descripcion'    => 'nullable|string|max:2000',
            'fecha'          => $obligatorio . '|date',
            'fecha_fin'      => 'nullable|date|after_or_equal:fecha',
            'hora_inicio'    => 'nullable|date_format:H:i',
            'hora_fin'       => 'nullable|date_format:H:i|after:hora_inicio',
            'aula'           => 'nullable|string|max:50',
            'cancela_clases' => 'boolean',
            'estado'         => 'boolean',
        ]);

        $tipo = $datos['tipo'] ?? $excepcion?->tipo ?? 'otro';

        // Por defecto, el tipo decide si cancela: feriado/suspensión/viaje sí,
        // recuperación/actividad no. El cliente puede sobrescribirlo.
        if (!array_key_exists('cancela_clases', $datos)) {
            $datos['cancela_clases'] = in_array($tipo, HorarioExcepcion::TIPOS_QUE_CANCELAN, true);
        }

        // El alcance se infiere de los ids recibidos si no viene explícito.
        if (empty($datos['alcance'])) {
            $seccionId = $datos['seccion_id'] ?? $excepcion?->seccion_id;
            $docenteId = $datos['docente_id'] ?? $excepcion?->docente_id;

            $datos['alcance'] = $seccionId ? 'seccion' : ($docenteId ? 'docente' : 'institucional');
        }

        if ($datos['alcance'] === 'seccion' && empty($datos['seccion_id']) && !$excepcion?->seccion_id) {
            abort(response()->json([
                'message' => 'Una excepción de alcance sección necesita una sección.',
                'errors'  => ['seccion_id' => ['Selecciona la sección afectada.']],
            ], 422));
        }
        if ($datos['alcance'] === 'docente' && empty($datos['docente_id']) && !$excepcion?->docente_id) {
            abort(response()->json([
                'message' => 'Una excepción de alcance docente necesita un docente.',
                'errors'  => ['docente_id' => ['Selecciona el docente afectado.']],
            ], 422));
        }

        // Los bloques que se agregan (recuperación, actividad) sí necesitan hora.
        $agregaBloque = !$datos['cancela_clases'];
        $horaInicio = $datos['hora_inicio'] ?? $excepcion?->hora_inicio;
        $horaFin    = $datos['hora_fin'] ?? $excepcion?->hora_fin;

        if ($agregaBloque && (!$horaInicio || !$horaFin)) {
            abort(response()->json([
                'message' => 'Una clase de recuperación o actividad necesita hora de inicio y fin.',
                'errors'  => ['hora_inicio' => ['Indica la franja horaria.']],
            ], 422));
        }

        if (!$excepcion) {
            $datos['estado'] = $datos['estado'] ?? true;
        }

        return $datos;
    }

    /** @param  array<int, array<string, string|int>>  $conflictos */
    private function respuestaConflicto(array $conflictos)
    {
        return response()->json([
            'message'    => 'La excepción se cruza con clases ya programadas.',
            'conflictos' => $conflictos,
            'sugerencia' => 'Cambia la franja horaria o reenvía con forzar=true para guardarla igual.',
        ], 422);
    }
}
