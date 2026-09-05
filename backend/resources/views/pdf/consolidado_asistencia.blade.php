<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Consolidado de Asistencia</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 10px; color: #1f2937; padding: 25px; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #059669; padding-bottom: 12px; }
        .header h1 { font-size: 16px; color: #059669; margin-bottom: 3px; }
        .header h2 { font-size: 13px; color: #374151; font-weight: normal; }
        .header p { font-size: 9px; color: #6b7280; margin-top: 4px; }
        .info-box { background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 10px 14px; margin-bottom: 18px; font-size: 10px; }
        .info-label { font-weight: bold; color: #374151; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th { background-color: #059669; color: white; padding: 8px 6px; text-align: center; font-size: 9px; text-transform: uppercase; letter-spacing: 0.3px; }
        th:first-child, th:nth-child(2) { text-align: left; }
        td { padding: 7px 6px; text-align: center; border-bottom: 1px solid #e5e7eb; font-size: 10px; }
        td:first-child { text-align: center; width: 30px; }
        td:nth-child(2) { text-align: left; }
        tr:nth-child(even) { background-color: #f9fafb; }
        .pct-alto { color: #059669; font-weight: bold; }
        .pct-medio { color: #d97706; }
        .pct-bajo { color: #dc2626; font-weight: bold; }
        .footer { text-align: center; margin-top: 20px; padding-top: 10px; border-top: 1px solid #d1d5db; font-size: 8px; color: #9ca3af; }
        .resumen-box { margin-top: 15px; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; }
        .resumen-box h4 { font-size: 11px; margin-bottom: 6px; color: #374151; }
    </style>
</head>
<body>
    <div class="header">
        <h1>I.E.P. Milagroso San Judas Tadeo</h1>
        <h2>CONSOLIDADO DE ASISTENCIA</h2>
        <p>Año Escolar {{ $anioEscolar }}</p>
    </div>

    <div class="info-box">
        <span class="info-label">Sección:</span> {{ $seccion->grado->nombre ?? '' }} — {{ $seccion->nombre }}
        &nbsp;&nbsp;|&nbsp;&nbsp;
        <span class="info-label">Período:</span> {{ $fechaDesde }} al {{ $fechaHasta }}
        &nbsp;&nbsp;|&nbsp;&nbsp;
        <span class="info-label">Total alumnos:</span> {{ count($alumnos) }}
    </div>

    <table>
        <thead>
            <tr>
                <th>N°</th>
                <th>Alumno</th>
                <th>Presente</th>
                <th>Tardanza</th>
                <th>Falta</th>
                <th>Justif.</th>
                <th>Total</th>
                <th>% Asist.</th>
            </tr>
        </thead>
        <tbody>
            @foreach($alumnos as $i => $al)
            <tr>
                <td>{{ $i + 1 }}</td>
                <td>{{ $al['apellidos'] }}, {{ $al['nombres'] }}</td>
                <td>{{ $al['presente'] }}</td>
                <td>{{ $al['tardanza'] }}</td>
                <td style="{{ $al['falta'] > 0 ? 'color:#dc2626;font-weight:bold;' : '' }}">{{ $al['falta'] }}</td>
                <td>{{ $al['justificado'] }}</td>
                <td>{{ $al['total_dias'] }}</td>
                <td class="{{ $al['porcentaje'] >= 90 ? 'pct-alto' : ($al['porcentaje'] >= 75 ? 'pct-medio' : 'pct-bajo') }}">
                    {{ number_format($al['porcentaje'], 1) }}%
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
