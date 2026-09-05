<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Pago extends Model
{
    protected $table = 'pagos';

    protected $fillable = [
        'alumno_id', 'concepto_pago_id', 'evento_id',
        'monto', 'fecha_pago', 'metodo_pago',
        'referencia_pago', 'observacion', 'evidencia', 'registrado_por', 'estado',
    ];

    protected $casts = [
        'monto'      => 'decimal:2',
        'fecha_pago' => 'date',
    ];

    protected $appends = ['evidencia_url'];

    public function getEvidenciaUrlAttribute(): ?string
    {
        if (!$this->evidencia) {
            return null;
        }

        return url('storage/' . ltrim($this->evidencia, '/'));
    }

    public function alumno(): BelongsTo
    {
        return $this->belongsTo(Alumno::class);
    }

    public function conceptoPago(): BelongsTo
    {
        return $this->belongsTo(ConceptoPago::class);
    }

    public function evento(): BelongsTo
    {
        return $this->belongsTo(Evento::class);
    }

    public function registrador(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'registrado_por');
    }

    public function comprobante(): HasOne
    {
        return $this->hasOne(Comprobante::class);
    }
}
