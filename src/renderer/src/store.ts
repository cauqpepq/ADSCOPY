import { create } from 'zustand'
import type {
  AppSettings,
  AutomationRun,
  AutomationScenario,
  BrowserProfile,
  ExtensionEntry,
  LocalApiInfo,
  ProfileFolder,
  ProxyConfig
} from '@shared/types'

type Page = 'profiles' | 'proxies' | 'extensions' | 'automation' | 'team' | 'settings'

interface AppState {
  page: Page
  setPage: (p: Page) => void

  profiles: BrowserProfile[]
  folders: ProfileFolder[]
  proxies: ProxyConfig[]
  extensions: ExtensionEntry[]
  scenarios: AutomationScenario[]
  runs: AutomationRun[]
  settings: AppSettings | null
  apiInfo: LocalApiInfo | null
  selectedFolderId: string | null
  search: string

  refreshAll: () => Promise<void>
  refreshProfiles: () => Promise<void>
  refreshFolders: () => Promise<void>
  refreshProxies: () => Promise<void>
  refreshExtensions: () => Promise<void>
  refreshScenarios: () => Promise<void>
  refreshRuns: () => Promise<void>
  refreshSettings: () => Promise<void>
  refreshApiInfo: () => Promise<void>

  setSelectedFolderId: (id: string | null) => void
  setSearch: (s: string) => void
}

export const useStore = create<AppState>((set, get) => ({
  page: 'profiles',
  setPage: (p) => set({ page: p }),

  profiles: [],
  folders: [],
  proxies: [],
  extensions: [],
  scenarios: [],
  runs: [],
  settings: null,
  apiInfo: null,
  selectedFolderId: null,
  search: '',

  setSelectedFolderId: (id) => set({ selectedFolderId: id }),
  setSearch: (s) => set({ search: s }),

  refreshAll: async () => {
    await Promise.all([
      get().refreshProfiles(),
      get().refreshFolders(),
      get().refreshProxies(),
      get().refreshExtensions(),
      get().refreshScenarios(),
      get().refreshRuns(),
      get().refreshSettings(),
      get().refreshApiInfo()
    ])
  },
  refreshProfiles: async () => {
    set({ profiles: await window.api.profilesList() })
  },
  refreshFolders: async () => {
    set({ folders: await window.api.foldersList() })
  },
  refreshProxies: async () => {
    set({ proxies: await window.api.proxiesList() })
  },
  refreshExtensions: async () => {
    set({ extensions: await window.api.extensionsList() })
  },
  refreshScenarios: async () => {
    set({ scenarios: await window.api.scenariosList() })
  },
  refreshRuns: async () => {
    set({ runs: await window.api.runsList() })
  },
  refreshSettings: async () => {
    set({ settings: await window.api.settingsGet() })
  },
  refreshApiInfo: async () => {
    set({ apiInfo: await window.api.apiInfo() })
  }
}))
