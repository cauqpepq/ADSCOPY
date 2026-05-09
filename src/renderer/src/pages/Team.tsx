import { Users } from 'lucide-react'
import { EmptyState } from '../components/EmptyState'

export function TeamPage(): JSX.Element {
  return (
    <div className="p-6">
      <EmptyState
        icon={Users}
        title="Team collaboration"
        description="In real AdsPower, this section lets you invite teammates, share profiles, and assign roles. Replicating that requires a server-side backend, which is out of scope for this open-source clone."
      />
    </div>
  )
}
