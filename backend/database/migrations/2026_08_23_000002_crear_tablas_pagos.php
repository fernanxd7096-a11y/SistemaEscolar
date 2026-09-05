<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conceptos_pago', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 100);
            $table->text('descripcion')->nullable();
            $table->decimal('monto_base', 10, 2)->default(0);
            $table->string('año_escolar', 20)->nullable();
            $table->boolean('estado')->default(true);
            $table->timestamps();
        });

        Schema::create('pagos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('alumno_id')->constrained('alumnos')->cascadeOnDelete();
            $table->foreignId('concepto_pago_id')->constrained('conceptos_pago')->cascadeOnDelete();
            $table->foreignId('evento_id')->nullable()->constrained('eventos')->nullOnDelete();
            $table->decimal('monto', 10, 2);
            $table->date('fecha_pago');
            $table->enum('metodo_pago', ['efectivo', 'transferencia', 'deposito'])->default('efectivo');
            $table->string('referencia_pago', 100)->nullable();
            $table->text('observacion')->nullable();
            $table->string('evidencia')->nullable();
            $table->foreignId('registrado_por')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->enum('estado', ['pendiente', 'pagado', 'anulado'])->default('pendiente');
            $table->timestamps();
        });

        Schema::create('comprobantes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pago_id')->constrained('pagos')->cascadeOnDelete();
            $table->string('numero_comprobante', 50)->unique();
            $table->enum('tipo', ['boleta', 'recibo', 'factura'])->default('recibo');
            $table->string('archivo')->nullable();
            $table->foreignId('emitido_por')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->date('fecha_emision');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comprobantes');
        Schema::dropIfExists('pagos');
        Schema::dropIfExists('conceptos_pago');
    }
};
