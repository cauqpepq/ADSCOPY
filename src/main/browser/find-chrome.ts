import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

/**
 * Find a Chrome / Chromium binary on the host.
 * Looks at:
 *   1. user override (passed in)
 *   2. CHROME_PATH env var
 *   3. common platform paths
 */
export function findChromeBinary(override?: string): string | null {
  const candidates: string[] = []

  if (override && override.trim()) candidates.push(override.trim())
  if (process.env.CHROME_PATH) candidates.push(process.env.CHROME_PATH)

  if (process.platform === 'win32') {
    const programFiles = [
      process.env['PROGRAMFILES'],
      process.env['PROGRAMFILES(X86)'],
      process.env['LOCALAPPDATA']
    ].filter(Boolean) as string[]
    for (const root of programFiles) {
      candidates.push(path.join(root, 'Google', 'Chrome', 'Application', 'chrome.exe'))
      candidates.push(path.join(root, 'Microsoft', 'Edge', 'Application', 'msedge.exe'))
      candidates.push(path.join(root, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'))
      candidates.push(path.join(root, 'Chromium', 'Application', 'chrome.exe'))
    }
  } else if (process.platform === 'darwin') {
    candidates.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
    candidates.push('/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta')
    candidates.push('/Applications/Chromium.app/Contents/MacOS/Chromium')
    candidates.push('/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge')
    candidates.push('/Applications/Brave Browser.app/Contents/MacOS/Brave Browser')
    candidates.push(path.join(os.homedir(), 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'))
  } else {
    candidates.push('/usr/bin/google-chrome')
    candidates.push('/usr/bin/google-chrome-stable')
    candidates.push('/usr/bin/chromium')
    candidates.push('/usr/bin/chromium-browser')
    candidates.push('/snap/bin/chromium')
    candidates.push('/usr/bin/microsoft-edge')
    candidates.push('/usr/bin/brave-browser')
    candidates.push('/opt/google/chrome/chrome')
  }

  for (const c of candidates) {
    try {
      if (c && fs.existsSync(c)) return c
    } catch {
      /* swallow */
    }
  }
  return null
}
