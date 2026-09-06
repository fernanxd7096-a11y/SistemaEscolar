<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Alumno;
use App\Models\Padre;

class PadreSeeder extends Seeder
{
    /**
     * Crea un padre/apoderado por alumno con email, para que el aviso automático
     * de faltas/tardanzas (Tarea 4) tenga a quién enviarse en el entorno de demo.
     */
    public function run(): void
    {
        $datos = [
            '80111222' => ['dni' => '70111222', 'nombres' => 'Rosa', 'apellidos' => 'López Vidal', 'relacion' => 'madre', 'email' => 'rosa.lopez@correo-padres.test', 'telefono' => '987111222'],
            '80333444' => ['dni' => '70333444', 'nombres' => 'Miguel', 'apellidos' => 'García Soto', 'relacion' => 'padre', 'email' => 'miguel.garcia@correo-padres.test', 'telefono' => '987333444'],
            '80555666' => ['dni' => '70555666', 'nombres' => 'Patricia', 'apellidos' => 'Ruiz Campos', 'relacion' => 'madre', 'email' => 'patricia.ruiz@correo-padres.test', 'telefono' => '987555666'],
            '80777888' => ['dni' => '70777888', 'nombres' => 'Jorge', 'apellidos' => 'Castro Peña', 'relacion' => 'padre', 'email' => 'jorge.castro@correo-padres.test', 'telefono' => '987777888'],
        ];

        foreach ($datos as $dniAlumno => $datosPadre) {
            $alumno = Alumno::where('dni', $dniAlumno)->first();
            if (!$alumno) {
                continue;
            }

            $padre = Padre::firstOrCreate(['dni' => $datosPadre['dni']], $datosPadre);

            if (!$alumno->padres()->where('padre_id', $padre->id)->exists()) {
                $alumno->padres()->attach($padre->id);
            }
        }

        $this->command->info('✓ Padres de ejemplo sembrados y vinculados a alumnos.');
    }
}
