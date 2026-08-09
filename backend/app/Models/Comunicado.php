<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Comunicado extends Model
{
    protected $table = 'comunicados';

    protected $fillable = [
        'titulo',
        'contenido',
        'tipo',
        'destinatarios',
        'publicado_por',
        'fecha_publicacion',
        'estado',
    ];

    protected $casts = [
        'estado'            => 'boolean',
        'fecha_publicacion' => 'date',
    ];

    public function autor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'publicado_por');
    }
}
