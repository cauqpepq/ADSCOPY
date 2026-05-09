import {
  Bot,
  Globe,
  HelpCircle,
  Network,
  Puzzle,
  Settings as SettingsIcon,
  Users
} from 'lucide-react'
import { useStore } from '../store'
import { cn } from '../lib/utils'

const PRIMARY = [
  { id: 'profiles', label: 'Browser Profiles', icon: Globe },
  { id: 'proxies', label: 'Proxies', icon: Network },
  { id: 'extensions', label: 'Extensions', icon: Puzzle },
  { id: 'automation', label: 'Automation', icon: Bot },
  { id: 'team', label: 'Team', icon: Users }
] as const

export function Sidebar(): JSX.Element {
  const page = useStore((s) => s.page)
  const setPage = useStore((s) => s.setPage)

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-ink-200 bg-white">
      <div className="flex h-14 items-center gap-2.5 border-b border-ink-200 px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
          <Globe className="h-5 w-5" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight text-ink-800">AdsPower Clone</span>
          <span className="text-[10px] uppercase tracking-wider text-ink-400">v0.1 · open source</span>
        </div>
      </div>

      <nav className="flex-1 overflow-auto px-2 py-3">
        <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
          Workspace
        </div>
        {PRIMARY.map((item) => {
          const Icon = item.icon
          const active = page === item.id
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={cn(
                'group flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm transition',
                active
                  ? 'bg-brand-50 text-brand-700 font-medium'
                  : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
              )}
            >
              <Icon
                className={cn('h-4 w-4', active ? 'text-brand-600' : 'text-ink-400 group-hover:text-ink-600')}
              />
              <span>{item.label}</span>
            </button>
          )
        })}

        <div className="mb-1 mt-4 px-2 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
          System
        </div>
        <button
          onClick={() => setPage('settings')}
          className={cn(
            'group flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm transition',
            page === 'settings'
              ? 'bg-brand-50 text-brand-700 font-medium'
              : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
          )}
        >
          <SettingsIcon
            className={cn(
              'h-4 w-4',
              page === 'settings' ? 'text-brand-600' : 'text-ink-400 group-hover:text-ink-600'
            )}
          />
          <span>Settings</span>
        </button>
        <a
          href="https://github.com/cauqpepq/ADSCOPY"
          onClick={(e) => {
            e.preventDefault()
            void window.api.systemOpenPath('https://github.com/cauqpepq/ADSCOPY')
          }}
          className="group flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm text-ink-600 transition hover:bg-ink-50 hover:text-ink-900"
        >
          <HelpCircle className="h-4 w-4 text-ink-400 group-hover:text-ink-600" />
          <span>Help &amp; About</span>
        </a>
      </nav>

      <div className="border-t border-ink-200 p-3">
        <ApiStatus />
      </div>
    </aside>
  )
}

function ApiStatus(): JSX.Element {
  const apiInfo = useStore((s) => s.apiInfo)
  if (!apiInfo) return <span className="text-[11px] text-ink-400">Local API: …</span>

  return (
    <div className="text-[11px] text-ink-500">
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            apiInfo.enabled ? 'bg-emerald-500' : 'bg-ink-300'
          )}
        />
        <span className="font-medium text-ink-600">
          Local API: {apiInfo.enabled ? `running on :${apiInfo.port}` : 'off'}
        </span>
      </div>
      {apiInfo.enabled && (
        <div className="mt-1 truncate font-mono text-[10px] text-ink-400">{apiInfo.baseUrl}</div>
      )}
    </div>
  )
}
