<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private array $permisos = [
        'ver-padres',
        'crear-padres',
        'editar-padres',
        'eliminar-padres',
    ];

    public function up(): void
    {
        $now = now();

        foreach ($this->permisos as $permiso) {
            DB::table('permissions')->insertOrIgnore([
                'name'       => $permiso,
                'guard_name' => 'web',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // Asignar permisos al rol administrador
        $rolAdmin = DB::table('roles')->where('name', 'administrador')->first();

        if ($rolAdmin) {
            $permisosIds = DB::table('permissions')
                ->whereIn('name', $this->permisos)
                ->pluck('id');

            foreach ($permisosIds as $permisoId) {
                DB::table('role_has_permissions')->insertOrIgnore([
                    'permission_id' => $permisoId,
                    'role_id'       => $rolAdmin->id,
                ]);
            }
        }
    }

    public function down(): void
    {
        $permisosIds = DB::table('permissions')
            ->whereIn('name', $this->permisos)
            ->pluck('id');

        DB::table('role_has_permissions')
            ->whereIn('permission_id', $permisosIds)
            ->delete();

        DB::table('permissions')
            ->whereIn('name', $this->permisos)
            ->delete();
    }
};
