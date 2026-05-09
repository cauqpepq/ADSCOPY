import { useMemo } from 'react'
import { Activity, Globe, Network, Play } from 'lucide-react'
import { useStore } from '../store'
import { useT } from '../i18n'

export function StatisticsPage(): JSX.Element {
  const profiles = useStore((s) => s.profiles)
  const proxies = useStore((s) => s.proxies)
  const runs = useStore((s) => s.runs)
  const t = useT()

  const running = profiles.filter((p) => p.status === 'running').length
  const recentRuns = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
    return runs.filter((r) => new Date(r.startedAt).getTime() > cutoff).length
  }, [runs])

  const buckets = useMemo(() => buildSparkline(runs), [runs])

  return (
    <div className="space-y-6 p-6">
      <div className="grid gap-3 md:grid-cols-4">
        <Stat icon={Globe} label={t('stats.profiles')} value={profiles.length} accent="brand" />
        <Stat icon={Play} label={t('stats.running')} value={running} accent="emerald" />
        <Stat icon={Activity} label={t('stats.runs')} value={recentRuns} accent="violet" />
        <Stat icon={Network} label={t('stats.proxies')} value={proxies.length} accent="sky" />
      </div>

      <div className="card p-5">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-base-mute">
          RPA runs · last 14 days
        </div>
        <div className="flex h-32 items-end gap-1.5">
          {buckets.map((b, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-brand-500/80 dark:bg-brand-500/70"
                style={{ height: `${Math.max(2, (b.count / Math.max(1, ...buckets.map((x) => x.count))) * 110)}px` }}
                title={`${b.label}: ${b.count}`}
              />
              <span className="text-[9px] text-base-mute">{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function buildSparkline(runs: { startedAt: string }[]): { label: string; count: number }[] {
  const days = 14
  const out: { label: string; count: number; ts: number }[] = []
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    out.push({ label: `${d.getDate()}`, count: 0, ts: d.getTime() })
  }
  for (const r of runs) {
    const t = new Date(r.startedAt)
    t.setHours(0, 0, 0, 0)
    const ts = t.getTime()
    const bucket = out.find((b) => b.ts === ts)
    if (bucket) bucket.count++
  }
  return out
}

function Stat({
  icon: Icon,
  label,
  value,
  accent
}: {
  icon: typeof Activity
  label: string
  value: number
  accent: 'brand' | 'emerald' | 'violet' | 'sky'
}): JSX.Element {
  const accents: Record<typeof accent, string> = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300'
  }
  return (
    <div className="card flex items-center gap-3 p-4">
      <div
        className={
          'flex h-10 w-10 items-center justify-center rounded-md ' + accents[accent]
        }
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-base-mute">{label}</div>
        <div className="text-xl font-semibold text-base-strong">{value}</div>
      </div>
    </div>
  )
}
