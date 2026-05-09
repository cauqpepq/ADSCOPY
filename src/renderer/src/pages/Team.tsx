import { Users } from 'lucide-react'
import { EmptyState } from '../components/EmptyState'
import { useT } from '../i18n'

export function TeamPage(): JSX.Element {
  const t = useT()
  return (
    <div className="p-6">
      <EmptyState icon={Users} title={t('team.title')} description={t('team.empty')} />
    </div>
  )
}
