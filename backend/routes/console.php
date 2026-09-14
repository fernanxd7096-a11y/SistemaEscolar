<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('pagos:notificar-pendientes', function (\App\Services\ExpoPushService $expo) {
    $this->info('Iniciando envío de notificaciones push de pagos pendientes...');
    $controlador = app(\App\Http\Controllers\PagoControlador::class);
    $request = new \Illuminate\Http\Request();
    $respuesta = $controlador->notificarPendientes($request, $expo);
    $datos = $respuesta->getData(true);
    $this->info($datos['mensaje'] ?? 'Proceso finalizado.');
})->purpose('Enviar notificaciones push a los padres con pagos pendientes');
