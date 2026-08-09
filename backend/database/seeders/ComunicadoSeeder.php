<?php

namespace Database\Seeders;

use App\Models\Comunicado;
use App\Models\Usuario;
use Illuminate\Database\Seeder;

class ComunicadoSeeder extends Seeder
{
    public function run(): void
    {
        $admin = Usuario::first();

        $comunicados = [
            [
                'titulo'            => 'Inicio del Año Escolar 2026',
                'contenido'         => "Estimados padres de familia y comunidad educativa:\n\nNos complace informarles que el año escolar 2026 dará inicio el día lunes 2 de marzo. Les recordamos que es importante que los alumnos se presenten con el uniforme completo y los útiles escolares correspondientes.\n\nLa matrícula estará disponible desde el 15 de febrero en la secretaría del colegio.\n\nCordialmente,\nDirección del Colegio Milagroso San Judas Tadeo",
                'tipo'              => 'general',
                'destinatarios'     => 'todos',
                'fecha_publicacion' => now()->subDays(30)->toDateString(),
            ],
            [
                'titulo'            => '⚠️ Suspensión de clases por mantenimiento',
                'contenido'         => "Se comunica a toda la comunidad educativa que el día viernes se suspenderán las actividades académicas por trabajos de mantenimiento en las instalaciones del colegio.\n\nLas clases se reanudarán con normalidad el día lunes.\n\nAgradecemos su comprensión.",
                'tipo'              => 'urgente',
                'destinatarios'     => 'todos',
                'fecha_publicacion' => now()->subDays(5)->toDateString(),
            ],
            [
                'titulo'            => 'Reunión de Padres de Familia — I Bimestre',
                'contenido'         => "Estimados padres:\n\nSe convoca a la reunión de padres de familia para la entrega de libretas del I Bimestre.\n\n📅 Fecha: Viernes próximo\n🕐 Hora: 3:00 PM\n📍 Lugar: Auditorio del colegio\n\nSe ruega puntualidad. La asistencia es obligatoria.",
                'tipo'              => 'informativo',
                'destinatarios'     => 'padres',
                'fecha_publicacion' => now()->subDays(3)->toDateString(),
            ],
            [
                'titulo'            => 'Capacitación Docente — Nuevas Metodologías',
                'contenido'         => "Estimados docentes:\n\nSe les invita a la jornada de capacitación sobre nuevas metodologías de enseñanza que se realizará el próximo sábado de 9:00 AM a 1:00 PM.\n\nTemas:\n• Aprendizaje basado en proyectos\n• Herramientas digitales para el aula\n• Evaluación formativa\n\nLa asistencia es obligatoria y se entregará certificado.",
                'tipo'              => 'informativo',
                'destinatarios'     => 'docentes',
                'fecha_publicacion' => now()->subDays(2)->toDateString(),
            ],
            [
                'titulo'            => 'Concurso de Ciencias — ¡Inscríbete!',
                'contenido'         => "¡Atención alumnos!\n\nSe abre la convocatoria para el Concurso Interno de Ciencias 2026. Pueden participar alumnos de todos los grados.\n\n🔬 Categorías: Experimentos, Investigación, Innovación\n📅 Fecha límite de inscripción: Fin de mes\n📍 Inscripciones: Con su tutor de sección\n\n¡Anímate a participar y demuestra tu talento científico!",
                'tipo'              => 'general',
                'destinatarios'     => 'alumnos',
                'fecha_publicacion' => now()->subDay()->toDateString(),
            ],
        ];

        foreach ($comunicados as $datos) {
            Comunicado::create(array_merge($datos, [
                'publicado_por' => $admin?->id,
            ]));
        }
    }
}
