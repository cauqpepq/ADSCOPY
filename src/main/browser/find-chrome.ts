import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createRequire } from 'node:module'

const requireCJS = createRequire(__filename)

/**
 * Find a Chrome / Chromium binary on the host.
 * Looks at:
 *   1. user override (passed in)
 *   2. CHROME_PATH env var
 *   3. chrome-launcher's deep detection (Windows registry, macOS LSRegister, Linux known paths)
 *   4. common platform paths (fallback)
 *
 * Edge is intentionally NOT auto-detected. Chromium-based but its CDP semantics
 * and fingerprint surface differ from Chrome; if user wants Edge they can set
 * the path explicitly in Settings.
 */
export function findChromeBinary(override?: string): string | null {
  const candidates: string[] = []

  if (override && override.trim()) candidates.push(override.trim())
  if (process.env.CHROME_PATH) candidates.push(process.env.CHROME_PATH)

  // Deep detection via chrome-launcher (queries Windows registry, macOS LSRegister).
  // Wrapped because the package may not expose internals on every platform.
  try {
    const cl = requireCJS('chrome-launcher') as {
      Launcher?: {
        getInstallations?: () => string[]
        getFirstInstallation?: () => string
      }
    }
    const installs = cl.Launcher?.getInstallations?.()
    if (Array.isArray(installs)) {
      for (const p of installs) if (p) candidates.push(p)
    }
  } catch {
    /* chrome-launcher unavailable, fall back to manual paths */
  }

  if (process.platform === 'win32') {
    const programFiles = [
      process.env['PROGRAMFILES'],
      process.env['PROGRAMFILES(X86)'],
      process.env['LOCALAPPDATA']
    ].filter(Boolean) as string[]
    for (const root of programFiles) {
      candidates.push(path.join(root, 'Google', 'Chrome', 'Application', 'chrome.exe'))
      candidates.push(path.join(root, 'Google', 'Chrome Beta', 'Application', 'chrome.exe'))
      candidates.push(path.join(root, 'Google', 'Chrome SxS', 'Application', 'chrome.exe'))
      candidates.push(path.join(root, 'Chromium', 'Application', 'chrome.exe'))
      candidates.push(path.join(root, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'))
    }
  } else if (process.platform === 'darwin') {
    candidates.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
    candidates.push('/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta')
    candidates.push('/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary')
    candidates.push('/Applications/Chromium.app/Contents/MacOS/Chromium')
    candidates.push('/Applications/Brave Browser.app/Contents/MacOS/Brave Browser')
    candidates.push(
      path.join(os.homedir(), 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
    )
  } else {
    candidates.push('/usr/bin/google-chrome')
    candidates.push('/usr/bin/google-chrome-stable')
    candidates.push('/usr/bin/google-chrome-beta')
    candidates.push('/usr/bin/chromium')
    candidates.push('/usr/bin/chromium-browser')
    candidates.push('/snap/bin/chromium')
    candidates.push('/usr/bin/brave-browser')
    candidates.push('/opt/google/chrome/chrome')
    candidates.push(path.join(os.homedir(), '.local/bin/google-chrome'))
  }

  // Filter to existing chrome-like binaries; exclude Edge unless user override.
  const looksLikeChrome = (p: string): boolean => {
    const base = path.basename(p).toLowerCase()
    if (override && p === override.trim()) return true
    if (base.includes('msedge') || base.includes('edge')) return false
    return true
  }

  for (const c of candidates) {
    try {
      if (c && looksLikeChrome(c) && fs.existsSync(c)) return c
    } catch {
      /* swallow */
    }
  }
  return null
}
