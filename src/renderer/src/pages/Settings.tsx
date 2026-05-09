import { useEffect, useState } from 'react'
import { CheckCircle2, Moon, Sun } from 'lucide-react'
import { useStore } from '../store'
import { useT } from '../i18n'
import type { Lang } from '../store'
import type { AppSettings } from '@shared/types'

export function SettingsPage(): JSX.Element {
  const settings = useStore((s) => s.settings)
  const refreshSettings = useStore((s) => s.refreshSettings)
  const refreshApiInfo = useStore((s) => s.refreshApiInfo)
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const lang = useStore((s) => s.lang)
  const setLang = useStore((s) => s.setLang)
  const t = useT()

  const [draft, setDraft] = useState<AppSettings | null>(null)
  const [detected, setDetected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)

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
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
  }

  if (!draft) return <div className="p-6 text-base-mute">Loading…</div>

  return (
    <div className="max-w-3xl space-y-4 p-6">
      <section className="card p-5">
        <h3 className="mb-3 text-sm font-semibold text-base-strong">
          {t('settings.browser.title')}
        </h3>
        <div className="space-y-3">
          <div>
            <div className="label">{t('settings.browser.label')}</div>
            <div className="flex gap-2">
              <input
                className="input"
                value={draft.chromePath}
                onChange={(e) => setDraft({ ...draft, chromePath: e.target.value })}
                placeholder="/usr/bin/google-chrome"
              />
              <button className="btn-secondary" onClick={() => void detect()}>
                {t('settings.browser.detect')}
              </button>
            </div>
            {detected && (
              <p className="mt-1 text-xs text-base-mute">Detected: {detected}</p>
            )}
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h3 className="mb-3 text-sm font-semibold text-base-strong">
          {t('settings.api.title')}
        </h3>
        <p className="mb-3 text-xs text-base-mute">{t('settings.api.desc')}</p>
        <div>
          <div className="label">{t('settings.api.port')}</div>
          <input
            className="input w-32"
            type="number"
            value={draft.apiPort}
            onChange={(e) => setDraft({ ...draft, apiPort: Number(e.target.value) || 0 })}
          />
        </div>
      </section>

      <section className="card p-5">
        <h3 className="mb-3 text-sm font-semibold text-base-strong">
          {t('settings.appearance.title')}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="label">{t('settings.appearance.theme')}</div>
            <div className="flex items-center gap-2">
              <ThemePill
                active={theme === 'light'}
                onClick={() => setTheme('light')}
                icon={<Sun className="h-4 w-4" />}
                label={t('settings.appearance.theme.light')}
              />
              <ThemePill
                active={theme === 'dark'}
                onClick={() => setTheme('dark')}
                icon={<Moon className="h-4 w-4" />}
                label={t('settings.appearance.theme.dark')}
              />
            </div>
          </div>
          <div>
            <div className="label">{t('settings.appearance.lang')}</div>
            <select
              className="input"
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
            >
              <option value="en">English</option>
              <option value="ru">Русский</option>
              <option value="zh">中文</option>
            </select>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end gap-2">
        {savedFlash && (
          <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Saved
          </span>
        )}
        <button className="btn-primary" onClick={() => void save()} disabled={saving}>
          {saving ? 'Saving…' : t('settings.save')}
        </button>
      </div>
    </div>
  )
}

function ThemePill({
  active,
  onClick,
  icon,
  label
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      className={
        'flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition ' +
        (active
          ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200'
          : 'border-line surface text-base-soft hover:border-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800')
      }
    >
      {icon}
      {label}
    </button>
  )
}

