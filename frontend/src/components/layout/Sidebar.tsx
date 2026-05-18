import { CalendarDays, Grid2x2, MapPinned, PanelLeft, Users } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard', icon: Grid2x2 },
  { to: '/appointments', label: 'Appointments', icon: CalendarDays },
  { to: '/technicians', label: 'Technicians', icon: Users },
  { to: '/map', label: 'Map', icon: MapPinned },
]

export function Sidebar() {
  const [expanded, setExpanded] = useState(false)
  const width = expanded ? 'w-[220px]' : 'w-16'
  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`glass-panel hidden min-h-screen flex-col border-y-0 border-l-0 p-3 transition-all md:flex ${width}`}
    >
      <button
        type="button"
        className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--bg-border)] text-[var(--text-secondary)]"
        onClick={() => setExpanded((v) => !v)}
      >
        <PanelLeft size={16} />
      </button>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md border-l-2 px-2 py-2 text-sm ${
                isActive
                  ? 'border-l-[var(--accent-primary)] bg-[var(--bg-elevated)] text-[var(--accent-glow)]'
                  : 'border-l-transparent text-[var(--text-secondary)]'
              }`
            }
          >
            <item.icon size={17} />
            {expanded && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
