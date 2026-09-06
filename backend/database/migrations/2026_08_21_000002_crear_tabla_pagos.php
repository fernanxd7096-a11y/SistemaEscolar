<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pagos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('alumno_id')->constrained('alumnos')->cascadeOnDelete();
            $table->decimal('monto', 8, 2);
            $table->string('concepto', 150);
            $table->date('fecha');
            $table->enum('metodo_pago', ['yape', 'efectivo', 'tarjeta']);
            $table->string('referencia', 50)->nullable();
            $table->string('observacion', 255)->nullable();
            $table->foreignId('registrado_por')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->timestamps();

            $table->index(['alumno_id', 'fecha']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pagos');
    }
};
