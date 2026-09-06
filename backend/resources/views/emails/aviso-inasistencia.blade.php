<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Aviso de asistencia</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f7fa; font-family: Arial, Helvetica, sans-serif; color:#1a1f2b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f7fa; padding:32px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e2e6ec;">
                    <tr>
                        <td style="background-color:#1E3A5F; padding:20px 28px;">
                            <span style="color:#ffffff; font-size:16px; font-weight:bold;">Colegio Milagroso San Judas Tadeo</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:28px;">
                            <p style="margin:0 0 16px; font-size:15px;">Estimado(a) {{ $nombrePadre }},</p>

                            <p style="margin:0 0 16px; font-size:15px; line-height:1.5;">
                                Le informamos que el(la) alumno(a)
                                <strong>{{ $alumno->nombres }} {{ $alumno->apellidos }}</strong>
                                registró {{ $estadoTexto }} el día
                                <strong>{{ $asistencia->fecha->locale('es')->translatedFormat('d \d\e F \d\e Y') }}</strong>.
                            </p>

                            @if($asistencia->observacion)
                                <p style="margin:0 0 16px; font-size:14px; color:#5b6472;">
                                    <strong>Observación:</strong> {{ $asistencia->observacion }}
                                </p>
                            @endif

                            <p style="margin:0 0 16px; font-size:14px; color:#5b6472; line-height:1.5;">
                                Si considera que esta información es incorrecta, o desea justificar la
                                inasistencia, por favor comuníquese con la dirección del colegio.
                            </p>

                            <p style="margin:24px 0 0; font-size:13px; color:#5b6472;">
                                Este es un mensaje automático, por favor no responda a este correo.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color:#f5f7fa; padding:16px 28px; font-size:12px; color:#5b6472;">
                            Sistema Escolar — Milagroso San Judas Tadeo
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
