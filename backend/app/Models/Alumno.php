<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Alumno extends Model
{
    protected $table = 'alumnos';

    protected $fillable = [
        'usuario_id',
        'dni',
        'nombres',
        'apellidos',
        'fecha_nacimiento',
        'genero',
        'direccion',
        'telefono',
        'foto',
        'estado',
    ];

    protected $casts = [
        'estado' => 'boolean',
        'fecha_nacimiento' => 'date',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class);
    }

    public function padres(): BelongsToMany
    {
        return $this->belongsToMany(Padre::class, 'alumno_padre')->withTimestamps();
    }

    public function secciones(): BelongsToMany
    {
        return $this->belongsToMany(Seccion::class, 'alumno_seccion')
            ->withPivot(['año_escolar', 'estado'])
            ->withTimestamps();
    }
}
