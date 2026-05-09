import { useEffect, useState } from 'react'
import { Modal } from './Modal'
import * as Tabs from '@radix-ui/react-tabs'
import { useStore } from '../store'
import type { BrowserProfile, FingerprintConfig, ProxyConfig } from '@shared/types'
import { Sparkles } from 'lucide-react'
import { cn } from '../lib/utils'

const blankProxy: ProxyConfig = { type: 'none' }

const BLANK_FP: FingerprintConfig = {
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  os: 'windows',
  browser: 'chrome',
  browserVersion: 131,
  locale: 'en-US',
  languages: ['en-US', 'en'],
  timezone: 'America/New_York',
  geolocation: null,
  screen: {
    width: 1920,
    height: 1080,
    availWidth: 1920,
    availHeight: 1040,
    colorDepth: 24,
    pixelDepth: 24,
    devicePixelRatio: 1
  },
  hardwareConcurrency: 8,
  deviceMemory: 8,
  canvas: 'noise',
  webgl: { mode: 'noise', vendor: 'Google Inc. (Intel)', renderer: 'ANGLE (Intel)' },
  audio: 'noise',
  webrtc: 'altered',
  fonts: [],
  mediaDevices: { videoinputs: 1, audioinputs: 1, audiooutputs: 1 },
  noiseSeed: 1
}

