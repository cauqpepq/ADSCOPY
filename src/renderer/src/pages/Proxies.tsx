import { useState } from 'react'
import { CheckCircle2, Loader2, Network, Plus, TestTube2, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import { Modal } from '../components/Modal'
import { EmptyState } from '../components/EmptyState'
import type { ProxyConfig } from '@shared/types'

export function ProxiesPage(): JSX.Element {
  const proxies = useStore((s) => s.proxies)
  const refresh = useStore((s) => s.refreshProxies)
  const [open, setOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [editing, setEditing] = useState<ProxyConfig | null>(null)
  const [draft, setDraft] = useState<ProxyConfig>({ type: 'http' })
  const [testing, setTesting] = useState<Record<string, boolean>>({})
  const [results, setResults] = useState<Record<string, { ok: boolean; ip?: string; latencyMs?: number; error?: string }>>(
    {}
  )

  const startCreate = (): void => {
    setEditing(null)
    setDraft({ type: 'http' })
    setOpen(true)
  }
  const startEdit = (p: ProxyConfig): void => {
    setEditing(p)
    setDraft(p)
    setOpen(true)
  }
  const save = async (): Promise<void> => {
    if (editing?.id) {
      await window.api.proxiesUpdate(editing.id, draft)
    } else {
      await window.api.proxiesCreate(draft)
    }
    setOpen(false)
    await refresh()
  }
  const remove = async (id: string): Promise<void> => {
    if (!confirm('Delete this proxy?')) return
    await window.api.proxiesDelete(id)
    await refresh()
  }
  const test = async (p: ProxyConfig): Promise<void> => {
    if (!p.id) return
    setTesting((t) => ({ ...t, [p.id!]: true }))
    const r = await window.api.proxiesTest(p)
    setResults((rs) => ({ ...rs, [p.id!]: r }))
    setTesting((t) => ({ ...t, [p.id!]: false }))
  }
  const importBulk = async (): Promise<void> => {
    const created = await window.api.proxiesImportBulk(bulkText)
    alert(`Imported ${created.length} proxies.`)
    setBulkOpen(false)
    setBulkText('')
    await refresh()
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-ink-500">{proxies.length} proxies</div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setBulkOpen(true)}>
            Bulk import
          </button>
          <button className="btn-primary" onClick={startCreate}>
            <Plus className="h-4 w-4" />
            Add proxy
          </button>
        </div>
      </div>

      {proxies.length === 0 ? (
        <EmptyState
          icon={Network}
          title="No proxies yet"
          description="Add HTTP/HTTPS or SOCKS proxies to assign to your browser profiles."
          action={
            <button className="btn-primary" onClick={startCreate}>
              <Plus className="h-4 w-4" />
              Add proxy
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-200 bg-ink-50">
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-ink-500">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Endpoint</th>
                <th className="px-4 py-2">Auth</th>
                <th className="px-4 py-2">Test result</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {proxies.map((p) => {
                const r = results[p.id!]
                return (
                  <tr key={p.id} className="border-b border-ink-100 hover:bg-ink-50">
                    <td className="px-4 py-2 font-medium text-ink-800">
                      {p.name ?? <span className="text-ink-400">(no name)</span>}
                    </td>
                    <td className="px-4 py-2 uppercase">{p.type}</td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {p.host}:{p.port}
                    </td>
                    <td className="px-4 py-2 text-ink-500">{p.username || '—'}</td>
                    <td className="px-4 py-2 text-xs">
                      {testing[p.id!] ? (
                        <span className="inline-flex items-center gap-1 text-ink-500">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Testing…
                        </span>
                      ) : r ? (
                        r.ok ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            {r.ip} ({r.latencyMs}ms)
                          </span>
                        ) : (
                          <span className="text-rose-600">{r.error}</span>
                        )
                      ) : (
                        <span className="text-ink-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button className="btn-secondary" onClick={() => void test(p)}>
                          <TestTube2 className="h-3.5 w-3.5" />
                          Test
                        </button>
                        <button className="btn-ghost" onClick={() => startEdit(p)}>
                          Edit
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => p.id && void remove(p.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={open}
        onOpenChange={setOpen}
        title={editing ? 'Edit proxy' : 'New proxy'}
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={() => void save()}>
              Save
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <div className="label">Name</div>
            <input
              className="input"
              value={draft.name ?? ''}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </div>
          <div>
            <div className="label">Type</div>
            <select
              className="input"
              value={draft.type}
              onChange={(e) => setDraft({ ...draft, type: e.target.value as any })}
            >
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
              <option value="socks4">SOCKS4</option>
              <option value="socks5">SOCKS5</option>
            </select>
          </div>
          <div>
            <div className="label">Host : Port</div>
            <div className="flex gap-1">
              <input
                className="input"
                value={draft.host ?? ''}
                onChange={(e) => setDraft({ ...draft, host: e.target.value })}
                placeholder="proxy.example.com"
              />
              <input
                className="input w-24"
                type="number"
                value={draft.port ?? ''}
                onChange={(e) =>
                  setDraft({ ...draft, port: Number(e.target.value) || undefined })
                }
                placeholder="8080"
              />
            </div>
          </div>
          <div>
            <div className="label">Username</div>
            <input
              className="input"
              value={draft.username ?? ''}
              onChange={(e) => setDraft({ ...draft, username: e.target.value })}
            />
          </div>
          <div>
            <div className="label">Password</div>
            <input
              className="input"
              type="password"
              value={draft.password ?? ''}
              onChange={(e) => setDraft({ ...draft, password: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        title="Bulk import proxies"
        description="One per line. Supports formats: scheme://user:pass@host:port  or  host:port:user:pass"
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setBulkOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={() => void importBulk()}>
              Import
            </button>
          </>
        }
      >
        <textarea
          className="input min-h-[260px] font-mono text-xs"
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder={'http://user:pass@1.2.3.4:8080\nsocks5://1.2.3.4:1080\n5.6.7.8:3128:user:pass'}
        />
      </Modal>
    </div>
  )
}
