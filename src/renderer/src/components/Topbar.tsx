import { Search } from 'lucide-react'
import { useStore } from '../store'

const TITLES: Record<string, string> = {
  profiles: 'Browser Profiles',
  proxies: 'Proxies',
  extensions: 'Extensions',
  automation: 'Automation',
  team: 'Team',
  settings: 'Settings'
}

export function Topbar(): JSX.Element {
  const page = useStore((s) => s.page)
  const search = useStore((s) => s.search)
  const setSearch = useStore((s) => s.setSearch)

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div>
        <h1 className="text-base font-semibold text-slate-800">{TITLES[page] ?? page}</h1>
      </div>
      {page === 'profiles' && (
        <div className="relative w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search profiles by name or tag…"
            className="input pl-8"
          />
        </div>
      )}
    </header>
  )
}
