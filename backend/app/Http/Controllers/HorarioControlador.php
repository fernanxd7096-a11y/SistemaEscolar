<?php

namespace App\Http\Controllers;

use App\Models\Horario;
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
            ->get();

        return response()->json($horarios);
    }

    public function store(Request $request)
    {
        $datos = $request->validate([
            'seccion_id'  => 'required|exists:secciones,id',
            'curso_id'    => 'required|exists:cursos,id',
            'docente_id'  => 'nullable|exists:docentes,id',
            'dia_semana'  => 'required|in:lunes,martes,miercoles,jueves,viernes',
            'hora_inicio' => 'required|date_format:H:i',
            'hora_fin'    => 'required|date_format:H:i|after:hora_inicio',
            'aula'        => 'nullable|string|max:50',
            'estado'      => 'boolean',
        ]);

        $datos['estado'] = $datos['estado'] ?? true;

        // Verificar conflicto de horario en la misma sección
        $conflicto = Horario::where('seccion_id', $datos['seccion_id'])
            ->where('dia_semana', $datos['dia_semana'])
            ->where(function ($q) use ($datos) {
                $q->whereBetween('hora_inicio', [$datos['hora_inicio'], $datos['hora_fin']])
                    ->orWhereBetween('hora_fin', [$datos['hora_inicio'], $datos['hora_fin']])
                    ->orWhere(function ($q2) use ($datos) {
                        $q2->where('hora_inicio', '<=', $datos['hora_inicio'])
                            ->where('hora_fin', '>=', $datos['hora_fin']);
                    });
            })
            ->exists();

        if ($conflicto) {
            return response()->json([
                'mensaje' => 'Ya existe una clase programada en ese horario para esta sección.',
            ], 422);
        }

        $horario = Horario::create($datos);

        return response()->json($horario->load(['seccion.grado', 'curso', 'docente']), 201);
    }

    public function show(Horario $horario)
    {
        return response()->json($horario->load(['seccion.grado', 'curso', 'docente']));
    }

    public function update(Request $request, Horario $horario)
    {
        $datos = $request->validate([
            'seccion_id'  => 'sometimes|exists:secciones,id',
            'curso_id'    => 'sometimes|exists:cursos,id',
            'docente_id'  => 'nullable|exists:docentes,id',
            'dia_semana'  => 'sometimes|in:lunes,martes,miercoles,jueves,viernes',
            'hora_inicio' => 'sometimes|date_format:H:i',
            'hora_fin'    => 'sometimes|date_format:H:i|after:hora_inicio',
            'aula'        => 'nullable|string|max:50',
            'estado'      => 'boolean',
        ]);

        // Verificar conflicto si cambian horario o sección
        if (isset($datos['hora_inicio']) || isset($datos['dia_semana']) || isset($datos['seccion_id'])) {
            $seccionId = $datos['seccion_id'] ?? $horario->seccion_id;
            $dia = $datos['dia_semana'] ?? $horario->dia_semana;
            $inicio = $datos['hora_inicio'] ?? $horario->hora_inicio;
            $fin = $datos['hora_fin'] ?? $horario->hora_fin;

            $conflicto = Horario::where('seccion_id', $seccionId)
                ->where('dia_semana', $dia)
                ->where('id', '!=', $horario->id)
                ->where(function ($q) use ($inicio, $fin) {
                    $q->whereBetween('hora_inicio', [$inicio, $fin])
                        ->orWhereBetween('hora_fin', [$inicio, $fin])
                        ->orWhere(function ($q2) use ($inicio, $fin) {
                            $q2->where('hora_inicio', '<=', $inicio)
                                ->where('hora_fin', '>=', $fin);
                        });
                })
                ->exists();

            if ($conflicto) {
                return response()->json([
                    'mensaje' => 'Ya existe una clase programada en ese horario para esta sección.',
                ], 422);
            }
        }

        $horario->update($datos);

        return response()->json($horario->fresh()->load(['seccion.grado', 'curso', 'docente']));
    }

    public function destroy(Horario $horario)
    {
        $horario->delete();
        return response()->json(null, 204);
    }
}
