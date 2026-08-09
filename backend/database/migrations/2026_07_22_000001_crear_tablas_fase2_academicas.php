<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grados', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 50);
            $table->enum('nivel', ['inicial', 'primaria', 'secundaria']);
            $table->string('descripcion')->nullable();
            $table->boolean('estado')->default(true);
            $table->timestamps();
        });

        Schema::create('docentes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->string('dni', 20)->unique();
            $table->string('nombres', 100);
            $table->string('apellidos', 100);
            $table->string('especialidad', 150)->nullable();
            $table->string('titulo', 150)->nullable();
            $table->string('telefono', 30)->nullable();
            $table->string('email')->nullable();
            $table->boolean('estado')->default(true);
            $table->timestamps();
        });

        Schema::create('secciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grado_id')->constrained('grados')->cascadeOnDelete();
            $table->string('nombre', 20);
            $table->unsignedSmallInteger('capacidad')->default(30);
            $table->foreignId('docente_tutor_id')->nullable()->constrained('docentes')->nullOnDelete();
            $table->boolean('estado')->default(true);
            $table->timestamps();

            $table->unique(['grado_id', 'nombre']);
        });

        Schema::create('alumnos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->string('dni', 20)->unique();
            $table->string('nombres', 100);
            $table->string('apellidos', 100);
            $table->date('fecha_nacimiento')->nullable();
            $table->enum('genero', ['M', 'F', 'O'])->nullable();
            $table->string('direccion')->nullable();
            $table->string('telefono', 30)->nullable();
            $table->string('foto')->nullable();
            $table->boolean('estado')->default(true);
            $table->timestamps();
        });

        Schema::create('padres', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->string('dni', 20)->unique();
            $table->string('nombres', 100);
            $table->string('apellidos', 100);
            $table->string('relacion', 50)->nullable();
            $table->string('telefono', 30)->nullable();
            $table->string('email')->nullable();
            $table->timestamps();
        });

        Schema::create('alumno_padre', function (Blueprint $table) {
            $table->id();
            $table->foreignId('alumno_id')->constrained('alumnos')->cascadeOnDelete();
            $table->foreignId('padre_id')->constrained('padres')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['alumno_id', 'padre_id']);
        });

        Schema::create('alumno_seccion', function (Blueprint $table) {
            $table->id();
            $table->foreignId('alumno_id')->constrained('alumnos')->cascadeOnDelete();
            $table->foreignId('seccion_id')->constrained('secciones')->cascadeOnDelete();
            $table->string('año_escolar', 20);
            $table->enum('estado', ['activo', 'retirado', 'trasladado'])->default('activo');
            $table->timestamps();

            $table->unique(['alumno_id', 'seccion_id', 'año_escolar']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alumno_seccion');
        Schema::dropIfExists('alumno_padre');
        Schema::dropIfExists('padres');
        Schema::dropIfExists('alumnos');
        Schema::dropIfExists('secciones');
        Schema::dropIfExists('docentes');
        Schema::dropIfExists('grados');
    }
};
