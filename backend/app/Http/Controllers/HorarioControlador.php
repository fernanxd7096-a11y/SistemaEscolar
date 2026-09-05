<?php

namespace App\Http\Controllers;

use App\Models\Horario;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;

class HorarioControlador extends Controller
{
    public function index(Request $request)
    {
        $query = Horario::query()->with(['seccion.grado', 'curso', 'docente']);

        if ($request->filled('seccion_id')) {
            $query->where('seccion_id', $request->input('seccion_id'));
        }

        if ($request->filled('docente_id')) {
            $query->where('docente_id', $request->input('docente_id'));
        }

        if ($request->filled('dia_semana')) {
            $query->where('dia_semana', $request->input('dia_semana'));
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->boolean('estado'));
        }

        $horarios = $query->orderByRaw("CASE dia_semana WHEN 'lunes' THEN 1 WHEN 'martes' THEN 2 WHEN 'miercoles' THEN 3 WHEN 'jueves' THEN 4 WHEN 'viernes' THEN 5 END")
            ->orderBy('hora_inicio')
            ->get()
            ->map(function (Horario $h) {
                $h->hora_inicio = $this->normalizarHora($h->hora_inicio);
                $h->hora_fin = $this->normalizarHora($h->hora_fin);
                return $h;
            });

        return response()->json($horarios);
    }

    public function store(Request $request)
    {
        $this->normalizarRequestHoras($request);

        $datos = $request->validate([
            'seccion_id'  => 'required|exists:secciones,id',
            'curso_id'    => 'required|exists:cursos,id',
            'docente_id'  => 'nullable|exists:docentes,id',
            'dia_semana'  => 'required|in:lunes,martes,miercoles,jueves,viernes',
            'hora_inicio' => ['required', 'regex:/^\d{2}:\d{2}(:\d{2})?$/'],
            'hora_fin'    => ['required', 'regex:/^\d{2}:\d{2}(:\d{2})?$/', 'after:hora_inicio'],
            'aula'        => 'nullable|string|max:50',
            'estado'      => 'boolean',
        ], [
            'hora_inicio.regex' => 'La hora de inicio no es válida.',
            'hora_fin.regex'    => 'La hora de fin no es válida.',
            'hora_fin.after'    => 'La hora de fin debe ser posterior a la hora de inicio.',
        ]);

        $datos['hora_inicio'] = $this->normalizarHora($datos['hora_inicio']);
        $datos['hora_fin'] = $this->normalizarHora($datos['hora_fin']);
        $datos['estado'] = $datos['estado'] ?? true;

        $conflicto = $this->conflictoSeccion($datos['seccion_id'], $datos['dia_semana'], $datos['hora_inicio'], $datos['hora_fin']);
        if ($conflicto) {
            return response()->json(['mensaje' => $conflicto], 422);
        }

        if (!empty($datos['docente_id'])) {
            $conflictoDocente = $this->conflictoDocente($datos['docente_id'], $datos['dia_semana'], $datos['hora_inicio'], $datos['hora_fin']);
            if ($conflictoDocente) {
                return response()->json(['mensaje' => $conflictoDocente], 422);
            }
        }

        try {
            $horario = Horario::create($datos);
        } catch (QueryException $e) {
            if ($this->esConflictoUnico($e)) {
                return response()->json([
                    'mensaje' => 'Ya existe una clase con la misma hora de inicio en esta sección y día.',
                ], 422);
            }
            throw $e;
        }

        $horario = $horario->load(['seccion.grado', 'curso', 'docente']);
        $horario->hora_inicio = $this->normalizarHora($horario->hora_inicio);
        $horario->hora_fin = $this->normalizarHora($horario->hora_fin);

        return response()->json($horario, 201);
    }

    public function show(Horario $horario)
    {
        $horario->load(['seccion.grado', 'curso', 'docente']);
        $horario->hora_inicio = $this->normalizarHora($horario->hora_inicio);
        $horario->hora_fin = $this->normalizarHora($horario->hora_fin);

        return response()->json($horario);
    }

    public function update(Request $request, Horario $horario)
    {
        $this->normalizarRequestHoras($request);

        $datos = $request->validate([
            'seccion_id'  => 'sometimes|exists:secciones,id',
            'curso_id'    => 'sometimes|exists:cursos,id',
            'docente_id'  => 'nullable|exists:docentes,id',
            'dia_semana'  => 'sometimes|in:lunes,martes,miercoles,jueves,viernes',
            'hora_inicio' => ['sometimes', 'regex:/^\d{2}:\d{2}(:\d{2})?$/'],
            'hora_fin'    => ['sometimes', 'regex:/^\d{2}:\d{2}(:\d{2})?$/'],
            'aula'        => 'nullable|string|max:50',
            'estado'      => 'boolean',
        ], [
            'hora_inicio.regex' => 'La hora de inicio no es válida.',
            'hora_fin.regex'    => 'La hora de fin no es válida.',
        ]);

        if (isset($datos['hora_inicio'])) {
            $datos['hora_inicio'] = $this->normalizarHora($datos['hora_inicio']);
        }
        if (isset($datos['hora_fin'])) {
            $datos['hora_fin'] = $this->normalizarHora($datos['hora_fin']);
        }

        $seccionId = $datos['seccion_id'] ?? $horario->seccion_id;
        $dia = $datos['dia_semana'] ?? $horario->dia_semana;
        $inicio = $datos['hora_inicio'] ?? $this->normalizarHora($horario->hora_inicio);
        $fin = $datos['hora_fin'] ?? $this->normalizarHora($horario->hora_fin);
        $docenteId = array_key_exists('docente_id', $datos) ? $datos['docente_id'] : $horario->docente_id;

        if ($fin <= $inicio) {
            return response()->json(['mensaje' => 'La hora de fin debe ser posterior a la hora de inicio.'], 422);
        }

        $conflicto = $this->conflictoSeccion($seccionId, $dia, $inicio, $fin, $horario->id);
        if ($conflicto) {
            return response()->json(['mensaje' => $conflicto], 422);
        }

        if ($docenteId) {
            $conflictoDocente = $this->conflictoDocente($docenteId, $dia, $inicio, $fin, $horario->id);
            if ($conflictoDocente) {
                return response()->json(['mensaje' => $conflictoDocente], 422);
            }
        }

        try {
            $horario->update($datos);
        } catch (QueryException $e) {
            if ($this->esConflictoUnico($e)) {
                return response()->json([
                    'mensaje' => 'Ya existe una clase con la misma hora de inicio en esta sección y día.',
                ], 422);
            }
            throw $e;
        }

        $fresh = $horario->fresh()->load(['seccion.grado', 'curso', 'docente']);
        $fresh->hora_inicio = $this->normalizarHora($fresh->hora_inicio);
        $fresh->hora_fin = $this->normalizarHora($fresh->hora_fin);

        return response()->json($fresh);
    }

    public function destroy(Horario $horario)
    {
        $horario->delete();
        return response()->json(null, 204);
    }

    private function normalizarRequestHoras(Request $request): void
    {
        foreach (['hora_inicio', 'hora_fin'] as $campo) {
            if ($request->filled($campo)) {
                $request->merge([$campo => $this->normalizarHora($request->input($campo))]);
            }
        }
    }

    private function normalizarHora(mixed $hora): string
    {
        if ($hora === null || $hora === '') {
            return '00:00';
        }

        $texto = (string) $hora;
        // Soporta "08:00", "08:00:00", "8:00"
        if (preg_match('/^(\d{1,2}):(\d{2})/', $texto, $m)) {
            return sprintf('%02d:%02d', (int) $m[1], (int) $m[2]);
        }

        return substr($texto, 0, 5);
    }

    private function conflictoSeccion(int $seccionId, string $dia, string $inicio, string $fin, ?int $excluirId = null): ?string
    {
        $query = Horario::where('seccion_id', $seccionId)
            ->where('dia_semana', $dia);

        if ($excluirId) {
            $query->where('id', '!=', $excluirId);
        }

        $existe = $query->get()->contains(function (Horario $h) use ($inicio, $fin) {
            $hi = $this->normalizarHora($h->hora_inicio);
            $hf = $this->normalizarHora($h->hora_fin);
            return $hi < $fin && $hf > $inicio;
        });

        if ($existe) {
            return 'Ya existe una clase programada en ese horario para esta sección. Elige otro día u otra hora.';
        }

        return null;
    }

    private function conflictoDocente(int $docenteId, string $dia, string $inicio, string $fin, ?int $excluirId = null): ?string
    {
        $query = Horario::where('docente_id', $docenteId)
            ->where('dia_semana', $dia);

        if ($excluirId) {
            $query->where('id', '!=', $excluirId);
        }

        $existe = $query->get()->contains(function (Horario $h) use ($inicio, $fin) {
            $hi = $this->normalizarHora($h->hora_inicio);
            $hf = $this->normalizarHora($h->hora_fin);
            return $hi < $fin && $hf > $inicio;
        });

        if ($existe) {
            return 'El docente ya tiene otra clase programada en ese horario.';
        }

        return null;
    }

    private function esConflictoUnico(QueryException $e): bool
    {
        $codigo = $e->errorInfo[0] ?? '';
        return in_array($codigo, ['23000', '23505'], true);
    }
}
