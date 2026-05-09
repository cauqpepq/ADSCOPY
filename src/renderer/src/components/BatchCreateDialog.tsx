import { useState } from 'react'
import { Layers } from 'lucide-react'
import { Modal } from './Modal'
import { useStore } from '../store'
import { useT } from '../i18n'
import type { OS } from '@shared/types'

const OS_OPTIONS: OS[] = ['windows', 'macos', 'linux']

export function BatchCreateDialog({
  open,
  onOpenChange
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}): JSX.Element {
  const folders = useStore((s) => s.folders)
  const refreshProfiles = useStore((s) => s.refreshProfiles)
  const t = useT()

  const [count, setCount] = useState(5)
  const [prefix, setPrefix] = useState('Profile')
  const [startNumber, setStartNumber] = useState(1)
  const [os, setOs] = useState<OS>('windows')
  const [folderId, setFolderId] = useState<string | null>(null)
  const [tags, setTags] = useState('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })

  const create = async (): Promise<void> => {
    if (count < 1 || count > 200) return
    setBusy(true)
    setProgress({ done: 0, total: count })
    const tagList = tags
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    try {
      for (let i = 0; i < count; i++) {
        const num = startNumber + i
        const fp = await window.api.fingerprintGenerate({ os })
        const payload = {
          name: `${prefix} ${num}`,
          folderId,
          notes: '',
          tags: tagList,
          fingerprint: fp,
          proxy: { type: 'none' as const },
          startupUrls: [],
          extensionIds: [],
          userDataDir: '',
          cookies: [],
          status: 'idle' as const,
          lastError: null,
          lastOpenedAt: null
        }
         
        await window.api.profilesCreate(payload)
        setProgress({ done: i + 1, total: count })
      }
      await refreshProfiles()
      onOpenChange(false)
    } finally {
      setBusy(false)
      setProgress({ done: 0, total: 0 })
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t('profiles.batchNew')}
      description={t('profiles.batchNew.desc')}
      footer={
        <>
          <button
            className="btn-secondary"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            {t('common.cancel')}
          </button>
          <button className="btn-primary" onClick={() => void create()} disabled={busy}>
            <Layers className="h-4 w-4" />
            {busy
              ? `${progress.done} / ${progress.total}`
              : t('profiles.batchNew.cta', { n: count })}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label={t('profiles.batchNew.count')}>
          <input
            type="number"
            className="input"
            value={count}
            min={1}
            max={200}
            onChange={(e) => setCount(Math.max(1, Math.min(200, Number(e.target.value) || 1)))}
          />
        </Field>
        <Field label={t('profiles.batchNew.startNum')}>
          <input
            type="number"
            className="input"
            value={startNumber}
            min={1}
            onChange={(e) => setStartNumber(Math.max(1, Number(e.target.value) || 1))}
          />
        </Field>
        <Field label={t('profiles.batchNew.prefix')}>
          <input
            className="input"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="Profile"
          />
        </Field>
        <Field label={t('profiles.batchNew.os')}>
          <select className="input" value={os} onChange={(e) => setOs(e.target.value as OS)}>
            {OS_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('profiles.batchNew.folder')}>
          <select
            className="input"
            value={folderId ?? ''}
            onChange={(e) => setFolderId(e.target.value || null)}
          >
            <option value="">Ungrouped</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('profiles.batchNew.tags')}>
          <input
            className="input"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="ads, fb, t1"
          />
        </Field>
      </div>
      <p className="mt-4 text-xs text-base-mute">{t('profiles.batchNew.note')}</p>
    </Modal>
  )
}

function Field({
  label,
  children
}: {
  label: string
  children: React.ReactNode
}): JSX.Element {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}
