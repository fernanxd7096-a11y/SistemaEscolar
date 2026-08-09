<?php

namespace Database\Seeders;

use App\Models\Alumno;
use App\Models\Asistencia;
use App\Models\Seccion;
use Illuminate\Database\Seeder;

class AsistenciaSeeder extends Seeder
{
    public function run(): void
    {
        $estados = ['presente', 'presente', 'presente', 'presente', 'tardanza', 'falta', 'justificado'];

        // Obtener primera sección con alumnos
        $seccion = Seccion::first();
        if (!$seccion) return;

        $alumnos = Alumno::whereHas('secciones', function ($q) use ($seccion) {
            $q->where('secciones.id', $seccion->id);
        })->get();

        if ($alumnos->isEmpty()) return;

        // Generar asistencia para los últimos 5 días laborales
        $fecha = now();
        $diasGenerados = 0;

        while ($diasGenerados < 5) {
            // Saltar fines de semana
            if ($fecha->isWeekend()) {
                $fecha = $fecha->subDay();
                continue;
            }

            foreach ($alumnos as $alumno) {
                Asistencia::create([
                    'alumno_id'  => $alumno->id,
                    'seccion_id' => $seccion->id,
                    'fecha'      => $fecha->toDateString(),
                    'estado'     => $estados[array_rand($estados)],
                ]);
            }

            $fecha = $fecha->subDay();
            $diasGenerados++;
        }
    }
}
