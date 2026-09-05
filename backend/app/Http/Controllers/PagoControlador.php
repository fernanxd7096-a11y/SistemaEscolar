<?php

namespace App\Http\Controllers;

use App\Models\Pago;
use App\Models\Comprobante;
use App\Models\ConceptoPago;
use Illuminate\Http\Request;

class PagoControlador extends Controller
{
    /* ==================== CONCEPTOS ==================== */

    public function conceptos(Request $request)
    {
        $query = ConceptoPago::query();

        if ($request->filled('buscar')) {
            $query->where('nombre', 'ilike', "%{$request->input('buscar')}%");
        }

        if ($request->boolean('all')) {
            return response()->json($query->orderBy('nombre')->get());
        }

        return response()->json($query->orderBy('nombre')->paginate(15));
    }

    public function crearConcepto(Request $request)
    {
        $datos = $request->validate([
            'nombre'      => 'required|string|max:100',
            'descripcion' => 'nullable|string',
            'monto_base'  => 'required|numeric|min:0',
            'año_escolar' => 'nullable|string|max:20',
            'estado'      => 'boolean',
        ]);

        $datos['estado'] = $datos['estado'] ?? true;

        return response()->json(ConceptoPago::create($datos), 201);
    }

    public function actualizarConcepto(Request $request, ConceptoPago $concepto)
    {
        $datos = $request->validate([
            'nombre'      => 'sometimes|string|max:100',
            'descripcion' => 'nullable|string',
            'monto_base'  => 'sometimes|numeric|min:0',
            'año_escolar' => 'nullable|string|max:20',
            'estado'      => 'boolean',
        ]);

        $concepto->update($datos);

        return response()->json($concepto);
    }

    public function eliminarConcepto(ConceptoPago $concepto)
    {
        $concepto->delete();
        return response()->json(null, 204);
    }

    /* ==================== PAGOS ==================== */

    public function index(Request $request)
    {
        $query = Pago::query()->with([
            'alumno:id,nombres,apellidos,dni',
            'conceptoPago:id,nombre',
            'evento:id,titulo',
            'comprobante:id,pago_id,numero_comprobante,tipo',
        ]);

        if ($request->filled('alumno_id')) {
            $query->where('alumno_id', $request->input('alumno_id'));
        }

        if ($request->filled('concepto_pago_id')) {
            $query->where('concepto_pago_id', $request->input('concepto_pago_id'));
        }

        if ($request->filled('evento_id')) {
            $query->where('evento_id', $request->input('evento_id'));
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->input('estado'));
        }

        if ($request->filled('desde')) {
            $query->where('fecha_pago', '>=', $request->input('desde'));
        }

        if ($request->filled('hasta')) {
            $query->where('fecha_pago', '<=', $request->input('hasta'));
        }

