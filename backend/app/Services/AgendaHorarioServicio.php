<?php

namespace App\Services;

use App\Models\Docente;
use App\Models\HorarioExcepcion;
use App\Models\HorarioRegla;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

/**
 * Resuelve el horario real de una sección o un docente para un rango de fechas.
 *
 * No hay filas materializadas por día: se parte de las reglas recurrentes
 * (horario_reglas) vigentes en el rango, se expanden sobre los días de la semana
 * que correspondan y encima se aplican las excepciones (horario_excepciones):
 * las que cancelan quitan o marcan bloques, las que no cancelan agregan bloques.
 */
class AgendaHorarioServicio
{
    /** Tope de días por consulta, para que un rango absurdo no tumbe el API. */
    public const MAX_DIAS = 120;

    private const ETIQUETAS_DIA = [
        'lunes'     => 'Lunes',
        'martes'    => 'Martes',
        'miercoles' => 'Miércoles',
        'jueves'    => 'Jueves',
        'viernes'   => 'Viernes',
        'sabado'    => 'Sábado',
        'domingo'   => 'Domingo',
    ];

    /**
     * @param  array{seccion_id?:int|null, docente_id?:int|null}  $filtros
     * @return array<int, array<string, mixed>> Un elemento por día del rango.
     */
    public function resolver(string $desde, string $hasta, array $filtros = []): array
    {
        $inicio = CarbonImmutable::parse($desde)->startOfDay();
        $fin    = CarbonImmutable::parse($hasta)->startOfDay();

        if ($fin->lessThan($inicio)) {
            [$inicio, $fin] = [$fin, $inicio];
        }
        if ($inicio->diffInDays($fin) > self::MAX_DIAS) {
            $fin = $inicio->addDays(self::MAX_DIAS);
        }

        $seccionId = $filtros['seccion_id'] ?? null;
        $docenteId = $filtros['docente_id'] ?? null;

        $reglas = $this->reglasVigentes($inicio, $fin, $seccionId, $docenteId);

        // Cuando se filtra por docente, sus secciones salen de sus propias reglas:
        // hacen falta para saber qué feriados/viajes de sección le afectan.
        $seccionesRelevantes = $seccionId
            ? [$seccionId]
            : $reglas->pluck('seccion_id')->unique()->values()->all();

        $excepciones = $this->excepcionesVigentes($inicio, $fin, $seccionesRelevantes, $docenteId);

        $dias = [];
        for ($fecha = $inicio; $fecha->lessThanOrEqualTo($fin); $fecha = $fecha->addDay()) {
            $dias[] = $this->resolverDia($fecha, $reglas, $excepciones, $seccionId, $docenteId);
        }

        return $dias;
    }

    /** Agenda de un solo día. */
    public function resolverFecha(string $fecha, array $filtros = []): array
    {
        return $this->resolver($fecha, $fecha, $filtros)[0] ?? [];
    }

    /**
     * Reglas activas cuya vigencia se cruza con el rango pedido.
     */
    private function reglasVigentes(
        CarbonImmutable $inicio,
        CarbonImmutable $fin,
        ?int $seccionId,
        ?int $docenteId
    ): Collection {
        $query = HorarioRegla::query()
            ->with(['seccion.grado', 'curso', 'docente'])
            ->where('estado', true)
            ->whereDate('fecha_inicio', '<=', $fin->toDateString())
            ->whereDate('fecha_fin', '>=', $inicio->toDateString());

        if ($seccionId) {
            $query->where('seccion_id', $seccionId);
        }
        if ($docenteId) {
            $query->where('docente_id', $docenteId);
        }

        return $query->orderBy('hora_inicio')->get();
    }

