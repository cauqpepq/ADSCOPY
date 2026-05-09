import { useEffect, useMemo, useState } from 'react'
import {
  Bot,
  Camera,
  ChevronDown,
  ChevronUp,
  Code2,
  GripVertical,
  ListChecks,
  MousePointerClick,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  Type,
  Activity,
  Globe2
} from 'lucide-react'
import { useStore } from '../store'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import { formatDate, cn } from '../lib/utils'
import { useT } from '../i18n'
import type { AutomationScenario } from '@shared/types'

type StepType =
  | 'goto'
  | 'wait'
  | 'waitForSelector'
  | 'click'
  | 'type'
  | 'press'
  | 'evaluate'
  | 'screenshot'
  | 'scroll'

type Step = { type: StepType } & Record<string, unknown>

const STEP_PALETTE: { type: StepType; icon: typeof Globe2; defaults: Step }[] = [
  { type: 'goto', icon: Globe2, defaults: { type: 'goto', url: 'https://example.com' } },
  { type: 'wait', icon: Activity, defaults: { type: 'wait', ms: 1000 } },
  {
    type: 'waitForSelector',
    icon: ListChecks,
    defaults: { type: 'waitForSelector', selector: 'body', timeout: 10000 }
  },
  { type: 'click', icon: MousePointerClick, defaults: { type: 'click', selector: 'button' } },
  { type: 'type', icon: Type, defaults: { type: 'type', selector: 'input', text: '' } },
  { type: 'press', icon: Type, defaults: { type: 'press', key: 'Enter' } },
  { type: 'scroll', icon: Activity, defaults: { type: 'scroll', x: 0, y: 800 } },
  { type: 'screenshot', icon: Camera, defaults: { type: 'screenshot' } },
  { type: 'evaluate', icon: Code2, defaults: { type: 'evaluate', script: 'document.title' } }
]

const STEP_ICONS: Record<StepType, typeof Globe2> = STEP_PALETTE.reduce(
  (acc, p) => ({ ...acc, [p.type]: p.icon }),
  {} as Record<StepType, typeof Globe2>
)

