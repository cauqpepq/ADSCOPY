import express from 'express'
import type { Server } from 'node:http'
import { profileRepo, settingsRepo } from '@main/db'
import { closeProfile, isRunning, launchProfile } from '@main/browser/launcher'

let server: Server | null = null
let activePort = 0

/**
 * Mimics AdsPower's local API on http://localhost:<port>.
 * Endpoints:
 *   GET  /status                        -> { ok: true }
 *   GET  /api/v1/browser/list           -> profiles
 *   GET  /api/v1/browser/active?user_id -> running info
 *   POST /api/v1/browser/start          -> { user_id }
 *   POST /api/v1/browser/stop           -> { user_id }
 */
export function startApiServer(emit: (id: string, status: 'running' | 'idle' | 'error', err?: string) => void): void {
  const settings = settingsRepo.get()
  if (!settings.apiPort) return
  stopApiServer()

  const app = express()
  app.use(express.json())

  app.get('/status', (_req, res) => res.json({ ok: true, version: '0.1.0' }))

  app.get('/api/v1/browser/list', (_req, res) => {
    const list = profileRepo.list().map((p) => ({
      user_id: p.id,
      name: p.name,
      status: p.status,
      created_time: p.createdAt
    }))
    res.json({ code: 0, msg: 'ok', data: list })
  })

  app.get('/api/v1/browser/active', (req, res) => {
    const id = String(req.query.user_id || '')
    const profile = profileRepo.get(id)
    if (!profile) return res.status(404).json({ code: 404, msg: 'profile not found' })
    res.json({
      code: 0,
      msg: 'ok',
      data: { user_id: id, status: isRunning(id) ? 'Active' : 'Inactive' }
    })
  })

  app.post('/api/v1/browser/start', async (req, res) => {
    const id = String(req.body?.user_id || req.query.user_id || '')
    if (!id) return res.status(400).json({ code: 400, msg: 'user_id required' })
    const r = await launchProfile(id, emit)
    if (!r.ok) return res.status(500).json({ code: 500, msg: r.error })
    res.json({
      code: 0,
      msg: 'ok',
      data: { ws: r.cdpEndpoint, debug_port: r.cdpEndpoint?.split(':').pop() }
    })
  })

  app.post('/api/v1/browser/stop', async (req, res) => {
    const id = String(req.body?.user_id || req.query.user_id || '')
    if (!id) return res.status(400).json({ code: 400, msg: 'user_id required' })
    await closeProfile(id)
    res.json({ code: 0, msg: 'ok' })
  })

  server = app.listen(settings.apiPort, '127.0.0.1')
  activePort = settings.apiPort
}

export function stopApiServer(): void {
  if (server) {
    server.close()
    server = null
  }
}

export function getApiInfo(): { enabled: boolean; port: number; baseUrl: string } {
  return {
    enabled: !!server,
    port: activePort,
    baseUrl: server ? `http://127.0.0.1:${activePort}` : ''
  }
}
