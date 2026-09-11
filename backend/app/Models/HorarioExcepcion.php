<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Excepción puntual del horario sobre una fecha o un rango de fechas.
 *
 * Dos familias, según `cancela_clases`:
 *  - true  (feriado, suspensión, viaje): quita de la agenda los bloques regulares
 *          que caigan dentro de la excepción.
 *  - false (recuperación, extracurricular): agrega un bloque nuevo a esa fecha.
 *
 * `alcance` decide a quién afecta: todo el colegio, una sección o un docente.
 * Si `hora_inicio`/`hora_fin` son null, la excepción cubre el día completo.
 */
class HorarioExcepcion extends Model
{
    protected $table = 'horario_excepciones';

    /** Tipos que, por defecto, cancelan las clases regulares. */
    public const TIPOS_QUE_CANCELAN = ['feriado', 'suspension', 'viaje'];

    protected $fillable = [
        'tipo',
        'alcance',
        'seccion_id',
        'docente_id',
        'curso_id',
        'regla_id',
        'evento_id',
        'titulo',
        'descripcion',
        'fecha',
        'fecha_fin',
        'hora_inicio',
        'hora_fin',
        'aula',
        'cancela_clases',
        'estado',
        'creado_por',
    ];

    protected $casts = [
        'fecha'          => 'date:Y-m-d',
        'fecha_fin'      => 'date:Y-m-d',
        'cancela_clases' => 'boolean',
        'estado'         => 'boolean',
    ];

    public function seccion(): BelongsTo
    {
        return $this->belongsTo(Seccion::class);
    }

    public function docente(): BelongsTo
    {
        return $this->belongsTo(Docente::class);
    }

    public function curso(): BelongsTo
    {
        return $this->belongsTo(Curso::class);
    }

    public function regla(): BelongsTo
    {
        return $this->belongsTo(HorarioRegla::class, 'regla_id');
    }

    public function evento(): BelongsTo
    {
        return $this->belongsTo(Evento::class);
    }

    public function creador(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'creado_por');
    }

    /** Último día cubierto por la excepción (fecha_fin es opcional). */
    public function ultimaFecha(): string
    {
        return ($this->fecha_fin ?? $this->fecha)->format('Y-m-d');
    }

    public function esTodoElDia(): bool
    {
        return $this->hora_inicio === null || $this->hora_fin === null;
    }
}
