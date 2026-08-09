<?php

namespace App\Http\Controllers;

use App\Models\Comunicado;
use Illuminate\Http\Request;

class ComunicadoControlador extends Controller
{
    public function index(Request $request)
    {
        $query = Comunicado::query()->with('autor');

        if ($request->filled('buscar')) {
            $buscar = mb_strtolower($request->input('buscar'));
            $query->where(function ($q) use ($buscar) {
                $q->whereRaw('LOWER(titulo) LIKE ?', ["%{$buscar}%"])
                    ->orWhereRaw('LOWER(contenido) LIKE ?', ["%{$buscar}%"]);
            });
        }

        if ($request->filled('tipo')) {
            $query->where('tipo', $request->input('tipo'));
        }

        if ($request->filled('destinatarios')) {
            $query->where('destinatarios', $request->input('destinatarios'));
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->boolean('estado'));
        }

        return response()->json(
            $query->orderBy('fecha_publicacion', 'desc')->orderBy('created_at', 'desc')->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $datos = $request->validate([
            'titulo'            => 'required|string|max:200',
            'contenido'         => 'required|string',
            'tipo'              => 'required|in:general,urgente,informativo',
            'destinatarios'     => 'required|in:todos,padres,docentes,alumnos',
            'fecha_publicacion' => 'nullable|date',
            'estado'            => 'boolean',
        ]);

        $datos['publicado_por'] = $request->user()?->id;
        $datos['fecha_publicacion'] = $datos['fecha_publicacion'] ?? now()->toDateString();
        $datos['estado'] = $datos['estado'] ?? true;

        $comunicado = Comunicado::create($datos);

        return response()->json($comunicado->load('autor'), 201);
    }

    public function show(Comunicado $comunicado)
    {
        return response()->json($comunicado->load('autor'));
    }

    public function update(Request $request, Comunicado $comunicado)
    {
        $datos = $request->validate([
            'titulo'            => 'sometimes|string|max:200',
            'contenido'         => 'sometimes|string',
            'tipo'              => 'sometimes|in:general,urgente,informativo',
            'destinatarios'     => 'sometimes|in:todos,padres,docentes,alumnos',
            'fecha_publicacion' => 'nullable|date',
            'estado'            => 'boolean',
        ]);

        $comunicado->update($datos);

        return response()->json($comunicado->fresh()->load('autor'));
    }

    public function destroy(Comunicado $comunicado)
    {
        $comunicado->delete();
        return response()->json(null, 204);
    }
}
