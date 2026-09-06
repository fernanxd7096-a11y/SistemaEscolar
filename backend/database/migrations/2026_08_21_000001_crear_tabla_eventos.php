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
            $table->string('titulo', 200);
            $table->text('descripcion')->nullable();
            $table->enum('tipo', ['visita_estudio', 'olimpiada', 'deportivo', 'cultural', 'otro'])->default('otro');
            $table->string('lugar', 200)->nullable();
            $table->date('fecha');
            $table->time('hora')->nullable();
            $table->enum('estado', ['programado', 'en_curso', 'finalizado', 'cancelado'])->default('programado');
            $table->boolean('visible')->default(true);
            $table->foreignId('creado_por')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->timestamps();

            $table->index(['fecha', 'visible']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('eventos');
    }
};
