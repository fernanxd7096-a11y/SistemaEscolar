<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AutenticacionControlador;
use App\Http\Controllers\Auth\PasswordControlador;
use App\Http\Controllers\Admin\UsuarioControlador;
use App\Http\Controllers\Admin\RolControlador;
use App\Http\Controllers\DashboardControlador;
use App\Http\Controllers\AlumnoControlador;
use App\Http\Controllers\DocenteControlador;
use App\Http\Controllers\GradoControlador;
use App\Http\Controllers\SeccionControlador;
use App\Http\Controllers\CursoControlador;
use App\Http\Controllers\HorarioControlador;
use App\Http\Controllers\AsistenciaControlador;
use App\Http\Controllers\NotaControlador;
use App\Http\Controllers\ComunicadoControlador;
use App\Http\Controllers\ReporteControlador;
use App\Http\Controllers\PadreControlador;
use App\Http\Controllers\EventoControlador;
use App\Http\Controllers\PagoControlador;
use App\Http\Controllers\RegistroDocenteControlador;
use App\Http\Controllers\PerfilControlador;
use App\Http\Controllers\PushTokenControlador;
use App\Http\Controllers\AgendaHorarioControlador;
use App\Http\Controllers\HorarioReglaControlador;
use App\Http\Controllers\HorarioExcepcionControlador;
use App\Http\Controllers\Movil\MovilControlador;

Route::get('ping', fn () => response()->json([
    'estado'  => 'ok',
    'sistema' => 'Milagroso San Judas Tadeo',
    'version' => '1.0.0',
]));

