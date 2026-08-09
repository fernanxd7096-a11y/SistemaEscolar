<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Padre extends Model
{
    protected $table = 'padres';

    protected $fillable = [
        'usuario_id',
        'dni',
        'nombres',
        'apellidos',
        'relacion',
        'telefono',
        'email',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class);
    }

    public function alumnos(): BelongsToMany
    {
        return $this->belongsToMany(Alumno::class, 'alumno_padre')->withTimestamps();
    }
}
