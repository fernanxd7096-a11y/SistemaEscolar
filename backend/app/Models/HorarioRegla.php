<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Regla recurrente del horario: "todos los <dias_semana>, de <hora_inicio> a
 * <hora_fin>, entre <fecha_inicio> y <fecha_fin>".
 *
 * No se materializa una fila por día: las ocurrencias las calcula
 * App\Services\AgendaHorarioServicio al resolver un rango de fechas.
 */
class HorarioRegla extends Model
{
    protected $table = 'horario_reglas';

    /** Días válidos, en orden. El índice + 1 coincide con Carbon::dayOfWeekIso. */
    public const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

    /**
     * Evita que la sincronización con la tabla legacy `horarios` se dispare en
     * cadena (Horario::saved -> regla -> Horario::save -> ...).
     */
    public static bool $sincronizando = false;

    protected $fillable = [
        'horario_id',
        'seccion_id',
        'curso_id',
        'docente_id',
        'tipo',
        'titulo',
        'dias_semana',
        'hora_inicio',
        'hora_fin',
        'aula',
        'fecha_inicio',
        'fecha_fin',
        'año_escolar',
        'observacion',
        'estado',
    ];

    protected $casts = [
        'dias_semana'  => 'array',
        'fecha_inicio' => 'date:Y-m-d',
        'fecha_fin'    => 'date:Y-m-d',
        'estado'       => 'boolean',
    ];

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

    public function horario(): BelongsTo
    {
        return $this->belongsTo(Horario::class);
    }

    public function excepciones(): HasMany
    {
        return $this->hasMany(HorarioExcepcion::class, 'regla_id');
    }

    /**
     * ¿Esta regla nace de una fila de la plantilla semanal legacy (`horarios`)?
     * Las que sí, se escriben de vuelta a esa tabla para que la app web siga viendo
     * los mismos datos.
     */
    public function esEspejoLegacy(): bool
    {
        return $this->horario_id !== null;
    }

    /**
     * Crea o actualiza la regla espejo de una fila de `horarios`.
     * Solo toca los campos que la tabla legacy sabe representar: la vigencia y el
     * año escolar de una regla ya existente se respetan.
     */
    public static function sincronizarDesdeHorario(Horario $horario): void
    {
        if (static::$sincronizando) {
            return;
        }

        $anio = (int) date('Y');

        $regla = static::firstOrNew(['horario_id' => $horario->id]);

        $regla->fill([
            'seccion_id'  => $horario->seccion_id,
            'curso_id'    => $horario->curso_id,
            'docente_id'  => $horario->docente_id,
            'tipo'        => 'clase',
            'dias_semana' => [$horario->dia_semana],
            'hora_inicio' => $horario->hora_inicio,
            'hora_fin'    => $horario->hora_fin,
            'aula'        => $horario->aula,
            'estado'      => (bool) $horario->estado,
        ]);

        if (!$regla->exists) {
            $regla->fecha_inicio = $anio . '-01-01';
            $regla->fecha_fin    = $anio . '-12-31';
            $regla->año_escolar  = (string) $anio;
        }

        static::$sincronizando = true;
        try {
            $regla->save();
        } finally {
            static::$sincronizando = false;
        }
    }

    /**
     * Escribe los cambios de una regla espejo de vuelta en la tabla legacy.
     * Si la regla pasó a tener más de un día de la semana, la fila legacy ya no
     * puede representarla: se elimina y la regla queda desligada.
     */
    public function sincronizarHaciaHorario(): void
    {
        if (!$this->esEspejoLegacy() || static::$sincronizando) {
            return;
        }

        $horario = Horario::find($this->horario_id);
        if (!$horario) {
            $this->horario_id = null;
            $this->saveQuietly();
            return;
        }

        $dias = $this->dias_semana ?? [];

        static::$sincronizando = true;
        try {
            $representable = count($dias) === 1
                && in_array($dias[0], ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'], true)
                && $this->tipo === 'clase'
                && $this->curso_id !== null;

            if (!$representable) {
                // Desligar ANTES de borrar: el evento `deleted` de Horario elimina
                // las reglas que apunten a esa fila, y esta debe sobrevivir.
                $this->horario_id = null;
                $this->saveQuietly();
                $horario->delete();
                return;
            }

            $horario->update([
                'seccion_id'  => $this->seccion_id,
                'curso_id'    => $this->curso_id,
                'docente_id'  => $this->docente_id,
                'dia_semana'  => $dias[0],
                'hora_inicio' => $this->hora_inicio,
                'hora_fin'    => $this->hora_fin,
                'aula'        => $this->aula,
                'estado'      => $this->estado,
            ]);
        } finally {
            static::$sincronizando = false;
        }
    }
}
