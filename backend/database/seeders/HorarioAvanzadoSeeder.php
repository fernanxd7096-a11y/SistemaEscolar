<?php

namespace Database\Seeders;

use App\Models\Evento;
use App\Models\HorarioExcepcion;
use App\Models\HorarioRegla;
use App\Models\Seccion;
use Illuminate\Database\Seeder;

/**
 * Datos de ejemplo del horario avanzado.
 *
 * Las reglas de las clases regulares ya existen: la migración del horario avanzado
 * espeja cada fila de `horarios` en `horario_reglas`. Aquí se agregan los casos que
 * la plantilla semanal no podía representar: un taller recurrente con vigencia
 * acotada, un feriado institucional, un viaje de estudio y una recuperación.
 */
class HorarioAvanzadoSeeder extends Seeder
{
    public function run(): void
    {
        $seccion = Seccion::with('grado')->first();

        if (!$seccion) {
            return;
        }

        $anio = (int) date('Y');

        // Taller extracurricular: martes y jueves, solo durante el segundo semestre.
        HorarioRegla::firstOrCreate(
            [
                'seccion_id'  => $seccion->id,
                'titulo'      => 'Taller de robótica',
                'hora_inicio' => '13:00:00',
            ],
            [
                'curso_id'     => null,
                'docente_id'   => $seccion->docente_tutor_id,
                'tipo'         => 'extracurricular',
                'dias_semana'  => ['martes', 'jueves'],
                'hora_fin'     => '14:30:00',
                'aula'         => 'Laboratorio',
                'fecha_inicio' => $anio . '-08-01',
                'fecha_fin'    => $anio . '-12-15',
                'año_escolar'  => (string) $anio,
                'observacion'  => 'Cupo limitado a 20 estudiantes.',
                'estado'       => true,
            ]
        );

        // Feriado institucional: nadie tiene clases.
        HorarioExcepcion::firstOrCreate(
            ['tipo' => 'feriado', 'fecha' => $anio . '-07-28'],
            [
                'alcance'        => 'institucional',
                'titulo'         => 'Fiestas Patrias',
                'descripcion'    => 'Feriado nacional. No hay actividades académicas.',
                'fecha_fin'      => $anio . '-07-29',
                'cancela_clases' => true,
                'estado'         => true,
            ]
        );

        // Viaje de estudio de una sección, enlazado al módulo de Eventos si existe.
        $evento = Evento::where('tipo', 'visita_estudio')->first();

        HorarioExcepcion::firstOrCreate(
            ['tipo' => 'viaje', 'seccion_id' => $seccion->id, 'fecha' => $anio . '-09-18'],
            [
                'alcance'        => 'seccion',
                'evento_id'      => $evento?->id,
                'titulo'         => 'Visita de estudio al museo',
                'descripcion'    => 'La sección sale todo el día; las clases se reprograman.',
                'cancela_clases' => true,
                'estado'         => true,
            ]
        );

        // Recuperación de las clases perdidas por el viaje: un sábado.
        HorarioExcepcion::firstOrCreate(
            ['tipo' => 'recuperacion', 'seccion_id' => $seccion->id, 'fecha' => $anio . '-09-21'],
            [
                'alcance'        => 'seccion',
                'docente_id'     => $seccion->docente_tutor_id,
                'titulo'         => 'Recuperación de clases (viaje de estudio)',
                'hora_inicio'    => '09:00:00',
                'hora_fin'       => '12:00:00',
                'aula'           => 'Aula ' . $seccion->nombre,
                'cancela_clases' => false,
                'estado'         => true,
            ]
        );
    }
}
