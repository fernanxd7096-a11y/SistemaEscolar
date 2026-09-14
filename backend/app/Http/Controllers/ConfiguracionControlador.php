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
            'resolucion_directoral' => $configs->get('ugel')?->valor ?? ($configs->get('resolucion_directoral')?->valor ?? 'UGEL 05 S.J.L. - R.D. 05069 - R.D. 003839'),
            'logo_url'              => $configs->get('logo_url')?->valor ?? ($configs->get('logo_base64')?->valor ?? null),
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

    /**
     * Subir y actualizar el logo institucional.
     * POST /api/configuracion/logo
     */
    public function subirLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,jpg,webp,svg|max:4096',
        ]);

        $archivo = $request->file('logo');
        if (!$archivo) {
            return response()->json(['error' => 'No se recibió ningún archivo de imagen.'], 422);
        }

        // 1. Convertir a Data URI Base64 para persistencia garantizada en la BD PostgreSQL
        $mime = $archivo->getMimeType() ?: 'image/png';
        $base64 = 'data:' . $mime . ';base64,' . base64_encode(file_get_contents($archivo->getRealPath()));

        // 2. Guardar en almacenamiento público
        $nombreArchivo = 'logo_' . time() . '.' . $archivo->getClientOriginalExtension();
        $path = $archivo->storeAs('configuracion', $nombreArchivo, 'public');
        $url = asset('storage/' . $path);

        // 3. Replicar también en resources/images/logo.png y public/images/logo.png para DomPDF
        try {
            $destinos = [
                public_path('images'),
                resource_path('images'),
            ];
            foreach ($destinos as $dir) {
                if (!is_dir($dir)) {
                    @mkdir($dir, 0755, true);
                }
                @copy($archivo->getRealPath(), $dir . DIRECTORY_SEPARATOR . 'logo.png');
            }
        } catch (\Throwable $e) {
            // Continuar normalmente si el entorno tiene restricciones
        }

        // 4. Guardar en base de datos
        if (Schema::hasTable('configuraciones')) {
            DB::table('configuraciones')->updateOrInsert(
                ['clave' => 'logo_base64'],
                ['valor' => $base64, 'descripcion' => 'Logo institucional en Base64', 'updated_at' => now()]
            );
            DB::table('configuraciones')->updateOrInsert(
                ['clave' => 'logo_url'],
                ['valor' => $url, 'descripcion' => 'URL pública del logo', 'updated_at' => now()]
            );
        }

        return response()->json([
            'mensaje'     => 'Logo institucional actualizado correctamente.',
            'logo_url'    => $url,
            'logo_base64' => $base64,
        ]);
    }
}
