<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardControlador extends Controller
{
    public function resumen()
    {
        $totalAlumnos = 0;
        try {
            $totalAlumnos = DB::table('alumnos')->count();
        } catch (\Exception $e) {}

        $totalDocentes = 0;
        try {
            $totalDocentes = DB::table('docentes')->count();
        } catch (\Exception $e) {}

        $totalUsuariosActivos = Usuario::where('estado', true)->count();

        $anioEscolar = date('Y');
        try {
            $config = DB::table('configuraciones')->where('clave', 'anio_escolar')->first();
            if ($config) {
                $anioEscolar = $config->valor;
            }
        } catch (\Exception $e) {}

        $asistenciaHoy = 0;
        try {
            $asistenciaHoy = DB::table('asistencias')
                ->whereDate('fecha', Carbon::today())
                ->where('estado', 'presente')
                ->count();
        } catch (\Exception $e) {}

        return response()->json([
            'total_alumnos'         => $totalAlumnos,
            'total_docentes'        => $totalDocentes,
            'total_usuarios_activos' => $totalUsuariosActivos,
            'asistencia_hoy'        => $asistenciaHoy,
            'fecha_actual'          => Carbon::now()->locale('es')->isoFormat('dddd, D [de] MMMM [de] YYYY'),
            'año_escolar_actual'    => $anioEscolar,
        ]);
    }
}
