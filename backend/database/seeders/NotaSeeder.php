<?php

namespace Database\Seeders;

use App\Models\Alumno;
use App\Models\Curso;
use App\Models\Nota;
use App\Models\Seccion;
use Illuminate\Database\Seeder;

class NotaSeeder extends Seeder
{
    public function run(): void
    {
        $tipos = ['examen', 'practica', 'tarea', 'participacion'];

        $seccion = Seccion::first();
        if (!$seccion) return;

        $alumnos = Alumno::whereHas('secciones', function ($q) use ($seccion) {
            $q->where('secciones.id', $seccion->id);
        })->get();

        if ($alumnos->isEmpty()) return;

        $cursos = Curso::where('grado_id', $seccion->grado_id)->take(4)->get();

        foreach ($cursos as $curso) {
            foreach ([1, 2] as $bimestre) {
                foreach ($tipos as $tipo) {
                    foreach ($alumnos as $alumno) {
                        Nota::create([
                            'alumno_id'    => $alumno->id,
                            'curso_id'     => $curso->id,
                            'seccion_id'   => $seccion->id,
                            'bimestre'     => $bimestre,
                            'tipo'         => $tipo,
                            'calificacion' => rand(8, 20),
                        ]);
                    }
                }
            }
        }
    }
}
