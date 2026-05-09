import { useMemo, useState } from 'react'
import {
  ChevronDown,
  Copy,
  FileDown,
  FileUp,
  Globe,
  Layers,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Square,
  Trash2,
  X
} from 'lucide-react'
import * as Menu from '@radix-ui/react-dropdown-menu'
import { useStore } from '../store'
import { FolderTree } from '../components/FolderTree'
import { ProfileTable } from '../components/ProfileTable'
import { ProfileDialog } from '../components/ProfileDialog'
import { BatchCreateDialog } from '../components/BatchCreateDialog'
import { Modal } from '../components/Modal'
import { EmptyState } from '../components/EmptyState'
import { useT } from '../i18n'
import type { BrowserProfile } from '@shared/types'

export function ProfilesPage(): JSX.Element {
  const profiles = useStore((s) => s.profiles)
  const refreshProfiles = useStore((s) => s.refreshProfiles)
  const selectedFolderId = useStore((s) => s.selectedFolderId)
  const folders = useStore((s) => s.folders)
  const search = useStore((s) => s.search)
  const selectedIds = useStore((s) => s.selectedProfileIds)
  const clearSelection = useStore((s) => s.clearProfileSelection)
  const t = useT()

  const [editing, setEditing] = useState<BrowserProfile | null>(null)
  const [creating, setCreating] = useState(false)
  const [batchOpen, setBatchOpen] = useState(false)
  const [importingFor, setImportingFor] = useState<BrowserProfile | null>(null)
  const [importRaw, setImportRaw] = useState('')
  const [exportingFor, setExportingFor] = useState<BrowserProfile | null>(null)
  const [exportContent, setExportContent] = useState('')
  const [exportFormat, setExportFormat] = useState<'json' | 'netscape'>('json')

  const folderName =
    selectedFolderId === null
      ? t('profiles.allProfiles')
      : folders.find((f) => f.id === selectedFolderId)?.name ?? '—'

  const visible = useMemo(() => {
    return profiles
      .filter((p) => !selectedFolderId || p.folderId === selectedFolderId)
      .filter((p) => {
        if (!search.trim()) return true
        const q = search.toLowerCase()
        return (
          p.name.toLowerCase().includes(q) ||
          (p.tags ?? []).some((tag) => tag.toLowerCase().includes(q)) ||
          (p.notes ?? '').toLowerCase().includes(q)
        )
      })
  }, [profiles, selectedFolderId, search])

  const visibleCount = visible.length
  const runningCount = visible.filter((p) => p.status === 'running').length
  const selectedProfiles = useMemo(
    () => visible.filter((p) => selectedIds.has(p.id)),
    [visible, selectedIds]
  )

  const doImport = async (): Promise<void> => {
    if (!importingFor) return
    const r = await window.api.profilesImportCookies(importingFor.id, importRaw)
    alert(`Imported ${r.count} cookies.`)
    setImportingFor(null)
    setImportRaw('')
    await refreshProfiles()
  }

  const openExport = async (
    profile: BrowserProfile,
    format: 'json' | 'netscape'
  ): Promise<void> => {
    setExportingFor(profile)
    setExportFormat(format)
    const r = await window.api.profilesExportCookies(profile.id, format)
    setExportContent(r.ok ? r.content : 'Failed to export.')
  }

  const batchOpenAll = async (): Promise<void> => {
    for (const p of selectedProfiles) {
      if (p.status !== 'running') {
         
        await window.api.profilesLaunch(p.id)
      }
    }
    await refreshProfiles()
  }
  const batchCloseAll = async (): Promise<void> => {
    for (const p of selectedProfiles) {
      if (p.status === 'running') {
         
        await window.api.profilesClose(p.id)
      }
    }
    await refreshProfiles()
  }
  const batchDelete = async (): Promise<void> => {
    if (
      !confirm(
        `Delete ${selectedProfiles.length} profiles? This will erase their data folders.`
      )
    )
      return
    for (const p of selectedProfiles) {
       
      await window.api.profilesDelete(p.id)
    }
    clearSelection()
    await refreshProfiles()
  }
  const batchMove = async (folderId: string | null): Promise<void> => {
    for (const p of selectedProfiles) {
       
      await window.api.profilesUpdate(p.id, { folderId })
    }
    await refreshProfiles()
  }

  return (
    <div className="flex h-full">
      <FolderTree />
      <div className="flex-1 overflow-auto">
        <div className="border-b border-line surface px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-base-strong">{folderName}</h2>
              <div className="flex items-center gap-2 text-xs text-base-mute">
                <span className="pill bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300">
                  {t('profiles.total', { n: visibleCount })}
                </span>
                {runningCount > 0 && (
                  <span className="pill bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    {t('profiles.running', { n: runningCount })}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="icon-btn"
                title={t('common.refresh')}
                onClick={() => void refreshProfiles()}
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <SplitNewButton
                onNew={() => setCreating(true)}
                onBatchNew={() => setBatchOpen(true)}
                primaryLabel={t('profiles.new')}
                batchLabel={t('profiles.batchNew')}
              />
            </div>
          </div>

          {selectedProfiles.length > 0 && (
            <div className="mt-3 flex items-center justify-between rounded-md border border-brand-200 bg-brand-50/60 px-3 py-2 text-sm dark:border-brand-800 dark:bg-brand-900/20">
              <div className="flex items-center gap-2 text-brand-700 dark:text-brand-200">
                <Layers className="h-4 w-4" />
                <span className="font-medium">
                  {t('profiles.batch.selected', { n: selectedProfiles.length })}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button className="btn-secondary" onClick={() => void batchOpenAll()}>
                  <Play className="h-3.5 w-3.5" />
                  {t('profiles.batch.openAll')}
                </button>
                <button className="btn-secondary" onClick={() => void batchCloseAll()}>
                  <Square className="h-3.5 w-3.5" />
                  {t('profiles.batch.closeAll')}
                </button>
                <Menu.Root>
                  <Menu.Trigger asChild>
                    <button className="btn-secondary">
                      <Layers className="h-3.5 w-3.5" />
                      {t('profiles.batch.move')}
                      <ChevronDown className="h-3 w-3 opacity-60" />
                    </button>
                  </Menu.Trigger>
                  <Menu.Portal>
                    <Menu.Content
                      align="end"
                      sideOffset={4}
                      className="z-50 min-w-[200px] rounded-md border border-line bg-white p-1 shadow-lg dark:bg-ink-900"
                    >
                      <Menu.Item
                        onSelect={() => void batchMove(null)}
                        className="cursor-pointer rounded px-2 py-1.5 text-sm text-ink-700 outline-none hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800"
                      >
                        Ungrouped
                      </Menu.Item>
                      {folders.length > 0 && (
                        <Menu.Separator className="my-1 h-px bg-ink-100 dark:bg-ink-800" />
                      )}
                      {folders.map((f) => (
                        <Menu.Item
                          key={f.id}
                          onSelect={() => void batchMove(f.id)}
                          className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-ink-700 outline-none hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800"
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-sm"
                            style={{ backgroundColor: f.color }}
                          />
                          {f.name}
                        </Menu.Item>
                      ))}
                    </Menu.Content>
                  </Menu.Portal>
                </Menu.Root>
                <button className="btn-danger" onClick={() => void batchDelete()}>
                  <Trash2 className="h-3.5 w-3.5" />
                  {t('profiles.batch.delete')}
                </button>
                <button
                  className="icon-btn"
                  title="Clear selection"
                  onClick={() => clearSelection()}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-6">
          {profiles.length === 0 ? (
            <EmptyState
              icon={Globe}
              title={t('profiles.empty.title')}
              description={t('profiles.empty.desc')}
              action={
                <button className="btn-primary" onClick={() => setCreating(true)}>
                  <Sparkles className="h-4 w-4" />
                  {t('profiles.empty.cta')}
                </button>
              }
            />
          ) : (
            <ProfileTable
              profiles={visible}
              onEdit={(p) => setEditing(p)}
              onImportCookies={(p) => {
                setImportingFor(p)
                setImportRaw('')
              }}
              onExportCookies={(p) => void openExport(p, 'json')}
            />
          )}
        </div>

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

        <BatchCreateDialog open={batchOpen} onOpenChange={setBatchOpen} />

        <Modal
          open={!!importingFor}
          onOpenChange={(v) => !v && setImportingFor(null)}
          title={`Import cookies into "${importingFor?.name ?? ''}"`}
          description="Paste a JSON array (Puppeteer or EditThisCookie format) or a Netscape cookies.txt."
          footer={
            <>
              <button className="btn-secondary" onClick={() => setImportingFor(null)}>
                {t('common.cancel')}
              </button>
              <button className="btn-primary" onClick={() => void doImport()}>
                <FileUp className="h-4 w-4" />
                {t('common.import')}
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
                  className="input w-48"
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
                <Copy className="h-4 w-4" />
                {t('common.copy')}
              </button>
              <button className="btn-primary" onClick={() => setExportingFor(null)}>
                <FileDown className="h-4 w-4" />
                {t('common.close')}
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

function SplitNewButton({
  onNew,
  onBatchNew,
  primaryLabel,
  batchLabel
}: {
  onNew: () => void
  onBatchNew: () => void
  primaryLabel: string
  batchLabel: string
}): JSX.Element {
  return (
    <div className="inline-flex rounded-md shadow-sm">
      <button
        onClick={onNew}
        className="inline-flex items-center gap-1.5 rounded-l-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
      >
        <Plus className="h-4 w-4" />
        {primaryLabel}
      </button>
      <Menu.Root>
        <Menu.Trigger asChild>
          <button
            className="inline-flex items-center justify-center rounded-r-md border-l border-brand-700 bg-brand-600 px-2 py-1.5 text-white hover:bg-brand-700"
            aria-label="More options"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Content
            align="end"
            sideOffset={4}
            className="z-50 min-w-[200px] rounded-md border border-line bg-white p-1 shadow-lg dark:bg-ink-900"
          >
            <Menu.Item
              onSelect={onBatchNew}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-ink-700 outline-none hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800"
            >
              <Layers className="h-3.5 w-3.5" />
              {batchLabel}
            </Menu.Item>
          </Menu.Content>
        </Menu.Portal>
      </Menu.Root>
    </div>
  )
}
