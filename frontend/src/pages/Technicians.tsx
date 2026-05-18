import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../components/ui/dialog'
import { InitialsAvatar } from '../components/ui/InitialsAvatar'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useAppointments } from '../hooks/useAppointments'
import type { Appointment, Employee } from '../lib/types'
import { useTechnicians } from '../hooks/useTechnicians'
import { formatDate, fullName, idKey } from '../lib/utils'

const PIC_CDN_BASE =
  (import.meta.env.VITE_FIELD_ROUTE_PIC_CDN_BASE_URL as string | undefined)?.replace(/\/+$/, '') ||
  'https://d282x1mqo546ey.cloudfront.net'

type TechnicianModalData = Employee & {
  appointments: Appointment[]
}

function technicianPicUrl(tech: Employee): string | null {
  const picRaw = tech.pic == null ? '' : String(tech.pic).trim()
  if (!picRaw) return null
  if (picRaw.startsWith('http://') || picRaw.startsWith('https://')) return picRaw
  return `${PIC_CDN_BASE}/${picRaw}`
}

function isMonospaceField(key: string, value: unknown): boolean {
  return (
    typeof value === 'number' ||
    key.includes('id') ||
    key.includes('date') ||
    key.includes('time') ||
    key.includes('lat') ||
    key.includes('long')
  )
}

function hasDisplayValue(value: unknown): boolean {
  if (value == null) return false
  if (typeof value === 'string') return value.trim() !== ''
  return true
}

