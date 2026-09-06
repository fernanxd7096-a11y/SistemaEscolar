<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesPermisosSeeder extends Seeder
{
    public function run(): void
    {
        // Limpiar caché de permisos
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // --- Crear roles ---
        $roles = ['administrador', 'director', 'secretario', 'docente', 'padre', 'alumno'];
        foreach ($roles as $nombre) {
            Role::findOrCreate($nombre, 'web');
        }

        // --- Crear permisos por módulo ---
        $permisos = [
            // Alumnos
            'ver-alumnos', 'crear-alumnos', 'editar-alumnos', 'eliminar-alumnos',
            // Docentes
            'ver-docentes', 'crear-docentes', 'editar-docentes', 'eliminar-docentes',
            // Usuarios
            'ver-usuarios', 'crear-usuarios', 'editar-usuarios', 'eliminar-usuarios',
            // Roles
            'ver-roles', 'crear-roles', 'editar-roles', 'eliminar-roles',
            // Grados y secciones
            'ver-grados', 'crear-grados', 'editar-grados', 'eliminar-grados',
            // Cursos
            'ver-cursos', 'crear-cursos', 'editar-cursos', 'eliminar-cursos',
            // Horarios
            'ver-horarios', 'crear-horarios', 'editar-horarios', 'eliminar-horarios',
            // Asistencia
            'ver-asistencias', 'registrar-asistencias', 'editar-asistencias',
            // Notas
            'ver-notas', 'registrar-notas', 'editar-notas',
            // Comunicados
            'ver-comunicados', 'crear-comunicados', 'editar-comunicados', 'eliminar-comunicados',
            // Reportes
            'ver-reportes', 'exportar-reportes',
            // Configuración
            'ver-configuracion', 'editar-configuracion',
            // Eventos extracurriculares
            'ver-eventos', 'crear-eventos', 'editar-eventos', 'eliminar-eventos',
            // Pagos
            'ver-pagos', 'crear-pagos', 'editar-pagos', 'eliminar-pagos',
        ];

        foreach ($permisos as $permiso) {
            Permission::findOrCreate($permiso, 'web');
        }

        // --- Asignar permisos por rol ---

        // Administrador: todo
        Role::findByName('administrador', 'web')->syncPermissions(Permission::all());

        // Director: casi todo (sin eliminar ni gestionar roles/usuarios)
        Role::findByName('director', 'web')->syncPermissions([
            'ver-alumnos', 'crear-alumnos', 'editar-alumnos',
            'ver-docentes', 'crear-docentes', 'editar-docentes',
            'ver-usuarios',
            'ver-grados', 'crear-grados', 'editar-grados',
            'ver-cursos', 'crear-cursos', 'editar-cursos',
            'ver-horarios', 'crear-horarios', 'editar-horarios',
            'ver-asistencias', 'registrar-asistencias',
            'ver-notas', 'registrar-notas',
            'ver-comunicados', 'crear-comunicados', 'editar-comunicados',
            'ver-reportes', 'exportar-reportes',
            'ver-configuracion',
            'ver-eventos', 'crear-eventos', 'editar-eventos',
            'ver-pagos', 'crear-pagos', 'editar-pagos',
        ]);

        // Secretario: gestión administrativa
        Role::findByName('secretario', 'web')->syncPermissions([
            'ver-alumnos', 'crear-alumnos', 'editar-alumnos',
            'ver-docentes',
            'ver-grados', 'ver-cursos',
            'ver-asistencias', 'registrar-asistencias',
            'ver-comunicados', 'crear-comunicados',
            'ver-reportes',
            'ver-eventos', 'crear-eventos', 'editar-eventos',
            'ver-pagos', 'crear-pagos',
        ]);

        // Docente: lo relacionado con su trabajo
        Role::findByName('docente', 'web')->syncPermissions([
            'ver-alumnos',
            'ver-horarios',
            'ver-asistencias', 'registrar-asistencias',
            'ver-notas', 'registrar-notas',
            'ver-comunicados',
            'ver-cursos',
            'ver-eventos',
        ]);

        // Padre: solo consulta
        Role::findByName('padre', 'web')->syncPermissions([
            'ver-notas',
            'ver-asistencias',
            'ver-comunicados',
            'ver-eventos',
        ]);

        // Alumno: solo consulta propia
        Role::findByName('alumno', 'web')->syncPermissions([
            'ver-notas',
            'ver-asistencias',
            'ver-horarios',
            'ver-comunicados',
            'ver-eventos',
        ]);
    }
}
