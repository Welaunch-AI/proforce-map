import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import { AppointmentsPage } from './pages/Appointments'
import { DashboardPage } from './pages/Dashboard'
import { MapPage } from './pages/Map'
import { ReconciliationPage } from './pages/Reconciliation'
import { TechniciansPage } from './pages/Technicians'
import { UserKindDetailsPage } from './pages/UserKindDetails'

function AppLayout() {
  const location = useLocation()
  const isMapRoute = location.pathname === '/map'

  return (
    <div className="flex min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <Sidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <TopBar />
        <main
          className={`min-h-0 flex-1 ${isMapRoute ? 'overflow-hidden p-0' : 'p-4 md:p-6'}`}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/map" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/technicians" element={<TechniciansPage />} />
            <Route path="/reconciliation" element={<ReconciliationPage />} />
            <Route path="/user-kind-details" element={<UserKindDetailsPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="*" element={<Navigate to="/map" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  )
}

export default App
