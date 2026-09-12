<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // El rol administrador tiene acceso total a todos los módulos y permisos
        Gate::before(function ($user, $ability) {
            return $user->hasRole('administrador') ? true : null;
        });
    }
}
