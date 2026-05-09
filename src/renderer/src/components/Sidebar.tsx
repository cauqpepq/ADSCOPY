import {
  Bot,
  Globe,
  Network,
  Puzzle,
  Settings as SettingsIcon,
  Users
} from 'lucide-react'
import { useStore } from '../store'
import { cn } from '../lib/utils'

const ITEMS = [
  { id: 'profiles', label: 'Browser Profiles', icon: Globe },
  { id: 'proxies', label: 'Proxies', icon: Network },
  { id: 'extensions', label: 'Extensions', icon: Puzzle },
  { id: 'automation', label: 'Automation', icon: Bot },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'settings', label: 'Settings', icon: SettingsIcon }
] as const

export function Sidebar(): JSX.Element {
  const page = useStore((s) => s.page)
  const setPage = useStore((s) => s.setPage)

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-14 items-center gap-2 border-b border-slate-200 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 text-white font-bold">
          A
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-slate-800">AdsPower Clone</span>
          <span className="text-[10px] text-slate-400">v0.1.0 · open source</span>
        </div>
      </div>
      <nav className="flex-1 overflow-auto py-3">
        {ITEMS.map((item) => {
          const Icon = item.icon
          const active = page === item.id
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-2 text-sm transition',
                active
                  ? 'bg-brand-50 text-brand-700 border-l-2 border-brand-600 font-medium'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
      <div className="p-3 border-t border-slate-200">
        <ApiStatus />
      </div>
    </aside>
  )
}

function ApiStatus(): JSX.Element {
  const apiInfo = useStore((s) => s.apiInfo)
  if (!apiInfo)
    return <span className="text-[11px] text-slate-400">Local API: …</span>

  return (
    <div className="text-[11px] text-slate-500">
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            apiInfo.enabled ? 'bg-emerald-500' : 'bg-slate-300'
          )}
        />
        <span>Local API: {apiInfo.enabled ? `:${apiInfo.port}` : 'off'}</span>
      </div>
      {apiInfo.enabled && (
        <div className="mt-1 truncate text-slate-400">{apiInfo.baseUrl}</div>
      )}
    </div>
  )
}
