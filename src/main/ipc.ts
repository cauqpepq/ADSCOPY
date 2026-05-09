import { BrowserWindow, dialog, ipcMain, shell } from 'electron'
import {
  extensionRepo,
  folderRepo,
  profileRepo,
  proxyRepo,
  runRepo,
  scenarioRepo,
  settingsRepo
} from '@main/db'
import { IPC } from '@shared/ipc-channels'
import type {
  AutomationScenario,
  BrowserProfile,
  ProfileFolder,
  ProxyConfig,
  AppSettings
} from '@shared/types'
import { generateFingerprint } from '@main/fingerprint/generator'
import { findChromeBinary } from '@main/browser/find-chrome'
import { closeProfile, launchProfile } from '@main/browser/launcher'
import { exportCookiesJson, exportNetscape, importCookiesFromString } from '@main/cookies/import-export'
import { addUnpackedExtension, removeExtension } from '@main/extensions/manager'
import { runScenario } from '@main/automation/runner'
import { getApiInfo, startApiServer, stopApiServer } from '@main/api/server'
import { parseProxyString, testProxy } from '@main/browser/proxy'
import {
  COMMON_LOCALES,
  SCREEN_PRESETS,
  UA_PRESETS,
  WEBGL_VENDOR_RENDERER
} from '@main/fingerprint/presets'

function emitToAll(channel: string, payload: any): void {
  for (const w of BrowserWindow.getAllWindows()) {
    w.webContents.send(channel, payload)
  }
}

const onProfileStatus = (id: string, status: 'running' | 'idle' | 'error', err?: string): void => {
  emitToAll(IPC.EventProfileStatusChanged, { id, status, error: err })
}

