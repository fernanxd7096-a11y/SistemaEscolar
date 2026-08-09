<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Usuario;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $admin = Usuario::firstOrCreate(
            ['email' => 'admin@sanjudastadeo.edu.pe'],
            [
                'nombre'   => 'Admin',
                'apellido' => 'Sistema',
                'password' => Hash::make('Admin123!'),
                'estado'   => true,
            ]
        );

        $admin->assignRole('administrador');

        $this->command->info('✓ Administrador creado: admin@sanjudastadeo.edu.pe / Admin123!');
    }
}
