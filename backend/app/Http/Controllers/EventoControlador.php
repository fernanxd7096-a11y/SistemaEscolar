<?php

namespace App\Http\Controllers;

use App\Models\Evento;
use Illuminate\Http\Request;
use Carbon\Carbon;

class EventoControlador extends Controller
{
    public function index(Request $request)
    {
        $query = Evento::query()->with('creador');

        if ($request->filled('buscar')) {
            $buscar = mb_strtolower($request->input('buscar'));
            $query->where(function ($q) use ($buscar) {
                $q->whereRaw('LOWER(titulo) LIKE ?', ["%{$buscar}%"])
                    ->orWhereRaw('LOWER(lugar) LIKE ?', ["%{$buscar}%"]);
            });
        }

        if ($request->filled('tipo')) {
            $query->where('tipo', $request->input('tipo'));
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->input('estado'));
        }

        return response()->json(
            $query->orderBy('fecha', 'desc')->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $datos = $request->validate([
            'titulo'      => 'required|string|max:200',
            'descripcion' => 'nullable|string',
            'tipo'        => 'required|in:visita_estudio,olimpiada,deportivo,cultural,otro',
            'lugar'       => 'nullable|string|max:200',
            'fecha'       => 'required|date',
            'hora'        => 'nullable|date_format:H:i',
            'estado'      => 'in:programado,en_curso,finalizado,cancelado',
            'visible'     => 'boolean',
        ]);

        $datos['creado_por'] = $request->user()?->id;
        $datos['estado'] = $datos['estado'] ?? 'programado';
        $datos['visible'] = $datos['visible'] ?? true;

        $evento = Evento::create($datos);

        return response()->json($evento->load('creador'), 201);
    }

    public function show(Evento $evento)
    {
        return response()->json($evento->load('creador'));
    }

    public function update(Request $request, Evento $evento)
    {
        $datos = $request->validate([
            'titulo'      => 'sometimes|string|max:200',
            'descripcion' => 'nullable|string',
            'tipo'        => 'sometimes|in:visita_estudio,olimpiada,deportivo,cultural,otro',
            'lugar'       => 'nullable|string|max:200',
            'fecha'       => 'sometimes|date',
            'hora'        => 'nullable|date_format:H:i',
            'estado'      => 'sometimes|in:programado,en_curso,finalizado,cancelado',
            'visible'     => 'boolean',
        ]);

        $evento->update($datos);

        return response()->json($evento->fresh()->load('creador'));
    }

    public function destroy(Evento $evento)
    {
        $evento->delete();
        return response()->json(null, 204);
    }

    /**
     * Eventos visibles y próximos (para el widget del dashboard).
     * Por defecto: próximos 14 días, incluyendo hoy; no cancelados.
     */
    public function proximos(Request $request)
    {
        $dias = (int) $request->input('dias', 14);
        $hoy = Carbon::today();

        $eventos = Evento::query()
            ->where('visible', true)
            ->where('estado', '!=', 'cancelado')
            ->whereDate('fecha', '>=', $hoy)
            ->whereDate('fecha', '<=', $hoy->copy()->addDays($dias))
            ->orderBy('fecha')
            ->orderBy('hora')
            ->limit(10)
            ->get();

        return response()->json($eventos);
    }
}
