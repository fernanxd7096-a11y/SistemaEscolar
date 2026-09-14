<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ConfiguracionControlador extends Controller
{
    /**
     * Obtener todas las configuraciones institucionales.
     * GET /api/configuracion
     */
    public function index()
    {
        if (!Schema::hasTable('configuraciones')) {
            return response()->json([]);
        }

        $configs = DB::table('configuraciones')->get()->keyBy('clave');

        return response()->json([
            'nombre_colegio'        => $configs->get('nombre_colegio')?->valor ?? 'Colegio Milagroso San Judas Tadeo',
            'director'              => $configs->get('director')?->valor ?? 'Fernando Martínez',
            'direccion'             => $configs->get('direccion')?->valor ?? 'Coop. Sagrada Familia Mz. K lote 11 - S.J.L.',
            'telefono'              => $configs->get('telefono')?->valor ?? '962359860',
            'email'                 => $configs->get('email')?->valor ?? 'secretaria@sanjudastadeo.edu.pe',
            'anio_escolar'          => $configs->get('anio_escolar')?->valor ?? date('Y'),
            'lema'                  => $configs->get('lema')?->valor ?? 'Educando con valores para la vida',
            'resolucion_directoral' => $configs->get('ugel')?->valor ?? 'UGEL 05 S.J.L. - R.D. 05069 - R.D. 003839',
        ]);
    }

    /**
     * Actualizar configuraciones institucionales.
     * PUT /api/configuracion
     */
    public function update(Request $request)
    {
        $datos = $request->validate([
            'nombre_colegio'        => 'nullable|string|max:150',
            'director'              => 'nullable|string|max:150',
            'direccion'             => 'nullable|string|max:255',
            'telefono'              => 'nullable|string|max:50',
            'email'                 => 'nullable|email|max:100',
            'anio_escolar'          => 'nullable|string|max:10',
            'lema'                  => 'nullable|string|max:255',
            'resolucion_directoral' => 'nullable|string|max:200',
        ]);

        if (!Schema::hasTable('configuraciones')) {
            return response()->json(['error' => 'La tabla de configuraciones no existe.'], 500);
        }

        $mapa = [
            'nombre_colegio'        => 'nombre_colegio',
            'director'              => 'director',
            'direccion'             => 'direccion',
            'telefono'              => 'telefono',
            'email'                 => 'email',
            'anio_escolar'          => 'anio_escolar',
            'lema'                  => 'lema',
            'resolucion_directoral' => 'ugel',
        ];

        foreach ($datos as $claveReq => $valor) {
            if (isset($mapa[$claveReq]) && $valor !== null) {
                $claveBd = $mapa[$claveReq];
                DB::table('configuraciones')->updateOrInsert(
                    ['clave' => $claveBd],
                    ['valor' => $valor, 'updated_at' => now()]
                );
            }
        }

        return $this->index();
    }
}
