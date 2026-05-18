import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import { AppointmentsPage } from './pages/Appointments'
import { DashboardPage } from './pages/Dashboard'
import { MapPage } from './pages/Map'
import { TechniciansPage } from './pages/Technicians'

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
        <Sidebar />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="min-h-0 flex-1 p-4 md:p-6">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/technicians" element={<TechniciansPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  )
}

export default App
