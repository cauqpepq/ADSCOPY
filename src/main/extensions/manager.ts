import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { app } from 'electron'
import { extensionRepo } from '@main/db'
import type { ExtensionEntry } from '@shared/types'

function extensionsRoot(): string {
  const root = path.join(app.getPath('userData'), 'extensions')
  if (!fs.existsSync(root)) fs.mkdirSync(root, { recursive: true })
  return root
}

interface ManifestV3 {
  name?: string
  version?: string
  description?: string
}

function readManifest(extDir: string): ManifestV3 | null {
  try {
    const m = fs.readFileSync(path.join(extDir, 'manifest.json'), 'utf8')
    return JSON.parse(m)
  } catch {
    return null
  }
}

/**
 * Add an extension from an unpacked directory.
 * Validates manifest.json, copies it to the user-data extensions dir.
 */
export async function addUnpackedExtension(srcDir: string): Promise<ExtensionEntry> {
  const manifest = readManifest(srcDir)
  if (!manifest) throw new Error('manifest.json not found or invalid in ' + srcDir)

  const id = (manifest.name || 'ext').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now()
  const dest = path.join(extensionsRoot(), id)
  await copyDir(srcDir, dest)

  return extensionRepo.add({
    name: manifest.name || path.basename(srcDir),
    version: manifest.version || '0.0.0',
    path: dest,
    description: manifest.description,
    enabled: true
  })
}

async function copyDir(src: string, dest: string): Promise<void> {
  await fs.promises.mkdir(dest, { recursive: true })
  for (const entry of await fs.promises.readdir(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name)
    const d = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      await copyDir(s, d)
    } else if (entry.isFile()) {
      await fs.promises.copyFile(s, d)
    }
  }
}

/**
 * Remove an extension and delete its files.
 */
export function removeExtension(id: string): void {
  const ext = extensionRepo.list().find((e) => e.id === id)
  if (!ext) return
  extensionRepo.remove(id)
  try {
    if (fs.existsSync(ext.path)) fs.rmSync(ext.path, { recursive: true, force: true })
  } catch {
    /* swallow */
  }
}

void os
