<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('configuraciones')) {
            Schema::create('configuraciones', function (Blueprint $table) {
                $table->id();
                $table->string('clave')->unique();
                $table->text('valor')->nullable();
                $table->string('descripcion')->nullable();
                $table->timestamps();
            });

            // Insertar datos por defecto de la I.E.P. Milagroso San Judas Tadeo
            DB::table('configuraciones')->insert([
                ['clave' => 'nombre_colegio', 'valor' => 'Colegio Milagroso San Judas Tadeo', 'descripcion' => 'Nombre oficial de la institución', 'created_at' => now(), 'updated_at' => now()],
                ['clave' => 'director', 'valor' => 'Fernando Martínez', 'descripcion' => 'Nombre del director(a)', 'created_at' => now(), 'updated_at' => now()],
                ['clave' => 'direccion', 'valor' => 'Coop. Sagrada Familia Mz. K lote 11 - S.J.L.', 'descripcion' => 'Dirección de la sede institucional', 'created_at' => now(), 'updated_at' => now()],
                ['clave' => 'telefono', 'valor' => '962359860', 'descripcion' => 'Teléfono institucional', 'created_at' => now(), 'updated_at' => now()],
                ['clave' => 'email', 'valor' => 'secretaria@sanjudastadeo.edu.pe', 'descripcion' => 'Correo electrónico institucional', 'created_at' => now(), 'updated_at' => now()],
                ['clave' => 'anio_escolar', 'valor' => '2026', 'descripcion' => 'Año lectivo activo', 'created_at' => now(), 'updated_at' => now()],
                ['clave' => 'lema', 'valor' => 'Educando con valores para la vida', 'descripcion' => 'Lema escolar', 'created_at' => now(), 'updated_at' => now()],
                ['clave' => 'ugel', 'valor' => 'UGEL 05 S.J.L. - R.D. 05069 - R.D. 003839', 'descripcion' => 'UGEL y Resoluciones Directorales', 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        if (!Schema::hasTable('boleta_observaciones')) {
            Schema::create('boleta_observaciones', function (Blueprint $table) {
                $table->id();
                $table->foreignId('alumno_id')->constrained('alumnos')->cascadeOnDelete();
                $table->foreignId('seccion_id')->nullable()->constrained('secciones')->nullOnDelete();
                $table->string('año_escolar', 10)->default('2026');
                $table->string('bimestre_1_conducta', 10)->nullable();
                $table->string('bimestre_2_conducta', 10)->nullable();
                $table->string('bimestre_3_conducta', 10)->nullable();
                $table->string('bimestre_4_conducta', 10)->nullable();
                $table->string('conducta_final', 10)->nullable();
                $table->text('recomendaciones')->nullable();
                $table->foreignId('registrado_por')->nullable()->constrained('usuarios')->nullOnDelete();
                $table->timestamps();

                $table->unique(['alumno_id', 'seccion_id', 'año_escolar'], 'alumno_seccion_anio_unique');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('boleta_observaciones');
        Schema::dropIfExists('configuraciones');
    }
};
