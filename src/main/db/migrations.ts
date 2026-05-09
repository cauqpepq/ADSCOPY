/**
 * SQL migrations.
 * Each entry is applied in order if its index >= current schema version.
 */
export const MIGRATIONS: string[] = [
  /* 0 */ `
    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#1a88dc',
      parent_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS proxies (
      id TEXT PRIMARY KEY,
      name TEXT,
      type TEXT NOT NULL,
      host TEXT,
      port INTEGER,
      username TEXT,
      password TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
      notes TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      "group" TEXT,
      fingerprint TEXT NOT NULL,
      proxy TEXT NOT NULL,
      startup_urls TEXT NOT NULL DEFAULT '[]',
      extension_ids TEXT NOT NULL DEFAULT '[]',
      user_data_dir TEXT NOT NULL,
      cookies TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'idle',
      last_error TEXT,
      last_opened_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS extensions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      version TEXT NOT NULL,
      path TEXT NOT NULL,
      description TEXT,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scenarios (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      steps TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      scenario_id TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ended_at TEXT,
      log TEXT NOT NULL DEFAULT '[]',
      error TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `
]
