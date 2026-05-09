import { useEffect, useState } from 'react'
import { Bot, Play, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import { formatDate } from '../lib/utils'
import type { AutomationScenario } from '@shared/types'

const SAMPLE_STEPS = [
  { type: 'goto', url: 'https://browserleaks.com/javascript' },
  { type: 'wait', ms: 3000 },
  { type: 'screenshot' }
]

export function AutomationPage(): JSX.Element {
  const scenarios = useStore((s) => s.scenarios)
  const profiles = useStore((s) => s.profiles)
  const runs = useStore((s) => s.runs)
  const refreshScenarios = useStore((s) => s.refreshScenarios)
  const refreshRuns = useStore((s) => s.refreshRuns)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AutomationScenario | null>(null)
  const [name, setName] = useState('')
  const [stepsText, setStepsText] = useState('')
  const [runOpen, setRunOpen] = useState<AutomationScenario | null>(null)
  const [runProfileId, setRunProfileId] = useState('')

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? '')
      setStepsText(JSON.stringify(editing?.steps ?? SAMPLE_STEPS, null, 2))
    }
  }, [open, editing])

  const startCreate = (): void => {
    setEditing(null)
    setOpen(true)
  }

  const save = async (): Promise<void> => {
    let steps
    try {
      steps = JSON.parse(stepsText)
    } catch (e: any) {
      alert('Invalid JSON: ' + e.message)
      return
    }
    if (editing) {
      await window.api.scenariosUpdate(editing.id, { name, steps })
    } else {
      await window.api.scenariosCreate({ name, steps })
    }
    setOpen(false)
    await refreshScenarios()
  }

  const remove = async (id: string): Promise<void> => {
    if (!confirm('Delete this scenario?')) return
    await window.api.scenariosDelete(id)
    await refreshScenarios()
  }

  const run = async (): Promise<void> => {
    if (!runOpen || !runProfileId) return
    const r = await window.api.scenariosRun(runOpen.id, runProfileId)
    if (r.status === 'failed') alert('Run failed: ' + (r.error ?? 'unknown'))
    setRunOpen(null)
    await refreshRuns()
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-slate-500">{scenarios.length} scenarios</div>
        <button className="btn-primary" onClick={startCreate}>
          <Plus className="h-4 w-4" />
          New scenario
        </button>
      </div>

      {scenarios.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="No automation scenarios yet"
          description="Define a JSON list of steps (goto, click, type, etc.) and run it against any profile."
          action={
            <button className="btn-primary" onClick={startCreate}>
              <Plus className="h-4 w-4" />
              Create scenario
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <section className="card">
            <header className="border-b border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Scenarios
            </header>
            <ul>
              {scenarios.map((sc) => (
                <li key={sc.id} className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
                  <div>
                    <div className="font-medium text-slate-800">{sc.name}</div>
                    <div className="text-xs text-slate-500">
                      {sc.steps.length} step{sc.steps.length === 1 ? '' : 's'} · updated {formatDate(sc.updatedAt)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      className="btn-primary"
                      onClick={() => {
                        setRunOpen(sc)
                        setRunProfileId(profiles[0]?.id ?? '')
                      }}
                    >
                      <Play className="h-3.5 w-3.5" />
                      Run
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={() => {
                        setEditing(sc)
                        setOpen(true)
                      }}
                    >
                      Edit
                    </button>
                    <button className="btn-danger" onClick={() => void remove(sc.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <header className="border-b border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Recent runs
            </header>
            <ul className="max-h-[600px] overflow-auto">
              {runs.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-slate-400">No runs yet.</li>
              )}
              {runs.map((r) => {
                const sc = scenarios.find((s) => s.id === r.scenarioId)
                const p = profiles.find((p) => p.id === r.profileId)
                return (
                  <li key={r.id} className="border-b border-slate-100 px-4 py-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-800">
                          {sc?.name ?? r.scenarioId} → {p?.name ?? r.profileId}
                        </div>
                        <div className="text-xs text-slate-500">{formatDate(r.startedAt)}</div>
                      </div>
                      <RunStatus status={r.status} />
                    </div>
                    {r.log.length > 0 && (
                      <pre className="mt-2 max-h-32 overflow-auto rounded bg-slate-50 p-2 text-[11px] text-slate-600">
                        {r.log.join('\n')}
                      </pre>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      )}

      <Modal
        open={open}
        onOpenChange={setOpen}
        title={editing ? 'Edit scenario' : 'New scenario'}
        size="lg"
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
        <div className="space-y-3">
          <div>
            <div className="label">Name</div>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <div className="label">Steps (JSON array)</div>
            <textarea
              className="input min-h-[300px] font-mono text-xs"
              value={stepsText}
              onChange={(e) => setStepsText(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500">
              Supported step types: <code>goto</code>, <code>wait</code>, <code>waitForSelector</code>,{' '}
              <code>click</code>, <code>type</code>, <code>press</code>, <code>evaluate</code>,{' '}
              <code>screenshot</code>, <code>scroll</code>.
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!runOpen}
        onOpenChange={(v) => !v && setRunOpen(null)}
        title={`Run "${runOpen?.name ?? ''}"`}
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setRunOpen(null)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={() => void run()} disabled={!runProfileId}>
              <Play className="h-4 w-4" />
              Run
            </button>
          </>
        }
      >
        <div>
          <div className="label">Profile</div>
          <select
            className="input"
            value={runProfileId}
            onChange={(e) => setRunProfileId(e.target.value)}
          >
            <option value="">— Select —</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </Modal>
    </div>
  )
}

function RunStatus({ status }: { status: string }): JSX.Element {
  if (status === 'success') return <span className="pill bg-emerald-50 text-emerald-700">success</span>
  if (status === 'failed') return <span className="pill bg-rose-50 text-rose-700">failed</span>
  if (status === 'running') return <span className="pill bg-brand-50 text-brand-700">running</span>
  return <span className="pill bg-slate-100 text-slate-500">{status}</span>
}
