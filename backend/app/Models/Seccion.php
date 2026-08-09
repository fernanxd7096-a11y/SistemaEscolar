<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Seccion extends Model
{
    protected $table = 'secciones';

    protected $fillable = [
        'grado_id',
        'nombre',
        'capacidad',
        'docente_tutor_id',
        'estado',
    ];

    protected $casts = [
        'estado' => 'boolean',
        'capacidad' => 'integer',
    ];

    public function grado(): BelongsTo
    {
        return $this->belongsTo(Grado::class);
    }

    public function docenteTutor(): BelongsTo
    {
        return $this->belongsTo(Docente::class, 'docente_tutor_id');
    }

    public function alumnos(): BelongsToMany
    {
        return $this->belongsToMany(Alumno::class, 'alumno_seccion')
            ->withPivot(['año_escolar', 'estado'])
            ->withTimestamps();
    }
}