export function TechniciansPage() {
  const { data: technicians, loading } = useTechnicians()
  const { data: appointments } = useAppointments({ onlyToday: false })
  const [selected, setSelected] = useState<TechnicianModalData | null>(null)
  const [brokenPics, setBrokenPics] = useState<Record<string, boolean>>({})

  const sortedTechnicians = useMemo(() => {
    return [...technicians].sort((a, b) => {
      const aHasPic = Boolean(technicianPicUrl(a))
      const bHasPic = Boolean(technicianPicUrl(b))
      if (aHasPic !== bHasPic) return aHasPic ? -1 : 1
      return fullName(a).localeCompare(fullName(b))
    })
  }, [technicians])

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
          {sortedTechnicians.map((tech) => {
            const name = fullName(tech)
            const count = appointmentCount.get(idKey(tech.id)) ?? 0
            const techKey = idKey(tech.id)
            const picUrl = technicianPicUrl(tech)
            const showPic = Boolean(picUrl) && !brokenPics[techKey]
            return (
              <button
                key={techKey}
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
                  {showPic ? (
                    <img
                      src={picUrl ?? ''}
                      alt={name}
                      className="h-9 w-9 rounded-full border border-[var(--bg-border)] object-cover"
                      onError={() =>
                        setBrokenPics((prev) => ({
                          ...prev,
                          [techKey]: true,
                        }))
                      }
                    />
                  ) : (
                    <InitialsAvatar name={name} />
                  )}
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

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-[var(--bg-border)] pb-3">
                <div className="flex items-center gap-3">
                  {technicianPicUrl(selected) ? (
                    <img
                      src={technicianPicUrl(selected) ?? ''}
                      alt={fullName(selected)}
                      className="h-14 w-14 rounded-full border border-[var(--bg-border)] object-cover"
                    />
                  ) : (
                    <InitialsAvatar name={fullName(selected)} />
                  )}
                  <div>
                    <DialogTitle className="text-lg font-semibold">
                      {fullName(selected)}
                    </DialogTitle>
                    <DialogDescription className="mono text-xs text-[var(--text-secondary)]">
                      Technician profile and assigned appointments
                    </DialogDescription>
                    <p className="mono mt-1 text-xs text-[var(--text-secondary)]">
                      ID: {String(selected.id)}
                    </p>
                  </div>
                </div>
                <DialogClose asChild>
                  <button
                    type="button"
                    className="mono rounded-md border border-[var(--bg-border)] px-2 py-1 text-xs uppercase text-[var(--text-secondary)]"
                  >
                    Close
                  </button>
                </DialogClose>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)] p-3">
                      <p className="mono text-xs uppercase text-[var(--text-secondary)]">Status</p>
                      <div className="mt-2">
                        <StatusBadge status={selected.active === '1' ? 'Active' : 'Inactive'} />
                      </div>
                    </div>
                    <div className="rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)] p-3">
                      <p className="mono text-xs uppercase text-[var(--text-secondary)]">Date Updated</p>
                      <p className="mono mt-2 text-sm">{String(selected.date_updated ?? '-')}</p>
                    </div>
                    <div className="rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)] p-3">
                      <p className="mono text-xs uppercase text-[var(--text-secondary)]">Appointments</p>
                      <p className="mono mt-2 text-xl font-bold">{selected.appointments.length}</p>
                    </div>
                  </div>
                  {[
                    selected.start_address,
                    selected.start_city,
                    selected.start_state,
                    selected.start_zip,
                    selected.start_lat,
                    selected.start_lng,
                  ].some(hasDisplayValue) && (
                    <div className="rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)] p-3">
                      <p className="mono text-xs uppercase text-[var(--text-secondary)]">
                        Location
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-[var(--text-primary)]">
                          {String(selected.start_address ?? '-')}
                        </p>
                        <p className="text-sm text-[var(--text-primary)]">
                          {String(selected.start_city ?? '-')}, {String(selected.start_state ?? '-')}{' '}
                          {String(selected.start_zip ?? '')}
                        </p>
                        {hasDisplayValue(selected.start_lat) && hasDisplayValue(selected.start_lng) && (
                          <p className="mono text-xs text-[var(--text-secondary)]">
                            {String(selected.start_lat)}, {String(selected.start_lng)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)] p-3">
                    <p className="mono text-xs uppercase text-[var(--text-secondary)]">
                      Appointments
                    </p>
                    {selected.appointments.length === 0 ? (
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        No appointments assigned.
                      </p>
                    ) : (
                      <div className="mt-2 max-h-[42vh] space-y-2 overflow-auto pr-1">
                        {selected.appointments.map((appt) => (
                          <div
                            key={idKey(appt.id)}
                            className="rounded-md border border-[var(--bg-border)] bg-[var(--bg-elevated)] p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="mono text-sm">#{String(appt.id)}</p>
                              <StatusBadge status={appt.status_text} />
                            </div>
                            <p className="mono mt-1 text-xs text-[var(--text-secondary)]">
                              {formatDate(appt.appointment_date)} | {appt.start_time_raw ?? '-'} -{' '}
                              {appt.end_time_raw ?? '-'}
                            </p>
                            <p className="mono mt-1 text-xs text-[var(--text-secondary)]">
                              Customer: {String(appt.customer_id ?? '-')}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)] p-3">
                  <p className="mono text-xs uppercase text-[var(--text-secondary)]">
                    More technician details
                  </p>
                  <div className="mt-2 max-h-[67vh] overflow-auto pr-1">
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {Object.entries(selected)
                        .filter(([key, value]) => key !== 'appointments' && key !== 'pic' && hasDisplayValue(value))
                        .map(([key, value]) => (
                          <div
                            key={key}
                            className="rounded-md border border-[var(--bg-border)] bg-[var(--bg-elevated)] p-2"
                          >
                            <p className="mono text-[11px] uppercase text-[var(--text-secondary)]">
                              {key}
                            </p>
                            <p className="mt-1 break-all text-xs text-[var(--text-primary)]">
                              {isMonospaceField(key, value) ? (
                                <span className="mono">{String(value ?? '-')}</span>
                              ) : (
                                String(value ?? '-')
                              )}
                            </p>
                          </div>
                        ))}
                    </div>
                    <div className="mt-3 rounded-md border border-[var(--bg-border)] bg-[var(--bg-elevated)] p-2">
                      <p className="mono text-[11px] uppercase text-[var(--text-secondary)]">
                        appointments_count
                      </p>
                      <p className="mono mt-1 text-xs text-[var(--text-primary)]">
                        {selected.appointments.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
