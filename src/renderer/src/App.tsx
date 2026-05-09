import { useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { ProfilesPage } from './pages/Profiles'
import { ProxiesPage } from './pages/Proxies'
import { ExtensionsPage } from './pages/Extensions'
import { AutomationPage } from './pages/Automation'
import { SettingsPage } from './pages/Settings'
import { TeamPage } from './pages/Team'
import { useStore } from './store'

export function App(): JSX.Element {
  const page = useStore((s) => s.page)
  const refreshAll = useStore((s) => s.refreshAll)
  const refreshProfiles = useStore((s) => s.refreshProfiles)
  const refreshRuns = useStore((s) => s.refreshRuns)

  useEffect(() => {
    void refreshAll()
    const offStatus = window.api.onProfileStatusChanged(() => {
      void refreshProfiles()
    })
    const offRun = window.api.onRunUpdated(() => {
      void refreshRuns()
    })
    return () => {
      offStatus()
      offRun()
    }
  }, [refreshAll, refreshProfiles, refreshRuns])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto">
          {page === 'profiles' && <ProfilesPage />}
          {page === 'proxies' && <ProxiesPage />}
          {page === 'extensions' && <ExtensionsPage />}
          {page === 'automation' && <AutomationPage />}
          {page === 'team' && <TeamPage />}
          {page === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  )
}
