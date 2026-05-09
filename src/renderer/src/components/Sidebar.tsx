import {
  BarChart3,
  Bot,
  FolderTree,
  Globe,
  HelpCircle,
  Network,
  Puzzle,
  RefreshCcw,
  Settings as SettingsIcon,
  TerminalSquare,
  Users
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Page } from '../store'
import { useStore } from '../store'
import { cn } from '../lib/utils'
import { useT } from '../i18n'
import type { TranslationKey } from '../i18n'

type NavItem = { id: Page; key: TranslationKey; icon: LucideIcon }

const PRIMARY: NavItem[] = [
  { id: 'profiles', key: 'nav.profiles', icon: Globe },
  { id: 'groups', key: 'nav.groups', icon: FolderTree },
  { id: 'application-center', key: 'nav.applicationCenter', icon: Puzzle },
  { id: 'rpa', key: 'nav.rpa', icon: Bot },
  { id: 'proxies', key: 'nav.proxies', icon: Network },
  { id: 'api', key: 'nav.api', icon: TerminalSquare },
  { id: 'sync', key: 'nav.sync', icon: RefreshCcw },
  { id: 'statistics', key: 'nav.statistics', icon: BarChart3 },
  { id: 'team', key: 'nav.team', icon: Users }
]

export function Sidebar(): JSX.Element {
  const page = useStore((s) => s.page)
  const setPage = useStore((s) => s.setPage)
  const t = useT()

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line surface">
      <div className="flex h-14 items-center gap-2.5 border-b border-line px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm">
          <Globe className="h-5 w-5" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight text-base-strong">AdsPower Clone</span>
          <span className="text-[10px] uppercase tracking-wider text-ink-400 dark:text-ink-500">
            v0.1 · open source
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-auto px-2 py-3">
        <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500">
          {t('nav.workspace')}
        </div>
        {PRIMARY.map((item) => (
          <NavRow
            key={item.id}
            icon={item.icon}
            label={t(item.key)}
            active={page === item.id}
            onClick={() => setPage(item.id)}
          />
        ))}

        <div className="mb-1 mt-4 px-2 text-[10px] font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-500">
          {t('nav.system')}
        </div>
        <NavRow
          icon={SettingsIcon}
          label={t('nav.settings')}
          active={page === 'settings'}
          onClick={() => setPage('settings')}
        />
        <NavRow
          icon={HelpCircle}
          label={t('nav.help')}
          active={false}
          onClick={() => {
            window.open('https://github.com/cauqpepq/ADSCOPY', '_blank', 'noopener,noreferrer')
          }}
        />
      </nav>
    </aside>
  )
}

function NavRow({
  icon: Icon,
  label,
  active,
  onClick
}: {
  icon: LucideIcon
  label: string
  active: boolean
  onClick: () => void
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm transition',
        active
          ? 'bg-brand-50 text-brand-700 font-medium dark:bg-brand-900/40 dark:text-brand-200'
          : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-ink-100'
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4',
          active
            ? 'text-brand-600 dark:text-brand-300'
            : 'text-ink-400 group-hover:text-ink-600 dark:text-ink-500 dark:group-hover:text-ink-300'
        )}
      />
      <span className="truncate">{label}</span>
    </button>
  )
}
