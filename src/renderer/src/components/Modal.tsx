import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '../lib/utils'

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md'
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}): JSX.Element {
  const sizeCls = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl'
  }[size]

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink-900/50 backdrop-blur-[2px]" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white shadow-xl dark:bg-ink-900 dark:shadow-2xl',
            sizeCls
          )}
        >
          <div className="flex items-start justify-between border-b border-line px-5 py-3">
            <div>
              <Dialog.Title className="text-base font-semibold text-base-strong">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="mt-1 text-sm text-base-mute">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-600 dark:text-ink-500 dark:hover:bg-ink-800 dark:hover:text-ink-200">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <div className="max-h-[70vh] overflow-auto px-5 py-4">{children}</div>
          {footer && (
            <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
