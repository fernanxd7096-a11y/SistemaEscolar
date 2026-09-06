<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Usuario extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles, LogsActivity;

    protected $table = 'usuarios';

    protected $fillable = [
        'nombre',
        'apellido',
        'email',
        'password',
        'estado',
        'foto',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'estado' => 'boolean',
    ];

    // `foto` guarda solo la ruta relativa dentro del disco "public" (ver
    // PerfilControlador::subirFoto); `foto_url` es la URL absoluta que la app
    // puede usar directamente en un <Image>. Se agrega automáticamente a cada
    // respuesta JSON del usuario (login, usuario-actual, perfil) sin tener que
    // repetir el cálculo en cada controlador.
    protected $appends = ['foto_url'];

    public function getFotoUrlAttribute(): ?string
    {
        return $this->foto ? Storage::disk('public')->url($this->foto) : null;
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['nombre', 'apellido', 'email', 'estado'])
            ->logOnlyDirty();
    }

    public function pushTokens(): HasMany
    {
        return $this->hasMany(PushToken::class);
    }
}
