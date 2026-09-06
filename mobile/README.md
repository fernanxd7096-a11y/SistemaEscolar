# Sistema Escolar SJT — App móvil (Expo)

App para el docente del colegio Milagroso San Judas Tadeo: asistencia, notas y
comunicados desde el celular, con soporte offline para el aula.

## Requisitos

- Node.js 20+
- El backend Laravel corriendo (`cd ../backend && php artisan serve`)
- Expo Go (para probar rápido) o un emulador Android/iOS

## Arranque

```bash
cp .env.example .env   # ajusta EXPO_PUBLIC_API_URL si no usas localhost
npm install
npx expo start
```

`EXPO_PUBLIC_API_URL` depende de dónde corre el backend respecto al dispositivo que
prueba la app — ver los comentarios en `.env.example` (localhost, `10.0.2.2` para el
emulador Android, o la IP de tu red para un dispositivo físico).

## Estructura

- `app/` — rutas de Expo Router. `(auth)` es la pantalla de login; `(app)` son las
  tabs del usuario autenticado (inicio, asistencia, notas, comunicados, perfil).
  Dentro de `(app)`:
  - `gestion/` — sección de administración (alumnos, docentes y horario). Es un
    `Stack` cuya pestaña se oculta con `href: null` para quien no sea administrador
    o director, y que además redirige en su `_layout.tsx` por si alguien llega por
    deep link.
  - `horario/` — "Mi horario" del docente. No ocupa pestaña (ya son cinco): se abre
    desde el Inicio, también con `href: null`.
- `src/api/` — clientes axios por recurso, migrados desde `frontend/src/api/`. Solo
  `cliente.ts` y `auth.ts` (indirectamente, vía el store) tuvieron que adaptarse para
  React Native; el resto de módulos (`asistencias.ts`, `notas.ts`, etc.) se copiaron
  tal cual porque no dependían de nada específico del navegador.
- `src/tipos/` — copia literal de `frontend/src/tipos/index.ts` (tipos puros de TS,
  sin dependencias del DOM).
- `src/tienda/auth.ts` — reemplaza a `frontend/src/contexto/AuthContexto.tsx` (React
  Context) por un store Zustand, porque el interceptor 401 de axios necesita poder
  cerrar sesión fuera del árbol de React. El token vive solo en `expo-secure-store`;
  el perfil del usuario se cachea en AsyncStorage para poder abrir la app sin red.
- `src/offline/` — configuración de TanStack Query con persistencia en AsyncStorage
  y cola de mutaciones offline (asistencia y notas). Ver comentarios en
  `queryClient.ts` y `QueryProvider.tsx` para el mecanismo exacto.
- `src/componentes/formulario.tsx` — piezas de formulario compartidas por las
  pantallas de gestión (campos, selector en Modal, chips de días, fecha y hora).
- `src/componentes/graficos/` — gráficos de barras y de dona hechos con
  `react-native-svg` para el Inicio.
- `src/componentes/AgendaSemana.tsx` — pintado de la agenda ya resuelta que
  devuelve el backend, con los bloques cancelados marcados y su motivo.

## Decisiones y supuestos importantes

1. **"Mis secciones" del docente**: el backend no expone un endpoint tipo
   `GET /docentes/mi-perfil` que devuelva las secciones del usuario autenticado.
   `src/hooks/useSecciones.ts` lo resuelve leyendo `GET /horarios` (permitido para el
   rol docente) y cruzando el `email` del `Docente` de cada horario con el `email`
   del `Usuario` logueado. Si no hay coincidencia (p. ej. el registro de Docente no
   tiene email cargado), la app simplemente muestra todas las secciones para que el
   docente elija manualmente. Si se prefiere una solución más robusta, se necesitaría
   un endpoint nuevo en el backend que vincule `Usuario` -> `Docente` -> secciones.
2. **Cola de sincronización offline**: se apoya en el mecanismo nativo de TanStack
   Query v5 (`networkMode: 'online'` + `resumePausedMutations`), no en una cola
   hecha a mano. Las mutaciones offline sobreviven un reinicio de la app porque se
   registran *mutation defaults* (`queryClient.setMutationDefaults`) para las claves
   `asistencia-masivo` y `notas-masivo` — sin esto, una mutación pausada y persistida
   pierde su función de red al reiniciar la app y nunca se reenviaría.
3. **Notificaciones push**: `src/hooks/useRegistrarPush.ts` registra el Expo Push
   Token del dispositivo en `POST /push-tokens` en cuanto el docente inicia sesión.
   Para que esto funcione en un build real (fuera de Expo Go) hace falta un proyecto
   EAS asociado (`eas init`), que no se configuró aquí porque requiere una cuenta de
   Expo. Backend: tabla `push_tokens` (migración
   `2026_08_18_000001_crear_tabla_push_tokens.php`), modelo `PushToken`,
   `PushTokenControlador` y `ExpoPushService` (envía vía la API HTTP de Expo). Ya
   migrado en la base de datos local. **Falta la fase 2**: disparar el envío
   automáticamente al publicar un `Comunicado` — por ahora solo existe el botón
   "Enviar notificación de prueba" en Perfil, tal como pedía el alcance inicial.
4. **Cambios en backend**: además de lo anterior (justificado explícitamente en el
   alcance de notificaciones push), no se modificó nada más de `backend/` ni
   `frontend/`.
5. **Horario avanzado**: la tabla `horarios` (plantilla semanal fija) no podía
   expresar "todos los lunes hasta fin de año", ni feriados, viajes o
   recuperaciones. El backend suma `horario_reglas` (regla recurrente: días de la
   semana + rango de vigencia) y `horario_excepciones` (hecho puntual sobre una
   fecha o rango, que cancela bloques o agrega uno nuevo). Las ocurrencias **no se
   materializan**: `GET /horarios/agenda` y `GET /horarios/mi-agenda` las resuelven
   por consulta. `horarios` sigue existiendo para la app web y cada fila se espeja
   automáticamente en `horario_reglas`, de modo que la agenda tenga una sola fuente
   de verdad.
6. **Boleta en PDF**: se genera en el backend con `barryvdh/laravel-dompdf`
   (`GET /reportes/boleta/{alumno}/pdf`). En la app no hay visor PDF embebido
   porque Expo Go no incluye módulos nativos como `react-native-pdf`: el archivo se
   descarga con `File.downloadFileAsync` (que sí acepta el header `Authorization`
   de Sanctum) y se entrega al sistema con `expo-sharing`.
7. **Gráficos sin librería de charts**: se usa `react-native-svg` (incluido en Expo
   Go y versionado por el propio SDK) con dos componentes propios, en vez de
   `react-native-gifted-charts` (necesita `react-native-linear-gradient`, que Expo
   Go no trae) o `react-native-chart-kit` (sin versiones probadas contra React 19 y
   RN 0.86).
