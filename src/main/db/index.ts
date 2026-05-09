import path from 'node:path'
import fs from 'node:fs'
import Database from 'better-sqlite3'
import { app } from 'electron'
import { v4 as uuid } from 'uuid'
import { MIGRATIONS } from './migrations'
import type {
  AppSettings,
  AutomationRun,
  AutomationScenario,
  BrowserProfile,
  ExtensionEntry,
  ProfileFolder,
  ProxyConfig
} from '@shared/types'

let db: Database.Database

function getDataDir(): string {
  const dir = path.join(app.getPath('userData'), 'data')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function initDb(): void {
  const dbPath = path.join(getDataDir(), 'adspower-clone.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  const userVersion = db.pragma('user_version', { simple: true }) as number
  for (let i = userVersion; i < MIGRATIONS.length; i++) {
    db.exec(MIGRATIONS[i])
    db.pragma(`user_version = ${i + 1}`)
  }
}

export function getDb(): Database.Database {
  if (!db) initDb()
  return db
}

export function getProfilesRoot(): string {
  const dir = path.join(app.getPath('userData'), 'profiles-data')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

/* ---------- helpers ---------- */

function nowIso(): string {
  return new Date().toISOString()
}

function rowToProfile(row: any): BrowserProfile {
  return {
    id: row.id,
    name: row.name,
    folderId: row.folder_id,
    notes: row.notes ?? undefined,
    tags: JSON.parse(row.tags || '[]'),
    group: row.group ?? undefined,
    fingerprint: JSON.parse(row.fingerprint),
    proxy: JSON.parse(row.proxy),
    startupUrls: JSON.parse(row.startup_urls || '[]'),
    extensionIds: JSON.parse(row.extension_ids || '[]'),
    userDataDir: row.user_data_dir,
    cookies: JSON.parse(row.cookies || '[]'),
    status: row.status,
    lastError: row.last_error,
    lastOpenedAt: row.last_opened_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/* ---------- folders ---------- */

export const folderRepo = {
  list(): ProfileFolder[] {
    return getDb()
      .prepare('SELECT * FROM folders ORDER BY name COLLATE NOCASE')
      .all()
      .map((r: any) => ({
        id: r.id,
        name: r.name,
        color: r.color,
        parentId: r.parent_id,
        createdAt: r.created_at
      }))
  },
  create(input: Omit<ProfileFolder, 'id' | 'createdAt'>): ProfileFolder {
    const id = uuid()
    getDb()
      .prepare('INSERT INTO folders (id, name, color, parent_id) VALUES (?,?,?,?)')
      .run(id, input.name, input.color, input.parentId ?? null)
    return { id, ...input, createdAt: nowIso() }
  },
  update(id: string, patch: Partial<ProfileFolder>): void {
    const cur = getDb().prepare('SELECT * FROM folders WHERE id = ?').get(id) as any
    if (!cur) return
    getDb()
      .prepare('UPDATE folders SET name=?, color=?, parent_id=? WHERE id=?')
      .run(
        patch.name ?? cur.name,
        patch.color ?? cur.color,
        patch.parentId ?? cur.parent_id,
        id
      )
  },
  delete(id: string): void {
    getDb().prepare('DELETE FROM folders WHERE id = ?').run(id)
  }
}

/* ---------- proxies ---------- */

export const proxyRepo = {
  list(): ProxyConfig[] {
    return getDb()
      .prepare('SELECT * FROM proxies ORDER BY created_at DESC')
      .all()
      .map((r: any) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        host: r.host,
        port: r.port,
        username: r.username,
        password: r.password
      }))
  },
  create(input: Omit<ProxyConfig, 'id'>): ProxyConfig {
    const id = uuid()
    getDb()
      .prepare(
        'INSERT INTO proxies (id, name, type, host, port, username, password) VALUES (?,?,?,?,?,?,?)'
      )
      .run(
        id,
        input.name ?? null,
        input.type,
        input.host ?? null,
        input.port ?? null,
        input.username ?? null,
        input.password ?? null
      )
    return { id, ...input }
  },
  update(id: string, patch: Partial<ProxyConfig>): void {
    const cur = getDb().prepare('SELECT * FROM proxies WHERE id = ?').get(id) as any
    if (!cur) return
    getDb()
      .prepare(
        'UPDATE proxies SET name=?, type=?, host=?, port=?, username=?, password=? WHERE id=?'
      )
      .run(
        patch.name ?? cur.name,
        patch.type ?? cur.type,
        patch.host ?? cur.host,
        patch.port ?? cur.port,
        patch.username ?? cur.username,
        patch.password ?? cur.password,
        id
      )
  },
  delete(id: string): void {
    getDb().prepare('DELETE FROM proxies WHERE id = ?').run(id)
  }
}

/* ---------- profiles ---------- */

export const profileRepo = {
  list(): BrowserProfile[] {
    return getDb()
      .prepare('SELECT * FROM profiles ORDER BY updated_at DESC')
      .all()
      .map(rowToProfile)
  },
  get(id: string): BrowserProfile | undefined {
    const row = getDb().prepare('SELECT * FROM profiles WHERE id = ?').get(id)
    return row ? rowToProfile(row) : undefined
  },
  create(input: Omit<BrowserProfile, 'id' | 'createdAt' | 'updatedAt'>): BrowserProfile {
    const id = uuid()
    const now = nowIso()
    const userDataDir = input.userDataDir || path.join(getProfilesRoot(), id)
    if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true })
    getDb()
      .prepare(
        `INSERT INTO profiles
          (id, name, folder_id, notes, tags, "group", fingerprint, proxy,
           startup_urls, extension_ids, user_data_dir, cookies, status,
           last_error, last_opened_at, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
      )
      .run(
        id,
        input.name,
        input.folderId ?? null,
        input.notes ?? null,
        JSON.stringify(input.tags ?? []),
        input.group ?? null,
        JSON.stringify(input.fingerprint),
        JSON.stringify(input.proxy),
        JSON.stringify(input.startupUrls ?? []),
        JSON.stringify(input.extensionIds ?? []),
        userDataDir,
        JSON.stringify(input.cookies ?? []),
        input.status ?? 'idle',
        input.lastError ?? null,
        input.lastOpenedAt ?? null,
        now,
        now
      )
    return { ...input, id, userDataDir, createdAt: now, updatedAt: now }
  },
  update(id: string, patch: Partial<BrowserProfile>): BrowserProfile | undefined {
    const cur = profileRepo.get(id)
    if (!cur) return undefined
    const merged: BrowserProfile = { ...cur, ...patch, id, updatedAt: nowIso() }
    getDb()
      .prepare(
        `UPDATE profiles SET
           name=?, folder_id=?, notes=?, tags=?, "group"=?, fingerprint=?, proxy=?,
           startup_urls=?, extension_ids=?, user_data_dir=?, cookies=?, status=?,
           last_error=?, last_opened_at=?, updated_at=?
         WHERE id=?`
      )
      .run(
        merged.name,
        merged.folderId ?? null,
        merged.notes ?? null,
        JSON.stringify(merged.tags),
        merged.group ?? null,
        JSON.stringify(merged.fingerprint),
        JSON.stringify(merged.proxy),
        JSON.stringify(merged.startupUrls),
        JSON.stringify(merged.extensionIds),
        merged.userDataDir,
        JSON.stringify(merged.cookies),
        merged.status,
        merged.lastError ?? null,
        merged.lastOpenedAt ?? null,
        merged.updatedAt,
        id
      )
    return merged
  },
  delete(id: string): void {
    const p = profileRepo.get(id)
    getDb().prepare('DELETE FROM profiles WHERE id = ?').run(id)
    if (p && fs.existsSync(p.userDataDir)) {
      try {
        fs.rmSync(p.userDataDir, { recursive: true, force: true })
      } catch {
        /* swallow */
      }
    }
  }
}

/* ---------- extensions ---------- */

export const extensionRepo = {
  list(): ExtensionEntry[] {
    return getDb()
      .prepare('SELECT * FROM extensions ORDER BY name COLLATE NOCASE')
      .all()
      .map((r: any) => ({
        id: r.id,
        name: r.name,
        version: r.version,
        path: r.path,
        description: r.description ?? undefined,
        enabled: !!r.enabled,
        createdAt: r.created_at
      }))
  },
  add(input: Omit<ExtensionEntry, 'id' | 'createdAt'>): ExtensionEntry {
    const id = uuid()
    getDb()
      .prepare(
        'INSERT INTO extensions (id, name, version, path, description, enabled) VALUES (?,?,?,?,?,?)'
      )
      .run(id, input.name, input.version, input.path, input.description ?? null, input.enabled ? 1 : 0)
    return { ...input, id, createdAt: nowIso() }
  },
  remove(id: string): void {
    getDb().prepare('DELETE FROM extensions WHERE id = ?').run(id)
  },
  toggle(id: string, enabled: boolean): void {
    getDb().prepare('UPDATE extensions SET enabled = ? WHERE id = ?').run(enabled ? 1 : 0, id)
  }
}

/* ---------- scenarios ---------- */

export const scenarioRepo = {
  list(): AutomationScenario[] {
    return getDb()
      .prepare('SELECT * FROM scenarios ORDER BY updated_at DESC')
      .all()
      .map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description ?? undefined,
        steps: JSON.parse(r.steps || '[]'),
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }))
  },
  create(input: Omit<AutomationScenario, 'id' | 'createdAt' | 'updatedAt'>): AutomationScenario {
    const id = uuid()
    const now = nowIso()
    getDb()
      .prepare(
        'INSERT INTO scenarios (id, name, description, steps, created_at, updated_at) VALUES (?,?,?,?,?,?)'
      )
      .run(id, input.name, input.description ?? null, JSON.stringify(input.steps), now, now)
    return { ...input, id, createdAt: now, updatedAt: now }
  },
  update(id: string, patch: Partial<AutomationScenario>): void {
    const cur = getDb().prepare('SELECT * FROM scenarios WHERE id = ?').get(id) as any
    if (!cur) return
    getDb()
      .prepare(
        'UPDATE scenarios SET name=?, description=?, steps=?, updated_at=? WHERE id=?'
      )
      .run(
        patch.name ?? cur.name,
        patch.description ?? cur.description,
        JSON.stringify(patch.steps ?? JSON.parse(cur.steps)),
        nowIso(),
        id
      )
  },
  delete(id: string): void {
    getDb().prepare('DELETE FROM scenarios WHERE id = ?').run(id)
  }
}

/* ---------- runs ---------- */

export const runRepo = {
  list(limit = 50): AutomationRun[] {
    return getDb()
      .prepare('SELECT * FROM runs ORDER BY started_at DESC LIMIT ?')
      .all(limit)
      .map((r: any) => ({
        id: r.id,
        scenarioId: r.scenario_id,
        profileId: r.profile_id,
        status: r.status,
        startedAt: r.started_at,
        endedAt: r.ended_at ?? undefined,
        log: JSON.parse(r.log || '[]'),
        error: r.error ?? undefined
      }))
  },
  create(input: Omit<AutomationRun, 'id' | 'startedAt'>): AutomationRun {
    const id = uuid()
    const startedAt = nowIso()
    getDb()
      .prepare(
        'INSERT INTO runs (id, scenario_id, profile_id, status, started_at, log, error) VALUES (?,?,?,?,?,?,?)'
      )
      .run(
        id,
        input.scenarioId,
        input.profileId,
        input.status,
        startedAt,
        JSON.stringify(input.log ?? []),
        input.error ?? null
      )
    return { ...input, id, startedAt }
  },
  update(id: string, patch: Partial<AutomationRun>): void {
    const cur = getDb().prepare('SELECT * FROM runs WHERE id = ?').get(id) as any
    if (!cur) return
    getDb()
      .prepare('UPDATE runs SET status=?, ended_at=?, log=?, error=? WHERE id=?')
      .run(
        patch.status ?? cur.status,
        patch.endedAt ?? cur.ended_at,
        JSON.stringify(patch.log ?? JSON.parse(cur.log)),
        patch.error ?? cur.error,
        id
      )
  }
}

/* ---------- settings ---------- */

const DEFAULT_SETTINGS: AppSettings = {
  chromePath: '',
  profilesDir: '',
  apiPort: 50325,
  theme: 'light',
  uiLanguage: 'en'
}

export const settingsRepo = {
  get(): AppSettings {
    const rows = getDb().prepare('SELECT key, value FROM settings').all() as Array<{
      key: string
      value: string
    }>
    const out: any = { ...DEFAULT_SETTINGS }
    for (const r of rows) {
      try {
        out[r.key] = JSON.parse(r.value)
      } catch {
        out[r.key] = r.value
      }
    }
    return out as AppSettings
  },
  update(patch: Partial<AppSettings>): AppSettings {
    const stmt = getDb().prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value'
    )
    for (const [k, v] of Object.entries(patch)) {
      stmt.run(k, JSON.stringify(v))
    }
    return settingsRepo.get()
  }
}
