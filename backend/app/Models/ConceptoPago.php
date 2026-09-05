<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConceptoPago extends Model
{
    protected $table = 'conceptos_pago';

    protected $fillable = [
        'nombre', 'descripcion', 'monto_base', 'año_escolar', 'estado',
    ];

    protected $casts = [
        'monto_base' => 'decimal:2',
        'estado'     => 'boolean',
    ];

    public function pagos()
    {
        return $this->hasMany(Pago::class);
    }
}
