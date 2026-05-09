import { useState } from 'react'
import { FolderTree, Pencil, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import { useT } from '../i18n'

const COLORS = [
  '#4263eb',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#a855f7',
  '#ec4899',
  '#64748b'
]

export function GroupsPage(): JSX.Element {
  const folders = useStore((s) => s.folders)
  const profiles = useStore((s) => s.profiles)
  const refreshFolders = useStore((s) => s.refreshFolders)
  const t = useT()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<{ id?: string; name: string; color: string } | null>(null)

  const startCreate = (): void => {
    setEditing({ name: '', color: COLORS[0] })
    setOpen(true)
  }

  const save = async (): Promise<void> => {
    if (!editing) return
    const name = editing.name.trim()
    if (!name) return
    if (editing.id) {
      await window.api.foldersUpdate(editing.id, { name, color: editing.color })
    } else {
      await window.api.foldersCreate({ name, color: editing.color, parentId: null })
    }
    setOpen(false)
    setEditing(null)
    await refreshFolders()
  }

  const remove = async (id: string): Promise<void> => {
    if (!confirm('Delete this group? Profiles inside will become ungrouped.')) return
    await window.api.foldersDelete(id)
    await refreshFolders()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line surface px-6 py-3">
        <div className="text-xs text-base-mute">
          {folders.length} group{folders.length === 1 ? '' : 's'}
        </div>
        <button className="btn-primary" onClick={startCreate}>
          <Plus className="h-4 w-4" />
          {t('groups.new')}
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {folders.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            title={t('groups.empty.title')}
            description={t('groups.empty.desc')}
            action={
              <button className="btn-primary" onClick={startCreate}>
                <Plus className="h-4 w-4" />
                {t('groups.new')}
              </button>
            }
          />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-ink-50/60 dark:bg-ink-950/40">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-base-mute">
                  <th className="px-4 py-3">{t('groups.col.name')}</th>
                  <th className="px-4 py-3">{t('groups.col.color')}</th>
                  <th className="px-4 py-3">{t('groups.col.profiles')}</th>
                  <th className="px-4 py-3 text-right">{t('groups.col.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {folders.map((f) => {
                  const count = profiles.filter((p) => p.folderId === f.id).length
                  return (
                    <tr
                      key={f.id}
                      className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/40 dark:border-ink-800 dark:hover:bg-ink-950/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-sm"
                            style={{ backgroundColor: f.color }}
                          />
                          <span className="font-medium text-base-strong">{f.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-base-mute">{f.color}</td>
                      <td className="px-4 py-3 text-base-soft">{count}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          className="btn-ghost"
                          onClick={() => {
                            setEditing({ id: f.id, name: f.name, color: f.color })
                            setOpen(true)
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button className="btn-danger ml-1" onClick={() => void remove(f.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) setEditing(null)
        }}
        title={editing?.id ? t('common.edit') : t('groups.new')}
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </button>
            <button className="btn-primary" onClick={() => void save()}>
              {t('common.save')}
            </button>
          </>
        }
      >
        {editing && (
          <div className="space-y-3">
            <div>
              <div className="label">{t('groups.col.name')}</div>
              <input
                className="input"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                autoFocus
              />
            </div>
            <div>
              <div className="label">{t('groups.col.color')}</div>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setEditing({ ...editing, color: c })}
                    className={
                      'h-7 w-7 rounded-md border-2 ' +
                      (editing.color === c
                        ? 'border-base-strong'
                        : 'border-transparent')
                    }
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
