<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pago extends Model
{
    protected $table = 'pagos';

    protected $fillable = [
        'alumno_id',
        'monto',
        'concepto',
        'fecha',
        'metodo_pago',
        'referencia',
        'observacion',
        'registrado_por',
    ];

    protected $casts = [
        'fecha' => 'date',
        'monto' => 'decimal:2',
    ];

    public function alumno(): BelongsTo
    {
        return $this->belongsTo(Alumno::class);
    }

    public function registrador(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'registrado_por');
    }
}
