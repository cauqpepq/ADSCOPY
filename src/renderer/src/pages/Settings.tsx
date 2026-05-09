import { useEffect, useState } from 'react'
import { useStore } from '../store'
import type { AppSettings } from '@shared/types'

export function SettingsPage(): JSX.Element {
  const settings = useStore((s) => s.settings)
  const refreshSettings = useStore((s) => s.refreshSettings)
  const refreshApiInfo = useStore((s) => s.refreshApiInfo)

  const [draft, setDraft] = useState<AppSettings | null>(null)
  const [detected, setDetected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (settings) setDraft(settings)
  }, [settings])

  const detect = async (): Promise<void> => {
    const r = await window.api.settingsDetectChrome()
    setDetected(r ?? '— not found —')
  }

  const save = async (): Promise<void> => {
    if (!draft) return
    setSaving(true)
    await window.api.settingsUpdate(draft)
    await Promise.all([refreshSettings(), refreshApiInfo()])
    setSaving(false)
  }

  if (!draft) return <div className="p-6 text-slate-400">Loading…</div>

  return (
    <div className="max-w-3xl p-6">
      <section className="card mb-4 p-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Browser binary</h3>
        <div className="space-y-3">
          <div>
            <div className="label">Chrome / Chromium path (leave empty for auto-detect)</div>
            <div className="flex gap-2">
              <input
                className="input"
                value={draft.chromePath}
                onChange={(e) => setDraft({ ...draft, chromePath: e.target.value })}
                placeholder="/usr/bin/google-chrome"
              />
              <button className="btn-secondary" onClick={() => void detect()}>
                Detect
              </button>
            </div>
            {detected && <p className="mt-1 text-xs text-slate-500">Detected: {detected}</p>}
          </div>
        </div>
      </section>

      <section className="card mb-4 p-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Local API</h3>
        <p className="mb-3 text-xs text-slate-500">
          Exposes a local HTTP server (similar to AdsPower's <code>local-api.adspower.net</code>)
          for programmatic control. Set port to <code>0</code> to disable.
        </p>
        <div>
          <div className="label">Port</div>
          <input
            className="input w-32"
            type="number"
            value={draft.apiPort}
            onChange={(e) => setDraft({ ...draft, apiPort: Number(e.target.value) || 0 })}
          />
        </div>
      </section>

      <section className="card mb-4 p-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Appearance</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="label">Theme</div>
            <select
              className="input"
              value={draft.theme}
              onChange={(e) => setDraft({ ...draft, theme: e.target.value as any })}
            >
              <option value="light">Light</option>
              <option value="dark">Dark (coming soon)</option>
            </select>
          </div>
          <div>
            <div className="label">UI language</div>
            <select
              className="input"
              value={draft.uiLanguage}
              onChange={(e) => setDraft({ ...draft, uiLanguage: e.target.value as any })}
            >
              <option value="en">English</option>
              <option value="ru">Русский (coming soon)</option>
            </select>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => void save()} disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </div>
  )
}
