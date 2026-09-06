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
            PadreSeeder::class,
            CursoSeeder::class,
            HorarioSeeder::class,
            HorarioAvanzadoSeeder::class,
            AsistenciaSeeder::class,
            NotaSeeder::class,
            ComunicadoSeeder::class,
            EventoSeeder::class,
        ]);
    }
}
