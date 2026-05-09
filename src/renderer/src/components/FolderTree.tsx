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
    <div className="w-56 shrink-0 border-r border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Folders</span>
        <button
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          onClick={() => setCreating((v) => !v)}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {creating && (
        <div className="flex gap-1 border-b border-slate-200 p-2">
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

      <div className="overflow-auto py-1">
        <FolderRow
          icon={<Folder className="h-4 w-4 text-slate-400" />}
          label="All profiles"
          count={profiles.length}
          active={selected === null}
          onClick={() => setSelected(null)}
        />
        <FolderRow
          icon={<Folder className="h-4 w-4 text-slate-400" />}
          label="No folder"
          count={profileCount(null)}
          active={false}
          onClick={() => setSelected(null)}
          subtle
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
        'group flex cursor-pointer items-center justify-between px-3 py-1.5 text-sm transition',
        active ? 'bg-brand-50 text-brand-700 font-medium' : 'text-slate-700 hover:bg-slate-50',
        subtle && 'text-slate-400'
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[11px] text-slate-400">{count}</span>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="hidden rounded p-0.5 text-slate-300 hover:bg-rose-50 hover:text-rose-500 group-hover:block"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  )
}