export function RpaPage(): JSX.Element {
  const scenarios = useStore((s) => s.scenarios)
  const profiles = useStore((s) => s.profiles)
  const runs = useStore((s) => s.runs)
  const refreshScenarios = useStore((s) => s.refreshScenarios)
  const refreshRuns = useStore((s) => s.refreshRuns)
  const t = useT()

  const [tab, setTab] = useState<'scenarios' | 'runs'>('scenarios')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AutomationScenario | null>(null)
  const [name, setName] = useState('')
  const [steps, setSteps] = useState<Step[]>([])
  const [editorMode, setEditorMode] = useState<'visual' | 'json'>('visual')
  const [stepsJson, setStepsJson] = useState('')
  const [runOpen, setRunOpen] = useState<AutomationScenario | null>(null)
  const [runProfileId, setRunProfileId] = useState('')

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? '')
      const initial = (editing?.steps as Step[]) ?? [
        { type: 'goto', url: 'https://browserleaks.com/javascript' },
        { type: 'wait', ms: 3000 },
        { type: 'screenshot' }
      ]
      setSteps(initial)
      setStepsJson(JSON.stringify(initial, null, 2))
      setEditorMode('visual')
    }
  }, [open, editing])

  const startCreate = (): void => {
    setEditing(null)
    setOpen(true)
  }

  const save = async (): Promise<void> => {
    let finalSteps: Step[] = steps
    if (editorMode === 'json') {
      try {
        finalSteps = JSON.parse(stepsJson) as Step[]
      } catch (e) {
        alert('Invalid JSON: ' + (e as Error).message)
        return
      }
    }
    if (editing) {
      await window.api.scenariosUpdate(editing.id, { name: name.trim() || 'Scenario', steps: finalSteps })
    } else {
      await window.api.scenariosCreate({ name: name.trim() || 'Scenario', steps: finalSteps })
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

  const addStep = (s: Step): void => setSteps((prev) => [...prev, structuredClone(s)])
  const removeStep = (i: number): void => setSteps((prev) => prev.filter((_, idx) => idx !== i))
  const moveStep = (i: number, dir: -1 | 1): void => {
    setSteps((prev) => {
      const next = prev.slice()
      const j = i + dir
      if (j < 0 || j >= next.length) return prev
      const tmp = next[i]
      next[i] = next[j]
      next[j] = tmp
      return next
    })
  }
  const updateStep = (i: number, patch: Partial<Step>): void => {
    setSteps((prev) => prev.map((s, idx) => (idx === i ? ({ ...s, ...patch } as Step) : s)))
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line surface px-6 py-3">
        <div className="flex items-center gap-1 rounded-md border border-line surface-2 p-0.5">
          <TabBtn active={tab === 'scenarios'} onClick={() => setTab('scenarios')}>
            {t('rpa.tab.scenarios')}
          </TabBtn>
          <TabBtn active={tab === 'runs'} onClick={() => setTab('runs')}>
            {t('rpa.tab.runs')} <span className="ml-1 text-base-mute">({runs.length})</span>
          </TabBtn>
        </div>
        <div className="flex items-center gap-2">
          <button className="icon-btn" title={t('common.refresh')} onClick={() => void refreshRuns()}>
            <RefreshCw className="h-4 w-4" />
          </button>
          <button className="btn-primary" onClick={startCreate}>
            <Plus className="h-4 w-4" />
            {t('rpa.new')}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {tab === 'scenarios' &&
          (scenarios.length === 0 ? (
            <EmptyState
              icon={Bot}
              title={t('rpa.empty.title')}
              description={t('rpa.empty.desc')}
              action={
                <button className="btn-primary" onClick={startCreate}>
                  <Plus className="h-4 w-4" />
                  {t('rpa.new')}
                </button>
              }
            />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {scenarios.map((sc) => (
                <div key={sc.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-base-strong">{sc.name}</div>
                      <div className="text-xs text-base-mute">
                        {sc.steps.length} step{sc.steps.length === 1 ? '' : 's'} · updated{' '}
                        {formatDate(sc.updatedAt)}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        className="btn-primary"
                        onClick={() => {
                          setRunOpen(sc)
                          setRunProfileId(profiles[0]?.id ?? '')
                        }}
                      >
                        <Play className="h-3.5 w-3.5" />
                        {t('rpa.run')}
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
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {(sc.steps as Step[]).slice(0, 8).map((s, i) => {
                      const Icon = STEP_ICONS[s.type as StepType] ?? Activity
                      return (
                        <span
                          key={i}
                          className="pill bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300"
                        >
                          <Icon className="h-3 w-3" />
                          {s.type}
                        </span>
                      )
                    })}
                    {sc.steps.length > 8 && (
                      <span className="pill bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                        +{sc.steps.length - 8}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}

        {tab === 'runs' && (
          <div className="card overflow-hidden">
            {runs.length === 0 ? (
              <div className="p-8 text-center text-sm text-base-mute">No runs yet.</div>
            ) : (
              <ul>
                {runs.map((r) => {
                  const sc = scenarios.find((s) => s.id === r.scenarioId)
                  const p = profiles.find((p) => p.id === r.profileId)
                  return (
                    <li
                      key={r.id}
                      className="border-b border-line px-4 py-3 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="truncate font-medium text-base-strong">
                            {sc?.name ?? r.scenarioId} → {p?.name ?? r.profileId}
                          </div>
                          <div className="text-xs text-base-mute">{formatDate(r.startedAt)}</div>
                        </div>
                        <RunStatus status={r.status} />
                      </div>
                      {r.log.length > 0 && (
                        <pre className="mt-2 max-h-32 overflow-auto rounded bg-ink-50 p-2 text-[11px] text-ink-600 dark:bg-ink-950 dark:text-ink-400">
                          {r.log.join('\n')}
                        </pre>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title={editing ? 'Edit scenario' : t('rpa.new')}
        size="xl"
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
        <div className="space-y-3">
          <div>
            <div className="label">Name</div>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex items-center gap-1 rounded-md border border-line surface-2 p-0.5">
            <TabBtn active={editorMode === 'visual'} onClick={() => setEditorMode('visual')}>
              Visual builder
            </TabBtn>
            <TabBtn active={editorMode === 'json'} onClick={() => setEditorMode('json')}>
              JSON
            </TabBtn>
          </div>

          {editorMode === 'visual' ? (
            <VisualBuilder
              steps={steps}
              addStep={addStep}
              updateStep={updateStep}
              removeStep={removeStep}
              moveStep={moveStep}
            />
          ) : (
            <textarea
              className="input min-h-[400px] font-mono text-xs"
              value={stepsJson}
              onChange={(e) => setStepsJson(e.target.value)}
            />
          )}
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
              {t('common.cancel')}
            </button>
            <button className="btn-primary" onClick={() => void run()} disabled={!runProfileId}>
              <Play className="h-4 w-4" />
              {t('rpa.run')}
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

function VisualBuilder({
  steps,
  addStep,
  updateStep,
  removeStep,
  moveStep
}: {
  steps: Step[]
  addStep: (s: Step) => void
  updateStep: (i: number, patch: Partial<Step>) => void
  removeStep: (i: number) => void
  moveStep: (i: number, dir: -1 | 1) => void
}): JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
      <aside className="card max-h-[420px] overflow-auto p-2">
        <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-base-mute">
          Step palette
        </div>
        {STEP_PALETTE.map((p) => {
          const Icon = p.icon
          return (
            <button
              key={p.type}
              onClick={() => addStep(p.defaults)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-base-soft hover:bg-ink-50 dark:hover:bg-ink-800"
            >
              <Icon className="h-3.5 w-3.5 text-base-mute" />
              <span className="capitalize">{p.type}</span>
            </button>
          )
        })}
      </aside>

      <div className="card max-h-[420px] overflow-auto p-3">
        {steps.length === 0 ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-1 text-sm text-base-mute">
            <Bot className="h-6 w-6" />
            Add steps from the palette to start building.
          </div>
        ) : (
          <ol className="space-y-2">
            {steps.map((s, i) => {
              const Icon = STEP_ICONS[s.type as StepType] ?? Activity
              return (
                <li
                  key={i}
                  className="flex items-start gap-2 rounded-md border border-line surface px-3 py-2"
                >
                  <GripVertical className="mt-1 h-4 w-4 text-ink-300 dark:text-ink-600" />
                  <Icon className="mt-1 h-4 w-4 text-brand-500" />
                  <div className="flex-1 space-y-1">
                    <div className="text-sm font-medium capitalize text-base-strong">
                      {s.type}
                    </div>
                    <StepEditor step={s} onChange={(patch) => updateStep(i, patch)} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      className="rounded p-1 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"
                      onClick={() => moveStep(i, -1)}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                      className="rounded p-1 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"
                      onClick={() => moveStep(i, 1)}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    <button
                      className="rounded p-1 text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30"
                      onClick={() => removeStep(i)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </div>
  )
}

function StepEditor({
  step,
  onChange
}: {
  step: Step
  onChange: (patch: Partial<Step>) => void
}): JSX.Element {
  const fields = useMemo(() => stepFieldsFor(step.type as StepType), [step.type])
  if (fields.length === 0)
    return <div className="text-xs text-base-mute">No parameters.</div>
  return (
    <div className="grid grid-cols-2 gap-2">
      {fields.map((f) => (
        <label key={f.key} className="text-xs">
          <span className="block text-[10px] uppercase tracking-wide text-base-mute">{f.label}</span>
          <input
            className="input mt-0.5 text-xs"
            type={f.type === 'number' ? 'number' : 'text'}
            value={String(step[f.key] ?? '')}
            placeholder={f.placeholder}
            onChange={(e) =>
              onChange({
                [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value
              } as Partial<Step>)
            }
          />
        </label>
      ))}
    </div>
  )
}

function stepFieldsFor(type: StepType): { key: string; label: string; type: 'string' | 'number'; placeholder?: string }[] {
  switch (type) {
    case 'goto':
      return [{ key: 'url', label: 'URL', type: 'string', placeholder: 'https://…' }]
    case 'wait':
      return [{ key: 'ms', label: 'Milliseconds', type: 'number' }]
    case 'waitForSelector':
      return [
        { key: 'selector', label: 'Selector', type: 'string' },
        { key: 'timeout', label: 'Timeout (ms)', type: 'number' }
      ]
    case 'click':
      return [{ key: 'selector', label: 'Selector', type: 'string' }]
    case 'type':
      return [
        { key: 'selector', label: 'Selector', type: 'string' },
        { key: 'text', label: 'Text', type: 'string' }
      ]
    case 'press':
      return [{ key: 'key', label: 'Key', type: 'string', placeholder: 'Enter' }]
    case 'scroll':
      return [
        { key: 'x', label: 'X', type: 'number' },
        { key: 'y', label: 'Y', type: 'number' }
      ]
    case 'evaluate':
      return [{ key: 'script', label: 'JS expression', type: 'string' }]
    default:
      return []
  }
}

function TabBtn({
  active,
  onClick,
  children
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded px-3 py-1 text-xs font-medium transition',
        active
          ? 'bg-white text-brand-700 shadow-sm dark:bg-ink-700 dark:text-brand-200'
          : 'text-base-soft hover:text-base-strong'
      )}
    >
      {children}
    </button>
  )
}

function RunStatus({ status }: { status: string }): JSX.Element {
  if (status === 'success')
    return <span className="pill bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">success</span>
  if (status === 'failed')
    return <span className="pill bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">failed</span>
  if (status === 'running')
    return <span className="pill bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200">running</span>
  return <span className="pill bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-300">{status}</span>
}
