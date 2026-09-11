<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Horario avanzado.
 *
 * El modelo anterior (tabla `horarios`) solo describe una plantilla semanal fija:
 * una fila por (sección, día, hora). No permite decir "todos los lunes desde el
 * 01/04 hasta el 31/12" ni representar feriados, viajes o recuperaciones.
 *
 * Se agregan dos tablas y NO se materializa una fila por día:
 *
 *  - `horario_reglas`      Regla recurrente: plantilla semanal (varios días de la
 *                          semana) + rango de vigencia (fecha_inicio..fecha_fin).
 *  - `horario_excepciones` Hecho puntual sobre una fecha o rango de fechas: feriado,
 *                          suspensión, viaje, recuperación o actividad extra. Puede
 *                          cancelar clases (cancela_clases = true) o agregar bloques.
 *
 * Las ocurrencias concretas se calculan por consulta en AgendaHorarioServicio.
 *
 * Compatibilidad: la tabla `horarios` sigue existiendo y sirviendo a la app web.
 * Cada fila de `horarios` se espeja en una `horario_reglas` con `horario_id`
 * apuntando a ella (ver App\Models\Horario::booted), de modo que la agenda tenga
 * una única fuente de verdad. Esta migración copia las filas ya existentes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('horario_reglas', function (Blueprint $table) {
            $table->id();
            // Fila de `horarios` de la que esta regla es espejo (null = regla creada
            // directamente con los endpoints nuevos).
            $table->foreignId('horario_id')->nullable()->constrained('horarios')->nullOnDelete();
            $table->foreignId('seccion_id')->constrained('secciones')->cascadeOnDelete();
            $table->foreignId('curso_id')->nullable()->constrained('cursos')->nullOnDelete();
            $table->foreignId('docente_id')->nullable()->constrained('docentes')->nullOnDelete();
            $table->enum('tipo', ['clase', 'recuperacion', 'extracurricular', 'taller', 'tutoria', 'otro'])
                ->default('clase');
            $table->string('titulo', 150)->nullable();
            // Días de la semana en los que se repite: ["lunes","miercoles"].
            $table->json('dias_semana');
            $table->time('hora_inicio');
            $table->time('hora_fin');
            $table->string('aula', 50)->nullable();
            $table->date('fecha_inicio');
            $table->date('fecha_fin');
            $table->string('año_escolar', 20);
            $table->text('observacion')->nullable();
            $table->boolean('estado')->default(true);
            $table->timestamps();

            $table->index(['seccion_id', 'fecha_inicio', 'fecha_fin'], 'regla_seccion_vigencia');
            $table->index(['docente_id', 'fecha_inicio', 'fecha_fin'], 'regla_docente_vigencia');
        });

        Schema::create('horario_excepciones', function (Blueprint $table) {
            $table->id();
            $table->enum('tipo', [
                'feriado',          // día no lectivo institucional
                'suspension',       // clases suspendidas (huelga, clima, etc.)
                'viaje',            // salida de estudio: la sección no tiene clases regulares
                'recuperacion',     // clase de recuperación en una fecha concreta
                'extracurricular',  // actividad extra puntual
                'cambio_horario',   // el bloque se dicta en otro horario/aula ese día
                'otro',
            ])->default('otro');
            // A quién afecta: todo el colegio, una sección o un docente.
            $table->enum('alcance', ['institucional', 'seccion', 'docente'])->default('institucional');
            $table->foreignId('seccion_id')->nullable()->constrained('secciones')->cascadeOnDelete();
            $table->foreignId('docente_id')->nullable()->constrained('docentes')->nullOnDelete();
            $table->foreignId('curso_id')->nullable()->constrained('cursos')->nullOnDelete();
            // Excepción dirigida a una regla concreta (p. ej. "esta clase se recupera").
            $table->foreignId('regla_id')->nullable()->constrained('horario_reglas')->cascadeOnDelete();
            // Enlace opcional con el módulo de Eventos ya existente (viajes, olimpiadas...).
            $table->foreignId('evento_id')->nullable()->constrained('eventos')->nullOnDelete();
            $table->string('titulo', 200);
            $table->text('descripcion')->nullable();
            $table->date('fecha');
            $table->date('fecha_fin')->nullable();   // null = un solo día
            $table->time('hora_inicio')->nullable(); // null = todo el día
            $table->time('hora_fin')->nullable();
            $table->string('aula', 50)->nullable();
            // true  -> quita los bloques regulares que caigan dentro de la excepción
            // false -> agrega un bloque nuevo a la agenda de esa fecha
            $table->boolean('cancela_clases')->default(false);
            $table->boolean('estado')->default(true);
            $table->foreignId('creado_por')->nullable()->constrained('usuarios')->nullOnDelete();
            $table->timestamps();

            $table->index(['fecha', 'fecha_fin'], 'excepcion_rango');
            $table->index(['alcance', 'seccion_id'], 'excepcion_alcance');
        });

        $this->migrarHorariosExistentes();
    }

    /**
     * Copia la plantilla semanal ya cargada en `horarios` a `horario_reglas`,
     * con vigencia de todo el año escolar en curso.
     */
    private function migrarHorariosExistentes(): void
    {
        $anio = (int) date('Y');
        $ahora = now();

        $filas = DB::table('horarios')->get()->map(fn ($h) => [
            'horario_id'   => $h->id,
            'seccion_id'   => $h->seccion_id,
            'curso_id'     => $h->curso_id,
            'docente_id'   => $h->docente_id,
            'tipo'         => 'clase',
            'titulo'       => null,
            'dias_semana'  => json_encode([$h->dia_semana]),
            'hora_inicio'  => $h->hora_inicio,
            'hora_fin'     => $h->hora_fin,
            'aula'         => $h->aula,
            'fecha_inicio' => $anio . '-01-01',
            'fecha_fin'    => $anio . '-12-31',
            'año_escolar'  => (string) $anio,
            'observacion'  => null,
            'estado'       => $h->estado,
            'created_at'   => $ahora,
            'updated_at'   => $ahora,
        ])->all();

        foreach (array_chunk($filas, 200) as $lote) {
            DB::table('horario_reglas')->insert($lote);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('horario_excepciones');
        Schema::dropIfExists('horario_reglas');
    }
};
