# Scripts de Desarrollo Local (Modo Offline / Servidor Local)

Esta carpeta contiene los scripts utilizados anteriormente para ejecutar el sistema en modo local con XAMPP (PHP local + MySQL local).

Se conservan como respaldo por si en el futuro se requiere trabajar de forma 100% offline sin conexion a internet ni a la nube de Render:

- SistemaEscolar.vbs: Inicia el entorno local de Electron en segundo plano sin dejar abierta la ventana negra de la consola.
- launch.bat: Mata procesos huerfanos en los puertos 8000 y 5173 e inicia Vite + Electron en modo desarrollo.
- start-api.bat: Inicia manualmente el backend Laravel local con php artisan serve en el puerto 8000.
- start-frontend.bat: Inicia manualmente el frontend Vite local en el puerto 5173.

> Nota: Para el uso diario normal conectado a la nube (PostgreSQL en Render), utilice el acceso directo principal Iniciar_Sistema_Escolar.bat ubicado en la raiz del proyecto.
