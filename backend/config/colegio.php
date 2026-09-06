<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Datos institucionales
    |--------------------------------------------------------------------------
    |
    | Se usan en los documentos oficiales que genera el sistema (por ahora, la
    | boleta de notas en PDF de ReporteControlador::boletaPdf). Se pueden ajustar
    | por .env sin tocar código.
    |
    */

    'nombre'    => env('COLEGIO_NOMBRE', 'I.E.P. Milagroso San Judas Tadeo'),
    'lema'      => env('COLEGIO_LEMA', 'Educación con valores'),
    'direccion' => env('COLEGIO_DIRECCION', ''),
    'telefono'  => env('COLEGIO_TELEFONO', ''),
    'email'     => env('COLEGIO_EMAIL', ''),
    'ugel'      => env('COLEGIO_UGEL', ''),

    /*
    | Escala de calificación vigesimal (0–20) usada en el sistema peruano.
    | `aprobado_desde` marca el mínimo aprobatorio en la boleta.
    */
    'nota_maxima'    => (float) env('COLEGIO_NOTA_MAXIMA', 20),
    'aprobado_desde' => (float) env('COLEGIO_APROBADO_DESDE', 11),

];
