<?php

namespace Database\Seeders;

use App\Models\Curso;
use App\Models\Docente;
use App\Models\Grado;
use Illuminate\Database\Seeder;

class CursoSeeder extends Seeder
{
    public function run(): void
    {
        $cursosPrimaria = [
            ['nombre' => 'Matemáticas',            'horas_semanales' => 5],
            ['nombre' => 'Comunicación',            'horas_semanales' => 5],
            ['nombre' => 'Ciencia y Tecnología',    'horas_semanales' => 3],
            ['nombre' => 'Personal Social',         'horas_semanales' => 3],
            ['nombre' => 'Arte y Cultura',           'horas_semanales' => 2],
            ['nombre' => 'Educación Física',         'horas_semanales' => 2],
            ['nombre' => 'Educación Religiosa',      'horas_semanales' => 2],
            ['nombre' => 'Inglés',                   'horas_semanales' => 2],
            ['nombre' => 'Tutoría',                  'horas_semanales' => 1],
        ];

        $cursosSecundaria = [
            ['nombre' => 'Matemáticas',              'horas_semanales' => 6],
            ['nombre' => 'Comunicación',              'horas_semanales' => 5],
            ['nombre' => 'Ciencia y Tecnología',      'horas_semanales' => 4],
            ['nombre' => 'Ciencias Sociales',         'horas_semanales' => 3],
            ['nombre' => 'Desarrollo Personal',       'horas_semanales' => 2],
            ['nombre' => 'Educación Física',           'horas_semanales' => 2],
            ['nombre' => 'Arte y Cultura',             'horas_semanales' => 2],
            ['nombre' => 'Educación Religiosa',        'horas_semanales' => 2],
            ['nombre' => 'Inglés',                     'horas_semanales' => 3],
            ['nombre' => 'Educación para el Trabajo',  'horas_semanales' => 2],
            ['nombre' => 'Tutoría',                    'horas_semanales' => 1],
        ];

        $docentes = Docente::all();
        $grados = Grado::all();

        foreach ($grados as $grado) {
            $listaCursos = $grado->nivel === 'secundaria' ? $cursosSecundaria : $cursosPrimaria;

            foreach ($listaCursos as $i => $cursoData) {
                Curso::create([
                    'nombre'          => $cursoData['nombre'],
                    'grado_id'        => $grado->id,
                    'docente_id'      => $docentes->isNotEmpty() ? $docentes[$i % $docentes->count()]->id : null,
                    'horas_semanales' => $cursoData['horas_semanales'],
                ]);
            }
        }
    }
}
