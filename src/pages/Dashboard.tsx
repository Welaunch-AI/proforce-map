import { useMemo, useState } from 'react'
import { DetailSheet } from '../components/ui/DetailSheet'
import { InitialsAvatar } from '../components/ui/InitialsAvatar'
import { StatCard } from '../components/ui/StatCard'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useAppointments } from '../hooks/useAppointments'
import { useTechnicians } from '../hooks/useTechnicians'
import { fullName, idKey, initialsFromName, isoToday } from '../lib/utils'

const pendingKeywords = ['pending', 'scheduled']

export function DashboardPage() {
  const { data: appointments, loading: apptLoading } = useAppointments()
  const { data: technicians, loading: techLoading } = useTechnicians()
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null)

  const employeeMap = useMemo(
    () => new Map(technicians.map((tech) => [idKey(tech.id), tech])),
    [technicians],
  )

  const filteredToday = useMemo(
    () => appointments.filter((a) => a.appointment_date === isoToday()),
    [appointments],
  )

  const completed = filteredToday.filter((a) =>
    (a.status_text ?? '').toLowerCase().includes('completed'),
  ).length

  const pending = filteredToday.filter((a) =>
    pendingKeywords.some((k) => (a.status_text ?? '').toLowerCase().includes(k)),
  ).length

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {apptLoading || techLoading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="skeleton h-[120px] rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Total Today"
              value={filteredToday.length}
              sublabel={isoToday()}
              accentColor="var(--accent-primary)"
            />
            <StatCard
              label="Completed"
              value={completed}
              accentColor="var(--accent-success)"
            />
            <StatCard
              label="Pending"
              value={pending}
              accentColor="var(--accent-warning)"
            />
            <StatCard
              label="Technicians Active"
              value={technicians.length}
              accentColor="var(--accent-glow)"
            />
          </>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="glass-panel rounded-xl p-4">
          <h2 className="mb-3 text-sm uppercase tracking-[0.12em] text-[var(--text-secondary)]">
            Today&apos;s Appointments
          </h2>
          <div className="space-y-2">
            {filteredToday
              .slice()
              .sort((a, b) => String(b.start_time_raw ?? '').localeCompare(String(a.start_time_raw ?? '')))
              .slice(0, 8)
              .map((appt) => {
                const tech = employeeMap.get(idKey(appt.assigned_tech_id))
                const name = fullName(tech)
                return (
                  <button
                    key={idKey(appt.id)}
                    type="button"
                    onClick={() => setSelected(appt)}
                    className="flex w-full items-center justify-between rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)] p-3 text-left"
                  >
                    <div>
                      <p className="mono text-sm">{String(appt.id)}</p>
                      <p className="mono text-xs text-[var(--text-secondary)]">{appt.start_time_raw ?? '-'}</p>
                    </div>
                    <StatusBadge status={appt.status_text} />
                    <div className="mono text-xs text-[var(--text-secondary)]">
                      {initialsFromName(name)}
                    </div>
                  </button>
                )
              })}
            {!apptLoading && filteredToday.length === 0 && (
              <p className="text-sm text-[var(--text-secondary)]">No appointments found for today.</p>
            )}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-4">
          <h2 className="mb-3 text-sm uppercase tracking-[0.12em] text-[var(--text-secondary)]">
            Technician Roster
          </h2>
          <div className="space-y-2">
            {technicians.map((tech) => {
              const name = fullName(tech)
              return (
                <button
                  key={idKey(tech.id)}
                  type="button"
                  onClick={() => setSelected(tech)}
                  className="flex w-full items-center justify-between rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)] p-3 text-left"
                >
                  <div className="flex items-center gap-2">
                    <InitialsAvatar name={name} />
                    <span>{name}</span>
                  </div>
                  <span className="mono text-xs text-[var(--text-secondary)]">
                    {String(tech.date_updated ?? '-')}
                  </span>
                </button>
              )
            })}
            {!techLoading && technicians.length === 0 && (
              <p className="text-sm text-[var(--text-secondary)]">No active technicians available.</p>
            )}
          </div>
        </div>
      </section>
      <DetailSheet
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
        title="Record details"
        data={selected}
      />
    </div>
  )
}
