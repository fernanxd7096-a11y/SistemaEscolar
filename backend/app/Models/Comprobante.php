<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Comprobante extends Model
{
    protected $table = 'comprobantes';

    protected $fillable = [
        'pago_id', 'numero_comprobante', 'tipo',
        'archivo', 'emitido_por', 'fecha_emision',
    ];

    protected $casts = [
        'fecha_emision' => 'date',
    ];

    public function pago(): BelongsTo
    {
        return $this->belongsTo(Pago::class);
    }

    public function emisor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'emitido_por');
    }
}
