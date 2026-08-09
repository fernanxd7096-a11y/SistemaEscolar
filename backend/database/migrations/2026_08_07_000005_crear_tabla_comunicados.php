<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('comunicados', function (Blueprint $table) {
            $table->id();
            $table->string('titulo', 200);
            $table->text('contenido');
            $table->enum('tipo', ['general', 'urgente', 'informativo'])->default('general');
            $table->enum('destinatarios', ['todos', 'padres', 'docentes', 'alumnos'])->default('todos');
            $table->foreignId('publicado_por')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->date('fecha_publicacion')->nullable();
            $table->boolean('estado')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comunicados');
    }
};
