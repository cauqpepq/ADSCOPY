import { useState } from 'react'
import { Plus, FileUp, FileDown, Globe } from 'lucide-react'
import { useStore } from '../store'
import { FolderTree } from '../components/FolderTree'
import { ProfileTable } from '../components/ProfileTable'
import { ProfileDialog } from '../components/ProfileDialog'
import { Modal } from '../components/Modal'
import { EmptyState } from '../components/EmptyState'
import type { BrowserProfile } from '@shared/types'

export function ProfilesPage(): JSX.Element {
  const profiles = useStore((s) => s.profiles)
  const refreshProfiles = useStore((s) => s.refreshProfiles)
  const [editing, setEditing] = useState<BrowserProfile | null>(null)
  const [creating, setCreating] = useState(false)
  const [importingFor, setImportingFor] = useState<BrowserProfile | null>(null)
  const [importRaw, setImportRaw] = useState('')
  const [exportingFor, setExportingFor] = useState<BrowserProfile | null>(null)
  const [exportContent, setExportContent] = useState('')
  const [exportFormat, setExportFormat] = useState<'json' | 'netscape'>('json')

  const doImport = async (): Promise<void> => {
    if (!importingFor) return
    const r = await window.api.profilesImportCookies(importingFor.id, importRaw)
    alert(`Imported ${r.count} cookies.`)
    setImportingFor(null)
    setImportRaw('')
    await refreshProfiles()
  }

  const openExport = async (profile: BrowserProfile, format: 'json' | 'netscape'): Promise<void> => {
    setExportingFor(profile)
    setExportFormat(format)
    const r = await window.api.profilesExportCookies(profile.id, format)
    setExportContent(r.ok ? r.content : 'Failed to export.')
  }

  return (
    <div className="flex h-full">
      <FolderTree />
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>{profiles.length} profiles</span>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" />
              New profile
            </button>
          </div>
        </div>

        {profiles.length === 0 ? (
          <EmptyState
            icon={Globe}
            title="No browser profiles yet"
            description="Create your first profile to launch an isolated Chromium session with a unique fingerprint."
            action={
              <button className="btn-primary" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" />
                Create profile
              </button>
            }
          />
        ) : (
          <ProfileTable
            onEdit={(p) => setEditing(p)}
            onImportCookies={(p) => {
              setImportingFor(p)
              setImportRaw('')
            }}
            onExportCookies={(p) => void openExport(p, 'json')}
          />
        )}

        <ProfileDialog
          open={creating || !!editing}
          onOpenChange={(v) => {
            if (!v) {
              setCreating(false)
              setEditing(null)
            }
          }}
          profile={editing}
        />

        <Modal
          open={!!importingFor}
          onOpenChange={(v) => !v && setImportingFor(null)}
          title={`Import cookies into "${importingFor?.name ?? ''}"`}
          description="Paste a JSON array (Puppeteer or EditThisCookie format) or a Netscape cookies.txt."
          footer={
            <>
              <button className="btn-secondary" onClick={() => setImportingFor(null)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={() => void doImport()}>
                <FileUp className="h-4 w-4" />
                Import
              </button>
            </>
          }
        >
          <textarea
            className="input min-h-[260px] font-mono text-xs"
            value={importRaw}
            onChange={(e) => setImportRaw(e.target.value)}
            placeholder='[{ "name": "...", "value": "...", "domain": "...", "path": "/" }]'
          />
        </Modal>

        <Modal
          open={!!exportingFor}
          onOpenChange={(v) => !v && setExportingFor(null)}
          title={`Export cookies from "${exportingFor?.name ?? ''}"`}
          footer={
            <>
              <div className="mr-auto flex items-center gap-2">
                <select
                  className="input w-40"
                  value={exportFormat}
                  onChange={(e) =>
                    void openExport(exportingFor!, e.target.value as 'json' | 'netscape')
                  }
                >
                  <option value="json">JSON</option>
                  <option value="netscape">Netscape (cookies.txt)</option>
                </select>
              </div>
              <button
                className="btn-secondary"
                onClick={() => {
                  void navigator.clipboard.writeText(exportContent)
                }}
              >
                <FileDown className="h-4 w-4" />
                Copy to clipboard
              </button>
              <button className="btn-primary" onClick={() => setExportingFor(null)}>
                Close
              </button>
            </>
          }
        >
          <textarea
            className="input min-h-[260px] font-mono text-xs"
            readOnly
            value={exportContent}
          />
        </Modal>
      </div>
    </div>
  )
}
