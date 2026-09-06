<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Evento extends Model
{
    protected $table = 'eventos';

    protected $fillable = [
        'titulo',
        'descripcion',
        'tipo',
        'lugar',
        'fecha',
        'hora',
        'estado',
        'visible',
        'creado_por',
    ];

    protected $casts = [
        'fecha' => 'date',
        'visible' => 'boolean',
    ];

    public function creador(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'creado_por');
    }
}
