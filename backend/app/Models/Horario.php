<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Horario extends Model
{
    protected $table = 'horarios';

    protected $fillable = [
        'seccion_id',
        'curso_id',
        'docente_id',
        'dia_semana',
        'hora_inicio',
        'hora_fin',
        'aula',
        'estado',
    ];

    protected $casts = [
        'estado' => 'boolean',
    ];

    /**
     * Esta tabla es la plantilla semanal "clásica" y la sigue usando la app web.
     * La agenda (App\Services\AgendaHorarioServicio) lee solo `horario_reglas`,
     * así que cada fila se espeja allí para que ambas vistas muestren lo mismo.
     */
    protected static function booted(): void
    {
        static::saved(function (Horario $horario) {
            HorarioRegla::sincronizarDesdeHorario($horario);
        });

        static::deleted(function (Horario $horario) {
            HorarioRegla::where('horario_id', $horario->id)->delete();
        });
    }

    public function seccion(): BelongsTo
    {
        return $this->belongsTo(Seccion::class);
    }

    public function curso(): BelongsTo
    {
        return $this->belongsTo(Curso::class);
    }

    public function docente(): BelongsTo
    {
        return $this->belongsTo(Docente::class);
    }
}
