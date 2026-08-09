<?php

namespace App\Http\Controllers;

use App\Models\Alumno;
use App\Models\Asistencia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AsistenciaControlador extends Controller
{
    /**
     * Listar asistencias con filtros (sección, fecha, alumno).
     */
    public function index(Request $request)
    {
        $query = Asistencia::query()->with(['alumno', 'seccion.grado']);

        if ($request->filled('seccion_id')) {
            $query->where('seccion_id', $request->input('seccion_id'));
        }

        if ($request->filled('fecha')) {
            $query->whereDate('fecha', $request->input('fecha'));
        }

        if ($request->filled('fecha_desde')) {
            $query->whereDate('fecha', '>=', $request->input('fecha_desde'));
        }

        if ($request->filled('fecha_hasta')) {
            $query->whereDate('fecha', '<=', $request->input('fecha_hasta'));
        }

        if ($request->filled('alumno_id')) {
            $query->where('alumno_id', $request->input('alumno_id'));
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->input('estado'));
        }

        return response()->json(
            $query->orderBy('fecha', 'desc')->orderBy('alumno_id')->paginate(30)
        );
    }

    /**
     * Registrar asistencia masiva para una sección en una fecha.
     * Recibe array de { alumno_id, estado, observacion? }
     */
    public function registrarMasivo(Request $request)
    {
        $request->validate([
            'seccion_id'              => 'required|exists:secciones,id',
            'fecha'                   => 'required|date',
            'asistencias'             => 'required|array|min:1',
            'asistencias.*.alumno_id' => 'required|exists:alumnos,id',
            'asistencias.*.estado'    => 'required|in:presente,tardanza,falta,justificado',
            'asistencias.*.observacion' => 'nullable|string|max:255',
        ]);

        $seccionId = $request->input('seccion_id');
        $fecha = $request->input('fecha');
        $userId = $request->user()?->id;

        $resultados = [];

        DB::transaction(function () use ($request, $seccionId, $fecha, $userId, &$resultados) {
            foreach ($request->input('asistencias') as $item) {
                $asistencia = Asistencia::updateOrCreate(
                    [
                        'alumno_id'  => $item['alumno_id'],
                        'seccion_id' => $seccionId,
                        'fecha'      => $fecha,
                    ],
                    [
                        'estado'         => $item['estado'],
                        'observacion'    => $item['observacion'] ?? null,
                        'registrado_por' => $userId,
                    ]
                );
                $resultados[] = $asistencia;
            }
        });

        return response()->json([
            'mensaje'     => 'Asistencia registrada correctamente.',
            'total'       => count($resultados),
            'asistencias' => $resultados,
        ], 201);
    }

    /**
     * Obtener los alumnos de una sección con su asistencia para una fecha.
     * Si no hay registro, devuelve null para ese alumno.
     */
    public function porSeccionFecha(Request $request)
    {
        $request->validate([
            'seccion_id' => 'required|exists:secciones,id',
            'fecha'      => 'required|date',
        ]);

        $seccionId = $request->input('seccion_id');
        $fecha = $request->input('fecha');

        // Obtener alumnos matriculados en la sección
        $alumnos = Alumno::whereHas('secciones', function ($q) use ($seccionId) {
            $q->where('secciones.id', $seccionId);
        })
            ->where('estado', true)
            ->orderBy('apellidos')
            ->orderBy('nombres')
            ->get();

        // Obtener asistencias existentes para esa fecha
        $asistencias = Asistencia::where('seccion_id', $seccionId)
            ->whereDate('fecha', $fecha)
            ->get()
            ->keyBy('alumno_id');

        $resultado = $alumnos->map(function ($alumno) use ($asistencias) {
            $asistencia = $asistencias->get($alumno->id);
            return [
                'alumno_id'   => $alumno->id,
                'dni'         => $alumno->dni,
                'nombres'     => $alumno->nombres,
                'apellidos'   => $alumno->apellidos,
                'estado'      => $asistencia?->estado ?? null,
                'observacion' => $asistencia?->observacion ?? null,
                'registrado'  => $asistencia !== null,
            ];
        });

        return response()->json([
            'seccion_id' => $seccionId,
            'fecha'      => $fecha,
            'alumnos'    => $resultado,
        ]);
    }

    /**
     * Resumen de asistencia por sección: conteo por estado.
     */
    public function resumen(Request $request)
    {
        $request->validate([
            'seccion_id'  => 'required|exists:secciones,id',
            'fecha_desde' => 'nullable|date',
            'fecha_hasta' => 'nullable|date',
        ]);

        $query = Asistencia::where('seccion_id', $request->input('seccion_id'));

        if ($request->filled('fecha_desde')) {
            $query->whereDate('fecha', '>=', $request->input('fecha_desde'));
        }
        if ($request->filled('fecha_hasta')) {
            $query->whereDate('fecha', '<=', $request->input('fecha_hasta'));
        }

        $resumen = $query->select('estado', DB::raw('COUNT(*) as total'))
            ->groupBy('estado')
            ->get()
            ->pluck('total', 'estado');

        return response()->json([
            'presente'    => $resumen['presente'] ?? 0,
            'tardanza'    => $resumen['tardanza'] ?? 0,
            'falta'       => $resumen['falta'] ?? 0,
            'justificado' => $resumen['justificado'] ?? 0,
        ]);
    }

    public function destroy(Asistencia $asistencia)
    {
        $asistencia->delete();
        return response()->json(null, 204);
    }
}