    /**
     * Excepciones activas que se cruzan con el rango y que pueden afectar al
     * filtro pedido (institucionales siempre; de sección/docente, las que calcen).
     *
     * @param  array<int, int>  $seccionesRelevantes
     */
    private function excepcionesVigentes(
        CarbonImmutable $inicio,
        CarbonImmutable $fin,
        array $seccionesRelevantes,
        ?int $docenteId
    ): Collection {
        return HorarioExcepcion::query()
            ->with(['seccion.grado', 'curso', 'docente', 'evento'])
            ->where('estado', true)
            ->whereDate('fecha', '<=', $fin->toDateString())
            ->where(function ($q) use ($inicio) {
                $q->whereDate('fecha_fin', '>=', $inicio->toDateString())
                    ->orWhere(function ($q2) use ($inicio) {
                        $q2->whereNull('fecha_fin')->whereDate('fecha', '>=', $inicio->toDateString());
                    });
            })
            ->where(function ($q) use ($seccionesRelevantes, $docenteId) {
                $q->where('alcance', 'institucional');

                if (!empty($seccionesRelevantes)) {
                    $q->orWhere(function ($q2) use ($seccionesRelevantes) {
                        $q2->where('alcance', 'seccion')->whereIn('seccion_id', $seccionesRelevantes);
                    });
                }

                if ($docenteId) {
                    $q->orWhere(function ($q2) use ($docenteId) {
                        $q2->where('alcance', 'docente')->where('docente_id', $docenteId);
                    });
                } else {
                    $q->orWhere('alcance', 'docente');
                }
            })
            ->orderBy('fecha')
            ->orderByRaw('hora_inicio IS NULL DESC')
            ->orderBy('hora_inicio')
            ->get();
    }

    /**
     * Arma la agenda de un día concreto: expande las reglas y superpone las
     * excepciones que caen en esa fecha.
     */
    private function resolverDia(
        CarbonImmutable $fecha,
        Collection $reglas,
        Collection $excepciones,
        ?int $seccionId,
        ?int $docenteId
    ): array {
        $iso = $fecha->toDateString();
        $dia = HorarioRegla::DIAS[$fecha->dayOfWeekIso - 1];

        $delDia = $excepciones->filter(
            fn (HorarioExcepcion $e) => $e->fecha->toDateString() <= $iso && $e->ultimaFecha() >= $iso
        )->values();

        $bloques = [];

        // 1) Bloques regulares: reglas vigentes ese día de la semana y esa fecha.
        foreach ($reglas as $regla) {
            if (!in_array($dia, $regla->dias_semana ?? [], true)) {
                continue;
            }
            if ($iso < $regla->fecha_inicio->toDateString() || $iso > $regla->fecha_fin->toDateString()) {
                continue;
            }

            $bloques[] = $this->bloqueDesdeRegla($regla);
        }

        // 2) Excepciones que cancelan: marcan los bloques regulares afectados.
        foreach ($delDia->where('cancela_clases', true) as $excepcion) {
            foreach ($bloques as $i => $bloque) {
                if ($this->excepcionAfectaBloque($excepcion, $bloque)) {
                    $bloques[$i]['cancelado'] = true;
                    $bloques[$i]['motivo_cancelacion'] = $excepcion->titulo;
                    $bloques[$i]['excepcion_id'] = $excepcion->id;
                }
            }
        }

        // 3) Excepciones que agregan: recuperaciones, actividades, cambios de horario.
        foreach ($delDia->where('cancela_clases', false) as $excepcion) {
            if (!$this->excepcionAplicaAlFiltro($excepcion, $seccionId, $docenteId)) {
                continue;
            }
            $bloques[] = $this->bloqueDesdeExcepcion($excepcion);
        }

        usort($bloques, fn ($a, $b) => ($a['hora_inicio'] ?? '') <=> ($b['hora_inicio'] ?? ''));

        // Un día se considera no lectivo solo si la suspensión cubre de verdad lo
        // consultado: institucional siempre, o de sección/docente cuando se está
        // mirando esa sección/docente en concreto (no al filtrar "todo el colegio").
        $noLectivo = $delDia->first(fn (HorarioExcepcion $e) => $e->cancela_clases
            && $e->esTodoElDia()
            && match ($e->alcance) {
                'institucional' => true,
                'seccion'       => $seccionId !== null && $e->seccion_id === $seccionId,
                'docente'       => $docenteId !== null && $e->docente_id === $docenteId,
                default         => false,
            });

        return [
            'fecha'          => $iso,
            'dia_semana'     => $dia,
            'etiqueta_dia'   => self::ETIQUETAS_DIA[$dia],
            'es_fin_semana'  => $fecha->dayOfWeekIso >= 6,
            'es_no_lectivo'  => (bool) $noLectivo,
            'motivo_no_lectivo' => $noLectivo?->titulo,
            'bloques'        => array_values($bloques),
            'excepciones'    => $delDia
                ->filter(fn ($e) => $this->excepcionAplicaAlFiltro($e, $seccionId, $docenteId))
                ->map(fn (HorarioExcepcion $e) => $this->resumenExcepcion($e))
                ->values()
                ->all(),
        ];
    }

