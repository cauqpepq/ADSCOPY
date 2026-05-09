import { Folder, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import { cn } from '../lib/utils'
import { useState } from 'react'

export function FolderTree(): JSX.Element {
  const folders = useStore((s) => s.folders)
  const selected = useStore((s) => s.selectedFolderId)
  const setSelected = useStore((s) => s.setSelectedFolderId)
  const refreshFolders = useStore((s) => s.refreshFolders)
  const profiles = useStore((s) => s.profiles)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')

  const profileCount = (folderId: string | null): number =>
    profiles.filter((p) => (folderId === null ? !p.folderId : p.folderId === folderId)).length

  const create = async (): Promise<void> => {
    if (!name.trim()) return
    await window.api.foldersCreate({ name: name.trim(), color: '#1a88dc', parentId: null })
    setName('')
    setCreating(false)
    await refreshFolders()
  }

  const remove = async (id: string): Promise<void> => {
    await window.api.foldersDelete(id)
    if (selected === id) setSelected(null)
    await refreshFolders()
  }

  return (
    <div className="flex w-56 shrink-0 flex-col border-r border-ink-200 bg-white">
      <div className="flex items-center justify-between border-b border-ink-200 px-3 py-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Folders</span>
        <button
          className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
          onClick={() => setCreating((v) => !v)}
          title="New folder"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {creating && (
        <div className="flex gap-1 border-b border-ink-200 p-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Folder name"
            className="input text-xs"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') void create()
              if (e.key === 'Escape') setCreating(false)
            }}
          />
        </div>
      )}

      <div className="flex-1 overflow-auto py-1">
        <FolderRow
          icon={<Folder className="h-4 w-4 text-brand-500" />}
          label="All profiles"
          count={profiles.length}
          active={selected === null}
          onClick={() => setSelected(null)}
        />
        {folders.map((f) => (
          <FolderRow
            key={f.id}
            icon={<Folder className="h-4 w-4" style={{ color: f.color }} />}
            label={f.name}
            count={profileCount(f.id)}
            active={selected === f.id}
            onClick={() => setSelected(f.id)}
            onDelete={() => void remove(f.id)}
          />
        ))}
      </div>
    </div>
  )
}

function FolderRow({
  icon,
  label,
  count,
  active,
  onClick,
  onDelete,
  subtle
}: {
  icon: React.ReactNode
  label: string
  count: number
  active: boolean
  onClick: () => void
  onDelete?: () => void
  subtle?: boolean
}): JSX.Element {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group mx-1.5 flex cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition',
        active
          ? 'bg-brand-50 text-brand-700 font-medium'
          : 'text-ink-700 hover:bg-ink-50 hover:text-ink-900',
        subtle && 'text-ink-400'
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        <span
          className={cn(
            'text-[11px]',
            active ? 'text-brand-600' : 'text-ink-400'
          )}
        >
          {count}
        </span>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="hidden rounded p-0.5 text-ink-300 hover:bg-rose-50 hover:text-rose-500 group-hover:block"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  )
}
