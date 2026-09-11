<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <style>
        @page { margin: 15px; }
        body {
            font-family: Helvetica, Arial, sans-serif;
            font-size: 9px;
            color: #000;
            padding: 8px;
            border: 4px double #D4A017;
        }

        .header-table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
        .header-table td { border: none; vertical-align: middle; padding: 0; }
        .header-table img { width: 55px; height: 55px; }
        .inst-label { font-size: 8px; color: #8B1A2B; text-align: center; }
        .inst-name { font-size: 14px; font-weight: bold; color: #8B1A2B; text-align: center; letter-spacing: 2px; }
        .inst-sub { font-size: 7px; color: #555; text-align: center; }

        .titulo-box { text-align: center; margin: 8px 80px; padding: 4px; border: 2px solid #8B1A2B; }
        .titulo-box span { font-size: 13px; font-weight: bold; color: #8B1A2B; letter-spacing: 2px; }

        .datos { margin: 6px 0; font-size: 9px; }
        .datos-bold { font-weight: bold; }
        .datos-underline { border-bottom: 1px solid #000; }

        .notas-table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
        .notas-table th {
            background-color: #8B1A2B; color: #FFF; font-size: 8px; font-weight: bold;
            padding: 4px 2px; text-align: center; border: 1px solid #6D1422;
        }
        .notas-table td {
            padding: 3px 2px; text-align: center; border: 1px solid #CCC; font-size: 9px;
        }
        .notas-table td.area-col {
            text-align: left; font-weight: bold; font-size: 8px; padding-left: 5px;
        }
        .notas-table td.prom-col { font-weight: bold; }
        .notas-table tr.even-row { background-color: #FDF8F8; }

        .comport-table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
        .comport-table td {
            padding: 3px 2px; text-align: center; border: 1px solid #CCC; font-size: 9px;
        }
        .comport-table td.area-col { text-align: left; font-weight: bold; font-size: 8px; padding-left: 5px; }
        .comport-table td.prom-col { font-weight: bold; }

        .recom-box { border: 2px solid #8B1A2B; margin: 6px 15px; }
        .recom-header {
            background-color: #8B1A2B; color: #FFF; text-align: center;
            font-size: 9px; font-weight: bold; padding: 3px; letter-spacing: 1px;
        }
        .recom-body { padding: 6px 10px; font-size: 8px; text-align: center; min-height: 25px; color: #333; }

        .firmas-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .firmas-table td { border: none; width: 50%; text-align: center; }
        .firma-btn {
            background-color: #8B1A2B; color: #FFF; font-size: 9px;
            font-weight: bold; padding: 3px 20px; letter-spacing: 1px;
        }
    </style>
</head>
<body>

    <!-- HEADER -->
    <table class="header-table">
        <tr>
            <td style="width: 65px; text-align: center;">
                @if($logoBase64)
                <img src="{{ $logoBase64 }}">
                @endif
            </td>
            <td>
                <div class="inst-label">INSTITUCION EDUCATIVA PRIVADA</div>
                <div class="inst-name">MILAGROSO SAN JUDAS TADEO</div>
                <div class="inst-sub">UGEL 05 S.J.L. - R.D. 05069 - R.D. 003839</div>
                <div class="inst-sub">Coop. Sagrada Familia Mz. K lote 11 - S.J.L. - Telf.: 962359860</div>
            </td>
            <td style="width: 65px;"></td>
        </tr>
    </table>

    <!-- TITULO -->
    <div class="titulo-box">
        <span>INFORME ACADEMICO {{ $anioEscolar }}</span>
    </div>

    <!-- DATOS ALUMNO -->
    <div class="datos">
        <span class="datos-bold">APELLIDOS Y NOMBRES: </span>
        <span class="datos-bold" style="font-size: 10px;">{{ mb_strtoupper($alumno->apellidos) }} {{ mb_strtoupper($alumno->nombres) }}</span>
        <br>
        <span class="datos-bold">TUTOR: </span>
        <span class="datos-underline">{{ $tutor }}</span>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        <span class="datos-bold">GRADO: </span>
        <span class="datos-underline">{{ $seccion ? mb_strtoupper($seccion->grado->nombre ?? '') : '' }}</span>
        &nbsp;&nbsp;&nbsp;
        <span class="datos-bold">SECCION: </span>
        <span class="datos-underline">{{ $seccion ? $seccion->nombre : '' }}</span>
    </div>

    <!-- TABLA CONSOLIDADA: TODOS LOS BIMESTRES EN UNA SOLA TABLA -->
    <table class="notas-table">
        <thead>
            <tr>
                <th style="width: 28%;">AREA</th>
                <th style="width: 12%;">I BIM</th>
                <th style="width: 12%;">II BIM</th>
                <th style="width: 12%;">III BIM</th>
                <th style="width: 12%;">IV BIM</th>
                <th style="width: 12%;">PROM ANUAL</th>
            </tr>
        </thead>
        <tbody>
            @php $totalProm = 0; $countCursos = 0; @endphp
            @foreach($cursosConsolidados as $idx => $curso)
            <tr class="{{ $idx % 2 == 1 ? 'even-row' : '' }}">
                <td class="area-col">{{ mb_strtoupper($curso['nombre']) }}</td>
                <td>{!! $curso['bim1'] !== null ? $curso['bim1'] : '&mdash;' !!}</td>
                <td>{!! $curso['bim2'] !== null ? $curso['bim2'] : '&mdash;' !!}</td>
                <td>{!! $curso['bim3'] !== null ? $curso['bim3'] : '&mdash;' !!}</td>
                <td>{!! $curso['bim4'] !== null ? $curso['bim4'] : '&mdash;' !!}</td>
                <td class="prom-col">{!! $curso['promedio_anual'] !== null ? $curso['promedio_anual'] : '&mdash;' !!}</td>
            </tr>
            @php if($curso['promedio_anual'] !== null) { $totalProm += $curso['promedio_anual']; $countCursos++; } @endphp
            @endforeach
            @if($countCursos > 0)
            <tr style="background-color: #FCE4EC;">
                <td class="area-col" style="border-top: 2px solid #8B1A2B;">PROMEDIO GENERAL</td>
                <td style="border-top: 2px solid #8B1A2B;"></td>
                <td style="border-top: 2px solid #8B1A2B;"></td>
                <td style="border-top: 2px solid #8B1A2B;"></td>
                <td style="border-top: 2px solid #8B1A2B;"></td>
                <td class="prom-col" style="border-top: 2px solid #8B1A2B;">{{ round($totalProm / $countCursos) }}</td>
            </tr>
            @endif
        </tbody>
    </table>

    <!-- COMPORTAMIENTO -->
    <table class="comport-table">
        <tr>
            <td class="area-col" style="width: 28%;"><b>COMPORTAMIENTO</b></td>
            <td style="width: 12%;">{!! isset($comportamiento['bim1']) ? $comportamiento['bim1'] : '&mdash;' !!}</td>
            <td style="width: 12%;">{!! isset($comportamiento['bim2']) ? $comportamiento['bim2'] : '&mdash;' !!}</td>
            <td style="width: 12%;">{!! isset($comportamiento['bim3']) ? $comportamiento['bim3'] : '&mdash;' !!}</td>
            <td style="width: 12%;">{!! isset($comportamiento['bim4']) ? $comportamiento['bim4'] : '&mdash;' !!}</td>
            <td class="prom-col" style="width: 12%;">{!! isset($comportamiento['promedio']) ? $comportamiento['promedio'] : '&mdash;' !!}</td>
        </tr>
    </table>

    <!-- RECOMENDACIONES -->
    <div class="recom-box">
        <div class="recom-header">RECOMENDACIONES</div>
        <div class="recom-body">{{ $recomendaciones ?: '' }}</div>
    </div>

    <!-- FIRMAS -->
    <table class="firmas-table">
        <tr>
            <td><span class="firma-btn">TUTOR</span></td>
            <td><span class="firma-btn">DIRECCION</span></td>
        </tr>
    </table>

</body>
</html>
