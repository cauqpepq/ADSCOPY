import { Bell, Moon, Search, Sun } from 'lucide-react'
import { useStore } from '../store'
import type { Page } from '../store'
import { useT } from '../i18n'
import type { TranslationKey } from '../i18n'

const PAGE_META: Record<Page, { title: TranslationKey; subtitle: TranslationKey }> = {
  profiles: { title: 'profiles.title', subtitle: 'profiles.subtitle' },
  groups: { title: 'groups.title', subtitle: 'groups.subtitle' },
  'application-center': { title: 'apps.title', subtitle: 'apps.subtitle' },
  rpa: { title: 'rpa.title', subtitle: 'rpa.subtitle' },
  proxies: { title: 'proxies.title', subtitle: 'proxies.subtitle' },
  api: { title: 'api.title', subtitle: 'api.subtitle' },
  sync: { title: 'sync.title', subtitle: 'sync.subtitle' },
  statistics: { title: 'stats.title', subtitle: 'stats.subtitle' },
  team: { title: 'team.title', subtitle: 'team.subtitle' },
  settings: { title: 'settings.title', subtitle: 'settings.subtitle' }
}

export function Topbar(): JSX.Element {
  const page = useStore((s) => s.page)
  const search = useStore((s) => s.search)
  const setSearch = useStore((s) => s.setSearch)
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const t = useT()
  const meta = PAGE_META[page]

  return (
    <header className="flex h-16 items-center justify-between border-b border-line surface px-6">
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold leading-tight text-base-strong">
          {t(meta.title)}
        </h1>
        <p className="truncate text-xs leading-tight text-base-mute">{t(meta.subtitle)}</p>
      </div>
      <div className="flex items-center gap-2">
        {page === 'profiles' && (
          <div className="relative w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400 dark:text-ink-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('profiles.searchPlaceholder')}
              className="input pl-8"
            />
          </div>
        )}
        <button
          className="icon-btn"
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button className="icon-btn" title={t('common.notifications')}>
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
