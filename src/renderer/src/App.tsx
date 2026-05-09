import { useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { StatusBar } from './components/StatusBar'
import { ProfilesPage } from './pages/Profiles'
import { GroupsPage } from './pages/Groups'
import { ApplicationCenterPage } from './pages/ApplicationCenter'
import { ProxiesPage } from './pages/Proxies'
import { RpaPage } from './pages/Rpa'
import { ApiPage } from './pages/Api'
import { SyncPage } from './pages/Sync'
import { StatisticsPage } from './pages/Statistics'
import { SettingsPage } from './pages/Settings'
import { TeamPage } from './pages/Team'
import { useStore } from './store'

export function App(): JSX.Element {
  const page = useStore((s) => s.page)
  const theme = useStore((s) => s.theme)
  const refreshAll = useStore((s) => s.refreshAll)
  const refreshProfiles = useStore((s) => s.refreshProfiles)
  const refreshRuns = useStore((s) => s.refreshRuns)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

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
    <div className="flex h-screen w-screen overflow-hidden bg-ink-50 text-ink-800 dark:bg-ink-950 dark:text-ink-100">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-hidden">
          {page === 'profiles' && <ProfilesPage />}
          {page === 'groups' && <GroupsPage />}
          {page === 'application-center' && <ApplicationCenterPage />}
          {page === 'proxies' && <ProxiesPage />}
          {page === 'rpa' && <RpaPage />}
          {page === 'api' && <ApiPage />}
          {page === 'sync' && <SyncPage />}
          {page === 'statistics' && <StatisticsPage />}
          {page === 'team' && <TeamPage />}
          {page === 'settings' && <SettingsPage />}
        </main>
        <StatusBar />
      </div>
    </div>
  )
}
