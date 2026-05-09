import {
  Apple,
  Copy,
  FileDown,
  FileUp,
  Globe,
  Laptop,
  Monitor,
  MoreVertical,
  Pencil,
  Play,
  Square,
  Trash2
} from 'lucide-react'
import * as Menu from '@radix-ui/react-dropdown-menu'
import type { BrowserProfile } from '@shared/types'
import { useStore } from '../store'
import { cn, formatDate, formatProxy } from '../lib/utils'
import { useT } from '../i18n'

const AVATAR_COLORS = [
  'bg-rose-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-lime-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-sky-500',
  'bg-indigo-500',
  'bg-fuchsia-500',
  'bg-pink-500'
] as const

function avatarColor(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function initial(name: string): string {
  const cleaned = name.trim()
  return cleaned ? cleaned[0]!.toUpperCase() : '?'
}

function OsIcon({ os }: { os: string }): JSX.Element {
  if (os === 'macos') return <Apple className="h-3.5 w-3.5 text-base-mute" />
  if (os === 'linux') return <Laptop className="h-3.5 w-3.5 text-base-mute" />
  return <Monitor className="h-3.5 w-3.5 text-base-mute" />
}

export function ProfileTable({
  profiles,
  onEdit,
  onImportCookies,
  onExportCookies
}: {
  profiles: BrowserProfile[]
  onEdit: (p: BrowserProfile) => void
  onImportCookies: (p: BrowserProfile) => void
  onExportCookies: (p: BrowserProfile) => void
}): JSX.Element {
  const refreshProfiles = useStore((s) => s.refreshProfiles)
  const selected = useStore((s) => s.selectedProfileIds)
  const toggle = useStore((s) => s.toggleProfileSelection)
  const setSelection = useStore((s) => s.setProfileSelection)
  const t = useT()

  const allSelected = profiles.length > 0 && profiles.every((p) => selected.has(p.id))
  const someSelected = profiles.some((p) => selected.has(p.id))

  const launch = async (p: BrowserProfile): Promise<void> => {
    const r = await window.api.profilesLaunch(p.id)
    if (!r.ok) alert('Failed to launch: ' + (r.error ?? 'unknown'))
    await refreshProfiles()
  }
  const close = async (p: BrowserProfile): Promise<void> => {
    await window.api.profilesClose(p.id)
    await refreshProfiles()
  }
  const remove = async (p: BrowserProfile): Promise<void> => {
    if (!confirm(`Delete profile "${p.name}"? This will erase its data folder.`)) return
    await window.api.profilesDelete(p.id)
    await refreshProfiles()
  }
  const duplicate = async (p: BrowserProfile): Promise<void> => {
    await window.api.profilesDuplicate(p.id)
    await refreshProfiles()
  }

  const toggleAll = (): void => {
    if (allSelected) setSelection([])
    else setSelection(profiles.map((p) => p.id))
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-line bg-ink-50/60 dark:bg-ink-950/40">
          <tr className="text-left text-xs font-semibold uppercase tracking-wider text-base-mute">
            <th className="w-10 px-4 py-3">
              <Checkbox checked={allSelected} indeterminate={!allSelected && someSelected} onChange={toggleAll} />
            </th>
            <th className="w-12 px-2 py-3"></th>
            <th className="px-4 py-3">{t('profiles.col.profile')}</th>
            <th className="px-4 py-3">{t('profiles.col.environment')}</th>
            <th className="px-4 py-3">{t('profiles.col.proxy')}</th>
            <th className="px-4 py-3">{t('profiles.col.lastOpened')}</th>
            <th className="px-4 py-3">{t('profiles.col.status')}</th>
            <th className="px-4 py-3 text-right">{t('profiles.col.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {profiles.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-12 text-center text-ink-400 dark:text-ink-500">
                <Globe className="mx-auto mb-2 h-6 w-6 text-ink-300 dark:text-ink-600" />
                No profiles match the filter.
              </td>
            </tr>
          )}
          {profiles.map((p) => {
            const isSel = selected.has(p.id)
            return (
              <tr
                key={p.id}
                className={cn(
                  'border-b border-ink-100 last:border-b-0 hover:bg-ink-50/40 dark:border-ink-800 dark:hover:bg-ink-950/30',
                  isSel && 'bg-brand-50/40 dark:bg-brand-900/10'
                )}
              >
                <td className="px-4 py-3">
                  <Checkbox checked={isSel} onChange={() => toggle(p.id)} />
                </td>
                <td className="px-2 py-3">
                  <div
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white',
                      avatarColor(p.id)
                    )}
                  >
                    {initial(p.name)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onEdit(p)}
                    className="text-left font-medium text-base-strong hover:text-brand-600 dark:hover:text-brand-300"
                  >
                    {p.name}
                  </button>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-base-mute">
                    <span className="font-mono">{p.id.slice(0, 8)}</span>
                    {p.tags?.length ? (
                      <>
                        <span>·</span>
                        <span className="flex flex-wrap gap-1">
                          {p.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="pill bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </span>
                      </>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3 text-base-soft">
                  <div className="flex items-center gap-1.5">
                    <OsIcon os={p.fingerprint.os} />
                    <span className="capitalize">{p.fingerprint.os}</span>
                    <span className="text-ink-400 dark:text-ink-600">·</span>
                    <span>Chrome {p.fingerprint.browserVersion}</span>
                  </div>
                  <div className="text-[11px] text-base-mute">
                    {p.fingerprint.locale} · {p.fingerprint.timezone}
                  </div>
                </td>
                <td className="px-4 py-3 text-base-soft">{formatProxy(p.proxy)}</td>
                <td className="px-4 py-3 text-base-mute">{formatDate(p.lastOpenedAt)}</td>
                <td className="px-4 py-3">
                  <StatusPill status={p.status} error={p.lastError} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    {p.status === 'running' ? (
                      <button onClick={() => void close(p)} className="btn-secondary">
                        <Square className="h-3.5 w-3.5" />
                        {t('profiles.action.close')}
                      </button>
                    ) : (
                      <button onClick={() => void launch(p)} className="btn-primary">
                        <Play className="h-3.5 w-3.5" />
                        {t('profiles.action.open')}
                      </button>
                    )}
                    <Menu.Root>
                      <Menu.Trigger asChild>
                        <button className="btn-ghost px-1.5">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </Menu.Trigger>
                      <Menu.Portal>
                        <Menu.Content
                          align="end"
                          sideOffset={4}
                          className="z-50 min-w-[180px] rounded-md border border-line bg-white p-1 shadow-lg dark:bg-ink-900"
                        >
                          <Item icon={<Pencil className="h-3.5 w-3.5" />} onSelect={() => onEdit(p)}>
                            {t('profiles.action.edit')}
                          </Item>
                          <Item
                            icon={<Copy className="h-3.5 w-3.5" />}
                            onSelect={() => void duplicate(p)}
                          >
                            {t('profiles.action.duplicate')}
                          </Item>
                          <Item
                            icon={<FileUp className="h-3.5 w-3.5" />}
                            onSelect={() => onImportCookies(p)}
                          >
                            {t('profiles.action.importCookies')}
                          </Item>
                          <Item
                            icon={<FileDown className="h-3.5 w-3.5" />}
                            onSelect={() => onExportCookies(p)}
                          >
                            {t('profiles.action.exportCookies')}
                          </Item>
                          <Menu.Separator className="my-1 h-px bg-ink-100 dark:bg-ink-800" />
                          <Item
                            icon={<Trash2 className="h-3.5 w-3.5 text-rose-500" />}
                            onSelect={() => void remove(p)}
                            danger
                          >
                            {t('profiles.action.delete')}
                          </Item>
                        </Menu.Content>
                      </Menu.Portal>
                    </Menu.Root>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Item({
  children,
  onSelect,
  icon,
  danger
}: {
  children: React.ReactNode
  onSelect: () => void
  icon?: React.ReactNode
  danger?: boolean
}): JSX.Element {
  return (
    <Menu.Item
      onSelect={onSelect}
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm outline-none',
        danger
          ? 'text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-900/30'
          : 'text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800'
      )}
    >
      {icon}
      {children}
    </Menu.Item>
  )
}

function StatusPill({ status, error }: { status: string; error?: string | null }): JSX.Element {
  const t = useT()
  if (status === 'running')
    return (
      <span className="pill bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
        </span>
        {t('profiles.status.running')}
      </span>
    )
  if (status === 'error')
    return (
      <span
        className="pill bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
        title={error ?? undefined}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        {t('profiles.status.error')}
      </span>
    )
  return (
    <span className="pill bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
      <span className="h-1.5 w-1.5 rounded-full bg-ink-400 dark:bg-ink-500" />
      {t('profiles.status.idle')}
    </span>
  )
}

function Checkbox({
  checked,
  indeterminate,
  onChange
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: () => void
}): JSX.Element {
  return (
    <input
      type="checkbox"
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = !!indeterminate && !checked
      }}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
      className="h-4 w-4 cursor-pointer rounded border-ink-300 text-brand-600 focus:ring-brand-500 dark:border-ink-600 dark:bg-ink-800"
    />
  )
}
