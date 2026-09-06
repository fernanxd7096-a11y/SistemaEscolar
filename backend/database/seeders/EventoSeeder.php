<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Evento;
use App\Models\Usuario;
use Carbon\Carbon;

class EventoSeeder extends Seeder
{
    public function run(): void
    {
        $admin = Usuario::where('email', 'admin@sanjudastadeo.edu.pe')->first();

        $eventos = [
            ['titulo' => 'Visita de estudio al Museo de Historia', 'tipo' => 'visita_estudio', 'lugar' => 'Museo Nacional', 'dias' => 3, 'hora' => '08:00'],
            ['titulo' => 'Olimpiada de Matemática Interescolar', 'tipo' => 'olimpiada', 'lugar' => 'Auditorio principal', 'dias' => 6, 'hora' => '09:00'],
            ['titulo' => 'Campeonato de fútbol inter-secciones', 'tipo' => 'deportivo', 'lugar' => 'Cancha del colegio', 'dias' => 9, 'hora' => '14:00'],
            ['titulo' => 'Festival de danzas folclóricas', 'tipo' => 'cultural', 'lugar' => 'Patio central', 'dias' => 12, 'hora' => '10:00'],
            ['titulo' => 'Feria de ciencias', 'tipo' => 'otro', 'lugar' => 'Patio central', 'dias' => 20, 'hora' => '09:00'],
            ['titulo' => 'Actuación por el aniversario del colegio', 'tipo' => 'cultural', 'lugar' => 'Auditorio principal', 'dias' => -5, 'hora' => '18:00'],
        ];

        foreach ($eventos as $e) {
            Evento::firstOrCreate(
                ['titulo' => $e['titulo']],
                [
                    'descripcion' => 'Actividad extracurricular organizada por el colegio.',
                    'tipo'        => $e['tipo'],
                    'lugar'       => $e['lugar'],
                    'fecha'       => Carbon::today()->addDays($e['dias']),
                    'hora'        => $e['hora'],
                    'estado'      => $e['dias'] < 0 ? 'finalizado' : 'programado',
                    'visible'     => true,
                    'creado_por'  => $admin?->id,
                ]
            );
        }

        $this->command->info('✓ Eventos de ejemplo sembrados.');
    }
}
