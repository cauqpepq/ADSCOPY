import { spawn, ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import puppeteer, { type Browser } from 'puppeteer-core'
import type { LaunchResult } from '@shared/types'
import { findChromeBinary } from './find-chrome'
import { buildProxyFlag } from './proxy'
import { buildPreloadScript } from '@main/fingerprint/preload-template'
import { extensionRepo, settingsRepo } from '@main/db'
import { profileRepo } from '@main/db'

interface RunningProfile {
  proc: ChildProcess
  cdpPort: number
  cdpEndpoint: string
  browser: Browser
  closing: boolean
}

const RUNNING = new Map<string, RunningProfile>()

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.unref()
    srv.on('error', reject)
    srv.listen(0, () => {
      const addr = srv.address()
      if (typeof addr === 'object' && addr) {
        const port = addr.port
        srv.close(() => resolve(port))
      } else reject(new Error('cannot get free port'))
    })
  })
}

async function waitForPort(port: number, timeoutMs = 15_000): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const ok = await new Promise<boolean>((resolve) => {
      const s = net.createConnection(port, '127.0.0.1')
      s.once('connect', () => {
        s.end()
        resolve(true)
      })
      s.once('error', () => resolve(false))
    })
    if (ok) return
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error(`Chrome did not open CDP port ${port} in time`)
}

