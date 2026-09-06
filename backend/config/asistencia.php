<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Notificación automática a padres por falta o tardanza
    |--------------------------------------------------------------------------
    |
    | Si está activo, cada vez que se registre una asistencia con estado
    | "falta" o "tardanza" se encola un correo (Mail::queue, no bloqueante)
    | para el/los padre(s) del alumno que tengan email registrado.
    |
    */

    'notificar_padres_inasistencia' => env('NOTIFICAR_FALTAS_PADRES', true),

];
