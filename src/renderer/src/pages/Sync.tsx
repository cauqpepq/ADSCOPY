import { RefreshCw } from 'lucide-react'
import { EmptyState } from '../components/EmptyState'
import { useT } from '../i18n'

export function SyncPage(): JSX.Element {
  const t = useT()
  return (
    <div className="p-6">
      <EmptyState
        icon={RefreshCw}
        title={t('sync.title')}
        description={t('sync.empty')}
      />
    </div>
  )
}
