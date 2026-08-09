<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('alumno_id')->constrained('alumnos')->cascadeOnDelete();
            $table->foreignId('curso_id')->constrained('cursos')->cascadeOnDelete();
            $table->foreignId('seccion_id')->constrained('secciones')->cascadeOnDelete();
            $table->unsignedTinyInteger('bimestre');
            $table->enum('tipo', ['examen', 'practica', 'tarea', 'participacion'])->default('examen');
            $table->decimal('calificacion', 5, 2);
            $table->decimal('peso', 3, 2)->default(1.00);
            $table->string('observacion')->nullable();
            $table->foreignId('registrado_por')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->timestamps();

            $table->index(['alumno_id', 'curso_id', 'bimestre'], 'nota_alumno_curso_bimestre');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notas');
    }
};
