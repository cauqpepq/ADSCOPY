import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleString()
  } catch {
    return iso
  }
}

export function formatProxy(p: { type: string; host?: string; port?: number; username?: string }): string {
  if (!p || p.type === 'none' || !p.host) return 'No proxy'
  const auth = p.username ? `${p.username}@` : ''
  return `${p.type.toUpperCase()} ${auth}${p.host}:${p.port}`
}
