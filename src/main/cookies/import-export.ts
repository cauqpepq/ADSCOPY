import fs from 'node:fs'
import type { SerializedCookie } from '@shared/types'

/**
 * Cookie import/export utilities.
 * Supports:
 *   - JSON array (Puppeteer format)
 *   - Netscape cookies.txt
 *   - Browser-extension export (EditThisCookie)
 */

export function exportCookiesJson(cookies: SerializedCookie[]): string {
  return JSON.stringify(cookies, null, 2)
}

export function importCookiesFromString(raw: string): SerializedCookie[] {
  const trimmed = raw.trim()
  // Try JSON first
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed)
      const arr = Array.isArray(parsed) ? parsed : [parsed]
      return arr.map(normalizeJsonCookie).filter(Boolean) as SerializedCookie[]
    } catch {
      /* fall through */
    }
  }
  return parseNetscape(trimmed)
}

export function importCookiesFromFile(filePath: string): SerializedCookie[] {
  const raw = fs.readFileSync(filePath, 'utf8')
  return importCookiesFromString(raw)
}

function normalizeJsonCookie(c: any): SerializedCookie | null {
  if (!c) return null
  // EditThisCookie format
  if (c.hostOnly !== undefined && c.domain) {
    return {
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path ?? '/',
      expires: c.expirationDate ?? c.expires,
      httpOnly: !!c.httpOnly,
      secure: !!c.secure,
      sameSite:
        c.sameSite === 'no_restriction' || c.sameSite === 'unspecified'
          ? 'None'
          : c.sameSite === 'lax'
            ? 'Lax'
            : c.sameSite === 'strict'
              ? 'Strict'
              : undefined
    }
  }
  // Puppeteer format
  if (c.name && c.value) {
    return {
      name: c.name,
      value: c.value,
      domain: c.domain ?? '',
      path: c.path ?? '/',
      expires: c.expires,
      httpOnly: !!c.httpOnly,
      secure: !!c.secure,
      sameSite: c.sameSite
    }
  }
  return null
}

/**
 * Parse a Netscape cookies.txt file.
 *
 * Format (tab-separated):
 *   domain  flag  path  secure  expiration  name  value
 */
function parseNetscape(input: string): SerializedCookie[] {
  const out: SerializedCookie[] = []
  for (const line of input.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue
    const parts = line.split('\t')
    if (parts.length < 7) continue
    const [domain, , path, secure, expires, name, value] = parts
    out.push({
      name,
      value,
      domain,
      path,
      expires: Number(expires) || undefined,
      secure: secure.toLowerCase() === 'true'
    })
  }
  return out
}

/**
 * Format cookies as a Netscape cookies.txt string.
 */
export function exportNetscape(cookies: SerializedCookie[]): string {
  const header = `# Netscape HTTP Cookie File\n# https://curl.se/docs/http-cookies.html\n# Exported by AdsPower Clone\n\n`
  const lines = cookies.map((c) => {
    const domain = c.domain.startsWith('.') ? c.domain : c.domain
    const includeSubdomains = domain.startsWith('.') ? 'TRUE' : 'FALSE'
    const path = c.path || '/'
    const secure = c.secure ? 'TRUE' : 'FALSE'
    const expires = c.expires ? Math.floor(c.expires) : 0
    return [domain, includeSubdomains, path, secure, expires, c.name, c.value].join('\t')
  })
  return header + lines.join('\n') + '\n'
}
