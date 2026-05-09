import { Bell, Search } from 'lucide-react'
import { useStore } from '../store'

const TITLES: Record<string, { title: string; subtitle: string }> = {
  profiles: { title: 'Browser Profiles', subtitle: 'Manage isolated browser sessions, each with a unique fingerprint.' },
  proxies: { title: 'Proxies', subtitle: 'HTTP / SOCKS proxies that you can attach to profiles.' },
  extensions: { title: 'Extensions', subtitle: 'Unpacked Chromium extensions injected into profiles on launch.' },
  automation: { title: 'Automation', subtitle: 'JSON-defined RPA scenarios run via Puppeteer.' },
  team: { title: 'Team', subtitle: 'Team collaboration features.' },
  settings: { title: 'Settings', subtitle: 'Configure Chrome path, local API, and appearance.' }
}

export function Topbar(): JSX.Element {
  const page = useStore((s) => s.page)
  const search = useStore((s) => s.search)
  const setSearch = useStore((s) => s.setSearch)
  const meta = TITLES[page] ?? { title: page, subtitle: '' }

  return (
    <header className="flex h-16 items-center justify-between border-b border-ink-200 bg-white px-6">
      <div>
        <h1 className="text-base font-semibold leading-tight text-ink-800">{meta.title}</h1>
        <p className="text-xs leading-tight text-ink-500">{meta.subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        {page === 'profiles' && (
          <div className="relative w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search profiles, tags, notes…"
              className="input pl-8"
            />
          </div>
        )}
        <button className="icon-btn" title="Notifications">
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
