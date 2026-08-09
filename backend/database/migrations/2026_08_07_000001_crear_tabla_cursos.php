<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cursos', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 100);
            $table->string('descripcion')->nullable();
            $table->foreignId('grado_id')->constrained('grados')->cascadeOnDelete();
            $table->foreignId('docente_id')->nullable()->constrained('docentes')->nullOnDelete();
            $table->unsignedSmallInteger('horas_semanales')->default(2);
            $table->boolean('estado')->default(true);
            $table->timestamps();

            $table->unique(['nombre', 'grado_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cursos');
    }
};
