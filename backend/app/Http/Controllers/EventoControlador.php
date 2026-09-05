<?php

namespace App\Http\Controllers;

use App\Models\Evento;
use Illuminate\Http\Request;

class EventoControlador extends Controller
{
    public function index(Request $request)
    {
        $query = Evento::query()->with('creador:id,nombre,apellido');

        if ($request->filled('buscar')) {
            $buscar = mb_strtolower($request->input('buscar'));
            $query->where(function ($q) use ($buscar) {
                $q->whereRaw('LOWER(titulo) LIKE ?', ["%{$buscar}%"])
                  ->orWhereRaw('LOWER(descripcion) LIKE ?', ["%{$buscar}%"]);
            });
        }

        if ($request->filled('tipo')) {
            $query->where('tipo', $request->input('tipo'));
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->input('estado'));
        }

        if ($request->filled('desde')) {
            $query->where('fecha_inicio', '>=', $request->input('desde'));
        }

        if ($request->filled('hasta')) {
            $query->where('fecha_inicio', '<=', $request->input('hasta'));
        }

        return response()->json(
            $query->orderByDesc('fecha_inicio')->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $datos = $request->validate([
            'titulo'       => 'required|string|max:150',
            'descripcion'  => 'nullable|string',
            'tipo'         => 'required|in:institucional,reunion,celebracion,escolar,actividad',
            'fecha_inicio' => 'required|date',
            'hora_inicio'  => 'nullable|date_format:H:i',
            'fecha_fin'    => 'nullable|date|after_or_equal:fecha_inicio',
            'hora_fin'     => 'nullable|date_format:H:i',
            'lugar'        => 'nullable|string|max:150',
            'costo'        => 'nullable|numeric|min:0',
            'cupo_maximo'  => 'nullable|integer|min:1',
            'estado'       => 'sometimes|in:activo,cancelado,finalizado',
        ]);

        $datos['creado_por'] = $request->user()->id;
        $datos['estado'] = $datos['estado'] ?? 'activo';

        $evento = Evento::create($datos);

        return response()->json($evento->load('creador:id,nombre,apellido'), 201);
    }

    public function show(Evento $evento)
    {
        return response()->json($evento->load('creador:id,nombre,apellido'));
    }

    public function update(Request $request, Evento $evento)
    {
        $datos = $request->validate([
            'titulo'       => 'sometimes|string|max:150',
            'descripcion'  => 'nullable|string',
            'tipo'         => 'sometimes|in:institucional,reunion,celebracion,escolar,actividad',
            'fecha_inicio' => 'sometimes|date',
            'hora_inicio'  => 'nullable|date_format:H:i',
            'fecha_fin'    => 'nullable|date|after_or_equal:fecha_inicio',
            'hora_fin'     => 'nullable|date_format:H:i',
            'lugar'        => 'nullable|string|max:150',
            'costo'        => 'nullable|numeric|min:0',
            'cupo_maximo'  => 'nullable|integer|min:1',
            'estado'       => 'sometimes|in:activo,cancelado,finalizado',
        ]);

        $evento->update($datos);

        return response()->json($evento->fresh()->load('creador:id,nombre,apellido'));
    }

    public function destroy(Evento $evento)
    {
        $evento->delete();
        return response()->json(null, 204);
    }
}
