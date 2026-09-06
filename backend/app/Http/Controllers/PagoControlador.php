<?php

namespace App\Http\Controllers;

use App\Models\Pago;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PagoControlador extends Controller
{
    public function index(Request $request)
    {
        $query = Pago::query()->with(['alumno', 'registrador']);

        if ($request->filled('alumno_id')) {
            $query->where('alumno_id', $request->input('alumno_id'));
        }

        if ($request->filled('metodo_pago')) {
            $query->where('metodo_pago', $request->input('metodo_pago'));
        }

        if ($request->filled('fecha_desde')) {
            $query->whereDate('fecha', '>=', $request->input('fecha_desde'));
        }

        if ($request->filled('fecha_hasta')) {
            $query->whereDate('fecha', '<=', $request->input('fecha_hasta'));
        }

        if ($request->filled('buscar')) {
            $buscar = mb_strtolower($request->input('buscar'));
            $query->whereHas('alumno', function ($q) use ($buscar) {
                $q->whereRaw('LOWER(nombres) LIKE ?', ["%{$buscar}%"])
                    ->orWhereRaw('LOWER(apellidos) LIKE ?', ["%{$buscar}%"])
                    ->orWhereRaw('LOWER(dni) LIKE ?', ["%{$buscar}%"]);
            });
        }

        return response()->json(
            $query->orderBy('fecha', 'desc')->orderBy('id', 'desc')->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $datos = $this->validarDatos($request);

        $datos['registrado_por'] = $request->user()?->id;

        $pago = Pago::create($datos);

        return response()->json($pago->load(['alumno', 'registrador']), 201);
    }

    public function show(Pago $pago)
    {
        return response()->json($pago->load(['alumno', 'registrador']));
    }

    public function update(Request $request, Pago $pago)
    {
        $datos = $this->validarDatos($request, true);

        $pago->update($datos);

        return response()->json($pago->fresh()->load(['alumno', 'registrador']));
    }

    public function destroy(Pago $pago)
    {
        $pago->delete();
        return response()->json(null, 204);
    }

    /**
     * Resumen de montos cobrados por método de pago (para dashboard/reportes).
     */
    public function resumenMetodo(Request $request)
    {
        $query = Pago::query();

        if ($request->filled('fecha_desde')) {
            $query->whereDate('fecha', '>=', $request->input('fecha_desde'));
        }
        if ($request->filled('fecha_hasta')) {
            $query->whereDate('fecha', '<=', $request->input('fecha_hasta'));
        }

        $resumen = $query->select('metodo_pago', DB::raw('SUM(monto) as total'), DB::raw('COUNT(*) as cantidad'))
            ->groupBy('metodo_pago')
            ->get()
            ->keyBy('metodo_pago');

        $vacio = fn ($metodo) => [
            'total'    => (float) ($resumen[$metodo]->total ?? 0),
            'cantidad' => (int) ($resumen[$metodo]->cantidad ?? 0),
        ];

        return response()->json([
            'yape'     => $vacio('yape'),
            'plin'     => $vacio('plin'),
            'efectivo' => $vacio('efectivo'),
            'tarjeta'  => $vacio('tarjeta'),
        ]);
    }

    private function validarDatos(Request $request, bool $actualizando = false): array
    {
        $prefijo = $actualizando ? 'sometimes' : 'required';

        return $request->validate([
            'alumno_id'    => "{$prefijo}|exists:alumnos,id",
            'monto'        => "{$prefijo}|numeric|min:0.01|max:99999.99",
            // Concepto y monto son de texto/número libre a propósito: el colegio
            // cobra por conceptos variados (pensión, matrícula, materiales, uniforme,
            // actividades...) y este campo permite registrar cualquiera sin tener
            // que mantener un catálogo cerrado de conceptos.
            'concepto'     => "{$prefijo}|string|max:150",
            'fecha'        => "{$prefijo}|date",
            'metodo_pago'  => "{$prefijo}|in:yape,plin,tarjeta,efectivo",
            'referencia'   => 'nullable|string|max:50',
            'observacion'  => 'nullable|string|max:255',
        ]);
    }
}
