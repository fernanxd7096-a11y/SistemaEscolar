<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Informe Académico - {{ $alumno->apellidos }}, {{ $alumno->nombres }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 10px; color: #1f2937; padding: 20px 25px; }

        /* Header institucional */
        .header { text-align: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 3px double #8B1A2B; }
        .header-inner { display: table; width: 100%; }
        .header-logo { display: table-cell; width: 80px; vertical-align: middle; text-align: left; }
        .header-logo img { width: 65px; height: 65px; }
        .header-text { display: table-cell; vertical-align: middle; text-align: center; }
        .header-right { display: table-cell; width: 80px; vertical-align: middle; }

        .header h1 { font-size: 13px; color: #8B1A2B; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 1px; }
        .header h2 { font-size: 15px; color: #8B1A2B; font-weight: bold; margin-bottom: 2px; }
        .header .subtitulo { font-size: 9px; color: #6b7280; }
        .header .ugel { font-size: 8px; color: #9ca3af; margin-top: 2px; }

        /* Info alumno */
        .info-box { border: 1px solid #d1d5db; border-radius: 4px; padding: 8px 12px; margin-bottom: 12px; background: #fdf2f4; }
        .info-table { width: 100%; }
        .info-table td { padding: 2px 5px; vertical-align: top; }
        .info-label { font-weight: bold; color: #8B1A2B; font-size: 9px; white-space: nowrap; width: 100px; }
        .info-value { color: #1f2937; font-size: 10px; }

        /* Tabla de notas */
        table.notas { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        table.notas th {
            background-color: #8B1A2B; color: white; padding: 7px 5px;
            text-align: center; font-size: 8px; text-transform: uppercase; letter-spacing: 0.3px;
        }
        table.notas th:first-child { text-align: left; padding-left: 8px; }
        table.notas td {
            padding: 6px 5px; text-align: center; border-bottom: 1px solid #e5e7eb; font-size: 10px;
        }
        table.notas td:first-child { text-align: left; padding-left: 8px; font-weight: 500; }
        table.notas tr:nth-child(even) { background-color: #fef7f8; }

        /* Colores de notas */
        .n-ad { color: #059669; font-weight: bold; } /* 18-20 AD */
        .n-a { color: #2563eb; }                      /* 14-17 A */
        .n-b { color: #d97706; }                       /* 11-13 B */
        .n-c { color: #dc2626; font-weight: bold; }    /* 0-10 C */

        /* Fila promedio */
        .promedio-row { background-color: #fce4ec !important; }
        .promedio-row td { border-top: 2px solid #8B1A2B; font-weight: bold; font-size: 10px; }

        /* Escala */
        .escala { margin-bottom: 15px; font-size: 8px; }
        .escala table { width: auto; border-collapse: collapse; }
        .escala td { padding: 2px 8px; border: 1px solid #d1d5db; }
        .escala .label { font-weight: bold; }

        /* Firmas */
        .firmas { margin-top: 45px; }
        .firmas table { width: 100%; }
        .firmas td { text-align: center; border: none; padding-top: 40px; width: 33%; }
        .firma-linea { border-top: 1px solid #374151; width: 150px; margin: 0 auto; }
        .firma-cargo { margin-top: 3px; font-size: 9px; color: #6b7280; }

        /* Footer */
        .footer { text-align: center; margin-top: 15px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 8px; color: #9ca3af; }
    </style>
</head>
<body>
    {{-- HEADER INSTITUCIONAL --}}
    <div class="header">
        <div class="header-inner">
            <div class="header-logo">
                @if($logoBase64)
                <img src="{{ $logoBase64 }}" alt="Logo">
                @endif
            </div>
            <div class="header-text">
                <h1>I.E.P. Milagroso San Judas Tadeo</h1>
                <h2>INFORME ACADÉMICO {{ $anioEscolar }}</h2>
                <div class="subtitulo">BOLETA DE NOTAS</div>
                <div class="ugel">UGEL 05 — San Juan de Lurigancho</div>
            </div>
            <div class="header-right"></div>
        </div>
    </div>

    {{-- DATOS DEL ALUMNO --}}
    <div class="info-box">
        <table class="info-table">
            <tr>
                <td class="info-label">Alumno(a):</td>
                <td class="info-value">{{ $alumno->apellidos }}, {{ $alumno->nombres }}</td>
                <td class="info-label">DNI:</td>
                <td class="info-value">{{ $alumno->dni }}</td>
            </tr>
            <tr>
                @if($seccion)
                <td class="info-label">Grado:</td>
                <td class="info-value">{{ $seccion->grado->nombre ?? '' }}</td>
                <td class="info-label">Sección:</td>
                <td class="info-value">{{ $seccion->nombre }}</td>
                @endif
            </tr>
            @if($seccion && ($seccion->grado->nivel ?? ''))
            <tr>
                <td class="info-label">Nivel:</td>
                <td class="info-value" style="text-transform: capitalize">{{ $seccion->grado->nivel }}</td>
                <td class="info-label">Año Escolar:</td>
                <td class="info-value">{{ $anioEscolar }}</td>
            </tr>
            @endif
        </table>
    </div>

    {{-- TABLA DE CALIFICACIONES --}}
    <table class="notas">
        <thead>
            <tr>
                <th style="width: 32%">Área / Curso</th>
                <th style="width: 12%">I Bim.</th>
                <th style="width: 12%">II Bim.</th>
                <th style="width: 12%">III Bim.</th>
                <th style="width: 12%">IV Bim.</th>
                <th style="width: 12%">Prom. Anual</th>
            </tr>
        </thead>
        <tbody>
            @php $totalPromedio = 0; $countCursos = 0; @endphp
            @foreach($cursos as $curso)
            <tr>
                <td>{{ $curso['curso'] }}</td>
                @foreach([1,2,3,4] as $b)
                @php $nota = $curso['bimestre_'.$b]; @endphp
                <td class="{{ $nota !== null ? ($nota >= 18 ? 'n-ad' : ($nota >= 14 ? 'n-a' : ($nota >= 11 ? 'n-b' : 'n-c'))) : '' }}">
                    {{ $nota !== null ? number_format($nota, 0) : '—' }}
                </td>
                @endforeach
                @php $pf = $curso['promedio_final']; @endphp
                <td class="{{ $pf >= 18 ? 'n-ad' : ($pf >= 14 ? 'n-a' : ($pf >= 11 ? 'n-b' : 'n-c')) }}" style="font-weight:bold">
                    {{ number_format($pf, 0) }}
                </td>
            </tr>
            @php $totalPromedio += $curso['promedio_final']; $countCursos++; @endphp
            @endforeach

            @if($countCursos > 0)
            <tr class="promedio-row">
                <td>PROMEDIO GENERAL</td>
                <td colspan="4"></td>
                <td>{{ number_format($totalPromedio / $countCursos, 0) }}</td>
            </tr>
            @endif
        </tbody>
    </table>

    {{-- ESCALA DE CALIFICACIÓN --}}
    <div class="escala">
        <strong style="color: #8B1A2B;">Escala de Calificación:</strong>
        <table style="margin-top: 3px;">
            <tr>
                <td class="label n-ad">AD (18-20)</td><td>Logro Destacado</td>
                <td class="label n-a">A (14-17)</td><td>Logro Esperado</td>
                <td class="label n-b">B (11-13)</td><td>En Proceso</td>
                <td class="label n-c">C (0-10)</td><td>En Inicio</td>
            </tr>
        </table>
    </div>

    {{-- OBSERVACIONES --}}
    @if(!empty($observaciones))
    <div style="margin-bottom: 15px;">
        <strong style="color: #8B1A2B; font-size: 9px;">Observaciones:</strong>
        <div style="border: 1px solid #e5e7eb; padding: 6px 10px; min-height: 30px; font-size: 9px; color: #6b7280; margin-top: 3px;">
            {{ $observaciones }}
        </div>
    </div>
    @else
    <div style="margin-bottom: 15px;">
        <strong style="color: #8B1A2B; font-size: 9px;">Observaciones:</strong>
        <div style="border: 1px solid #e5e7eb; padding: 6px 10px; min-height: 30px; font-size: 9px; color: #6b7280; margin-top: 3px;">
            &nbsp;
        </div>
    </div>
    @endif

    {{-- FIRMAS --}}
    <div class="firmas">
        <table>
            <tr>
                <td>
                    <div class="firma-linea"></div>
                    <div class="firma-cargo">Director(a)</div>
                </td>
                <td>
                    <div class="firma-linea"></div>
                    <div class="firma-cargo">Tutor(a)</div>
                </td>
                <td>
                    <div class="firma-linea"></div>
                    <div class="firma-cargo">Padre/Madre/Apoderado</div>
                </td>
            </tr>
        </table>
    </div>

    {{-- FOOTER --}}
    <div class="footer">
        Documento generado el {{ $fechaGeneracion }} — I.E.P. Milagroso San Judas Tadeo — Sistema de Gestión Escolar
    </div>
</body>
</html>
