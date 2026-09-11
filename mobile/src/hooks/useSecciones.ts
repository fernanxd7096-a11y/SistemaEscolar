import { useQuery } from '@tanstack/react-query';
import { listarHorarios } from '@/api/horarios';
import { useAuthStore } from '@/tienda/auth';
import type { Seccion } from '@/tipos';

export interface SeccionConCurso extends Seccion {
  cursos: { id: number; nombre: string }[];
}

// El backend no expone "mis secciones" para el usuario autenticado (Docente no tiene
// endpoint propio ligado a Usuario). Lo derivamos de GET /horarios, al que el rol
// docente sí tiene acceso (permiso ver-horarios), agrupando por sección y usando el
// email del docente de cada horario para distinguir "mis secciones" del resto. Si el
// email no coincide con ningún registro (p. ej. el Docente no tiene email cargado),
// se devuelven todas las secciones igual para que el usuario elija manualmente.
export const useSecciones = () => {
  const usuario = useAuthStore((state) => state.usuario);

  const query = useQuery({
    queryKey: ['horarios'],
    queryFn: () => listarHorarios(),
  });

  const horarios = query.data ?? [];

  const seccionesPorId = new Map<number, SeccionConCurso>();
  const seccionesPropiasIds = new Set<number>();

  for (const horario of horarios) {
    if (!horario.seccion) continue;
    const existente = seccionesPorId.get(horario.seccion.id);
    const cursoEntry = horario.curso ? [{ id: horario.curso.id, nombre: horario.curso.nombre }] : [];

    if (existente) {
      if (horario.curso && !existente.cursos.some((c) => c.id === horario.curso!.id)) {
        existente.cursos.push({ id: horario.curso.id, nombre: horario.curso.nombre });
      }
    } else {
      seccionesPorId.set(horario.seccion.id, { ...horario.seccion, cursos: cursoEntry });
    }

    const esMiHorario =
      !!usuario?.email && !!horario.docente?.email && horario.docente.email === usuario.email;
    if (esMiHorario) {
      seccionesPropiasIds.add(horario.seccion.id);
    }
  }

  const todasLasSecciones = Array.from(seccionesPorId.values()).sort((a, b) =>
    `${a.grado?.nombre ?? ''} ${a.nombre}`.localeCompare(`${b.grado?.nombre ?? ''} ${b.nombre}`)
  );

  const misSecciones = todasLasSecciones.filter((s) => seccionesPropiasIds.has(s.id));

  return {
    ...query,
    todasLasSecciones,
    misSecciones,
    tieneSeccionesPropiasDetectadas: misSecciones.length > 0,
  };
};
