const { contextBridge, ipcRenderer } = require('electron')

// Exponer funciones seguras al proceso de render (React)
contextBridge.exposeInMainWorld('electronAPI', {
  // Notificaciones nativas de Windows
  mostrarNotificacion: (titulo, cuerpo) =>
    ipcRenderer.invoke('mostrar-notificacion', { titulo, cuerpo }),

  // Versión de la app
  obtenerVersion: () =>
    ipcRenderer.invoke('obtener-version'),

  // Abrir enlace en navegador externo
  abrirEnlaceExterno: (url) =>
    ipcRenderer.invoke('abrir-enlace-externo', url),

  // Detectar si estamos en Electron
  esElectron: true,

  // Plataforma
  plataforma: process.platform
})
