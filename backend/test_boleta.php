<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\Alumno;
use App\Models\Seccion;
use App\Models\Nota;

echo "=== TEST: GENERACIÓN DE BOLETA PDF ===\n\n";

// 1. Verificar que hay alumnos
$alumno = Alumno::where('estado', true)->first();
if (!$alumno) {
    echo "[SKIP] No hay alumnos activos en la BD\n";
    exit(0);
}
echo "[OK] Alumno: {$alumno->apellidos}, {$alumno->nombres} (ID:{$alumno->id})\n";

// 2. Verificar sección
$seccion = $alumno->secciones()->with('grado')->first();
if ($seccion) {
    echo "[OK] Sección: {$seccion->grado->nombre} - {$seccion->nombre}\n";
} else {
    echo "[WARN] Alumno sin sección asignada\n";
}

// 3. Verificar notas
$notas = Nota::where('alumno_id', $alumno->id)->get();
echo "[INFO] Notas del alumno: {$notas->count()}\n";
if ($notas->isEmpty()) {
    echo "[INFO] Creando notas de prueba para bimestre 1 y 2...\n";
    
    // Obtener cursos del grado
    $cursos = $seccion ? \App\Models\Curso::where('grado_id', $seccion->grado_id)->where('estado', true)->take(3)->get() : collect();
    
    foreach ($cursos as $curso) {
        // Bimestre 1
        Nota::create([
            'alumno_id' => $alumno->id,
            'curso_id' => $curso->id,
            'seccion_id' => $seccion->id,
            'bimestre' => 1,
            'tipo' => 'examen',
            'calificacion' => rand(12, 18),
            'registrado_por' => 1,
        ]);
        // Bimestre 2
        Nota::create([
            'alumno_id' => $alumno->id,
            'curso_id' => $curso->id,
            'seccion_id' => $seccion->id,
            'bimestre' => 2,
            'tipo' => 'examen',
            'calificacion' => rand(11, 19),
            'registrado_por' => 1,
        ]);
    }
    echo "[OK] Notas de prueba creadas para {$cursos->count()} cursos\n";
}

// 4. Verificar DomPDF
try {
    $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML('<h1>Test</h1>');
    echo "[OK] DomPDF funciona\n";
} catch (\Exception $e) {
    echo "[FAIL] DomPDF error: " . $e->getMessage() . "\n";
    exit(1);
}

// 5. Generar boleta completa
try {
    $seccionId = $seccion ? $seccion->id : null;
    $query = Nota::where('alumno_id', $alumno->id)->with('curso');
    if ($seccionId) $query->where('seccion_id', $seccionId);
    $notas = $query->orderBy('curso_id')->orderBy('bimestre')->get();
    
    $cursosSeccion = $seccion
        ? \App\Models\Curso::where('grado_id', $seccion->grado_id)->where('estado', true)->orderBy('nombre')->get()
        : collect();

    $cursos = $cursosSeccion->map(function ($curso) use ($notas) {
        $notasCurso = $notas->where('curso_id', $curso->id);
        $porBimestre = [];
        for ($b = 1; $b <= 4; $b++) {
            $del = $notasCurso->where('bimestre', $b);
            $porBimestre[$b] = $del->isEmpty() ? null : round($del->avg('calificacion'), 1);
        }
        $promedioFinal = $notasCurso->isEmpty() ? 0 : round($notasCurso->avg('calificacion'), 1);
        return [
            'curso' => $curso->nombre,
            'bimestre_1' => $porBimestre[1],
            'bimestre_2' => $porBimestre[2],
            'bimestre_3' => $porBimestre[3],
            'bimestre_4' => $porBimestre[4],
            'promedio_final' => $promedioFinal,
        ];
    })->toArray();

    echo "[OK] Cursos procesados: " . count($cursos) . "\n";
    foreach ($cursos as $c) {
        $b1 = $c['bimestre_1'] !== null ? $c['bimestre_1'] : '—';
        $b2 = $c['bimestre_2'] !== null ? $c['bimestre_2'] : '—';
        $b3 = $c['bimestre_3'] !== null ? $c['bimestre_3'] : '—';
        $b4 = $c['bimestre_4'] !== null ? $c['bimestre_4'] : '—';
        echo "  {$c['curso']}: B1={$b1} B2={$b2} B3={$b3} B4={$b4} Prom={$c['promedio_final']}\n";
    }

    // Logo
    $logoBase64 = null;
    $logoPath = base_path('../frontend/src/assets/logo.png');
    if (file_exists($logoPath)) {
        $logoBase64 = 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath));
        echo "[OK] Logo encontrado\n";
    } else {
        echo "[WARN] Logo no encontrado en: $logoPath\n";
    }

    $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.boleta', [
        'alumno' => $alumno,
        'seccion' => $seccion,
        'cursos' => $cursos,
        'anioEscolar' => date('Y'),
        'logoBase64' => $logoBase64,
        'observaciones' => '',
        'fechaGeneracion' => \Carbon\Carbon::now()->locale('es')->isoFormat('D [de] MMMM [de] YYYY, HH:mm'),
    ]);
    $pdf->setPaper('A4', 'portrait');

    // Guardar
    $boletasDir = base_path('../Boletas');
    if (!is_dir($boletasDir)) mkdir($boletasDir, 0755, true);

    $apellidos = preg_replace('/[^a-zA-Z0-9_]/', '_', $alumno->apellidos);
    $nombres = preg_replace('/[^a-zA-Z0-9_]/', '_', $alumno->nombres);
    $filename = "Informe_Academico_{$apellidos}_{$nombres}_" . date('Y') . ".pdf";
    $filepath = $boletasDir . DIRECTORY_SEPARATOR . $filename;

    file_put_contents($filepath, $pdf->output());

    echo "[OK] PDF generado: $filepath\n";
    echo "[OK] Tamaño: " . number_format(filesize($filepath)) . " bytes\n";

    // Verificar que existe
    if (file_exists($filepath)) {
        echo "\n[PASS] ✅ Boleta generada correctamente\n";
        echo "[PASS] ✅ Guardada en: $boletasDir\n";
    } else {
        echo "\n[FAIL] El archivo no se creó\n";
    }

} catch (\Exception $e) {
    echo "[FAIL] Error generando PDF: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}

echo "\n=== TEST COMPLETADO ===\n";
