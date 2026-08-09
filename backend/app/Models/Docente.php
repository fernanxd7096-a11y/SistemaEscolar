<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Docente extends Model
{
    protected $table = 'docentes';

    protected $fillable = [
        'usuario_id',
        'dni',
        'nombres',
        'apellidos',
        'especialidad',
        'titulo',
        'telefono',
        'email',
        'estado',
    ];

    protected $casts = [
        'estado' => 'boolean',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class);
    }

    public function seccionesTutor(): HasMany
    {
        return $this->hasMany(Seccion::class, 'docente_tutor_id');
    }
}
