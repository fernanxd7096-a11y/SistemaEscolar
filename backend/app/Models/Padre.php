<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Collection;

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

    /** Pagos de todos los hijos vinculados. */
    public function pagosHijos(): Collection
    {
        $alumnoIds = $this->alumnos()->pluck('alumnos.id');

        return Pago::whereIn('alumno_id', $alumnoIds)
            ->with(['alumno:id,nombres,apellidos,dni', 'conceptoPago:id,nombre', 'evento:id,titulo', 'comprobante'])
            ->orderByDesc('fecha_pago')
            ->get();
    }
}