export function registerIpc(): void {
  /* ---------- folders ---------- */
  ipcMain.handle(IPC.FoldersList, () => folderRepo.list())
  ipcMain.handle(IPC.FoldersCreate, (_e, input: Omit<ProfileFolder, 'id' | 'createdAt'>) =>
    folderRepo.create(input)
  )
  ipcMain.handle(IPC.FoldersUpdate, (_e, id: string, patch: Partial<ProfileFolder>) =>
    folderRepo.update(id, patch)
  )
  ipcMain.handle(IPC.FoldersDelete, (_e, id: string) => folderRepo.delete(id))

  /* ---------- profiles ---------- */
  ipcMain.handle(IPC.ProfilesList, () => profileRepo.list())
  ipcMain.handle(IPC.ProfilesGet, (_e, id: string) => profileRepo.get(id))
  ipcMain.handle(
    IPC.ProfilesCreate,
    (_e, input: Omit<BrowserProfile, 'id' | 'createdAt' | 'updatedAt'>) => profileRepo.create(input)
  )
  ipcMain.handle(IPC.ProfilesUpdate, (_e, id: string, patch: Partial<BrowserProfile>) =>
    profileRepo.update(id, patch)
  )
  ipcMain.handle(IPC.ProfilesDelete, async (_e, id: string) => {
    await closeProfile(id)
    profileRepo.delete(id)
  })
  ipcMain.handle(IPC.ProfilesDuplicate, (_e, id: string) => {
    const src = profileRepo.get(id)
    if (!src) return null
    const copy = profileRepo.create({
      ...src,
      name: src.name + ' (copy)',
      fingerprint: generateFingerprint({ os: src.fingerprint.os, locale: src.fingerprint.locale }),
      cookies: [],
      status: 'idle',
      lastError: null,
      lastOpenedAt: null,
      userDataDir: '' // force regeneration
    })
    return copy
  })
  ipcMain.handle(IPC.ProfilesLaunch, (_e, id: string) => launchProfile(id, onProfileStatus))
  ipcMain.handle(IPC.ProfilesClose, (_e, id: string) => closeProfile(id))
  ipcMain.handle(IPC.ProfilesImportCookies, (_e, id: string, raw: string) => {
    const cookies = importCookiesFromString(raw)
    const updated = profileRepo.update(id, { cookies })
    return { ok: true, count: cookies.length, profile: updated }
  })
  ipcMain.handle(IPC.ProfilesExportCookies, (_e, id: string, format: 'json' | 'netscape') => {
    const p = profileRepo.get(id)
    if (!p) return { ok: false, error: 'profile not found' }
    return {
      ok: true,
      content: format === 'netscape' ? exportNetscape(p.cookies) : exportCookiesJson(p.cookies)
    }
  })

  /* ---------- proxies ---------- */
  ipcMain.handle(IPC.ProxiesList, () => proxyRepo.list())
  ipcMain.handle(IPC.ProxiesCreate, (_e, input: Omit<ProxyConfig, 'id'>) => proxyRepo.create(input))
  ipcMain.handle(IPC.ProxiesUpdate, (_e, id: string, patch: Partial<ProxyConfig>) =>
    proxyRepo.update(id, patch)
  )
  ipcMain.handle(IPC.ProxiesDelete, (_e, id: string) => proxyRepo.delete(id))
  ipcMain.handle(IPC.ProxiesTest, (_e, p: ProxyConfig) => testProxy(p))
  ipcMain.handle(IPC.ProxiesImportBulk, (_e, raw: string) => {
    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
    const created: ProxyConfig[] = []
    for (const line of lines) {
      const parsed = parseProxyString(line)
      if (parsed) created.push(proxyRepo.create(parsed))
    }
    return created
  })

  /* ---------- extensions ---------- */
  ipcMain.handle(IPC.ExtensionsList, () => extensionRepo.list())
  ipcMain.handle(IPC.ExtensionsAdd, async (_e, srcDir: string) => {
    return await addUnpackedExtension(srcDir)
  })
  ipcMain.handle(IPC.ExtensionsRemove, (_e, id: string) => removeExtension(id))
  ipcMain.handle(IPC.ExtensionsToggle, (_e, id: string, enabled: boolean) =>
    extensionRepo.toggle(id, enabled)
  )

  /* ---------- automation ---------- */
  ipcMain.handle(IPC.ScenariosList, () => scenarioRepo.list())
  ipcMain.handle(
    IPC.ScenariosCreate,
    (_e, input: Omit<AutomationScenario, 'id' | 'createdAt' | 'updatedAt'>) =>
      scenarioRepo.create(input)
  )
  ipcMain.handle(IPC.ScenariosUpdate, (_e, id: string, patch: Partial<AutomationScenario>) =>
    scenarioRepo.update(id, patch)
  )
  ipcMain.handle(IPC.ScenariosDelete, (_e, id: string) => scenarioRepo.delete(id))
  ipcMain.handle(IPC.ScenariosRun, async (_e, scenarioId: string, profileId: string) => {
    return runScenario(scenarioId, profileId, (run) => emitToAll(IPC.EventRunUpdated, run), onProfileStatus)
  })
  ipcMain.handle(IPC.RunsList, () => runRepo.list())

  /* ---------- fingerprint ---------- */
  ipcMain.handle(IPC.FingerprintGenerate, (_e, opts: any) => generateFingerprint(opts))
  ipcMain.handle(IPC.FingerprintPresets, () => ({
    ua: UA_PRESETS,
    screens: SCREEN_PRESETS,
    locales: COMMON_LOCALES,
    webgl: WEBGL_VENDOR_RENDERER
  }))

  /* ---------- settings ---------- */
  ipcMain.handle(IPC.SettingsGet, () => settingsRepo.get())
  ipcMain.handle(IPC.SettingsUpdate, (_e, patch: Partial<AppSettings>) => {
    const next = settingsRepo.update(patch)
    if (typeof patch.apiPort === 'number') {
      stopApiServer()
      if (patch.apiPort > 0) startApiServer(onProfileStatus)
    }
    return next
  })
  ipcMain.handle(IPC.SettingsDetectChrome, () => findChromeBinary())

  /* ---------- API ---------- */
  ipcMain.handle(IPC.ApiInfo, () => getApiInfo())

  /* ---------- system ---------- */
  ipcMain.handle(IPC.SystemOpenPath, (_e, p: string) => shell.openPath(p))
  ipcMain.handle(IPC.SystemSelectFile, async () => {
    const r = await dialog.showOpenDialog({ properties: ['openFile'] })
    return r.canceled ? null : r.filePaths[0]
  })
  ipcMain.handle(IPC.SystemSelectDir, async () => {
    const r = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    return r.canceled ? null : r.filePaths[0]
  })
}