export async function launchProfile(
  profileId: string,
  emit: (profileId: string, status: 'running' | 'idle' | 'error', err?: string) => void
): Promise<LaunchResult> {
  const profile = profileRepo.get(profileId)
  if (!profile) return { ok: false, error: 'profile not found' }
  if (RUNNING.has(profileId)) {
    const r = RUNNING.get(profileId)!
    return { ok: true, pid: r.proc.pid, cdpEndpoint: r.cdpEndpoint }
  }

  const settings = settingsRepo.get()
  const chromePath = findChromeBinary(settings.chromePath)
  if (!chromePath) {
    const err =
      'Chrome / Chromium not found. Install Google Chrome or set the path in Settings.'
    emit(profileId, 'error', err)
    profileRepo.update(profileId, { status: 'error', lastError: err })
    return { ok: false, error: err }
  }

  if (!fs.existsSync(profile.userDataDir)) {
    fs.mkdirSync(profile.userDataDir, { recursive: true })
  }

  const cdpPort = await getFreePort()
  const args = [
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${profile.userDataDir}`,
    `--lang=${profile.fingerprint.locale}`,
    `--window-size=${profile.fingerprint.screen.width},${profile.fingerprint.screen.height}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-features=IsolateOrigins,site-per-process,Translate',
    '--disable-blink-features=AutomationControlled',
    '--disable-component-update',
    '--disable-popup-blocking'
  ]

  const proxyFlag = buildProxyFlag(profile.proxy)
  if (proxyFlag) args.push(proxyFlag)

  // Load enabled extensions
  const enabledExtensions = extensionRepo
    .list()
    .filter((e) => e.enabled && profile.extensionIds.includes(e.id))
  if (enabledExtensions.length) {
    args.push(`--load-extension=${enabledExtensions.map((e) => e.path).join(',')}`)
    args.push(`--disable-extensions-except=${enabledExtensions.map((e) => e.path).join(',')}`)
  }

  // Startup URLs
  if (profile.startupUrls.length) {
    args.push(...profile.startupUrls)
  } else {
    args.push('about:blank')
  }

  const proc = spawn(chromePath, args, {
    detached: false,
    stdio: ['ignore', 'pipe', 'pipe']
  })
  proc.stdout?.on('data', () => {})
  proc.stderr?.on('data', () => {})

  try {
    await waitForPort(cdpPort, 20_000)
  } catch (e: any) {
    proc.kill('SIGKILL')
    const err = e?.message ?? 'Chrome did not start'
    emit(profileId, 'error', err)
    profileRepo.update(profileId, { status: 'error', lastError: err })
    return { ok: false, error: err }
  }

  // Connect Puppeteer to the running browser
  const cdpEndpoint = `http://127.0.0.1:${cdpPort}`
  let browser: Browser
  try {
    browser = await puppeteer.connect({
      browserURL: cdpEndpoint,
      defaultViewport: null
    })
  } catch (e: any) {
    proc.kill('SIGKILL')
    const err = e?.message ?? 'Failed to connect Puppeteer to Chrome'
    emit(profileId, 'error', err)
    profileRepo.update(profileId, { status: 'error', lastError: err })
    return { ok: false, error: err }
  }

  // Inject fingerprint preload into all current and future targets
  const preloadJs = buildPreloadScript(profile.fingerprint)
  const installPreload = async (page: any): Promise<void> => {
    try {
      await page.evaluateOnNewDocument(preloadJs)
      await page.setUserAgent(profile.fingerprint.userAgent)
      await page.setExtraHTTPHeaders({
        'Accept-Language':
          profile.fingerprint.languages.join(',') +
          ',' +
          profile.fingerprint.languages[0].split('-')[0] +
          ';q=0.9'
      })
      // Authenticate proxy if creds present
      if (profile.proxy.username && profile.proxy.password) {
        await page.authenticate({
          username: profile.proxy.username,
          password: profile.proxy.password
        })
      }
      // Restore cookies
      if (profile.cookies?.length) {
        try {
          await page.setCookie(...(profile.cookies as any))
        } catch {
          /* swallow */
        }
      }
    } catch {
      /* swallow */
    }
  }

  for (const page of await browser.pages()) {
    await installPreload(page)
  }
  browser.on('targetcreated', async (target) => {
    try {
      const page = await target.page()
      if (page) await installPreload(page)
    } catch {
      /* swallow */
    }
  })

  const running: RunningProfile = {
    proc,
    cdpPort,
    cdpEndpoint,
    browser,
    closing: false
  }
  RUNNING.set(profileId, running)

  proc.on('exit', async () => {
    if (!running.closing) {
      // Persist cookies on exit
      try {
        const pages = await browser.pages()
        const allCookies: any[] = []
        for (const p of pages) {
          try {
            allCookies.push(...(await p.cookies()))
          } catch {
            /* swallow */
          }
        }
        if (allCookies.length) {
          profileRepo.update(profileId, {
            cookies: allCookies,
            lastOpenedAt: new Date().toISOString()
          })
        }
      } catch {
        /* swallow */
      }
    }
    RUNNING.delete(profileId)
    emit(profileId, 'idle')
    profileRepo.update(profileId, { status: 'idle' })
  })

  emit(profileId, 'running')
  profileRepo.update(profileId, {
    status: 'running',
    lastOpenedAt: new Date().toISOString(),
    lastError: null
  })
  return { ok: true, pid: proc.pid ?? undefined, cdpEndpoint }
}

export async function closeProfile(profileId: string): Promise<{ ok: boolean }> {
  const r = RUNNING.get(profileId)
  if (!r) return { ok: true }
  r.closing = true
  try {
    // Persist cookies before quitting
    const pages = await r.browser.pages()
    const allCookies: any[] = []
    for (const p of pages) {
      try {
        allCookies.push(...(await p.cookies()))
      } catch {
        /* swallow */
      }
    }
    if (allCookies.length) {
      profileRepo.update(profileId, { cookies: allCookies })
    }
    await r.browser.disconnect()
  } catch {
    /* swallow */
  }
  try {
    r.proc.kill('SIGTERM')
    setTimeout(() => {
      try {
        if (!r.proc.killed) r.proc.kill('SIGKILL')
      } catch {
        /* swallow */
      }
    }, 3000)
  } catch {
    /* swallow */
  }
  RUNNING.delete(profileId)
  return { ok: true }
}

export function isRunning(profileId: string): boolean {
  return RUNNING.has(profileId)
}

export function getRunning(profileId: string): RunningProfile | undefined {
  return RUNNING.get(profileId)
}

export async function closeAll(): Promise<void> {
  for (const id of Array.from(RUNNING.keys())) {
    await closeProfile(id)
  }
}