Route::get('db-check', function () {
    try {
        \Illuminate\Support\Facades\DB::connection()->getPdo();
        $tables = \Illuminate\Support\Facades\DB::select("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
        return response()->json([
            'status' => 'connected',
            'tables' => count($tables),
            'database' => \Illuminate\Support\Facades\DB::connection()->getDatabaseName()
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'status' => 'error',
            'message' => $e->getMessage(),
            'trace' => $e->getFile() . ':' . $e->getLine()
        ], 500);
    }
});

Route::prefix('auth')->group(function () {
    Route::post('login',                    [AutenticacionControlador::class, 'login']);
    Route::post('password/enviar-enlace',   [PasswordControlador::class, 'enviarEnlace']);
    Route::post('password/reset',           [PasswordControlador::class, 'reset']);
});

// --- Registro público de docentes (sin autenticación) ---
Route::post('docentes/registro', [RegistroDocenteControlador::class, 'registrar']);

Route::middleware('auth:sanctum')->group(function () {

    Route::post('auth/logout',              [AutenticacionControlador::class, 'logout']);
    Route::get('auth/usuario-actual',       [AutenticacionControlador::class, 'usuarioActual']);

    Route::get('dashboard/resumen',         [DashboardControlador::class, 'resumen']);
    Route::get('dashboard/graficos',        [DashboardControlador::class, 'graficos']);
    Route::get('dashboard/kpis',            [DashboardControlador::class, 'kpis']);

    Route::middleware('role:administrador|director')->group(function () {
        Route::apiResource('usuarios', UsuarioControlador::class);
        Route::post('usuarios/{usuario}/asignar-rol', [UsuarioControlador::class, 'asignarRol']);
        Route::apiResource('roles', RolControlador::class);
    });

    // --- Fase 2: académicos ---
    Route::get('alumnos', [AlumnoControlador::class, 'index'])->middleware('permission:ver-alumnos');
    Route::post('alumnos', [AlumnoControlador::class, 'store'])->middleware('permission:crear-alumnos');
    Route::get('alumnos/{alumno}', [AlumnoControlador::class, 'show'])->middleware('permission:ver-alumnos');
    Route::put('alumnos/{alumno}', [AlumnoControlador::class, 'update'])->middleware('permission:editar-alumnos');
    Route::delete('alumnos/{alumno}', [AlumnoControlador::class, 'destroy'])->middleware('permission:eliminar-alumnos');
    Route::post('alumnos/{alumno}/matricular', [AlumnoControlador::class, 'matricular'])->middleware('permission:editar-alumnos');

    Route::get('docentes', [DocenteControlador::class, 'index'])->middleware('permission:ver-docentes');
    Route::post('docentes', [DocenteControlador::class, 'store'])->middleware('permission:crear-docentes');
    Route::get('docentes/registros/pendientes', [RegistroDocenteControlador::class, 'pendientes'])->middleware('permission:ver-docentes');
    Route::get('docentes/{docente}', [DocenteControlador::class, 'show'])->middleware('permission:ver-docentes');
    Route::put('docentes/{docente}', [DocenteControlador::class, 'update'])->middleware('permission:editar-docentes');
    Route::delete('docentes/{docente}', [DocenteControlador::class, 'destroy'])->middleware('permission:eliminar-docentes');
    Route::post('docentes/{docente}/aprobar', [RegistroDocenteControlador::class, 'aprobar'])->middleware('permission:editar-docentes');
    Route::post('docentes/{docente}/rechazar', [RegistroDocenteControlador::class, 'rechazar'])->middleware('permission:editar-docentes');
    Route::get('notificaciones/pendientes', [RegistroDocenteControlador::class, 'contadorPendientes']);

    Route::get('grados', [GradoControlador::class, 'index'])->middleware('permission:ver-grados');
    Route::post('grados', [GradoControlador::class, 'store'])->middleware('permission:crear-grados');
    Route::get('grados/{grado}', [GradoControlador::class, 'show'])->middleware('permission:ver-grados');
    Route::put('grados/{grado}', [GradoControlador::class, 'update'])->middleware('permission:editar-grados');
    Route::delete('grados/{grado}', [GradoControlador::class, 'destroy'])->middleware('permission:eliminar-grados');

    Route::get('secciones', [SeccionControlador::class, 'index'])->middleware('permission:ver-grados');
    Route::post('grados/{grado}/secciones', [SeccionControlador::class, 'store'])->middleware('permission:crear-grados');
    Route::put('secciones/{seccion}', [SeccionControlador::class, 'update'])->middleware('permission:editar-grados');
    Route::delete('secciones/{seccion}', [SeccionControlador::class, 'destroy'])->middleware('permission:eliminar-grados');

    // --- Fase 3: cursos ---
    Route::get('cursos', [CursoControlador::class, 'index'])->middleware('permission:ver-cursos');
    Route::post('cursos', [CursoControlador::class, 'store'])->middleware('permission:crear-cursos');
    Route::get('cursos/{curso}', [CursoControlador::class, 'show'])->middleware('permission:ver-cursos');
    Route::put('cursos/{curso}', [CursoControlador::class, 'update'])->middleware('permission:editar-cursos');
    Route::delete('cursos/{curso}', [CursoControlador::class, 'destroy'])->middleware('permission:eliminar-cursos');

    // --- Fase 3: horarios ---
    Route::get('horarios/agenda',      [AgendaHorarioControlador::class, 'agenda'])->middleware('permission:ver-horarios');
    Route::get('horarios/mi-agenda',   [AgendaHorarioControlador::class, 'miAgenda'])->middleware('permission:ver-horarios');

    Route::get('horarios/reglas',                    [HorarioReglaControlador::class, 'index'])->middleware('permission:ver-horarios');
    Route::post('horarios/reglas',                   [HorarioReglaControlador::class, 'store'])->middleware('permission:crear-horarios');
    Route::post('horarios/reglas/verificar',         [HorarioReglaControlador::class, 'verificarConflictos'])->middleware('permission:ver-horarios');
    Route::get('horarios/reglas/{regla}',            [HorarioReglaControlador::class, 'show'])->middleware('permission:ver-horarios');
    Route::put('horarios/reglas/{regla}',            [HorarioReglaControlador::class, 'update'])->middleware('permission:editar-horarios');
    Route::delete('horarios/reglas/{regla}',         [HorarioReglaControlador::class, 'destroy'])->middleware('permission:eliminar-horarios');

    Route::get('horarios/excepciones',               [HorarioExcepcionControlador::class, 'index'])->middleware('permission:ver-horarios');
    Route::post('horarios/excepciones',              [HorarioExcepcionControlador::class, 'store'])->middleware('permission:crear-horarios');
    Route::get('horarios/excepciones/{excepcion}',   [HorarioExcepcionControlador::class, 'show'])->middleware('permission:ver-horarios');
    Route::put('horarios/excepciones/{excepcion}',   [HorarioExcepcionControlador::class, 'update'])->middleware('permission:editar-horarios');
    Route::delete('horarios/excepciones/{excepcion}', [HorarioExcepcionControlador::class, 'destroy'])->middleware('permission:eliminar-horarios');

    Route::get('horarios', [HorarioControlador::class, 'index'])->middleware('permission:ver-horarios');
    Route::post('horarios', [HorarioControlador::class, 'store'])->middleware('permission:crear-horarios');
    Route::get('horarios/{horario}', [HorarioControlador::class, 'show'])->middleware('permission:ver-horarios');
    Route::put('horarios/{horario}', [HorarioControlador::class, 'update'])->middleware('permission:editar-horarios');
    Route::delete('horarios/{horario}', [HorarioControlador::class, 'destroy'])->middleware('permission:eliminar-horarios');

    // --- Fase 4: asistencia ---
    Route::get('asistencias', [AsistenciaControlador::class, 'index'])->middleware('permission:ver-asistencias');
    Route::post('asistencias/masivo', [AsistenciaControlador::class, 'registrarMasivo'])->middleware('permission:registrar-asistencias');
    Route::get('asistencias/seccion-fecha', [AsistenciaControlador::class, 'porSeccionFecha'])->middleware('permission:ver-asistencias');
    Route::get('asistencias/resumen', [AsistenciaControlador::class, 'resumen'])->middleware('permission:ver-asistencias');
    Route::delete('asistencias/{asistencia}', [AsistenciaControlador::class, 'destroy'])->middleware('permission:registrar-asistencias');

    // --- Fase 5: notas ---
    Route::get('notas', [NotaControlador::class, 'index'])->middleware('permission:ver-notas');
    Route::post('notas/masivo', [NotaControlador::class, 'registrarMasivo'])->middleware('permission:registrar-notas');
    Route::get('notas/seccion-curso', [NotaControlador::class, 'porSeccionCurso'])->middleware('permission:ver-notas');
    Route::get('notas/libreta/{alumno}', [NotaControlador::class, 'libreta'])->middleware('permission:ver-notas');
    Route::delete('notas/{nota}', [NotaControlador::class, 'destroy'])->middleware('permission:registrar-notas');

    // --- Fase 6: comunicados ---
    Route::get('comunicados', [ComunicadoControlador::class, 'index'])->middleware('permission:ver-comunicados');
    Route::post('comunicados', [ComunicadoControlador::class, 'store'])->middleware('permission:crear-comunicados');
    Route::get('comunicados/{comunicado}', [ComunicadoControlador::class, 'show'])->middleware('permission:ver-comunicados');
    Route::put('comunicados/{comunicado}', [ComunicadoControlador::class, 'update'])->middleware('permission:editar-comunicados');
    Route::delete('comunicados/{comunicado}', [ComunicadoControlador::class, 'destroy'])->middleware('permission:eliminar-comunicados');

    // --- Eventos ---
    Route::get('eventos', [EventoControlador::class, 'index'])->middleware('permission:ver-eventos');
    Route::post('eventos', [EventoControlador::class, 'store'])->middleware('permission:crear-eventos');
    Route::get('eventos/{evento}', [EventoControlador::class, 'show'])->middleware('permission:ver-eventos');
    Route::put('eventos/{evento}', [EventoControlador::class, 'update'])->middleware('permission:editar-eventos');
    Route::delete('eventos/{evento}', [EventoControlador::class, 'destroy'])->middleware('permission:eliminar-eventos');

    // --- Padres de familia ---
    Route::get('padres', [PadreControlador::class, 'index'])->middleware('permission:ver-padres');
    Route::post('padres', [PadreControlador::class, 'store'])->middleware('permission:crear-padres');
    Route::get('padres/{padre}', [PadreControlador::class, 'show'])->middleware('permission:ver-padres');
    Route::put('padres/{padre}', [PadreControlador::class, 'update'])->middleware('permission:editar-padres');
    Route::delete('padres/{padre}', [PadreControlador::class, 'destroy'])->middleware('permission:eliminar-padres');
    Route::post('padres/{padre}/vincular', [PadreControlador::class, 'vincularAlumno'])->middleware('permission:editar-padres');
    Route::delete('padres/{padre}/desvincular/{alumno}', [PadreControlador::class, 'desvincularAlumno'])->middleware('permission:editar-padres');

    // --- Fase 7: reportes y boletas ---
    Route::get('reportes/resumen', [ReporteControlador::class, 'resumenGeneral'])->middleware('permission:ver-reportes');
    Route::get('reportes/boleta/{alumno}', [ReporteControlador::class, 'boletaAlumno']);
    Route::get('reportes/boleta/{alumno}/observaciones', [ReporteControlador::class, 'obtenerObservacionesBoleta']);
    Route::post('reportes/boleta/{alumno}/observaciones', [ReporteControlador::class, 'guardarObservacionesBoleta']);
    Route::get('reportes/consolidado-asistencia', [ReporteControlador::class, 'consolidadoAsistencia'])->middleware('permission:ver-reportes');
    Route::get('reportes/consolidado-notas', [ReporteControlador::class, 'consolidadoNotas'])->middleware('permission:ver-reportes');

    // --- PDF Exports ---
    Route::get('reportes/boleta/{alumno}/pdf', [ReporteControlador::class, 'boletaPdf']);
    Route::get('reportes/consolidado-asistencia/pdf', [ReporteControlador::class, 'consolidadoAsistenciaPdf'])->middleware('permission:ver-reportes');
    Route::get('reportes/consolidado-notas/pdf', [ReporteControlador::class, 'consolidadoNotasPdf'])->middleware('permission:ver-reportes');

    // --- Configuración institucional ---
    Route::get('configuracion', [\App\Http\Controllers\ConfiguracionControlador::class, 'index']);
    Route::put('configuracion', [\App\Http\Controllers\ConfiguracionControlador::class, 'update'])->middleware('permission:ver-configuracion');

    // --- Conceptos de pago ---
    Route::get('conceptos-pago', [PagoControlador::class, 'conceptos'])->middleware('permission:ver-pagos');
    Route::post('conceptos-pago', [PagoControlador::class, 'crearConcepto'])->middleware('permission:crear-pagos');
    Route::put('conceptos-pago/{concepto}', [PagoControlador::class, 'actualizarConcepto'])->middleware('permission:editar-pagos');
    Route::delete('conceptos-pago/{concepto}', [PagoControlador::class, 'eliminarConcepto'])->middleware('permission:eliminar-pagos');

    // --- Pagos ---
    Route::get('pagos/resumen-metodo', [PagoControlador::class, 'resumenMetodo'])->middleware('permission:ver-pagos');
    Route::get('pagos', [PagoControlador::class, 'index'])->middleware('permission:ver-pagos');
    Route::post('pagos', [PagoControlador::class, 'store'])->middleware('permission:crear-pagos');
    Route::get('pagos/{pago}', [PagoControlador::class, 'show'])->middleware('permission:ver-pagos');
    Route::put('pagos/{pago}', [PagoControlador::class, 'update'])->middleware('permission:editar-pagos');
    Route::delete('pagos/{pago}', [PagoControlador::class, 'destroy'])->middleware('permission:eliminar-pagos');
    Route::post('pagos/{pago}/evidencia', [PagoControlador::class, 'subirEvidencia'])->middleware('permission:crear-pagos|editar-pagos');
    Route::delete('pagos/{pago}/evidencia', [PagoControlador::class, 'eliminarEvidencia'])->middleware('permission:crear-pagos|editar-pagos|eliminar-pagos');

    // --- Pagos por evento ---
    Route::get('eventos/{evento}/pagos', [PagoControlador::class, 'pagosPorEvento'])->middleware('permission:ver-pagos');

    // --- Pagos por padre ---
    Route::get('padres/{padre}/pagos', [PagoControlador::class, 'pagosPorPadre'])->middleware('permission:ver-pagos');

    // --- Perfil de usuario (para web y móvil) ---
    Route::put('perfil',                   [PerfilControlador::class, 'actualizar']);
    Route::put('perfil/password',          [PerfilControlador::class, 'actualizarPassword']);
    Route::post('perfil/foto',             [PerfilControlador::class, 'subirFoto']);
    Route::delete('perfil/foto',           [PerfilControlador::class, 'eliminarFoto']);

    // --- Push Tokens (móvil) ---
    Route::post('push-tokens',             [PushTokenControlador::class, 'registrar']);
    Route::delete('push-tokens',           [PushTokenControlador::class, 'eliminar']);
    Route::post('push-tokens/prueba',      [PushTokenControlador::class, 'enviarPrueba']);
});

// =============================================
// API MÓVIL — Para la app de celulares
// =============================================
Route::middleware('auth:sanctum')->prefix('movil')->group(function () {
    Route::get('perfil',                          [MovilControlador::class, 'perfil']);
    Route::get('hijo/{alumno}/resumen',           [MovilControlador::class, 'resumenHijo']);
    Route::get('hijo/{alumno}/notas',             [MovilControlador::class, 'notasHijo']);
    Route::get('hijo/{alumno}/asistencia',        [MovilControlador::class, 'asistenciaHijo']);
    Route::get('hijo/{alumno}/horario',           [MovilControlador::class, 'horarioHijo']);
    Route::get('hijo/{alumno}/pagos',             [MovilControlador::class, 'pagosHijo']);
    Route::get('comunicados',                     [MovilControlador::class, 'comunicados']);
    Route::get('comunicados/{comunicado}',        [MovilControlador::class, 'comunicadoDetalle']);
});
