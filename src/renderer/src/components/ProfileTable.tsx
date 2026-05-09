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
  if (os === 'macos') return <Apple className="h-3.5 w-3.5 text-ink-500" />
  if (os === 'linux') return <Laptop className="h-3.5 w-3.5 text-ink-500" />
  return <Monitor className="h-3.5 w-3.5 text-ink-500" />
}

export function ProfileTable({
  onEdit,
  onImportCookies,
  onExportCookies
}: {
  onEdit: (p: BrowserProfile) => void
  onImportCookies: (p: BrowserProfile) => void
  onExportCookies: (p: BrowserProfile) => void
}): JSX.Element {
  const profiles = useStore((s) => s.profiles)
  const selectedFolderId = useStore((s) => s.selectedFolderId)
  const search = useStore((s) => s.search)
  const refreshProfiles = useStore((s) => s.refreshProfiles)

  const visible = profiles
    .filter((p) => !selectedFolderId || p.folderId === selectedFolderId)
    .filter((p) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        p.name.toLowerCase().includes(q) ||
        (p.tags ?? []).some((t) => t.toLowerCase().includes(q)) ||
        (p.notes ?? '').toLowerCase().includes(q)
      )
    })

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

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-ink-200 bg-ink-50/60">
          <tr className="text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
            <th className="w-10 px-4 py-3"></th>
            <th className="px-4 py-3">Profile</th>
            <th className="px-4 py-3">Environment</th>
            <th className="px-4 py-3">Proxy</th>
            <th className="px-4 py-3">Last opened</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {visible.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center text-ink-400">
                <Globe className="mx-auto mb-2 h-6 w-6 text-ink-300" />
                No profiles match the filter.
              </td>
            </tr>
          )}
          {visible.map((p) => (
            <tr key={p.id} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/40">
              <td className="px-4 py-3">
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
                <div className="font-medium text-ink-800">{p.name}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-ink-500">
                  <span className="font-mono">{p.id.slice(0, 8)}</span>
                  {p.tags?.length ? (
                    <>
                      <span>·</span>
                      <span className="flex flex-wrap gap-1">
                        {p.tags.slice(0, 3).map((t) => (
                          <span key={t} className="pill bg-ink-100 text-ink-600">
                            {t}
                          </span>
                        ))}
                      </span>
                    </>
                  ) : null}
                </div>
              </td>
              <td className="px-4 py-3 text-ink-700">
                <div className="flex items-center gap-1.5">
                  <OsIcon os={p.fingerprint.os} />
                  <span className="capitalize">{p.fingerprint.os}</span>
                  <span className="text-ink-400">·</span>
                  <span>Chrome {p.fingerprint.browserVersion}</span>
                </div>
                <div className="text-[11px] text-ink-500">
                  {p.fingerprint.locale} · {p.fingerprint.timezone}
                </div>
              </td>
              <td className="px-4 py-3 text-ink-700">{formatProxy(p.proxy as any)}</td>
              <td className="px-4 py-3 text-ink-500">{formatDate(p.lastOpenedAt)}</td>
              <td className="px-4 py-3">
                <StatusPill status={p.status} error={p.lastError} />
              </td>
              <td className="px-4 py-3 text-right">
                <div className="inline-flex items-center gap-1">
                  {p.status === 'running' ? (
                    <button onClick={() => void close(p)} className="btn-secondary">
                      <Square className="h-3.5 w-3.5" />
                      Close
                    </button>
                  ) : (
                    <button onClick={() => void launch(p)} className="btn-primary">
                      <Play className="h-3.5 w-3.5" />
                      Open
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
                        className="z-50 min-w-[180px] rounded-md border border-ink-200 bg-white p-1 shadow-lg"
                      >
                        <Item icon={<Pencil className="h-3.5 w-3.5" />} onSelect={() => onEdit(p)}>
                          Edit
                        </Item>
                        <Item
                          icon={<Copy className="h-3.5 w-3.5" />}
                          onSelect={() => void duplicate(p)}
                        >
                          Duplicate
                        </Item>
                        <Item
                          icon={<FileUp className="h-3.5 w-3.5" />}
                          onSelect={() => onImportCookies(p)}
                        >
                          Import cookies
                        </Item>
                        <Item
                          icon={<FileDown className="h-3.5 w-3.5" />}
                          onSelect={() => onExportCookies(p)}
                        >
                          Export cookies
                        </Item>
                        <Menu.Separator className="my-1 h-px bg-ink-100" />
                        <Item
                          icon={<Trash2 className="h-3.5 w-3.5 text-rose-500" />}
                          onSelect={() => void remove(p)}
                          danger
                        >
                          Delete
                        </Item>
                      </Menu.Content>
                    </Menu.Portal>
                  </Menu.Root>
                </div>
              </td>
            </tr>
          ))}
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
        danger ? 'text-rose-600 hover:bg-rose-50' : 'text-ink-700 hover:bg-ink-100'
      )}
    >
      {icon}
      {children}
    </Menu.Item>
  )
}

function StatusPill({ status, error }: { status: string; error?: string | null }): JSX.Element {
  if (status === 'running')
    return (
      <span className="pill bg-emerald-50 text-emerald-700">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
        </span>
        Running
      </span>
    )
  if (status === 'error')
    return (
      <span className="pill bg-rose-50 text-rose-700" title={error ?? undefined}>
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        Error
      </span>
    )
  return (
    <span className="pill bg-ink-100 text-ink-600">
      <span className="h-1.5 w-1.5 rounded-full bg-ink-400" />
      Idle
    </span>
  )
}
