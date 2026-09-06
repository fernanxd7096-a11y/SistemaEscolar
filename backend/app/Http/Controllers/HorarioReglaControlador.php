<?php

namespace App\Http\Controllers;

use App\Models\HorarioRegla;
use App\Services\AgendaHorarioServicio;
use Illuminate\Http\Request;

/**
 * CRUD de reglas recurrentes del horario.
 *
 * Una regla reemplaza a "crear cada lunes a mano": guarda los días de la semana,
 * la franja horaria y el rango de fechas de vigencia. Las ocurrencias se calculan
 * al consultar la agenda (ver AgendaHorarioControlador).
 */
class HorarioReglaControlador extends Controller
{
    public function __construct(private readonly AgendaHorarioServicio $agenda)
    {
    }

    public function index(Request $request)
    {
        $query = HorarioRegla::query()->with(['seccion.grado', 'curso', 'docente']);

        if ($request->filled('seccion_id')) {
            $query->where('seccion_id', $request->input('seccion_id'));
        }
        if ($request->filled('docente_id')) {
            $query->where('docente_id', $request->input('docente_id'));
        }
        if ($request->filled('curso_id')) {
            $query->where('curso_id', $request->input('curso_id'));
        }
        if ($request->filled('tipo')) {
            $query->where('tipo', $request->input('tipo'));
        }
        if ($request->filled('año_escolar')) {
            $query->where('año_escolar', $request->input('año_escolar'));
        }
        if ($request->filled('estado')) {
            $query->where('estado', $request->boolean('estado'));
        }
        // Solo las reglas vigentes en una fecha dada.
        if ($request->filled('vigente_en')) {
            $query->whereDate('fecha_inicio', '<=', $request->input('vigente_en'))
                ->whereDate('fecha_fin', '>=', $request->input('vigente_en'));
        }

        return response()->json(
            $query->orderBy('fecha_inicio')->orderBy('hora_inicio')->get()
        );
    }

    public function store(Request $request)
    {
        $datos = $this->validar($request);

        $conflictos = $this->agenda->conflictosDeRegla($datos);
        if ($conflictos && !$request->boolean('forzar')) {
            return $this->respuestaConflicto($conflictos);
        }

        $regla = HorarioRegla::create($datos);

        return response()->json($regla->load(['seccion.grado', 'curso', 'docente']), 201);
    }

    public function show(HorarioRegla $regla)
    {
        return response()->json($regla->load(['seccion.grado', 'curso', 'docente', 'excepciones']));
    }

    public function update(Request $request, HorarioRegla $regla)
    {
        $datos = $this->validar($request, $regla);

        $conflictos = $this->agenda->conflictosDeRegla(array_merge([
            'seccion_id'   => $regla->seccion_id,
            'docente_id'   => $regla->docente_id,
            'dias_semana'  => $regla->dias_semana,
            'hora_inicio'  => $regla->hora_inicio,
            'hora_fin'     => $regla->hora_fin,
            'fecha_inicio' => $regla->fecha_inicio->toDateString(),
            'fecha_fin'    => $regla->fecha_fin->toDateString(),
        ], $datos), $regla->id);

        if ($conflictos && !$request->boolean('forzar')) {
            return $this->respuestaConflicto($conflictos);
        }

        $regla->update($datos);
        $regla->sincronizarHaciaHorario();

        return response()->json($regla->fresh()->load(['seccion.grado', 'curso', 'docente']));
    }

    public function destroy(HorarioRegla $regla)
    {
        // Si la regla es espejo de una fila legacy, se borra esa fila: su evento
        // `deleted` arrastra la regla (ver App\Models\Horario::booted).
        if ($regla->esEspejoLegacy() && $regla->horario) {
            $regla->horario->delete();
        } else {
            $regla->delete();
        }

        return response()->json(null, 204);
    }

    /**
     * Comprobación previa sin guardar nada: la app la usa para avisar al usuario
     * antes de enviar el formulario.
     */
    public function verificarConflictos(Request $request)
    {
        $datos = $request->validate([
            'seccion_id'      => 'required|exists:secciones,id',
            'docente_id'      => 'nullable|exists:docentes,id',
            'dias_semana'     => 'required|array|min:1',
            'dias_semana.*'   => 'in:' . implode(',', HorarioRegla::DIAS),
            'hora_inicio'     => 'required|date_format:H:i',
            'hora_fin'        => 'required|date_format:H:i|after:hora_inicio',
            'fecha_inicio'    => 'required|date',
            'fecha_fin'       => 'required|date|after_or_equal:fecha_inicio',
            'ignorar_regla_id' => 'nullable|exists:horario_reglas,id',
        ]);

        $conflictos = $this->agenda->conflictosDeRegla($datos, $datos['ignorar_regla_id'] ?? null);

        return response()->json([
            'hay_conflictos' => count($conflictos) > 0,
            'conflictos'     => $conflictos,
        ]);
    }

    /** @return array<string, mixed> */
    private function validar(Request $request, ?HorarioRegla $regla = null): array
    {
        $obligatorio = $regla ? 'sometimes' : 'required';

        $datos = $request->validate([
            'seccion_id'    => $obligatorio . '|exists:secciones,id',
            'curso_id'      => 'nullable|exists:cursos,id',
            'docente_id'    => 'nullable|exists:docentes,id',
            'tipo'          => 'nullable|in:clase,recuperacion,extracurricular,taller,tutoria,otro',
            'titulo'        => 'nullable|string|max:150',
            'dias_semana'   => $obligatorio . '|array|min:1',
            'dias_semana.*' => 'in:' . implode(',', HorarioRegla::DIAS),
            'hora_inicio'   => $obligatorio . '|date_format:H:i',
            'hora_fin'      => $obligatorio . '|date_format:H:i|after:hora_inicio',
            'aula'          => 'nullable|string|max:50',
            'fecha_inicio'  => $obligatorio . '|date',
            'fecha_fin'     => $obligatorio . '|date|after_or_equal:fecha_inicio',
            'año_escolar'   => 'nullable|string|max:20',
            'observacion'   => 'nullable|string|max:1000',
            'estado'        => 'boolean',
        ]);

        // Una clase sin curso no tiene sentido; el resto de tipos (viaje, taller)
        // puede describirse solo con un título.
        $tipo = $datos['tipo'] ?? $regla?->tipo ?? 'clase';
        if ($tipo === 'clase' && empty($datos['curso_id']) && !$regla?->curso_id) {
            abort(response()->json([
                'message' => 'Una regla de tipo clase necesita un curso.',
                'errors'  => ['curso_id' => ['Selecciona el curso de la clase.']],
            ], 422));
        }

        if (!$regla) {
            $datos['tipo']        = $tipo;
            $datos['estado']      = $datos['estado'] ?? true;
            $datos['año_escolar'] = $datos['año_escolar']
                ?? substr((string) $datos['fecha_inicio'], 0, 4);
        }

        return $datos;
    }

    /** @param  array<int, array<string, string|int>>  $conflictos */
    private function respuestaConflicto(array $conflictos)
    {
        return response()->json([
            'message'    => 'La regla choca con otro bloque ya programado.',
            'conflictos' => $conflictos,
            'sugerencia' => 'Cambia el horario o los días, o reenvía con forzar=true para guardarla igual.',
        ], 422);
    }
}
