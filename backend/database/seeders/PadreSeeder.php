<?php

namespace Database\Seeders;

use App\Models\Alumno;
use App\Models\Padre;
use Illuminate\Database\Seeder;

class PadreSeeder extends Seeder
{
    public function run(): void
    {
        $padres = [
            [
                'dni'       => '70111222',
                'nombres'   => 'Roberto',
                'apellidos' => 'Pérez Vargas',
                'relacion'  => 'padre',
                'telefono'  => '987654321',
                'email'     => 'rperez@correo.com',
                'alumnos'   => ['80111222'],
            ],
            [
                'dni'       => '70333444',
                'nombres'   => 'Carmen',
                'apellidos' => 'García Mendoza',
                'relacion'  => 'madre',
                'telefono'  => '987654322',
                'email'     => 'cgarcia@correo.com',
                'alumnos'   => ['80333444'],
            ],
            [
                'dni'       => '70555666',
                'nombres'   => 'Luis',
                'apellidos' => 'Salazar Torres',
                'relacion'  => 'padre',
                'telefono'  => '987654323',
                'email'     => 'lsalazar@correo.com',
                'alumnos'   => ['80555666', '80777888'],
            ],
        ];

        foreach ($padres as $datos) {
            $dniAlumnos = $datos['alumnos'];
            unset($datos['alumnos']);

            $padre = Padre::firstOrCreate(['dni' => $datos['dni']], $datos);

            $ids = Alumno::whereIn('dni', $dniAlumnos)->pluck('id');
            if ($ids->isNotEmpty()) {
                $padre->alumnos()->syncWithoutDetaching($ids);
            }
        }
    }
}
