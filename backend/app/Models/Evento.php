<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class Evento extends Model
{
    protected $table = 'eventos';

    protected $fillable = [
        'titulo',
        'descripcion',
        'tipo',
        'fecha_inicio',
        'hora_inicio',
        'fecha_fin',
        'hora_fin',
        'lugar',
        'costo',
        'cupo_maximo',
        'estado',
        'creado_por',
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin'    => 'date',
        'costo'        => 'decimal:2',
        'cupo_maximo'  => 'integer',
    ];

    /* ---------- Relaciones ---------- */

    public function creador(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'creado_por');
    }

    public function pagos(): HasMany
    {
        return $this->hasMany(Pago::class);
    }

    /* ---------- Scopes ---------- */

    public function scopeConPagos(Builder $query): Builder
    {
        return $query->whereHas('pagos');
    }

    public function scopeActivos(Builder $query): Builder
    {
        return $query->where('estado', 'activo');
    }

    public function scopeProximos(Builder $query): Builder
    {
        return $query->where('fecha_inicio', '>=', now()->toDateString())
                     ->where('estado', 'activo')
                     ->orderBy('fecha_inicio');
    }

    public function scopePasados(Builder $query): Builder
    {
        return $query->where('fecha_inicio', '<', now()->toDateString())
                     ->orderByDesc('fecha_inicio');
    }

    /* ---------- Helpers ---------- */

    public function tieneCosto(): bool
    {
        return $this->costo !== null && $this->costo > 0;
    }
}
