const { app, BrowserWindow, Tray, Menu, Notification, ipcMain, shell, nativeImage } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const http = require('http')

// ─── Variables globales ───────────────────────────────────────────────────────
let ventanaPrincipal = null
let ventanaSplash    = null
let bandeja          = null
let procesoPHP       = null
const PUERTO_API     = 8000
const URL_DEV        = 'http://localhost:5173'
const esDev          = process.env.NODE_ENV === 'development'

// ─── Rutas ───────────────────────────────────────────────────────────────────
const raizProyecto = esDev
  ? path.join(__dirname, '..', '..', 'backend')
  : path.join(process.resourcesPath, 'backend')

const phpExe = 'php'

// ─── Iniciar servidor Laravel ─────────────────────────────────────────────────
function iniciarBackend () {
  return new Promise((resolve, reject) => {
    console.log('[Backend] Iniciando Laravel en', raizProyecto)

    procesoPHP = spawn(phpExe, ['artisan', 'serve', '--host=127.0.0.1', `--port=${PUERTO_API}`], {
      cwd: raizProyecto,
      windowsHide: true,
      env: { ...process.env, APP_ENV: 'production' }
    })

    procesoPHP.stdout.on('data', (data) => console.log('[Laravel]', data.toString()))
    procesoPHP.stderr.on('data', (data) => console.error('[Laravel Error]', data.toString()))
    procesoPHP.on('error', (err) => {
      console.error('[Backend] Error al iniciar:', err)
      reject(err)
    })

    // Esperar hasta que el servidor responda
    esperarServidor(`http://127.0.0.1:${PUERTO_API}/api/ping`, 30)
      .then(resolve)
      .catch(reject)
  })
}

// ─── Esperar que el servidor esté listo ───────────────────────────────────────
function esperarServidor (url, intentosMax = 30) {
  return new Promise((resolve, reject) => {
    let intentos = 0
    const intervalo = setInterval(() => {
      intentos++
      http.get(url, (res) => {
        if (res.statusCode < 500) {
          clearInterval(intervalo)
          resolve()
        }
      }).on('error', () => {
        if (intentos >= intentosMax) {
          clearInterval(intervalo)
          reject(new Error('El servidor no respondió a tiempo'))
        }
      })
    }, 1000)
  })
}

// ─── Detener servidor Laravel ─────────────────────────────────────────────────
function detenerBackend () {
  if (procesoPHP) {
    console.log('[Backend] Deteniendo servidor...')
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', procesoPHP.pid, '/f', '/t'])
    } else {
      procesoPHP.kill('SIGTERM')
    }
    procesoPHP = null
  }
}

// ─── Crear ventana de carga (Splash) ─────────────────────────────────────────
function crearSplash () {
  ventanaSplash = new BrowserWindow({
    width:           420,
    height:          340,
    frame:           false,
    transparent:     true,
    resizable:       false,
    center:          true,
    alwaysOnTop:     true,
    webPreferences:  { nodeIntegration: false }
  })
  ventanaSplash.loadFile(path.join(__dirname, 'splash.html'))
}

// ─── Crear ventana principal ──────────────────────────────────────────────────
function crearVentanaPrincipal () {
  ventanaPrincipal = new BrowserWindow({
    width:           1280,
    height:          800,
    minWidth:        900,
    minHeight:       600,
    show:            false,
    title:           'Colegio Milagroso San Judas Tadeo',
    backgroundColor: '#0F172A',
    webPreferences: {
      preload:            path.join(__dirname, 'preload.js'),
      contextIsolation:   true,
      nodeIntegration:    false,
      webSecurity:        true
    }
  })

  // Cargar la app
  if (esDev) {
    ventanaPrincipal.loadURL(URL_DEV)
    ventanaPrincipal.webContents.openDevTools()
  } else {
    ventanaPrincipal.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  // Mostrar cuando esté lista
  ventanaPrincipal.once('ready-to-show', () => {
    if (ventanaSplash && !ventanaSplash.isDestroyed()) {
      ventanaSplash.close()
      ventanaSplash = null
    }
    ventanaPrincipal.show()
    ventanaPrincipal.focus()
  })

  // Al minimizar → ir a bandeja
  ventanaPrincipal.on('minimize', (event) => {
    event.preventDefault()
    ventanaPrincipal.hide()
    if (bandeja) {
      bandeja.displayBalloon({
        iconType: 'info',
        title:    'Sistema Escolar',
        content:  'La app sigue corriendo en segundo plano.'
      })
    }
  })

  // Al cerrar → preguntar o salir
  ventanaPrincipal.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      ventanaPrincipal.hide()
    }
  })

  return ventanaPrincipal
}

// ─── Crear bandeja del sistema ────────────────────────────────────────────────
function crearBandeja () {
  const iconPath = path.join(__dirname, 'icons', 'tray.png')
  const icon = nativeImage.createFromPath(iconPath)

  bandeja = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon)
  bandeja.setToolTip('Colegio Milagroso San Judas Tadeo')

  const menuBandeja = Menu.buildFromTemplate([
    {
      label: '📚 Abrir Sistema Escolar',
      click: () => {
        ventanaPrincipal.show()
        ventanaPrincipal.focus()
      }
    },
    { type: 'separator' },
    {
      label: '🔔 Notificaciones',
      enabled: false
    },
    { type: 'separator' },
    {
      label: '❌ Cerrar aplicación',
      click: () => {
        app.isQuitting = true
        detenerBackend()
        app.quit()
      }
    }
  ])

  bandeja.setContextMenu(menuBandeja)
  bandeja.on('double-click', () => {
    ventanaPrincipal.show()
    ventanaPrincipal.focus()
  })
}

// ─── IPC: Notificaciones desde React ─────────────────────────────────────────
ipcMain.handle('mostrar-notificacion', (event, { titulo, cuerpo }) => {
  const notif = new Notification({
    title:  titulo,
    body:   cuerpo,
    silent: false
  })
  notif.show()
  notif.on('click', () => {
    ventanaPrincipal.show()
    ventanaPrincipal.focus()
  })
})

ipcMain.handle('obtener-version', () => app.getVersion())

ipcMain.handle('abrir-enlace-externo', (event, url) => {
  shell.openExternal(url)
})

// ─── Inicio de la aplicación ──────────────────────────────────────────────────
app.whenReady().then(async () => {
  // Mostrar splash inmediatamente
  crearSplash()

  try {
    // Iniciar backend Laravel
    await iniciarBackend()
    console.log('[App] Backend listo')
  } catch (err) {
    console.error('[App] Error al iniciar backend:', err)
    // Continuar de todas formas (en dev ya puede estar corriendo)
  }

  // Crear ventana principal y bandeja
  crearVentanaPrincipal()
  crearBandeja()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentanaPrincipal()
  })
})

// ─── Cierre limpio ────────────────────────────────────────────────────────────
app.on('before-quit', () => {
  app.isQuitting = true
  detenerBackend()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    detenerBackend()
    app.quit()
  }
})
