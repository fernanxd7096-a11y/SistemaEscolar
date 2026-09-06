<?php

namespace App\Mail;

use App\Models\Alumno;
use App\Models\Asistencia;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AvisoInasistencia extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public Alumno $alumno,
        public Asistencia $asistencia,
        public string $nombrePadre,
    ) {
    }

    public function build()
    {
        $estadoTexto = $this->asistencia->estado === 'tardanza' ? 'una tardanza' : 'una falta';

        return $this->subject("Aviso de asistencia — {$this->alumno->nombres} {$this->alumno->apellidos}")
            ->view('emails.aviso-inasistencia')
            ->with([
                'nombrePadre'  => $this->nombrePadre,
                'alumno'       => $this->alumno,
                'asistencia'   => $this->asistencia,
                'estadoTexto'  => $estadoTexto,
            ]);
    }
}
