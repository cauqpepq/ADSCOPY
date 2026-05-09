import { Plus, Puzzle, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import { EmptyState } from '../components/EmptyState'

export function ExtensionsPage(): JSX.Element {
  const extensions = useStore((s) => s.extensions)
  const refresh = useStore((s) => s.refreshExtensions)

  const add = async (): Promise<void> => {
    const dir = await window.api.systemSelectDir()
    if (!dir) return
    try {
      await window.api.extensionsAdd(dir)
      await refresh()
    } catch (e: any) {
      alert(e?.message ?? String(e))
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
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-ink-500">{extensions.length} extensions</div>
        <button className="btn-primary" onClick={() => void add()}>
          <Plus className="h-4 w-4" />
          Add unpacked extension
        </button>
      </div>

      {extensions.length === 0 ? (
        <EmptyState
          icon={Puzzle}
          title="No extensions added"
          description="Add unpacked Chromium extensions (folders with manifest.json). They'll be available when launching profiles."
          action={
            <button className="btn-primary" onClick={() => void add()}>
              <Plus className="h-4 w-4" />
              Add extension
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-200 bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Version</th>
                <th className="px-4 py-2">Path</th>
                <th className="px-4 py-2">Enabled</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {extensions.map((e) => (
                <tr key={e.id} className="border-b border-ink-100 hover:bg-ink-50">
                  <td className="px-4 py-2 font-medium text-ink-800">{e.name}</td>
                  <td className="px-4 py-2 text-ink-600">{e.version}</td>
                  <td className="px-4 py-2 truncate font-mono text-xs text-ink-500">{e.path}</td>
                  <td className="px-4 py-2">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={e.enabled}
                        onChange={(ev) => void toggle(e.id, ev.target.checked)}
                      />
                      <span className="text-xs">{e.enabled ? 'Enabled' : 'Disabled'}</span>
                    </label>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button className="btn-danger" onClick={() => void remove(e.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
