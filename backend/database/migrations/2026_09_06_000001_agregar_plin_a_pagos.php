<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Agrega "plin" como método de pago.
 *
 * `metodo_pago` era un enum de SQLite (implementado como CHECK constraint), que
 * solo aceptaba yape/efectivo/tarjeta. En vez de usar Blueprint::change() —que
 * requiere doctrine/dbal y no mapea bien tipos enum—, se reemplaza la columna por
 * un string simple: la validez de cada valor pasa a controlarla la regla `in:...`
 * de PagoControlador. Esto además deja el campo abierto a agregar un nuevo método
 * de pago en el futuro sin tener que volver a migrar la columna.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pagos', function (Blueprint $table) {
            $table->string('metodo_pago_nuevo', 20)->nullable()->after('metodo_pago');
        });

        DB::statement('UPDATE pagos SET metodo_pago_nuevo = metodo_pago');

        Schema::table('pagos', function (Blueprint $table) {
            $table->dropColumn('metodo_pago');
        });

        Schema::table('pagos', function (Blueprint $table) {
            $table->renameColumn('metodo_pago_nuevo', 'metodo_pago');
        });
    }

    public function down(): void
    {
        Schema::table('pagos', function (Blueprint $table) {
            $table->string('metodo_pago_viejo', 20)->nullable()->after('metodo_pago');
        });

        // Cualquier pago registrado en Plin no tiene equivalente en el enum viejo;
        // se conserva como "efectivo" para no perder el registro al revertir.
        DB::statement("UPDATE pagos SET metodo_pago_viejo = CASE WHEN metodo_pago = 'plin' THEN 'efectivo' ELSE metodo_pago END");

        Schema::table('pagos', function (Blueprint $table) {
            $table->dropColumn('metodo_pago');
        });

        Schema::table('pagos', function (Blueprint $table) {
            $table->renameColumn('metodo_pago_viejo', 'metodo_pago');
        });
    }
};
