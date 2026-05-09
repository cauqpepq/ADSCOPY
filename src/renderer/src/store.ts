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

export type Page =
  | 'profiles'
  | 'groups'
  | 'application-center'
  | 'rpa'
  | 'proxies'
  | 'api'
  | 'sync'
  | 'statistics'
  | 'team'
  | 'settings'

export type Theme = 'light' | 'dark'
export type Lang = 'en' | 'ru' | 'zh'

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

  selectedProfileIds: Set<string>
  toggleProfileSelection: (id: string) => void
  setProfileSelection: (ids: string[]) => void
  clearProfileSelection: () => void

  theme: Theme
  setTheme: (t: Theme) => void
  lang: Lang
  setLang: (l: Lang) => void

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

const STORAGE_KEYS = {
  theme: 'apc.theme',
  lang: 'apc.lang'
} as const

const initialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light'
  const saved = window.localStorage.getItem(STORAGE_KEYS.theme)
  return saved === 'dark' ? 'dark' : 'light'
}

const initialLang = (): Lang => {
  if (typeof window === 'undefined') return 'en'
  const saved = window.localStorage.getItem(STORAGE_KEYS.lang)
  if (saved === 'ru' || saved === 'zh' || saved === 'en') return saved
  const nav = window.navigator.language.toLowerCase()
  if (nav.startsWith('ru')) return 'ru'
  if (nav.startsWith('zh')) return 'zh'
  return 'en'
}

export const useStore = create<AppState>((set, get) => ({
  page: 'profiles',
  setPage: (p) => set({ page: p, selectedProfileIds: new Set() }),

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

  selectedProfileIds: new Set<string>(),
  toggleProfileSelection: (id) =>
    set((s) => {
      const next = new Set(s.selectedProfileIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { selectedProfileIds: next }
    }),
  setProfileSelection: (ids) => set({ selectedProfileIds: new Set(ids) }),
  clearProfileSelection: () => set({ selectedProfileIds: new Set() }),

  theme: initialTheme(),
  setTheme: (t) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEYS.theme, t)
      document.documentElement.classList.toggle('dark', t === 'dark')
    }
    set({ theme: t })
  },
  lang: initialLang(),
  setLang: (l) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEYS.lang, l)
    set({ lang: l })
  },

  setSelectedFolderId: (id) => set({ selectedFolderId: id, selectedProfileIds: new Set() }),
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
