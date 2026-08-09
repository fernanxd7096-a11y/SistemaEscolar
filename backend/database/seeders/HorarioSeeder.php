<?php

namespace Database\Seeders;

use App\Models\Curso;
use App\Models\Horario;
use App\Models\Seccion;
use Illuminate\Database\Seeder;

class HorarioSeeder extends Seeder
{
    public function run(): void
    {
        $dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];

        $bloques = [
            ['inicio' => '08:00', 'fin' => '08:45'],
            ['inicio' => '08:45', 'fin' => '09:30'],
            ['inicio' => '09:30', 'fin' => '10:15'],
            ['inicio' => '10:30', 'fin' => '11:15'],  // después del recreo
            ['inicio' => '11:15', 'fin' => '12:00'],
            ['inicio' => '12:00', 'fin' => '12:45'],
        ];

        // Obtener primera sección que tenga cursos disponibles en su grado
        $secciones = Seccion::with('grado')->take(3)->get();

        foreach ($secciones as $seccion) {
            $cursos = Curso::where('grado_id', $seccion->grado_id)->get();

            if ($cursos->isEmpty()) {
                continue;
            }

            $cursoIndex = 0;

            foreach ($dias as $dia) {
                foreach ($bloques as $bloque) {
                    $curso = $cursos[$cursoIndex % $cursos->count()];

                    Horario::create([
                        'seccion_id'  => $seccion->id,
                        'curso_id'    => $curso->id,
                        'docente_id'  => $curso->docente_id,
                        'dia_semana'  => $dia,
                        'hora_inicio' => $bloque['inicio'],
                        'hora_fin'    => $bloque['fin'],
                        'aula'        => 'Aula ' . $seccion->nombre,
                    ]);

                    $cursoIndex++;
                }
            }
        }
    }
}
