import { Plus, Puzzle, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import { EmptyState } from '../components/EmptyState'
import { useT } from '../i18n'

export function ApplicationCenterPage(): JSX.Element {
  const extensions = useStore((s) => s.extensions)
  const refresh = useStore((s) => s.refreshExtensions)
  const t = useT()

  const add = async (): Promise<void> => {
    const dir = await window.api.systemSelectDir()
    if (!dir) return
    try {
      await window.api.extensionsAdd(dir)
      await refresh()
    } catch (e) {
      alert((e as Error).message)
    }
  }
  const remove = async (id: string): Promise<void> => {
    if (!confirm('Remove this extension and delete its files?')) return
    await window.api.extensionsRemove(id)
    await refresh()
  }
  const toggle = async (id: string, enabled: boolean): Promise<void> => {
    await window.api.extensionsToggle(id, enabled)
    await refresh()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line surface px-6 py-3">
        <div className="text-xs text-base-mute">{extensions.length} extensions</div>
        <button className="btn-primary" onClick={() => void add()}>
          <Plus className="h-4 w-4" />
          {t('apps.add')}
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {extensions.length === 0 ? (
          <EmptyState
            icon={Puzzle}
            title={t('apps.empty.title')}
            description={t('apps.empty.desc')}
            action={
              <button className="btn-primary" onClick={() => void add()}>
                <Plus className="h-4 w-4" />
                {t('apps.add')}
              </button>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {extensions.map((e) => (
              <div key={e.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                    <Puzzle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-base-strong">{e.name}</div>
                    <div className="truncate text-xs text-base-mute">v{e.version}</div>
                    <div className="mt-1 truncate font-mono text-[10px] text-base-mute">
                      {e.path}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-xs text-base-soft">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 cursor-pointer rounded border-ink-300 text-brand-600 dark:border-ink-600 dark:bg-ink-800"
                      checked={e.enabled}
                      onChange={(ev) => void toggle(e.id, ev.target.checked)}
                    />
                    {e.enabled ? 'Enabled' : 'Disabled'}
                  </label>
                  <button
                    className="rounded p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30"
                    onClick={() => void remove(e.id)}
                    title={t('common.delete')}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
