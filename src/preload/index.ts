import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/ipc-channels'

const api = {
  /* folders */
  foldersList: () => ipcRenderer.invoke(IPC.FoldersList),
  foldersCreate: (input: any) => ipcRenderer.invoke(IPC.FoldersCreate, input),
  foldersUpdate: (id: string, patch: any) => ipcRenderer.invoke(IPC.FoldersUpdate, id, patch),
  foldersDelete: (id: string) => ipcRenderer.invoke(IPC.FoldersDelete, id),

  /* profiles */
  profilesList: () => ipcRenderer.invoke(IPC.ProfilesList),
  profilesGet: (id: string) => ipcRenderer.invoke(IPC.ProfilesGet, id),
  profilesCreate: (input: any) => ipcRenderer.invoke(IPC.ProfilesCreate, input),
  profilesUpdate: (id: string, patch: any) => ipcRenderer.invoke(IPC.ProfilesUpdate, id, patch),
  profilesDelete: (id: string) => ipcRenderer.invoke(IPC.ProfilesDelete, id),
  profilesDuplicate: (id: string) => ipcRenderer.invoke(IPC.ProfilesDuplicate, id),
  profilesLaunch: (id: string) => ipcRenderer.invoke(IPC.ProfilesLaunch, id),
  profilesClose: (id: string) => ipcRenderer.invoke(IPC.ProfilesClose, id),
  profilesImportCookies: (id: string, raw: string) =>
    ipcRenderer.invoke(IPC.ProfilesImportCookies, id, raw),
  profilesExportCookies: (id: string, format: 'json' | 'netscape') =>
    ipcRenderer.invoke(IPC.ProfilesExportCookies, id, format),

  /* proxies */
  proxiesList: () => ipcRenderer.invoke(IPC.ProxiesList),
  proxiesCreate: (input: any) => ipcRenderer.invoke(IPC.ProxiesCreate, input),
  proxiesUpdate: (id: string, patch: any) => ipcRenderer.invoke(IPC.ProxiesUpdate, id, patch),
  proxiesDelete: (id: string) => ipcRenderer.invoke(IPC.ProxiesDelete, id),
  proxiesTest: (p: any) => ipcRenderer.invoke(IPC.ProxiesTest, p),
  proxiesImportBulk: (raw: string) => ipcRenderer.invoke(IPC.ProxiesImportBulk, raw),

  /* extensions */
  extensionsList: () => ipcRenderer.invoke(IPC.ExtensionsList),
  extensionsAdd: (srcDir: string) => ipcRenderer.invoke(IPC.ExtensionsAdd, srcDir),
  extensionsRemove: (id: string) => ipcRenderer.invoke(IPC.ExtensionsRemove, id),
  extensionsToggle: (id: string, enabled: boolean) =>
    ipcRenderer.invoke(IPC.ExtensionsToggle, id, enabled),

  /* automation */
  scenariosList: () => ipcRenderer.invoke(IPC.ScenariosList),
  scenariosCreate: (input: any) => ipcRenderer.invoke(IPC.ScenariosCreate, input),
  scenariosUpdate: (id: string, patch: any) => ipcRenderer.invoke(IPC.ScenariosUpdate, id, patch),
  scenariosDelete: (id: string) => ipcRenderer.invoke(IPC.ScenariosDelete, id),
  scenariosRun: (scenarioId: string, profileId: string) =>
    ipcRenderer.invoke(IPC.ScenariosRun, scenarioId, profileId),
  runsList: () => ipcRenderer.invoke(IPC.RunsList),

  /* fingerprint */
  fingerprintGenerate: (opts?: any) => ipcRenderer.invoke(IPC.FingerprintGenerate, opts),
  fingerprintPresets: () => ipcRenderer.invoke(IPC.FingerprintPresets),

  /* settings */
  settingsGet: () => ipcRenderer.invoke(IPC.SettingsGet),
  settingsUpdate: (patch: any) => ipcRenderer.invoke(IPC.SettingsUpdate, patch),
  settingsDetectChrome: () => ipcRenderer.invoke(IPC.SettingsDetectChrome),

  /* api */
  apiInfo: () => ipcRenderer.invoke(IPC.ApiInfo),

  /* system */
  systemOpenPath: (p: string) => ipcRenderer.invoke(IPC.SystemOpenPath, p),
  systemSelectFile: () => ipcRenderer.invoke(IPC.SystemSelectFile),
  systemSelectDir: () => ipcRenderer.invoke(IPC.SystemSelectDir),

  /* events */
  onProfileStatusChanged: (cb: (e: { id: string; status: string; error?: string }) => void) => {
    const sub = (_e: any, payload: any): void => cb(payload)
    ipcRenderer.on(IPC.EventProfileStatusChanged, sub)
    return () => ipcRenderer.removeListener(IPC.EventProfileStatusChanged, sub)
  },
  onRunUpdated: (cb: (run: any) => void) => {
    const sub = (_e: any, payload: any): void => cb(payload)
    ipcRenderer.on(IPC.EventRunUpdated, sub)
    return () => ipcRenderer.removeListener(IPC.EventRunUpdated, sub)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