    private function bloqueDesdeRegla(HorarioRegla $regla): array
    {
        return [
            'origen'        => 'regla',
            'regla_id'      => $regla->id,
            'excepcion_id'  => null,
            'tipo'          => $regla->tipo,
            'titulo'        => $regla->titulo ?? $regla->curso?->nombre ?? 'Clase',
            'curso_id'      => $regla->curso_id,
            'curso'         => $regla->curso?->nombre,
            'seccion_id'    => $regla->seccion_id,
            'seccion'       => $regla->seccion
                ? trim(($regla->seccion->grado?->nombre ?? '') . ' ' . $regla->seccion->nombre)
                : null,
            'docente_id'    => $regla->docente_id,
            'docente'       => $regla->docente
                ? $regla->docente->nombres . ' ' . $regla->docente->apellidos
                : null,
            'aula'          => $regla->aula,
            'hora_inicio'   => $this->hora($regla->hora_inicio),
            'hora_fin'      => $this->hora($regla->hora_fin),
            'cancelado'     => false,
            'motivo_cancelacion' => null,
        ];
    }

    private function bloqueDesdeExcepcion(HorarioExcepcion $excepcion): array
    {
        return [
            'origen'        => 'excepcion',
            'regla_id'      => $excepcion->regla_id,
            'excepcion_id'  => $excepcion->id,
            'tipo'          => $excepcion->tipo,
            'titulo'        => $excepcion->titulo,
            'curso_id'      => $excepcion->curso_id,
            'curso'         => $excepcion->curso?->nombre,
            'seccion_id'    => $excepcion->seccion_id,
            'seccion'       => $excepcion->seccion
                ? trim(($excepcion->seccion->grado?->nombre ?? '') . ' ' . $excepcion->seccion->nombre)
                : null,
            'docente_id'    => $excepcion->docente_id,
            'docente'       => $excepcion->docente
                ? $excepcion->docente->nombres . ' ' . $excepcion->docente->apellidos
                : null,
            'aula'          => $excepcion->aula,
            'hora_inicio'   => $this->hora($excepcion->hora_inicio),
            'hora_fin'      => $this->hora($excepcion->hora_fin),
            'cancelado'     => false,
            'motivo_cancelacion' => null,
        ];
    }

    private function resumenExcepcion(HorarioExcepcion $excepcion): array
    {
        return [
            'id'             => $excepcion->id,
            'tipo'           => $excepcion->tipo,
            'alcance'        => $excepcion->alcance,
            'titulo'         => $excepcion->titulo,
            'descripcion'    => $excepcion->descripcion,
            'cancela_clases' => $excepcion->cancela_clases,
            'todo_el_dia'    => $excepcion->esTodoElDia(),
            'hora_inicio'    => $this->hora($excepcion->hora_inicio),
            'hora_fin'       => $this->hora($excepcion->hora_fin),
            'evento_id'      => $excepcion->evento_id,
        ];
    }

