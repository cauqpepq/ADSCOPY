/**
 * Shared types between Electron main, preload, and renderer.
 */

export type OS = 'windows' | 'macos' | 'linux'
export type Browser = 'chrome' | 'firefox'

export interface ProxyConfig {
  id?: string
  name?: string
  type: 'none' | 'http' | 'https' | 'socks4' | 'socks5'
  host?: string
  port?: number
  username?: string
  password?: string
}

export interface FingerprintConfig {
  /** User-Agent string */
  userAgent: string
  /** Operating system label exposed via UA-CH and platform */
  os: OS
  /** Browser engine label */
  browser: Browser
  /** Major version of the browser engine */
  browserVersion: number
  /** Locale, e.g. en-US */
  locale: string
  /** IETF list of preferred languages, e.g. ['en-US','en'] */
  languages: string[]
  /** IANA timezone, e.g. Europe/Moscow */
  timezone: string
  /** Geolocation override */
  geolocation?: { latitude: number; longitude: number; accuracy: number } | null
  /** Screen */
  screen: {
    width: number
    height: number
    availWidth: number
    availHeight: number
    colorDepth: number
    pixelDepth: number
    devicePixelRatio: number
  }
  /** Hardware concurrency (cores) */
  hardwareConcurrency: number
  /** Device memory in GB */
  deviceMemory: number
  /** Canvas fingerprint mode */
  canvas: 'noise' | 'block' | 'off'
  /** WebGL fingerprint mode + vendor/renderer override */
  webgl: {
    mode: 'noise' | 'block' | 'off'
    vendor?: string
    renderer?: string
  }
  /** AudioContext fingerprint mode */
  audio: 'noise' | 'block' | 'off'
  /** WebRTC mode */
  webrtc: 'real' | 'altered' | 'disabled'
  /** Whitelisted fonts */
  fonts: string[]
  /** Media devices reported by the browser */
  mediaDevices: { videoinputs: number; audioinputs: number; audiooutputs: number }
  /** Stable per-profile noise seed for deterministic randomization */
  noiseSeed: number
}

export interface ProfileFolder {
  id: string
  name: string
  color: string
  parentId?: string | null
  createdAt: string
}

export interface BrowserProfile {
  id: string
  name: string
  folderId?: string | null
  notes?: string
  tags: string[]
  group?: string
  fingerprint: FingerprintConfig
  proxy: ProxyConfig
  /** URLs opened on launch */
  startupUrls: string[]
  /** IDs of extensions to load */
  extensionIds: string[]
  /** Path to user-data-dir on disk */
  userDataDir: string
  /** Cookie storage (JSON) */
  cookies: SerializedCookie[]
  /** Last status */
  status: 'idle' | 'running' | 'error'
  /** Last error (if any) */
  lastError?: string | null
  /** Last opened time */
  lastOpenedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface SerializedCookie {
  name: string
  value: string
  domain: string
  path: string
  expires?: number
  size?: number
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'Strict' | 'Lax' | 'None'
}

export interface ExtensionEntry {
  id: string
  name: string
  version: string
  /** Absolute path to unpacked extension directory */
  path: string
  description?: string
  enabled: boolean
  createdAt: string
}

export interface AutomationScenario {
  id: string
  name: string
  description?: string
  /** JSON steps */
  steps: AutomationStep[]
  createdAt: string
  updatedAt: string
}

export type AutomationStep =
  | { type: 'goto'; url: string }
  | { type: 'wait'; ms: number }
  | { type: 'waitForSelector'; selector: string; timeoutMs?: number }
  | { type: 'click'; selector: string }
  | { type: 'type'; selector: string; text: string; delay?: number }
  | { type: 'press'; key: string }
  | { type: 'evaluate'; script: string }
  | { type: 'screenshot'; path?: string }
  | { type: 'scroll'; x?: number; y?: number }

export interface AutomationRun {
  id: string
  scenarioId: string
  profileId: string
  status: 'pending' | 'running' | 'success' | 'failed'
  startedAt: string
  endedAt?: string
  log: string[]
  error?: string
}

export interface AppSettings {
  /** Path to chrome / chromium binary; auto-detected if empty */
  chromePath: string
  /** Default download dir for profile data */
  profilesDir: string
  /** Local API server port (0 = disabled) */
  apiPort: number
  /** Theme */
  theme: 'light' | 'dark'
  /** UI language */
  uiLanguage: 'en' | 'ru'
}

export interface LaunchResult {
  ok: boolean
  pid?: number
  cdpEndpoint?: string
  error?: string
}

export interface LocalApiInfo {
  enabled: boolean
  port: number
  baseUrl: string
}
