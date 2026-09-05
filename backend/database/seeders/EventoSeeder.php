<?php

namespace Database\Seeders;

use App\Models\Evento;
use App\Models\Usuario;
use Illuminate\Database\Seeder;

class EventoSeeder extends Seeder
{
    public function run(): void
    {
        $admin = Usuario::first();

        $eventos = [
            [
                'titulo'        => 'Acto Cívico — Fiestas Patrias',
                'descripcion'   => 'Ceremonia cívica con participación de todas las secciones de primaria y secundaria.',
                'tipo'          => 'institucional',
                'fecha_inicio'  => now()->addDays(15)->toDateString(),
                'hora_inicio'   => '08:00',
                'fecha_fin'     => now()->addDays(15)->toDateString(),
                'hora_fin'      => '10:00',
                'lugar'         => 'Patio principal',
                'costo'         => null,
                'cupo_maximo'   => null,
                'estado'        => 'activo',
            ],
            [
                'titulo'        => 'Reunión de Padres — I Bimestre',
                'descripcion'   => 'Entrega de libretas y retroalimentación académica del primer bimestre.',
                'tipo'          => 'reunion',
                'fecha_inicio'  => now()->addDays(7)->toDateString(),
                'hora_inicio'   => '15:00',
                'fecha_fin'     => now()->addDays(7)->toDateString(),
                'hora_fin'      => '17:00',
                'lugar'         => 'Auditorio',
                'costo'         => null,
                'cupo_maximo'   => 200,
                'estado'        => 'activo',
            ],
            [
                'titulo'        => 'Excursión Educativa — Museo de Historia',
                'descripcion'   => 'Visita guiada para alumnos de primaria. Incluye transporte y entrada.',
                'tipo'          => 'actividad',
                'fecha_inicio'  => now()->addDays(30)->toDateString(),
                'hora_inicio'   => '09:00',
                'fecha_fin'     => now()->addDays(30)->toDateString(),
                'hora_fin'      => '14:00',
                'lugar'         => 'Museo Nacional de Historia',
                'costo'         => 35.00,
                'cupo_maximo'   => 45,
                'estado'        => 'activo',
            ],
            [
                'titulo'        => 'Celebración del Día del Estudiante',
                'descripcion'   => 'Jornada recreativa con juegos, concursos y premiación.',
                'tipo'          => 'celebracion',
                'fecha_inicio'  => now()->subDays(10)->toDateString(),
                'hora_inicio'   => '10:00',
                'fecha_fin'     => now()->subDays(10)->toDateString(),
                'hora_fin'      => '13:00',
                'lugar'         => 'Cancha deportiva',
                'costo'         => 15.00,
                'cupo_maximo'   => null,
                'estado'        => 'finalizado',
            ],
        ];

        foreach ($eventos as $datos) {
            Evento::firstOrCreate(
                ['titulo' => $datos['titulo'], 'fecha_inicio' => $datos['fecha_inicio']],
                array_merge($datos, ['creado_por' => $admin?->id])
            );
        }
    }
}
