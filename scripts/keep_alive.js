#!/usr/bin/env node
/**
 * Script de Keep-Alive y Monitoreo para el Sistema Escolar San Judas Tadeo
 * Realiza pings HTTP regulares a https://sistema-escolar-sjt.onrender.com/api/ping
 * para prevenir que la instancia de Render entre en cold-start (suspensión tras 15 min).
 */

const https = require('https')

const URL_PING = process.env.PING_URL || 'https://sistema-escolar-sjt.onrender.com/api/ping'
const INTERVALO_MS = (parseInt(process.env.PING_INTERVAL_MINUTES, 10) || 10) * 60 * 1000

function hacerPing() {
  const inicio = Date.now()
  const fecha = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })

  const req = https.get(URL_PING, { timeout: 35000 }, (res) => {
    let data = ''
    res.on('data', chunk => { data += chunk })
    res.on('end', () => {
      const duracion = ((Date.now() - inicio) / 1000).toFixed(2)
      console.log(`[${fecha}] Ping HTTP ${res.statusCode} en ${duracion}s -> ${data.trim()}`)
    })
  })

  req.on('error', (err) => {
    const duracion = ((Date.now() - inicio) / 1000).toFixed(2)
    console.error(`[${fecha}] ERROR en ping tras ${duracion}s:`, err.message)
  })

  req.on('timeout', () => {
    req.destroy()
    const duracion = ((Date.now() - inicio) / 1000).toFixed(2)
    console.warn(`[${fecha}] TIMEOUT (>35s) en ping. Servidor posiblemente despertando de suspensión.`)
  })
}

console.log('=================================================================')
console.log('   SISTEMA ESCOLAR SAN JUDAS TADEO — KEEP-ALIVE RENDER')
console.log(`   URL: ${URL_PING}`)
console.log(`   Frecuencia: Cada ${INTERVALO_MS / 60000} minutos`)
console.log('=================================================================')

// Ping inicial inmediato
hacerPing()

// Programación periódica si se ejecuta en modo demonio
if (process.argv.includes('--daemon') || process.argv.includes('-d')) {
  setInterval(hacerPing, INTERVALO_MS)
}
