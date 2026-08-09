<?php

namespace Database\Seeders;

use App\Models\Alumno;
use App\Models\Docente;
use App\Models\Grado;
use App\Models\Seccion;
use Illuminate\Database\Seeder;

class AcademicoSeeder extends Seeder
{
    public function run(): void
    {
        $gradosData = [
            ['nombre' => '1°', 'nivel' => 'primaria', 'descripcion' => 'Primer grado de primaria'],
            ['nombre' => '2°', 'nivel' => 'primaria', 'descripcion' => 'Segundo grado de primaria'],
            ['nombre' => '3°', 'nivel' => 'primaria', 'descripcion' => 'Tercer grado de primaria'],
            ['nombre' => '1°', 'nivel' => 'secundaria', 'descripcion' => 'Primer grado de secundaria'],
            ['nombre' => '2°', 'nivel' => 'secundaria', 'descripcion' => 'Segundo grado de secundaria'],
        ];

        $grados = collect($gradosData)->map(fn ($g) => Grado::create($g));

        $docentes = collect([
            ['dni' => '40111222', 'nombres' => 'María', 'apellidos' => 'Quispe Huamán', 'especialidad' => 'Matemáticas', 'titulo' => 'Lic. Educación', 'email' => 'mquispe@sanjudastadeo.edu.pe'],
            ['dni' => '40333444', 'nombres' => 'Carlos', 'apellidos' => 'Ramos Díaz', 'especialidad' => 'Comunicación', 'titulo' => 'Lic. Educación', 'email' => 'cramos@sanjudastadeo.edu.pe'],
            ['dni' => '40555666', 'nombres' => 'Ana', 'apellidos' => 'Torres Vega', 'especialidad' => 'Ciencias', 'titulo' => 'Lic. Educación', 'email' => 'atorres@sanjudastadeo.edu.pe'],
        ])->map(fn ($d) => Docente::create($d));

        foreach ($grados as $i => $grado) {
            foreach (['A', 'B'] as $j => $letra) {
                Seccion::create([
                    'grado_id'         => $grado->id,
                    'nombre'           => $letra,
                    'capacidad'        => 30,
                    'docente_tutor_id' => $docentes[$j % $docentes->count()]->id,
                ]);
            }
        }

        $seccion1A = Seccion::where('nombre', 'A')->whereHas('grado', fn ($q) => $q->where('nombre', '1°')->where('nivel', 'primaria'))->first();

        $alumnos = [
            ['dni' => '80111222', 'nombres' => 'José', 'apellidos' => 'Pérez López', 'genero' => 'M', 'fecha_nacimiento' => '2018-03-12'],
            ['dni' => '80333444', 'nombres' => 'Lucía', 'apellidos' => 'García Méndez', 'genero' => 'F', 'fecha_nacimiento' => '2018-07-21'],
            ['dni' => '80555666', 'nombres' => 'Diego', 'apellidos' => 'Salazar Ruiz', 'genero' => 'M', 'fecha_nacimiento' => '2018-01-05'],
            ['dni' => '80777888', 'nombres' => 'Valentina', 'apellidos' => 'Castro Ríos', 'genero' => 'F', 'fecha_nacimiento' => '2017-11-30'],
        ];

        foreach ($alumnos as $datos) {
            $alumno = Alumno::create($datos);
            if ($seccion1A) {
                $alumno->secciones()->attach($seccion1A->id, [
                    'año_escolar' => (string) date('Y'),
                    'estado'      => 'activo',
                ]);
            }
        }
    }
}
