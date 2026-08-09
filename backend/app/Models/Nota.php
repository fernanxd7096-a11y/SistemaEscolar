<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Nota extends Model
{
    protected $table = 'notas';

    protected $fillable = [
        'alumno_id',
        'curso_id',
        'seccion_id',
        'bimestre',
        'tipo',
        'calificacion',
        'peso',
        'observacion',
        'registrado_por',
    ];

    protected $casts = [
        'bimestre'      => 'integer',
        'calificacion'  => 'decimal:2',
        'peso'          => 'decimal:2',
    ];

    public function alumno(): BelongsTo
    {
        return $this->belongsTo(Alumno::class);
    }

    public function curso(): BelongsTo
    {
        return $this->belongsTo(Curso::class);
    }

    public function seccion(): BelongsTo
    {
        return $this->belongsTo(Seccion::class);
    }

    public function registrador(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'registrado_por');
    }
}
