<!DOCTYPE html>
{{--
    Boleta de notas — plantilla para barryvdh/laravel-dompdf.

    Dompdf no soporta flexbox ni grid: la maquetación va con tablas y `width` en
    porcentaje, que es lo que su motor renderiza de forma predecible en A4.
--}}
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Boleta de notas — {{ $alumno['apellidos'] }}, {{ $alumno['nombres'] }}</title>
    <style>
        @page { margin: 28px 34px 60px 34px; }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 10px;
            color: #1a1f2b;
            margin: 0;
        }

        .encabezado { border-bottom: 2px solid #0f6cbd; padding-bottom: 10px; }
        .encabezado td { vertical-align: middle; }
        .colegio { font-size: 15px; font-weight: bold; color: #0a4d8c; }
        .lema { font-size: 9px; color: #5b6472; font-style: italic; }
        .contacto { font-size: 8px; color: #5b6472; line-height: 1.5; }
        .documento {
            font-size: 12px;
            font-weight: bold;
            color: #0f6cbd;
            text-align: right;
            text-transform: uppercase;
        }
        .periodo { font-size: 9px; color: #5b6472; text-align: right; }

        .sello {
            width: 62px; height: 62px;
            border: 2px solid #0f6cbd;
            border-radius: 31px;
            color: #0f6cbd;
            font-size: 17px;
            font-weight: bold;
            text-align: center;
            line-height: 62px;
        }

        .titulo-seccion {
            margin: 16px 0 6px;
            font-size: 10px;
            font-weight: bold;
            color: #0a4d8c;
            text-transform: uppercase;
            letter-spacing: .4px;
        }

        table.datos { width: 100%; border-collapse: collapse; }
        table.datos td {
            border: 1px solid #e2e6ec;
            padding: 5px 7px;
        }
        table.datos .etiqueta {
            width: 15%;
            background: #f5f7fa;
            font-size: 8px;
            color: #5b6472;
            text-transform: uppercase;
        }
        table.datos .valor { width: 35%; font-weight: bold; }

        table.notas { width: 100%; border-collapse: collapse; }
        table.notas th {
            background: #0f6cbd;
            color: #fff;
            font-size: 9px;
            padding: 6px 5px;
            border: 1px solid #0f6cbd;
            text-transform: uppercase;
        }
        table.notas td {
            border: 1px solid #e2e6ec;
            padding: 5px;
            text-align: center;
        }
        table.notas td.curso { text-align: left; font-weight: bold; }
        table.notas tr:nth-child(even) td { background: #fafbfd; }
        .desaprobado { color: #d64545; font-weight: bold; }
        .aprobado { font-weight: bold; }
        .sin-nota { color: #9aa3b0; }

        .resumen {
            margin-top: 12px;
            width: 100%;
            border-collapse: collapse;
        }
        .resumen td {
            border: 1px solid #e2e6ec;
            padding: 7px 9px;
            font-size: 10px;
        }
        .resumen .destacado {
            background: #f5f7fa;
            font-weight: bold;
            color: #0a4d8c;
        }

        .escala { margin-top: 10px; font-size: 8px; color: #5b6472; }

        .firmas { margin-top: 46px; width: 100%; }
        .firmas td { text-align: center; font-size: 9px; color: #5b6472; padding: 0 18px; }
        .linea-firma { border-top: 1px solid #1a1f2b; padding-top: 4px; }

        .pie {
            position: fixed;
            bottom: -34px; left: 0; right: 0;
            font-size: 7.5px;
            color: #9aa3b0;
            border-top: 1px solid #e2e6ec;
            padding-top: 5px;
        }
        .pie .derecha { text-align: right; }

        .vacio {
            padding: 22px;
            text-align: center;
            color: #5b6472;
            border: 1px dashed #e2e6ec;
        }
    </style>
</head>
<body>

<table class="encabezado" width="100%">
    <tr>
        <td width="12%"><div class="sello">SJT</div></td>
        <td width="53%">
            <div class="colegio">{{ $colegio['nombre'] }}</div>
            @if ($colegio['lema'])
                <div class="lema">{{ $colegio['lema'] }}</div>
            @endif
            <div class="contacto">
                @if ($colegio['direccion']) {{ $colegio['direccion'] }}<br> @endif
                @if ($colegio['telefono']) Tel. {{ $colegio['telefono'] }} @endif
                @if ($colegio['email']) · {{ $colegio['email'] }} @endif
                @if ($colegio['ugel']) <br>UGEL: {{ $colegio['ugel'] }} @endif
            </div>
        </td>
        <td width="35%">
            <div class="documento">Boleta de notas</div>
            <div class="periodo">
                Año escolar {{ $año_escolar }}<br>
                {{ $bimestre ? 'Bimestre ' . $bimestre : 'Consolidado anual' }}
            </div>
        </td>
    </tr>
</table>

<div class="titulo-seccion">Datos del estudiante</div>
<table class="datos">
    <tr>
        <td class="etiqueta">Apellidos</td>
        <td class="valor">{{ $alumno['apellidos'] }}</td>
        <td class="etiqueta">Nombres</td>
        <td class="valor">{{ $alumno['nombres'] }}</td>
    </tr>
    <tr>
        <td class="etiqueta">DNI</td>
        <td class="valor">{{ $alumno['dni'] ?: '—' }}</td>
        <td class="etiqueta">Nivel</td>
        <td class="valor">{{ $seccion['nivel'] ?? '—' }}</td>
    </tr>
    <tr>
        <td class="etiqueta">Grado</td>
        <td class="valor">{{ $seccion['grado'] ?? '—' }}</td>
        <td class="etiqueta">Sección</td>
        <td class="valor">{{ $seccion['nombre'] ?? '—' }}</td>
    </tr>
</table>

<div class="titulo-seccion">Rendimiento académico</div>

@if (count($cursos) === 0)
    <div class="vacio">
        El estudiante todavía no tiene calificaciones registradas para este periodo.
    </div>
@else
    <table class="notas">
        <thead>
        <tr>
            <th width="34%">Área / Curso</th>
            <th width="11%">I Bim.</th>
            <th width="11%">II Bim.</th>
            <th width="11%">III Bim.</th>
            <th width="11%">IV Bim.</th>
            <th width="11%">Promedio</th>
            <th width="11%">Condición</th>
        </tr>
        </thead>
        <tbody>
        @foreach ($cursos as $curso)
            <tr>
                <td class="curso">{{ $curso['curso'] }}</td>
                @foreach ([1, 2, 3, 4] as $b)
                    @php $nota = $curso['bimestre_' . $b]; @endphp
                    <td class="{{ $nota === null ? 'sin-nota' : ($nota < $aprobado_desde ? 'desaprobado' : '') }}">
                        {{ $nota === null ? '—' : number_format($nota, 1) }}
                    </td>
                @endforeach
                <td class="{{ $curso['promedio_final'] < $aprobado_desde ? 'desaprobado' : 'aprobado' }}">
                    {{ number_format($curso['promedio_final'], 1) }}
                </td>
                <td class="{{ $curso['promedio_final'] < $aprobado_desde ? 'desaprobado' : 'aprobado' }}">
                    {{ $curso['promedio_final'] < $aprobado_desde ? 'Desaprobado' : 'Aprobado' }}
                </td>
            </tr>
        @endforeach
        </tbody>
    </table>

    <table class="resumen">
        <tr>
            <td class="destacado" width="26%">Promedio general</td>
            <td width="14%">{{ $promedio_general === null ? '—' : number_format($promedio_general, 1) }}</td>
            <td class="destacado" width="20%">Cursos aprobados</td>
            <td width="10%">{{ $cursos_aprobados }} / {{ count($cursos) }}</td>
            <td class="destacado" width="18%">Condición final</td>
            <td width="12%">{{ $condicion_final }}</td>
        </tr>
    </table>
@endif

<div class="escala">
    Escala vigesimal de 0 a {{ (int) $nota_maxima }} puntos. Se considera aprobado a partir de
    {{ number_format($aprobado_desde, 0) }}. Las notas por bimestre son el promedio de las
    evaluaciones registradas (examen, práctica, tarea y participación).
</div>

<table class="firmas">
    <tr>
        <td width="33%"><div class="linea-firma">Docente tutor(a)</div></td>
        <td width="34%"><div class="linea-firma">Dirección</div></td>
        <td width="33%"><div class="linea-firma">Padre / Madre / Apoderado</div></td>
    </tr>
</table>

<table class="pie" width="100%">
    <tr>
        <td width="60%">{{ $colegio['nombre'] }} — Documento generado por el Sistema Escolar</td>
        <td width="40%" class="derecha">Emitido el {{ $emitido_en }}</td>
    </tr>
</table>

</body>
</html>
