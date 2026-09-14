<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Asegurar compatibilidad en PostgreSQL para evitar fallos de constraints
        try {
            DB::statement("ALTER TABLE pagos ALTER COLUMN concepto DROP NOT NULL");
        } catch (\Throwable $e) {}

        try {
            DB::statement("ALTER TABLE pagos ADD COLUMN IF NOT EXISTS referencia_pago VARCHAR(100)");
        } catch (\Throwable $e) {}

        try {
            DB::statement("ALTER TABLE conceptos_pago ADD COLUMN IF NOT EXISTS anio_escolar VARCHAR(20)");
        } catch (\Throwable $e) {}

        try {
            DB::statement("ALTER TABLE conceptos_pago ADD COLUMN IF NOT EXISTS año_escolar VARCHAR(20)");
        } catch (\Throwable $e) {}
    }

    public function down(): void
    {
        // No destructivo
    }
};