export function ProfileDialog({
  open,
  onOpenChange,
  profile
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  profile?: BrowserProfile | null
}): JSX.Element {
  const folders = useStore((s) => s.folders)
  const proxies = useStore((s) => s.proxies)
  const refreshProfiles = useStore((s) => s.refreshProfiles)

  const [name, setName] = useState('')
  const [folderId, setFolderId] = useState<string | null>(null)
  const [tags, setTags] = useState('')
  const [notes, setNotes] = useState('')
  const [startupUrls, setStartupUrls] = useState('')
  const [fp, setFp] = useState<FingerprintConfig>(BLANK_FP)
  const [proxyId, setProxyId] = useState<string>('')
  const [customProxy, setCustomProxy] = useState<ProxyConfig>(blankProxy)
  const [proxyMode, setProxyMode] = useState<'saved' | 'custom'>('custom')

  useEffect(() => {
    if (open) {
      if (profile) {
        setName(profile.name)
        setFolderId(profile.folderId ?? null)
        setTags((profile.tags ?? []).join(', '))
        setNotes(profile.notes ?? '')
        setStartupUrls((profile.startupUrls ?? []).join('\n'))
        setFp(profile.fingerprint)
        if (profile.proxy.id && proxies.find((x) => x.id === profile.proxy.id)) {
          setProxyMode('saved')
          setProxyId(profile.proxy.id)
        } else {
          setProxyMode('custom')
          setCustomProxy(profile.proxy)
        }
      } else {
        // new
        setName('Profile ' + (Math.floor(Math.random() * 9000) + 1000))
        setFolderId(null)
        setTags('')
        setNotes('')
        setStartupUrls('')
        void window.api.fingerprintGenerate().then((f: FingerprintConfig) => setFp(f))
        setProxyMode('custom')
        setCustomProxy(blankProxy)
      }
    }
  }, [open, profile, proxies])

  const generateNew = async (): Promise<void> => {
    const f = await window.api.fingerprintGenerate({ os: fp.os, locale: fp.locale })
    setFp(f)
  }

  const save = async (): Promise<void> => {
    const proxy: ProxyConfig =
      proxyMode === 'saved'
        ? proxies.find((x) => x.id === proxyId) ?? blankProxy
        : customProxy

    const payload = {
      name: name.trim() || 'Untitled profile',
      folderId,
      notes,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      fingerprint: fp,
      proxy,
      startupUrls: startupUrls
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      extensionIds: profile?.extensionIds ?? [],
      userDataDir: profile?.userDataDir ?? '',
      cookies: profile?.cookies ?? [],
      status: 'idle' as const,
      lastError: null,
      lastOpenedAt: null
    }
    if (profile) {
      await window.api.profilesUpdate(profile.id, payload)
    } else {
      await window.api.profilesCreate(payload)
    }
    await refreshProfiles()
    onOpenChange(false)
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={profile ? 'Edit profile' : 'New profile'}
      description={profile ? `ID: ${profile.id}` : 'Each profile runs in a fully isolated browser session.'}
      size="lg"
      footer={
        <>
          <button className="btn-secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </button>
          <button className="btn-primary" onClick={() => void save()}>
            {profile ? 'Save changes' : 'Create profile'}
          </button>
        </>
      }
    >
      <Tabs.Root defaultValue="general" className="flex flex-col gap-4">
        <Tabs.List className="flex gap-1 border-b border-ink-200">
          <TabTrigger value="general">General</TabTrigger>
          <TabTrigger value="fingerprint">Fingerprint</TabTrigger>
          <TabTrigger value="proxy">Proxy</TabTrigger>
          <TabTrigger value="advanced">Advanced</TabTrigger>
        </Tabs.List>

        <Tabs.Content value="general" className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Folder</label>
            <select
              className="input"
              value={folderId ?? ''}
              onChange={(e) => setFolderId(e.target.value || null)}
            >
              <option value="">No folder</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Tags (comma-separated)</label>
            <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">Notes</label>
            <textarea
              className="input min-h-[80px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="label">Startup URLs (one per line)</label>
            <textarea
              className="input min-h-[80px]"
              value={startupUrls}
              onChange={(e) => setStartupUrls(e.target.value)}
              placeholder="https://browserleaks.com&#10;https://pixelscan.net"
            />
          </div>
        </Tabs.Content>

        <Tabs.Content value="fingerprint" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink-500">
              Each profile gets a unique browser fingerprint. Click <strong>Re-roll</strong> to
              generate a new one for the chosen OS / locale.
            </p>
            <button className="btn-secondary" onClick={() => void generateNew()}>
              <Sparkles className="h-3.5 w-3.5" />
              Re-roll
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="OS">
              <select
                className="input"
                value={fp.os}
                onChange={(e) => setFp({ ...fp, os: e.target.value as any })}
              >
                <option value="windows">Windows</option>
                <option value="macos">macOS</option>
                <option value="linux">Linux</option>
              </select>
            </Field>
            <Field label="Browser">
              <select className="input" value={fp.browser} disabled>
                <option value="chrome">Chrome</option>
              </select>
            </Field>
            <Field label="Version">
              <input
                className="input"
                type="number"
                value={fp.browserVersion}
                onChange={(e) =>
                  setFp({ ...fp, browserVersion: Number(e.target.value) || 131 })
                }
              />
            </Field>
            <Field label="Locale">
              <input
                className="input"
                value={fp.locale}
                onChange={(e) => setFp({ ...fp, locale: e.target.value })}
              />
            </Field>
            <Field label="Timezone">
              <input
                className="input"
                value={fp.timezone}
                onChange={(e) => setFp({ ...fp, timezone: e.target.value })}
              />
            </Field>
            <Field label="Languages (comma-separated)">
              <input
                className="input"
                value={fp.languages.join(', ')}
                onChange={(e) =>
                  setFp({
                    ...fp,
                    languages: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                  })
                }
              />
            </Field>
            <Field label="Screen W × H">
              <div className="flex gap-1">
                <input
                  className="input"
                  type="number"
                  value={fp.screen.width}
                  onChange={(e) =>
                    setFp({
                      ...fp,
                      screen: { ...fp.screen, width: Number(e.target.value) || 1920 }
                    })
                  }
                />
                <input
                  className="input"
                  type="number"
                  value={fp.screen.height}
                  onChange={(e) =>
                    setFp({
                      ...fp,
                      screen: { ...fp.screen, height: Number(e.target.value) || 1080 }
                    })
                  }
                />
              </div>
            </Field>
            <Field label="Cores">
              <input
                className="input"
                type="number"
                value={fp.hardwareConcurrency}
                onChange={(e) =>
                  setFp({ ...fp, hardwareConcurrency: Number(e.target.value) || 8 })
                }
              />
            </Field>
            <Field label="RAM (GB)">
              <input
                className="input"
                type="number"
                value={fp.deviceMemory}
                onChange={(e) => setFp({ ...fp, deviceMemory: Number(e.target.value) || 8 })}
              />
            </Field>
            <Field label="Canvas">
              <select
                className="input"
                value={fp.canvas}
                onChange={(e) => setFp({ ...fp, canvas: e.target.value as any })}
              >
                <option value="noise">Noise</option>
                <option value="block">Block</option>
                <option value="off">Real</option>
              </select>
            </Field>
            <Field label="WebGL">
              <select
                className="input"
                value={fp.webgl.mode}
                onChange={(e) =>
                  setFp({ ...fp, webgl: { ...fp.webgl, mode: e.target.value as any } })
                }
              >
                <option value="noise">Noise</option>
                <option value="block">Block</option>
                <option value="off">Real</option>
              </select>
            </Field>
            <Field label="WebRTC">
              <select
                className="input"
                value={fp.webrtc}
                onChange={(e) => setFp({ ...fp, webrtc: e.target.value as any })}
              >
                <option value="altered">Altered (mask local IP)</option>
                <option value="real">Real</option>
                <option value="disabled">Disabled</option>
              </select>
            </Field>
          </div>
          <Field label="User-Agent">
            <input
              className="input"
              value={fp.userAgent}
              onChange={(e) => setFp({ ...fp, userAgent: e.target.value })}
            />
          </Field>
        </Tabs.Content>

        <Tabs.Content value="proxy" className="space-y-4">
          <div className="flex gap-2">
            <button
              className={cn(
                'btn',
                proxyMode === 'saved' ? 'bg-brand-600 text-white' : 'btn-secondary'
              )}
              onClick={() => setProxyMode('saved')}
            >
              Use saved proxy
            </button>
            <button
              className={cn(
                'btn',
                proxyMode === 'custom' ? 'bg-brand-600 text-white' : 'btn-secondary'
              )}
              onClick={() => setProxyMode('custom')}
            >
              Custom
            </button>
          </div>
          {proxyMode === 'saved' ? (
            <Field label="Saved proxy">
              <select className="input" value={proxyId} onChange={(e) => setProxyId(e.target.value)}>
                <option value="">— None —</option>
                {proxies.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name ?? `${p.type} ${p.host}:${p.port}`}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <Field label="Type">
                <select
                  className="input"
                  value={customProxy.type}
                  onChange={(e) => setCustomProxy({ ...customProxy, type: e.target.value as any })}
                >
                  <option value="none">No proxy</option>
                  <option value="http">HTTP</option>
                  <option value="https">HTTPS</option>
                  <option value="socks4">SOCKS4</option>
                  <option value="socks5">SOCKS5</option>
                </select>
              </Field>
              <Field label="Host">
                <input
                  className="input"
                  value={customProxy.host ?? ''}
                  onChange={(e) => setCustomProxy({ ...customProxy, host: e.target.value })}
                />
              </Field>
              <Field label="Port">
                <input
                  className="input"
                  type="number"
                  value={customProxy.port ?? ''}
                  onChange={(e) =>
                    setCustomProxy({ ...customProxy, port: Number(e.target.value) || undefined })
                  }
                />
              </Field>
              <Field label="Username">
                <input
                  className="input"
                  value={customProxy.username ?? ''}
                  onChange={(e) => setCustomProxy({ ...customProxy, username: e.target.value })}
                />
              </Field>
              <Field label="Password">
                <input
                  className="input"
                  type="password"
                  value={customProxy.password ?? ''}
                  onChange={(e) => setCustomProxy({ ...customProxy, password: e.target.value })}
                />
              </Field>
            </div>
          )}
        </Tabs.Content>

        <Tabs.Content value="advanced" className="space-y-3 text-sm text-ink-600">
          <p>
            Profile data folder will be created at the platform-default user data directory once
            the profile is saved.
          </p>
          <p>
            Cookies, localStorage, IndexedDB, and the password store are isolated per profile via
            Chrome's <code className="rounded bg-ink-100 px-1">--user-data-dir</code> flag.
          </p>
          <p>
            Fingerprint spoofing is injected via CDP{' '}
            <code className="rounded bg-ink-100 px-1">Page.addScriptToEvaluateOnNewDocument</code>{' '}
            before any page script runs.
          </p>
          <p className="text-xs text-ink-500">
            Note: this clone uses the system Chromium with a JavaScript injection layer. Real
            AdsPower ships its own forked Chromium ("SunBrowser") with C++ patches to the rendering
            engine, which provides stronger detection resistance for sites that fingerprint at the
            native level.
          </p>
        </Tabs.Content>
      </Tabs.Root>
    </Modal>
  )
}

function TabTrigger({
  value,
  children
}: {
  value: string
  children: React.ReactNode
}): JSX.Element {
  return (
    <Tabs.Trigger
      value={value}
      className="border-b-2 border-transparent px-3 py-2 text-sm text-ink-500 data-[state=active]:border-brand-600 data-[state=active]:text-brand-700 data-[state=active]:font-medium"
    >
      {children}
    </Tabs.Trigger>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div>
      <div className="label">{label}</div>
      {children}
    </div>
  )
}
