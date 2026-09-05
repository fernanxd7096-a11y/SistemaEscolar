<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Consolidado de Notas</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: landscape; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 9px; color: #1f2937; padding: 20px; }
        .header { text-align: center; margin-bottom: 18px; border-bottom: 3px solid #6366f1; padding-bottom: 10px; }
        .header h1 { font-size: 15px; color: #6366f1; margin-bottom: 2px; }
        .header h2 { font-size: 12px; color: #374151; font-weight: normal; }
        .header p { font-size: 9px; color: #6b7280; margin-top: 3px; }
        .info-box { background-color: #eef2ff; border: 1px solid #c7d2fe; border-radius: 6px; padding: 8px 12px; margin-bottom: 15px; font-size: 9px; }
        .info-label { font-weight: bold; color: #374151; }
        table { width: 100%; border-collapse: collapse; }
        th { background-color: #6366f1; color: white; padding: 7px 4px; text-align: center; font-size: 8px; text-transform: uppercase; letter-spacing: 0.3px; }
        th:first-child, th:nth-child(2) { text-align: left; }
        td { padding: 6px 4px; text-align: center; border-bottom: 1px solid #e5e7eb; font-size: 9px; }
        td:first-child { text-align: center; width: 25px; }
        td:nth-child(2) { text-align: left; }
        tr:nth-child(even) { background-color: #f9fafb; }
        .nota-alta { color: #059669; font-weight: bold; }
        .nota-media { color: #2563eb; }
        .nota-baja { color: #d97706; }
        .nota-reprobado { color: #dc2626; font-weight: bold; }
        .promedio-col { background-color: #eef2ff; font-weight: bold; }
        .footer { text-align: center; margin-top: 15px; padding-top: 8px; border-top: 1px solid #d1d5db; font-size: 8px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="header">
        <h1>I.E.P. Milagroso San Judas Tadeo</h1>
        <h2>CONSOLIDADO DE NOTAS</h2>
        <p>Año Escolar {{ $anioEscolar }}</p>
    </div>

    <div class="info-box">
        <span class="info-label">Sección:</span> {{ $seccion->grado->nombre ?? '' }} — {{ $seccion->nombre }}
        @if($bimestre)
        &nbsp;&nbsp;|&nbsp;&nbsp;
        <span class="info-label">Bimestre:</span> {{ $bimestre }}
        @endif
        &nbsp;&nbsp;|&nbsp;&nbsp;
        <span class="info-label">Total alumnos:</span> {{ count($alumnosData) }}
    </div>

    <table>
        <thead>
            <tr>
                <th>N°</th>
                <th>Alumno</th>
                @foreach($cursos as $curso)
                <th>{{ \Illuminate\Support\Str::limit($curso, 12) }}</th>
                @endforeach
                <th style="background-color: #4338ca;">Prom.</th>
            </tr>
        </thead>
        <tbody>
            @foreach($alumnosData as $i => $al)
            <tr>
                <td>{{ $i + 1 }}</td>
                <td>{{ $al['apellidos'] }}, {{ $al['nombres'] }}</td>
                @foreach($cursos as $curso)
                @php $nota = $al['notas_por_curso'][$curso] ?? null; @endphp
                <td class="{{ $nota !== null ? ($nota >= 18 ? 'nota-alta' : ($nota >= 14 ? 'nota-media' : ($nota >= 11 ? 'nota-baja' : 'nota-reprobado'))) : '' }}">
                    {{ $nota !== null ? number_format($nota, 1) : '—' }}
                </td>
                @endforeach
                <td class="promedio-col {{ $al['promedio_general'] !== null ? ($al['promedio_general'] >= 18 ? 'nota-alta' : ($al['promedio_general'] >= 14 ? 'nota-media' : ($al['promedio_general'] >= 11 ? 'nota-baja' : 'nota-reprobado'))) : '' }}">
                    {{ $al['promedio_general'] !== null ? number_format($al['promedio_general'], 1) : '—' }}
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Documento generado el {{ $fechaGeneracion }} — Sistema de Gestión Escolar
    </div>
</body>
</html>
