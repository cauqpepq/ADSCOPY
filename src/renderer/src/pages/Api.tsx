import { Copy, ExternalLink, Server, ShieldCheck } from 'lucide-react'
import { useStore } from '../store'
import { useT } from '../i18n'

const ENDPOINTS = [
  { method: 'GET', path: '/status', desc: 'Health check' },
  { method: 'GET', path: '/api/v1/browser/list', desc: 'List all profiles' },
  {
    method: 'GET',
    path: '/api/v1/browser/active',
    desc: 'List currently running profiles'
  },
  {
    method: 'POST',
    path: '/api/v1/browser/start',
    desc: 'Launch a profile (body: { user_id })'
  },
  {
    method: 'POST',
    path: '/api/v1/browser/stop',
    desc: 'Close a profile (body: { user_id })'
  }
]

const SAMPLE_REQUEST = `curl -X POST http://127.0.0.1:50325/api/v1/browser/start \\
  -H "Content-Type: application/json" \\
  -d '{ "user_id": "<profile-id>" }'`

export function ApiPage(): JSX.Element {
  const apiInfo = useStore((s) => s.apiInfo)
  const t = useT()
  const base = apiInfo?.enabled ? `http://127.0.0.1:${apiInfo.port}` : '—'

  return (
    <div className="flex h-full flex-col overflow-auto p-6">
      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-base-mute">
            <Server className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider">Status</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            {apiInfo?.enabled ? (
              <span className="pill bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {t('api.status.running')}
              </span>
            ) : (
              <span className="pill bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                {t('api.status.disabled')}
              </span>
            )}
            <span className="font-mono text-sm text-base-strong">{base}</span>
            {apiInfo?.enabled && (
              <button
                className="icon-btn"
                title="Copy"
                onClick={() => void navigator.clipboard.writeText(base)}
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-base-mute">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wider">Bind</span>
          </div>
          <p className="mt-2 text-sm text-base-soft">
            Loopback only. The server binds to <code className="font-mono">127.0.0.1</code>{' '}
            and is unreachable from other devices.
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <header className="border-b border-line px-4 py-2 text-xs font-semibold uppercase tracking-wide text-base-mute">
          {t('api.docs.title')}
        </header>
        <table className="w-full text-sm">
          <tbody>
            {ENDPOINTS.map((e) => (
              <tr key={e.method + e.path} className="border-b border-line last:border-b-0">
                <td className="w-20 px-4 py-2">
                  <span
                    className={
                      'pill font-mono text-[10px] ' +
                      (e.method === 'GET'
                        ? 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
                        : 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300')
                    }
                  >
                    {e.method}
                  </span>
                </td>
                <td className="px-4 py-2 font-mono text-xs text-base-strong">{e.path}</td>
                <td className="px-4 py-2 text-xs text-base-soft">{e.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 card p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-base-mute">
            Example
          </span>
          <button
            className="icon-btn"
            title="Copy"
            onClick={() => void navigator.clipboard.writeText(SAMPLE_REQUEST)}
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
        <pre className="overflow-auto rounded bg-ink-50 p-3 text-xs text-ink-700 dark:bg-ink-950 dark:text-ink-300">
          {SAMPLE_REQUEST}
        </pre>
      </div>

      <div className="mt-4 card p-4">
        <div className="flex items-center gap-2 text-xs text-base-mute">
          <ExternalLink className="h-3.5 w-3.5" />
          Compatible with AdsPower local-api shape (subset). Use any HTTP client to drive
          profiles programmatically.
        </div>
      </div>
    </div>
  )
}
