import { Copy, FileDown, FileUp, MoreVertical, Pencil, Play, Square, Trash2 } from 'lucide-react'
import * as Menu from '@radix-ui/react-dropdown-menu'
import type { BrowserProfile } from '@shared/types'
import { useStore } from '../store'
import { cn, formatDate, formatProxy } from '../lib/utils'

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
    if (!r.ok) {
      alert('Failed to launch: ' + (r.error ?? 'unknown'))
    }
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
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <th className="px-4 py-2">#</th>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">OS / Browser</th>
            <th className="px-4 py-2">Proxy</th>
            <th className="px-4 py-2">Last opened</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {visible.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                No profiles match the filter.
              </td>
            </tr>
          )}
          {visible.map((p, idx) => (
            <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-2.5 text-slate-400">{idx + 1}</td>
              <td className="px-4 py-2.5">
                <div className="font-medium text-slate-800">{p.name}</div>
                {p.tags?.length ? (
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {p.tags.map((t) => (
                      <span key={t} className="pill bg-slate-100 text-slate-600">
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </td>
              <td className="px-4 py-2.5 text-slate-600">
                <span className="capitalize">{p.fingerprint.os}</span> / {p.fingerprint.browser}{' '}
                {p.fingerprint.browserVersion}
              </td>
              <td className="px-4 py-2.5 text-slate-600">{formatProxy(p.proxy as any)}</td>
              <td className="px-4 py-2.5 text-slate-500">{formatDate(p.lastOpenedAt)}</td>
              <td className="px-4 py-2.5">
                <StatusPill status={p.status} error={p.lastError} />
              </td>
              <td className="px-4 py-2.5 text-right">
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
                        className="z-50 min-w-[180px] rounded-md border border-slate-200 bg-white p-1 shadow-lg"
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
                        <Menu.Separator className="my-1 h-px bg-slate-100" />
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
        danger ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-700 hover:bg-slate-100'
      )}
    >
      {icon}
      {children}
    </Menu.Item>
  )
}

function StatusPill({ status, error }: { status: string; error?: string | null }): JSX.Element {
  if (status === 'running')
    return <span className="pill bg-emerald-50 text-emerald-700">● Running</span>
  if (status === 'error')
    return (
      <span className="pill bg-rose-50 text-rose-700" title={error ?? undefined}>
        ● Error
      </span>
    )
  return <span className="pill bg-slate-100 text-slate-500">○ Idle</span>
}
