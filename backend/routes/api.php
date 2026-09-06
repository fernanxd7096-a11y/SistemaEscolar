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
use App\Http\Controllers\HorarioReglaControlador;
use App\Http\Controllers\HorarioExcepcionControlador;
use App\Http\Controllers\AgendaHorarioControlador;
use App\Http\Controllers\AsistenciaControlador;
use App\Http\Controllers\NotaControlador;
use App\Http\Controllers\ComunicadoControlador;
use App\Http\Controllers\ReporteControlador;
use App\Http\Controllers\PushTokenControlador;
use App\Http\Controllers\EventoControlador;
use App\Http\Controllers\PagoControlador;
use App\Http\Controllers\PerfilControlador;

Route::get('ping', fn () => response()->json([
    'estado'  => 'ok',
    'sistema' => 'Milagroso San Judas Tadeo',
    'version' => '1.0.0',
]));

Route::prefix('auth')->group(function () {
    Route::post('login',                    [AutenticacionControlador::class, 'login']);
    Route::post('password/enviar-enlace',   [PasswordControlador::class, 'enviarEnlace']);
    Route::post('password/reset',           [PasswordControlador::class, 'reset']);
});

Route::middleware('auth:sanctum')->group(function () {

    Route::post('auth/logout',              [AutenticacionControlador::class, 'logout']);
    Route::get('auth/usuario-actual',       [AutenticacionControlador::class, 'usuarioActual']);

    Route::get('dashboard/resumen',         [DashboardControlador::class, 'resumen']);
    Route::get('dashboard/kpis',            [DashboardControlador::class, 'kpis']);

    // --- App móvil: notificaciones push (Expo) ---
    Route::post('push-tokens',              [PushTokenControlador::class, 'store']);
    Route::delete('push-tokens',            [PushTokenControlador::class, 'destroy']);
    Route::post('push-tokens/prueba',       [PushTokenControlador::class, 'prueba']);

    // --- Mi perfil (autoservicio: cualquier usuario autenticado edita lo suyo,
    // sin permisos de rol — distinto de Admin\UsuarioControlador, que gestiona a
    // OTROS usuarios y sí está restringido a administrador/director) ---
    Route::put('perfil',                    [PerfilControlador::class, 'actualizar']);
    Route::put('perfil/password',           [PerfilControlador::class, 'cambiarPassword']);
    Route::post('perfil/foto',              [PerfilControlador::class, 'subirFoto']);
    Route::delete('perfil/foto',            [PerfilControlador::class, 'eliminarFoto']);

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
    Route::get('docentes/{docente}', [DocenteControlador::class, 'show'])->middleware('permission:ver-docentes');
    Route::put('docentes/{docente}', [DocenteControlador::class, 'update'])->middleware('permission:editar-docentes');
    Route::delete('docentes/{docente}', [DocenteControlador::class, 'destroy'])->middleware('permission:eliminar-docentes');

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
    // Horario avanzado (reglas recurrentes + excepciones + agenda resuelta).
    // Va ANTES de horarios/{horario} para que 'reglas', 'excepciones' y 'agenda'
    // no sean capturados por el binding del modelo.
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

    // Plantilla semanal clásica (la sigue usando la app web). Cada fila se espeja
    // en horario_reglas: ver App\Models\Horario::booted.
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

    // --- Fase 7: reportes ---
    Route::get('reportes/resumen', [ReporteControlador::class, 'resumenGeneral'])->middleware('permission:ver-reportes');
    Route::get('reportes/boleta/{alumno}', [ReporteControlador::class, 'boletaAlumno'])->middleware('permission:ver-reportes');
    Route::get('reportes/boleta/{alumno}/pdf', [ReporteControlador::class, 'boletaPdf'])->middleware('permission:ver-reportes');
    Route::get('reportes/consolidado-asistencia', [ReporteControlador::class, 'consolidadoAsistencia'])->middleware('permission:ver-reportes');
    Route::get('reportes/consolidado-notas', [ReporteControlador::class, 'consolidadoNotas'])->middleware('permission:ver-reportes');

    // --- Eventos extracurriculares ---
    Route::get('eventos/proximos', [EventoControlador::class, 'proximos'])->middleware('permission:ver-eventos');
    Route::get('eventos', [EventoControlador::class, 'index'])->middleware('permission:ver-eventos');
    Route::post('eventos', [EventoControlador::class, 'store'])->middleware('permission:crear-eventos');
    Route::get('eventos/{evento}', [EventoControlador::class, 'show'])->middleware('permission:ver-eventos');
    Route::put('eventos/{evento}', [EventoControlador::class, 'update'])->middleware('permission:editar-eventos');
    Route::delete('eventos/{evento}', [EventoControlador::class, 'destroy'])->middleware('permission:eliminar-eventos');

    // --- Pagos ---
    Route::get('pagos/resumen-metodo', [PagoControlador::class, 'resumenMetodo'])->middleware('permission:ver-pagos');
    Route::get('pagos', [PagoControlador::class, 'index'])->middleware('permission:ver-pagos');
    Route::post('pagos', [PagoControlador::class, 'store'])->middleware('permission:crear-pagos');
    Route::get('pagos/{pago}', [PagoControlador::class, 'show'])->middleware('permission:ver-pagos');
    Route::put('pagos/{pago}', [PagoControlador::class, 'update'])->middleware('permission:editar-pagos');
    Route::delete('pagos/{pago}', [PagoControlador::class, 'destroy'])->middleware('permission:eliminar-pagos');
});