    /** ¿La excepción alcanza al bloque regular (por institución, sección, docente o regla)? */
    private function excepcionAfectaBloque(HorarioExcepcion $excepcion, array $bloque): bool
    {
        if ($excepcion->regla_id && $excepcion->regla_id !== $bloque['regla_id']) {
            return false;
        }

        $alcanza = match ($excepcion->alcance) {
            'institucional' => true,
            'seccion'       => $excepcion->seccion_id === $bloque['seccion_id'],
            'docente'       => $excepcion->docente_id !== null
                && $excepcion->docente_id === $bloque['docente_id'],
            default         => false,
        };

        if (!$alcanza) {
            return false;
        }

        if ($excepcion->esTodoElDia()) {
            return true;
        }

        return $this->seSolapan(
            $this->hora($excepcion->hora_inicio),
            $this->hora($excepcion->hora_fin),
            $bloque['hora_inicio'],
            $bloque['hora_fin']
        );
    }

    /** ¿La excepción es relevante para la sección/docente que se está consultando? */
    private function excepcionAplicaAlFiltro(
        HorarioExcepcion $excepcion,
        ?int $seccionId,
        ?int $docenteId
    ): bool {
        return match ($excepcion->alcance) {
            'institucional' => true,
            'seccion'       => $seccionId === null || $excepcion->seccion_id === $seccionId,
            'docente'       => $docenteId === null || $excepcion->docente_id === $docenteId,
            default         => false,
        };
    }

    /**
     * Conflictos de una regla (nueva o editada) contra las demás reglas vigentes:
     * misma sección o mismo docente, días de la semana en común, vigencias que se
     * cruzan y franjas horarias solapadas.
     *
     * @param  array<string, mixed>  $datos
     * @return array<int, array<string, string|int>>
     */
    public function conflictosDeRegla(array $datos, ?int $ignorarReglaId = null): array
    {
        $dias        = $datos['dias_semana'] ?? [];
        $horaInicio  = $this->hora($datos['hora_inicio'] ?? null);
        $horaFin     = $this->hora($datos['hora_fin'] ?? null);
        $fechaInicio = $datos['fecha_inicio'] ?? null;
        $fechaFin    = $datos['fecha_fin'] ?? null;
        $seccionId   = $datos['seccion_id'] ?? null;
        $docenteId   = $datos['docente_id'] ?? null;

        if (!$dias || !$horaInicio || !$horaFin || !$fechaInicio || !$fechaFin) {
            return [];
        }

        $candidatas = HorarioRegla::query()
            ->with(['seccion.grado', 'curso', 'docente'])
            ->where('estado', true)
            ->whereDate('fecha_inicio', '<=', $fechaFin)
            ->whereDate('fecha_fin', '>=', $fechaInicio)
            ->when($ignorarReglaId, fn ($q) => $q->where('id', '!=', $ignorarReglaId))
            ->where(function ($q) use ($seccionId, $docenteId) {
                $q->where('seccion_id', $seccionId);
                if ($docenteId) {
                    $q->orWhere('docente_id', $docenteId);
                }
            })
            ->get();

        $conflictos = [];

        foreach ($candidatas as $otra) {
            $diasComunes = array_values(array_intersect($dias, $otra->dias_semana ?? []));
            if (!$diasComunes) {
                continue;
            }
            if (!$this->seSolapan($horaInicio, $horaFin, $this->hora($otra->hora_inicio), $this->hora($otra->hora_fin))) {
                continue;
            }

            $mismaSeccion = $otra->seccion_id === (int) $seccionId;

            $conflictos[] = [
                'regla_id' => $otra->id,
                'motivo'   => $mismaSeccion ? 'seccion' : 'docente',
                'dias'     => implode(', ', $diasComunes),
                'detalle'  => sprintf(
                    '%s: %s %s–%s (%s) en %s',
                    $mismaSeccion ? 'La sección ya tiene clase' : 'El docente ya dicta',
                    implode('/', $diasComunes),
                    $this->hora($otra->hora_inicio),
                    $this->hora($otra->hora_fin),
                    $otra->curso?->nombre ?? $otra->titulo ?? $otra->tipo,
                    trim(($otra->seccion?->grado?->nombre ?? '') . ' ' . ($otra->seccion?->nombre ?? ''))
                ),
            ];
        }

        return $conflictos;
    }

