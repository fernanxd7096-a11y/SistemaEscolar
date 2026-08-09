<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolesPermisosSeeder::class,
            AdminSeeder::class,
            AcademicoSeeder::class,
            CursoSeeder::class,
            HorarioSeeder::class,
            AsistenciaSeeder::class,
            NotaSeeder::class,
            ComunicadoSeeder::class,
        ]);
    }
}