        return response()->json(
            $query->orderByDesc('fecha_pago')->paginate(15)
        );
    }

    public function store(Request $request)
    {
        $datos = $request->validate([
            'alumno_id'        => 'required|exists:alumnos,id',
            'concepto_pago_id' => 'required|exists:conceptos_pago,id',
            'evento_id'        => 'nullable|exists:eventos,id',
            'monto'            => 'required|numeric|min:0.01',
            'fecha_pago'       => 'required|date',
            'metodo_pago'      => 'required|in:efectivo,transferencia,deposito',
            'referencia_pago'  => 'nullable|string|max:100',
            'observacion'      => 'nullable|string',
            'estado'           => 'sometimes|in:pendiente,pagado,anulado',
        ]);

        $datos['registrado_por'] = $request->user()->id;
        $datos['estado'] = $datos['estado'] ?? 'pagado';

        $pago = Pago::create($datos);

        // Generar comprobante automáticamente
        $numero = 'REC-' . str_pad($pago->id, 6, '0', STR_PAD_LEFT);
        Comprobante::create([
            'pago_id'             => $pago->id,
            'numero_comprobante'  => $numero,
            'tipo'                => 'recibo',
            'emitido_por'         => $request->user()->id,
            'fecha_emision'       => $datos['fecha_pago'],
        ]);

        return response()->json(
            $pago->load(['alumno:id,nombres,apellidos,dni', 'conceptoPago:id,nombre', 'comprobante']),
            201
        );
    }

    public function show(Pago $pago)
    {
        return response()->json($pago->load([
            'alumno:id,nombres,apellidos,dni',
            'conceptoPago',
            'evento:id,titulo',
            'comprobante',
            'registrador:id,nombre,apellido',
        ]));
    }

    public function update(Request $request, Pago $pago)
    {
        $datos = $request->validate([
            'monto'           => 'sometimes|numeric|min:0.01',
            'fecha_pago'      => 'sometimes|date',
            'metodo_pago'     => 'sometimes|in:efectivo,transferencia,deposito',
            'referencia_pago' => 'nullable|string|max:100',
            'observacion'     => 'nullable|string',
            'estado'          => 'sometimes|in:pendiente,pagado,anulado',
        ]);

        $pago->update($datos);

        return response()->json($pago->fresh()->load([
            'alumno:id,nombres,apellidos,dni', 'conceptoPago:id,nombre', 'comprobante',
        ]));
    }

    public function destroy(Pago $pago)
    {
        if ($pago->evidencia) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($pago->evidencia);
        }
        $pago->delete();
        return response()->json(null, 204);
    }

    /* ==================== EVIDENCIA (captura / foto) ==================== */

    public function subirEvidencia(Request $request, Pago $pago)
    {
        $request->validate([
            'evidencia' => 'required|file|mimes:jpg,jpeg,png,webp,pdf|max:5120',
        ], [
            'evidencia.required' => 'Debes seleccionar una imagen o PDF.',
            'evidencia.mimes'    => 'Solo se permiten JPG, PNG, WEBP o PDF.',
            'evidencia.max'      => 'El archivo no debe superar 5 MB.',
        ]);

        if ($pago->evidencia) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($pago->evidencia);
        }

        $ruta = $request->file('evidencia')->store('evidencias_pago', 'public');
        $pago->update(['evidencia' => $ruta]);

        return response()->json(
            $pago->fresh()->load([
                'alumno:id,nombres,apellidos,dni',
                'conceptoPago:id,nombre',
                'evento:id,titulo',
                'comprobante',
            ])
        );
    }

    public function eliminarEvidencia(Pago $pago)
    {
        if ($pago->evidencia) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($pago->evidencia);
            $pago->update(['evidencia' => null]);
        }

        return response()->json(
            $pago->fresh()->load([
                'alumno:id,nombres,apellidos,dni',
                'conceptoPago:id,nombre',
                'comprobante',
            ])
        );
    }

    /* ==================== PAGOS POR EVENTO ==================== */

    public function pagosPorEvento(Request $request, $eventoId)
    {
        $evento = \App\Models\Evento::findOrFail($eventoId);

        $pagos = Pago::where('evento_id', $eventoId)
            ->with(['alumno:id,nombres,apellidos,dni', 'comprobante:id,pago_id,numero_comprobante'])
            ->orderBy('created_at', 'desc')
            ->get();

        $pagadosIds = $pagos->where('estado', 'pagado')->pluck('alumno_id')->unique();

        $alumnosActivos = \App\Models\Alumno::where('estado', true)
            ->orderBy('apellidos')
            ->orderBy('nombres')
            ->get(['id', 'nombres', 'apellidos', 'dni']);

        $detalleAlumnos = $alumnosActivos->map(function ($alumno) use ($pagadosIds, $pagos) {
            $pago = $pagos->firstWhere('alumno_id', $alumno->id);
            return [
                'alumno'     => $alumno,
                'estado'     => $pago && $pago->estado === 'pagado' ? 'pagado' : 'pendiente',
                'pago'       => $pago,
            ];
        });

        return response()->json([
            'evento'  => $evento->only(['id', 'titulo', 'costo', 'fecha_inicio']),
            'resumen' => [
                'total_alumnos' => $alumnosActivos->count(),
                'pagados'       => $pagadosIds->count(),
                'pendientes'    => $alumnosActivos->count() - $pagadosIds->count(),
                'monto_recaudado' => $pagos->where('estado', 'pagado')->sum('monto'),
            ],
            'alumnos' => $detalleAlumnos,
            'pagos'   => $pagos,
        ]);
    }

    /* ==================== PAGOS POR PADRE ==================== */

    public function pagosPorPadre($padreId)
    {
        $padre = \App\Models\Padre::with('alumnos:id,nombres,apellidos,dni')->findOrFail($padreId);
        $pagos = $padre->pagosHijos();

        return response()->json([
            'padre'  => $padre,
            'pagos'  => $pagos,
            'resumen' => [
                'total'     => $pagos->count(),
                'pagados'   => $pagos->where('estado', 'pagado')->count(),
                'pendientes'=> $pagos->where('estado', 'pendiente')->count(),
                'monto'     => $pagos->where('estado', 'pagado')->sum('monto'),
            ],
        ]);
    }
}
