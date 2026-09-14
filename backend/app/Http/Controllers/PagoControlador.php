<?php

namespace App\Http\Controllers;

use App\Models\Pago;
use App\Models\Comprobante;
use App\Models\ConceptoPago;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

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

    private function discoEvidencias(): string
    {
        $custom = env('FILESYSTEM_EVIDENCIAS_DISK');
        if ($custom && config("filesystems.disks.{$custom}")) {
            return $custom;
        }

        if (config('filesystems.disks.s3.key') && config('filesystems.disks.s3.bucket')) {
            return 's3';
        }

        return 'public';
    }

    public function subirEvidencia(Request $request, Pago $pago)
    {
        $request->validate([
            'evidencia' => 'required|file|mimes:jpg,jpeg,png,webp,pdf|max:5120',
        ], [
            'evidencia.required' => 'Debes seleccionar una imagen o PDF.',
            'evidencia.mimes'    => 'Solo se permiten JPG, PNG, WEBP o PDF.',
            'evidencia.max'      => 'El archivo no debe superar 5 MB.',
        ]);

        $disk = $this->discoEvidencias();

        if ($pago->evidencia) {
            \Illuminate\Support\Facades\Storage::disk($disk)->delete($pago->evidencia);
        }

        $ruta = $request->file('evidencia')->store('evidencias_pago', $disk);
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
        $disk = $this->discoEvidencias();

        if ($pago->evidencia) {
            \Illuminate\Support\Facades\Storage::disk($disk)->delete($pago->evidencia);
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

    /**
     * Resumen de montos cobrados por método de pago (para dashboard/reportes/móvil).
     */
    public function resumenMetodo(Request $request)
    {
        $query = Pago::query();
        $fechaCol = Schema::hasColumn('pagos', 'fecha_pago') ? 'fecha_pago' : 'fecha';

        if ($request->filled('fecha_desde')) {
            $query->whereDate($fechaCol, '>=', $request->input('fecha_desde'));
        }
        if ($request->filled('fecha_hasta')) {
            $query->whereDate($fechaCol, '<=', $request->input('fecha_hasta'));
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
            'yape'          => $vacio('yape'),
            'plin'          => $vacio('plin'),
            'efectivo'      => $vacio('efectivo'),
            'tarjeta'       => $vacio('tarjeta'),
            'transferencia' => $vacio('transferencia'),
            'deposito'      => $vacio('deposito'),
        ]);
    }

    /* ==================== NOTIFICACIONES PUSH DE PAGOS PENDIENTES ==================== */

    /**
     * Enviar notificación push a los padres con pagos pendientes.
     * POST /api/pagos/notificar-pendientes
     */
    public function notificarPendientes(Request $request, \App\Services\ExpoPushService $expo)
    {
        $pagosPendientes = Pago::where('estado', 'pendiente')
            ->with(['alumno.padres.usuario.pushTokens', 'conceptoPago', 'evento'])
            ->get();

        if ($pagosPendientes->isEmpty()) {
            return response()->json([
                'mensaje'           => 'No hay pagos pendientes para notificar.',
                'total_notificados' => 0,
                'pagos_pendientes'  => 0,
            ]);
        }

        // Agrupar pagos por padre
        $padresNotificar = [];
        foreach ($pagosPendientes as $pago) {
            $alumno = $pago->alumno;
            if (!$alumno) continue;

            $conceptoNombre = $pago->conceptoPago?->nombre ?? ($pago->evento?->titulo ?? 'Cuota escolar');

            foreach ($alumno->padres as $padre) {
                $usuario = $padre->usuario;
                if (!$usuario) continue;

                $tokens = $usuario->pushTokens->pluck('token')->all();
                if (empty($tokens)) continue;

                if (!isset($padresNotificar[$padre->id])) {
                    $padresNotificar[$padre->id] = [
                        'padre'      => $padre,
                        'tokens'     => $tokens,
                        'totalDeuda' => 0,
                        'detalles'   => [],
                    ];
                }

                $padresNotificar[$padre->id]['totalDeuda'] += (float) $pago->monto;
                $padresNotificar[$padre->id]['detalles'][] = "{$conceptoNombre} (S/ {$pago->monto})";
            }
        }

        $enviados = 0;
        foreach ($padresNotificar as $registro) {
            $padre = $registro['padre'];
            $total = number_format($registro['totalDeuda'], 2);
            $primerConcepto = $registro['detalles'][0] ?? 'pensiones/conceptos';
            $mas = count($registro['detalles']) > 1 ? ' y otros' : '';

            $titulo = 'Recordatorio de Pago — San Judas Tadeo';
            $cuerpo = "Estimado(a) {$padre->nombres}, tiene pagos pendientes ({$primerConcepto}{$mas}) por un total de S/ {$total}.";

            $res = $expo->enviar(
                $registro['tokens'],
                $titulo,
                $cuerpo,
                [
                    'tipo'     => 'pago_pendiente',
                    'padre_id' => $padre->id,
                ]
            );

            if (!empty($res)) {
                $enviados++;
            }
        }

        return response()->json([
            'mensaje'           => "Se enviaron notificaciones a {$enviados} padre(s) de familia.",
            'total_notificados' => $enviados,
            'pagos_pendientes'  => $pagosPendientes->count(),
        ]);
    }

    /**
     * Enviar notificación push para un pago pendiente individual.
     * POST /api/pagos/{pago}/notificar
     */
    public function notificarPadre(Pago $pago, \App\Services\ExpoPushService $expo)
    {
        $pago->load(['alumno.padres.usuario.pushTokens', 'conceptoPago', 'evento']);

        $alumno = $pago->alumno;
        if (!$alumno || $alumno->padres->isEmpty()) {
            return response()->json([
                'error' => 'No se encontraron padres vinculados a este alumno.',
            ], 422);
        }

        $conceptoNombre = $pago->conceptoPago?->nombre ?? ($pago->evento?->titulo ?? 'Cuota escolar');
        $monto = number_format((float) $pago->monto, 2);
        $enviados = 0;

        foreach ($alumno->padres as $padre) {
            $usuario = $padre->usuario;
            if (!$usuario) continue;

            $tokens = $usuario->pushTokens->pluck('token')->all();
            if (empty($tokens)) continue;

            $titulo = 'Recordatorio de Pago — San Judas Tadeo';
            $cuerpo = "Estimado(a) {$padre->nombres}, le recordamos el pago pendiente de {$conceptoNombre} por S/ {$monto} de {$alumno->nombres}.";

            $res = $expo->enviar(
                $tokens,
                $titulo,
                $cuerpo,
                [
                    'tipo'      => 'pago_pendiente',
                    'pago_id'   => $pago->id,
                    'alumno_id' => $alumno->id,
                ]
            );

            if (!empty($res)) {
                $enviados++;
            }
        }

        return response()->json([
            'mensaje'           => "Notificación enviada a {$enviados} dispositivo(s).",
            'total_notificados' => $enviados,
        ]);
    }
}
