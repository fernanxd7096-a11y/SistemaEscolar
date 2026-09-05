<?php

namespace App\Http\Controllers;

use App\Models\Docente;
use Illuminate\Http\Request;

class RegistroDocenteControlador extends Controller
{
    /**
     * Registro público de docentes (sin autenticación).
     * El docente queda con estado_registro = 'pendiente'.
     */
    public function registrar(Request $request)
    {
        $datos = $request->validate([
            'dni'          => 'required|string|max:20|unique:docentes,dni',
            'nombres'      => 'required|string|max:100',
            'apellidos'    => 'required|string|max:100',
            'especialidad' => 'nullable|string|max:150',
            'titulo'       => 'nullable|string|max:150',
            'telefono'     => 'nullable|string|max:30',
            'email'        => 'required|email|max:255',
        ], [
            'dni.required'  => 'El DNI es obligatorio.',
            'dni.unique'    => 'Ya existe un docente registrado con este DNI.',
            'nombres.required' => 'Los nombres son obligatorios.',
            'apellidos.required' => 'Los apellidos son obligatorios.',
            'email.required' => 'El correo electrónico es obligatorio.',
            'email.email'   => 'El correo electrónico no es válido.',
        ]);

        $datos['estado'] = false; // Inactivo hasta ser aprobado
        $datos['estado_registro'] = 'pendiente';

        $docente = Docente::create($datos);

        return response()->json([
            'mensaje' => 'Registro enviado correctamente. El administrador revisará su solicitud.',
            'docente' => $docente->only(['id', 'dni', 'nombres', 'apellidos', 'estado_registro']),
        ], 201);
    }

    /**
     * Listar registros pendientes (solo admin/director).
     */
    public function pendientes()
    {
        $pendientes = Docente::where('estado_registro', 'pendiente')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($pendientes);
    }

    /**
     * Aprobar un registro de docente.
     */
    public function aprobar(Request $request, Docente $docente)
    {
        if ($docente->estado_registro !== 'pendiente') {
            return response()->json([
                'mensaje' => 'Este registro ya fue procesado.',
            ], 422);
        }

        $docente->update([
            'estado' => true,
            'estado_registro' => 'aprobado',
            'motivo_rechazo' => null,
        ]);

        return response()->json([
            'mensaje' => 'Docente aprobado correctamente.',
            'docente' => $docente->fresh(),
        ]);
    }

    /**
     * Rechazar un registro de docente.
     */
    public function rechazar(Request $request, Docente $docente)
    {
        if ($docente->estado_registro !== 'pendiente') {
            return response()->json([
                'mensaje' => 'Este registro ya fue procesado.',
            ], 422);
        }

        $datos = $request->validate([
            'motivo_rechazo' => 'required|string|max:500',
        ], [
            'motivo_rechazo.required' => 'Debe indicar el motivo del rechazo.',
        ]);

        $docente->update([
            'estado' => false,
            'estado_registro' => 'rechazado',
            'motivo_rechazo' => $datos['motivo_rechazo'],
        ]);

        return response()->json([
            'mensaje' => 'Registro rechazado.',
            'docente' => $docente->fresh(),
        ]);
    }

    /**
     * Contador de registros pendientes (para notificaciones).
     */
    public function contadorPendientes()
    {
        $count = Docente::where('estado_registro', 'pendiente')->count();

        return response()->json(['pendientes' => $count]);
    }
}
