import { useMemo, useState } from 'react'
import { DetailSheet } from '../components/ui/DetailSheet'
import { InitialsAvatar } from '../components/ui/InitialsAvatar'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useAppointments } from '../hooks/useAppointments'
import { useTechnicians } from '../hooks/useTechnicians'
import { fullName, idKey } from '../lib/utils'

export function TechniciansPage() {
  const { data: technicians, loading } = useTechnicians()
  const { data: appointments } = useAppointments({ onlyToday: false })
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null)

  const appointmentCount = useMemo(() => {
    const counts = new Map<string, number>()
    appointments.forEach((appt) => {
      const key = idKey(appt.assigned_tech_id)
      counts.set(key, (counts.get(key) ?? 0) + 1)
    })
    return counts
  }, [appointments])

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="skeleton h-[190px] rounded-xl" />
          ))}
        </div>
      ) : technicians.length === 0 ? (
        <div className="glass-panel rounded-xl p-10 text-center text-sm text-[var(--text-secondary)]">
          No active technicians found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {technicians.map((tech) => {
            const name = fullName(tech)
            const count = appointmentCount.get(idKey(tech.id)) ?? 0
            return (
              <button
                key={idKey(tech.id)}
                type="button"
                onClick={() =>
                  setSelected({
                    ...tech,
                      appointments: appointments.filter(
                      (a) => idKey(a.assigned_tech_id) === idKey(tech.id),
                    ),
                  })
                }
                className="glass-panel rounded-xl p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <InitialsAvatar name={name} />
                  <div>
                    <p className="font-medium">{name}</p>
                    <p className="mono text-xs text-[var(--text-secondary)]">
                      {String(tech.id)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <StatusBadge status={tech.active === '1' ? 'Active' : 'Inactive'} />
                  <p className="mono text-xs text-[var(--text-secondary)]">
                    {String(tech.date_updated ?? '-')}
                  </p>
                </div>
                {(tech.start_city || tech.start_state) && (
                  <p className="mt-3 text-sm text-[var(--text-secondary)]">
                    {String(tech.start_city ?? '')}, {String(tech.start_state ?? '')}
                  </p>
                )}
                <div className="mt-4 border-t border-[var(--bg-border)] pt-3">
                  <p className="mono text-xs text-[var(--text-secondary)]">Appointments</p>
                  <p className="mono text-xl font-bold">{count}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <DetailSheet
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
        title="Technician details"
        data={selected}
      />
    </div>
  )
}
