<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('docentes', function (Blueprint $table) {
            $table->enum('estado_registro', ['pendiente', 'aprobado', 'rechazado'])
                  ->default('aprobado')
                  ->after('estado');
            $table->text('motivo_rechazo')->nullable()->after('estado_registro');
        });
    }

    public function down(): void
    {
        Schema::table('docentes', function (Blueprint $table) {
            $table->dropColumn(['estado_registro', 'motivo_rechazo']);
        });
    }
};
