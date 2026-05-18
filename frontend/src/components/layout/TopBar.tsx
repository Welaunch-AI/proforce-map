import { useLocation } from 'react-router-dom'
import { SyncIndicator } from './SyncIndicator'

const titles: Record<string, string> = {
  '/': 'Dashboard',
  '/appointments': 'Appointments',
  '/technicians': 'Technicians',
}

export function TopBar() {
  const location = useLocation()
  return (
    <header className="glass-panel sticky top-0 z-10 flex h-16 items-center justify-between border-x-0 border-t-0 px-4 md:px-6">
      <h1 className="text-xl font-semibold">{titles[location.pathname] ?? 'Operations'}</h1>
      <SyncIndicator />
    </header>
  )
}
