<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Curso extends Model
{
    protected $table = 'cursos';

    protected $fillable = [
        'nombre',
        'descripcion',
        'grado_id',
        'docente_id',
        'horas_semanales',
        'estado',
    ];

    protected $casts = [
        'estado' => 'boolean',
        'horas_semanales' => 'integer',
    ];

    public function grado(): BelongsTo
    {
        return $this->belongsTo(Grado::class);
    }

    public function docente(): BelongsTo
    {
        return $this->belongsTo(Docente::class);
    }
}
