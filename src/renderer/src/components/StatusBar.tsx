import { Github, Server } from 'lucide-react'
import { useStore } from '../store'
import { cn } from '../lib/utils'

export function StatusBar(): JSX.Element {
  const apiInfo = useStore((s) => s.apiInfo)
  const profiles = useStore((s) => s.profiles)
  const running = profiles.filter((p) => p.status === 'running').length

  return (
    <footer className="flex h-8 shrink-0 items-center justify-between border-t border-line surface px-4 text-[11px] text-base-mute">
      <div className="flex items-center gap-4">
        <span className="font-medium text-base-soft">v0.1.0</span>
        <span className="hidden sm:flex items-center gap-1.5">
          <Server className="h-3 w-3" />
          {apiInfo?.enabled ? (
            <span>
              Local API
              <span className="mx-1 text-ink-400 dark:text-ink-500">·</span>
              <span className="font-mono">127.0.0.1:{apiInfo.port}</span>
              <span
                className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"
                aria-label="online"
              />
            </span>
          ) : (
            <span>
              Local API
              <span
                className={cn(
                  'ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-ink-300 dark:bg-ink-600'
                )}
                aria-label="offline"
              />
            </span>
          )}
        </span>
        <span>{running} running</span>
        <span>{profiles.length} profiles</span>
      </div>
      <div className="flex items-center gap-3">
        <a
          href="https://github.com/cauqpepq/ADSCOPY"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 hover:text-base-strong"
        >
          <Github className="h-3 w-3" />
          GitHub
        </a>
        <span className="hidden md:inline">Open source · MIT</span>
      </div>
    </footer>
  )
}
