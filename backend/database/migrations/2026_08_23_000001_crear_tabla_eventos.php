<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('eventos', function (Blueprint $table) {
            $table->id();
            $table->string('titulo', 150);
            $table->text('descripcion')->nullable();
            $table->enum('tipo', ['institucional', 'reunion', 'celebracion', 'escolar', 'actividad']);
            $table->date('fecha_inicio');
            $table->time('hora_inicio')->nullable();
            $table->date('fecha_fin')->nullable();
            $table->time('hora_fin')->nullable();
            $table->string('lugar', 150)->nullable();
            $table->decimal('costo', 10, 2)->nullable();
            $table->unsignedInteger('cupo_maximo')->nullable();
            $table->enum('estado', ['activo', 'cancelado', 'finalizado'])->default('activo');
            $table->foreignId('creado_por')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('eventos');
    }
};