    /**
     * Conflictos de una excepción que AGREGA un bloque (recuperación, actividad):
     * se compara contra la agenda ya resuelta de esas fechas.
     *
     * @param  array<string, mixed>  $datos
     * @return array<int, array<string, string|int>>
     */
    public function conflictosDeExcepcion(array $datos, ?int $ignorarExcepcionId = null): array
    {
        if (!empty($datos['cancela_clases'])) {
            return []; // Cancelar nunca choca: solo quita bloques.
        }

        $horaInicio = $this->hora($datos['hora_inicio'] ?? null);
        $horaFin    = $this->hora($datos['hora_fin'] ?? null);
        if (!$horaInicio || !$horaFin) {
            return [];
        }

        $desde = $datos['fecha'] ?? null;
        $hasta = $datos['fecha_fin'] ?? $desde;
        if (!$desde) {
            return [];
        }

        $filtros = [];
        if (!empty($datos['seccion_id'])) {
            $filtros['seccion_id'] = (int) $datos['seccion_id'];
        } elseif (!empty($datos['docente_id'])) {
            $filtros['docente_id'] = (int) $datos['docente_id'];
        } else {
            return [];
        }

        $conflictos = [];

        foreach ($this->resolver($desde, $hasta, $filtros) as $dia) {
            foreach ($dia['bloques'] as $bloque) {
                $esLaMismaExcepcion = $ignorarExcepcionId !== null
                    && $bloque['excepcion_id'] === $ignorarExcepcionId;

                if ($bloque['cancelado'] || $esLaMismaExcepcion) {
                    continue;
                }
                if (!$this->seSolapan($horaInicio, $horaFin, $bloque['hora_inicio'], $bloque['hora_fin'])) {
                    continue;
                }

                $conflictos[] = [
                    'fecha'   => $dia['fecha'],
                    'motivo'  => isset($filtros['seccion_id']) ? 'seccion' : 'docente',
                    'detalle' => sprintf(
                        '%s ya tiene %s de %s a %s',
                        $dia['fecha'],
                        $bloque['titulo'],
                        $bloque['hora_inicio'],
                        $bloque['hora_fin']
                    ),
                ];
            }
        }

        return $conflictos;
    }

    /** Dos franjas se solapan si cada una empieza antes de que termine la otra. */
    private function seSolapan(?string $inicioA, ?string $finA, ?string $inicioB, ?string $finB): bool
    {
        if (!$inicioA || !$finA || !$inicioB || !$finB) {
            return false;
        }

        return $inicioA < $finB && $inicioB < $finA;
    }

    /** Normaliza "08:00", "08:00:00" o un Carbon a "HH:MM" para comparar y mostrar. */
    private function hora(mixed $valor): ?string
    {
        if ($valor === null || $valor === '') {
            return null;
        }
        if ($valor instanceof \DateTimeInterface) {
            return $valor->format('H:i');
        }

        return substr((string) $valor, 0, 5);
    }

    /**
     * Docente ligado al usuario autenticado: primero por `usuario_id`, y si el
     * registro no está enlazado, por email (los seeders cargan docentes sin usuario).
     */
    public function docenteDelUsuario(?object $usuario): ?Docente
    {
        if (!$usuario) {
            return null;
        }

        return Docente::where('usuario_id', $usuario->id)->first()
            ?? (filled($usuario->email) ? Docente::where('email', $usuario->email)->first() : null);
    }
}
