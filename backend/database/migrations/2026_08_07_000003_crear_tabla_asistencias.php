<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asistencias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('alumno_id')->constrained('alumnos')->cascadeOnDelete();
            $table->foreignId('seccion_id')->constrained('secciones')->cascadeOnDelete();
            $table->date('fecha');
            $table->enum('estado', ['presente', 'tardanza', 'falta', 'justificado'])->default('presente');
            $table->string('observacion')->nullable();
            $table->foreignId('registrado_por')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->timestamps();

            $table->unique(['alumno_id', 'seccion_id', 'fecha'], 'asistencia_unica_dia');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asistencias');
    }
};
