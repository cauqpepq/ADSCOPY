import type { ProxyConfig } from '@shared/types'

/**
 * Build a Chrome --proxy-server flag from a ProxyConfig.
 * Returns null if no proxy.
 *
 * NOTE: Chrome only supports auth on SOCKS via dialog. For HTTP proxies that
 * require auth, the credentials must be supplied at runtime via the
 * Authentication Required dialog, or by listening to Network.authRequired
 * over CDP (handled by the launcher).
 */
export function buildProxyFlag(p: ProxyConfig): string | null {
  if (!p || p.type === 'none' || !p.host || !p.port) return null
  const scheme =
    p.type === 'https' ? 'https' : p.type === 'socks5' ? 'socks5' : p.type === 'socks4' ? 'socks4' : 'http'
  return `--proxy-server=${scheme}://${p.host}:${p.port}`
}

/**
 * Parse a proxy URL like:
 *   http://user:pass@host:port
 *   socks5://user:pass@host:port
 *   host:port:user:pass
 *   host:port
 *
 * Returns a ProxyConfig (without id).
 */
export function parseProxyString(input: string): Omit<ProxyConfig, 'id'> | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // URL form
  if (/^[a-z0-9]+:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed)
      const type = (u.protocol.replace(':', '') as ProxyConfig['type']) || 'http'
      return {
        type: ['http', 'https', 'socks4', 'socks5'].includes(type) ? type : 'http',
        host: u.hostname,
        port: Number(u.port) || (type === 'https' ? 443 : 80),
        username: decodeURIComponent(u.username) || undefined,
        password: decodeURIComponent(u.password) || undefined
      }
    } catch {
      return null
    }
  }

  // host:port:user:pass form
  const parts = trimmed.split(':')
  if (parts.length === 2) {
    return { type: 'http', host: parts[0], port: Number(parts[1]) }
  }
  if (parts.length === 4) {
    return {
      type: 'http',
      host: parts[0],
      port: Number(parts[1]),
      username: parts[2],
      password: parts[3]
    }
  }
  return null
}

/**
 * Test a proxy by issuing an HTTPS request to a known endpoint and reading
 * the public IP. Returns the IP and latency on success.
 */
export async function testProxy(
  p: ProxyConfig,
  testUrl = 'https://api.ipify.org?format=json',
  timeoutMs = 8000
): Promise<{ ok: boolean; ip?: string; latencyMs?: number; error?: string }> {
  if (!p.host || !p.port || p.type === 'none') {
    return { ok: false, error: 'Proxy not configured' }
  }
  const start = Date.now()
  try {
    // We use Node http(s) Agent indirectly via undici; for SOCKS we'd need a separate agent.
    // To stay lightweight and dependency-free we use the system's CONNECT for HTTP/S proxies only.
    const { default: nf } = await import('node-fetch')
    const { HttpsProxyAgent } = await import('https-proxy-agent').catch(() => ({ HttpsProxyAgent: undefined } as any))
    const { SocksProxyAgent } = await import('socks-proxy-agent').catch(() => ({ SocksProxyAgent: undefined } as any))
    let agent: any = undefined
    if (p.type === 'socks4' || p.type === 'socks5') {
      if (!SocksProxyAgent) return { ok: false, error: 'socks-proxy-agent not installed' }
      const auth = p.username ? `${encodeURIComponent(p.username)}:${encodeURIComponent(p.password ?? '')}@` : ''
      agent = new SocksProxyAgent(`${p.type}://${auth}${p.host}:${p.port}`)
    } else {
      if (!HttpsProxyAgent) return { ok: false, error: 'https-proxy-agent not installed' }
      const auth = p.username ? `${encodeURIComponent(p.username)}:${encodeURIComponent(p.password ?? '')}@` : ''
      agent = new HttpsProxyAgent(`${p.type === 'https' ? 'https' : 'http'}://${auth}${p.host}:${p.port}`)
    }
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), timeoutMs)
    const r = await nf(testUrl, { agent, signal: ctrl.signal as any })
    clearTimeout(t)
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}` }
    const j = (await r.json()) as { ip?: string }
    return { ok: true, ip: j.ip, latencyMs: Date.now() - start }
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e) }
  }
}
