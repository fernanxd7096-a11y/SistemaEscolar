<?php

namespace Database\Seeders;

use App\Models\Alumno;
use App\Models\Comprobante;
use App\Models\ConceptoPago;
use App\Models\Evento;
use App\Models\Pago;
use App\Models\Usuario;
use Illuminate\Database\Seeder;

class PagoSeeder extends Seeder
{
    public function run(): void
    {
        $admin = Usuario::first();
        $año = (string) date('Y');

        $conceptos = [
            ['nombre' => 'Matrícula 2026', 'descripcion' => 'Matrícula anual', 'monto_base' => 350.00],
            ['nombre' => 'Pensión Marzo', 'descripcion' => 'Pensión mensual', 'monto_base' => 280.00],
            ['nombre' => 'Pensión Abril', 'descripcion' => 'Pensión mensual', 'monto_base' => 280.00],
            ['nombre' => 'Evento escolar', 'descripcion' => 'Pago por participación en evento', 'monto_base' => 35.00],
        ];

        $conceptoMap = [];
        foreach ($conceptos as $c) {
            $conceptoMap[$c['nombre']] = ConceptoPago::firstOrCreate(
                ['nombre' => $c['nombre'], 'año_escolar' => $año],
                array_merge($c, ['año_escolar' => $año, 'estado' => true])
            );
        }

        $alumnoJose = Alumno::where('dni', '80111222')->first();
        $alumnoLucia = Alumno::where('dni', '80333444')->first();
        $eventoExcursion = Evento::where('titulo', 'like', '%Excursión%')->first();

        if ($alumnoJose) {
            $pago = Pago::firstOrCreate(
                [
                    'alumno_id'        => $alumnoJose->id,
                    'concepto_pago_id' => $conceptoMap['Matrícula 2026']->id,
                    'fecha_pago'       => now()->subDays(20)->toDateString(),
                ],
                [
                    'monto'          => 350.00,
                    'metodo_pago'    => 'efectivo',
                    'estado'         => 'pagado',
                    'registrado_por' => $admin?->id,
                ]
            );

            Comprobante::firstOrCreate(
                ['pago_id' => $pago->id],
                [
                    'numero_comprobante' => 'REC-2026-0001',
                    'tipo'               => 'recibo',
                    'emitido_por'        => $admin?->id,
                    'fecha_emision'      => $pago->fecha_pago,
                ]
            );
        }

        if ($alumnoLucia) {
            Pago::firstOrCreate(
                [
                    'alumno_id'        => $alumnoLucia->id,
                    'concepto_pago_id' => $conceptoMap['Pensión Marzo']->id,
                    'fecha_pago'       => now()->subDays(5)->toDateString(),
                ],
                [
                    'monto'          => 280.00,
                    'metodo_pago'    => 'transferencia',
                    'referencia_pago'=> 'OP-123456',
                    'estado'         => 'pagado',
                    'registrado_por' => $admin?->id,
                ]
            );
        }

        if ($alumnoJose && $eventoExcursion) {
            Pago::firstOrCreate(
                [
                    'alumno_id'        => $alumnoJose->id,
                    'concepto_pago_id' => $conceptoMap['Evento escolar']->id,
                    'evento_id'        => $eventoExcursion->id,
                ],
                [
                    'monto'          => 35.00,
                    'fecha_pago'     => now()->subDay()->toDateString(),
                    'metodo_pago'    => 'efectivo',
                    'estado'         => 'pagado',
                    'registrado_por' => $admin?->id,
                ]
            );
        }
    }
}
