import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { BriefcaseBusiness, Home, Satellite } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import Map, { Marker, Popup, type MapRef } from 'react-map-gl/mapbox'
import { InitialsAvatar } from '../components/ui/InitialsAvatar'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useAppointments } from '../hooks/useAppointments'
import { useTechnicians } from '../hooks/useTechnicians'
import type { Appointment, Employee } from '../lib/types'
import { formatDate, formatTimeRangeEST, fullName, idKey } from '../lib/utils'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined
const PIC_CDN_BASE =
  (import.meta.env.VITE_FIELD_ROUTE_PIC_CDN_BASE_URL as string | undefined)?.replace(/\/+$/, '') ||
  'https://d282x1mqo546ey.cloudfront.net'

function technicianPicUrl(tech: Employee): string | null {
  const picRaw = tech.pic == null ? '' : String(tech.pic).trim()
  if (!picRaw) return null
  if (picRaw.startsWith('http://') || picRaw.startsWith('https://')) return picRaw
  return `${PIC_CDN_BASE}/${picRaw}`
}

function shortStatusLabel(statusText?: string | null): string {
  const normalized = String(statusText ?? '').toLowerCase()
  if (normalized.includes('completed')) return 'Completed'
  if (normalized.includes('pending')) return 'Pending'
  return 'Unknown'
}

function shortStatusBadgeClass(statusText?: string | null): string {
  const normalized = String(statusText ?? '').toLowerCase()
  if (normalized.includes('completed')) {
    return 'border-[var(--accent-success)] bg-[color-mix(in_srgb,var(--accent-success)_18%,transparent)] text-[var(--accent-success)]'
  }
  if (normalized.includes('pending')) {
    return 'border-[var(--accent-warning)] bg-[color-mix(in_srgb,var(--accent-warning)_18%,transparent)] text-[var(--accent-warning)]'
  }
  return 'border-[var(--bg-border)] bg-[var(--bg-surface)] text-[var(--text-secondary)]'
}

export function MapPage() {
  const { data: technicians, loading } = useTechnicians()
  const { data: appointments } = useAppointments({ onlyToday: false })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)
  const [brokenPics, setBrokenPics] = useState<Record<string, boolean>>({})
  const [techSearch, setTechSearch] = useState('')
  const [apptSearch, setApptSearch] = useState('')
  const [apptStatus, setApptStatus] = useState('all')
  const [mapTheme, setMapTheme] = useState<'dark' | 'satellite'>('dark')
  const [apptSort, setApptSort] = useState<'recent_added' | 'recent_updated' | 'appointment_date'>(
    'recent_added',
  )
  const mapRef = useRef<MapRef | null>(null)
  const mapShellRef = useRef<HTMLElement | null>(null)

  const withCoords = useMemo(
    () =>
      technicians.filter(
        (tech) => typeof tech.start_lat === 'number' && typeof tech.start_lng === 'number',
      ),
    [technicians],
  )

  const filteredTechnicians = useMemo(() => {
    const query = techSearch.trim().toLowerCase()
    const rows = withCoords.filter((tech) => {
      if (!query) return true
      const haystack = [
        fullName(tech),
        String(tech.id ?? ''),
        String(tech.start_city ?? ''),
        String(tech.start_state ?? ''),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
    return [...rows].sort((a, b) => {
      const aHasPic = Boolean(technicianPicUrl(a))
      const bHasPic = Boolean(technicianPicUrl(b))
      if (aHasPic !== bHasPic) return aHasPic ? -1 : 1
      return fullName(a).localeCompare(fullName(b))
    })
  }, [withCoords, techSearch])

  const mapCenter = useMemo(() => {
    if (withCoords.length === 0) return { latitude: 35.2271, longitude: -80.8431, zoom: 4 }
    return {
      latitude: Number(withCoords[0].start_lat),
      longitude: Number(withCoords[0].start_lng),
      zoom: 8,
    }
  }, [withCoords])

  const selected = filteredTechnicians.find((t) => idKey(t.id) === selectedId) ?? null

  const appointmentsWithCoords = useMemo(() => {
    return appointments
      .map((appt) => {
        const latIn = typeof appt.lat_in === 'number' ? appt.lat_in : null
        const lngIn = typeof appt.long_in === 'number' ? appt.long_in : null
        const latOut = typeof appt.lat_out === 'number' ? appt.lat_out : null
        const lngOut = typeof appt.long_out === 'number' ? appt.long_out : null
        const latitude = latIn ?? latOut
        const longitude = lngIn ?? lngOut
        if (latitude == null || longitude == null) return null
        return { ...appt, map_lat: latitude, map_lng: longitude }
      })
      .filter((appt): appt is Appointment & { map_lat: number; map_lng: number } => {
        if (!appt) return false
        if (!Number.isFinite(appt.map_lat) || !Number.isFinite(appt.map_lng)) return false
        // Exclude default/invalid zero coordinates.
        if (appt.map_lat === 0 || appt.map_lng === 0) return false
        return true
      })
  }, [appointments])

  const selectedAppointment =
    appointmentsWithCoords.find((a) => idKey(a.id) === selectedAppointmentId) ?? null

  const appointmentStatuses = useMemo(() => {
    return Array.from(
      new Set(appointmentsWithCoords.map((a) => String(a.status_text ?? '')).filter(Boolean)),
    )
  }, [appointmentsWithCoords])

  const filteredAppointmentsWithCoords = useMemo(() => {
    const query = apptSearch.trim().toLowerCase()
    const rows = appointmentsWithCoords.filter((appt) => {
      if (apptStatus !== 'all' && String(appt.status_text ?? '') !== apptStatus) return false
      if (!query) return true
      const haystack = [
        String(appt.id ?? ''),
        String(appt.customer_id ?? ''),
        String(appt.status_text ?? ''),
        String(appt.appointment_date ?? ''),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })

    const asTime = (value: unknown): number => {
      const ts = new Date(String(value ?? '')).getTime()
      return Number.isFinite(ts) ? ts : 0
    }

    return [...rows].sort((a, b) => {
      if (apptSort === 'recent_updated') return asTime(b.date_updated) - asTime(a.date_updated)
      if (apptSort === 'appointment_date') return asTime(b.appointment_date) - asTime(a.appointment_date)
      return asTime(b.date_added) - asTime(a.date_added)
    })
  }, [appointmentsWithCoords, apptSearch, apptSort, apptStatus])

  const focusMapPoint = (lat: number, lng: number, zoom = 12) => {
    if (!mapRef.current) return
    mapRef.current.flyTo({
      center: [lng, lat],
      zoom,
      duration: 800,
      essential: true,
    })
  }

  const zoomToFit = () => {
    if (!mapRef.current || (filteredTechnicians.length === 0 && filteredAppointmentsWithCoords.length === 0)) return

    let minLng = Number.POSITIVE_INFINITY
    let minLat = Number.POSITIVE_INFINITY
    let maxLng = Number.NEGATIVE_INFINITY
    let maxLat = Number.NEGATIVE_INFINITY

    filteredTechnicians.forEach((tech) => {
      const lng = Number(tech.start_lng)
      const lat = Number(tech.start_lat)
      if (lng < minLng) minLng = lng
      if (lat < minLat) minLat = lat
      if (lng > maxLng) maxLng = lng
      if (lat > maxLat) maxLat = lat
    })
    filteredAppointmentsWithCoords.forEach((appt) => {
      const lng = Number(appt.map_lng)
      const lat = Number(appt.map_lat)
      if (lng < minLng) minLng = lng
      if (lat < minLat) minLat = lat
      if (lng > maxLng) maxLng = lng
      if (lat > maxLat) maxLat = lat
    })

    mapRef.current.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { padding: 70, duration: 800 },
    )
  }

  const resetMapSelection = () => {
    setSelectedId(null)
    setSelectedAppointmentId(null)
    zoomToFit()
  }

  useEffect(() => {
    const target = mapShellRef.current
    if (!target) return
    const observer = new ResizeObserver(() => {
      mapRef.current?.resize()
    })
    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="h-[calc(100vh-4rem)] p-2 md:p-3">
      <div className="grid h-full min-h-0 grid-cols-1 gap-3 xl:grid-cols-[320px_1fr_320px]">
        <aside className="glass-panel flex min-h-0 flex-col overflow-hidden rounded-xl p-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-5 w-5 items-center justify-center rounded-full border border-[#D1D9E6] bg-white text-[#2563EB] shadow-[0_4px_10px_rgba(0,0,0,0.2)]">
            <Home size={10} strokeWidth={2.2} />
            <span className="absolute -bottom-[3px] h-1.5 w-1.5 rotate-45 border-b border-r border-[#D1D9E6] bg-white" />
          </span>
          <h2 className="mono text-xs uppercase tracking-[0.12em] text-[var(--text-secondary)]">
            Technician Map
          </h2>
        </div>
        <p className="mono mt-1 text-[11px] text-[var(--text-tertiary)]">
          Technicians with home coordinates
        </p>
        <div className="mt-2 grid grid-cols-1 gap-2">
          <input
            value={techSearch}
            onChange={(e) => setTechSearch(e.target.value)}
            placeholder="Search tech..."
            className="mono rounded-md border border-[var(--bg-border)] bg-[var(--bg-surface)] px-2 py-1 text-xs"
          />
        </div>
        <p className="mono mt-2 text-[11px] text-[var(--text-secondary)]">
          Technicians GPS: {filteredTechnicians.length}
        </p>
        <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-auto pr-1">
          {filteredTechnicians.map((tech) => {
            const key = idKey(tech.id)
            const isActive = key === idKey(selected?.id)
            const picUrl = technicianPicUrl(tech)
            const showPic = Boolean(picUrl) && !brokenPics[key]
            return (
              <button
                type="button"
                key={key}
                onClick={() => {
                  setSelectedAppointmentId(null)
                  setSelectedId(key)
                  focusMapPoint(Number(tech.start_lat), Number(tech.start_lng), 15)
                }}
                className={`flex w-full items-center justify-between rounded-lg border p-2 text-left ${
                  isActive
                    ? 'border-[var(--accent-primary)] bg-[var(--bg-elevated)]'
                    : 'border-[var(--bg-border)] bg-[var(--bg-surface)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  {showPic ? (
                    <img
                      src={picUrl ?? ''}
                      alt={fullName(tech)}
                      className="h-8 w-8 rounded-full object-cover"
                      onError={() =>
                        setBrokenPics((prev) => ({
                          ...prev,
                          [key]: true,
                        }))
                      }
                    />
                  ) : (
                    <InitialsAvatar name={fullName(tech)} />
                  )}
                  <div>
                    <p className="text-sm">{fullName(tech)}</p>
                    <p className="mono text-[11px] text-[var(--text-secondary)]">
                      {String(tech.start_city ?? '-')}, {String(tech.start_state ?? '-')}
                    </p>
                  </div>
                </div>
                <span className="pulse-dot" />
              </button>
            )
          })}
          {!loading && filteredTechnicians.length === 0 && (
            <p className="text-sm text-[var(--text-secondary)]">
              No technicians match the selected filters.
            </p>
          )}
        </div>
        </aside>

        <section
          ref={mapShellRef}
          className="glass-panel relative min-h-0 overflow-hidden rounded-xl"
        >
        {!MAPBOX_TOKEN ? (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-[var(--text-secondary)]">
            Missing `VITE_MAPBOX_TOKEN` in environment.
          </div>
        ) : (
          <Map
            ref={mapRef}
            mapboxAccessToken={MAPBOX_TOKEN}
            mapLib={mapboxgl}
            initialViewState={mapCenter}
            style={{ width: '100%', height: '100%' }}
            mapStyle={
              mapTheme === 'dark'
                ? 'mapbox://styles/mapbox/dark-v11'
                : 'mapbox://styles/mapbox/satellite-streets-v12'
            }
          >
            {filteredTechnicians.map((tech) => {
              const key = idKey(tech.id)
              return (
                <Marker
                  key={key}
                  longitude={Number(tech.start_lng)}
                  latitude={Number(tech.start_lat)}
                  anchor="bottom"
                  onClick={() => {
                    setSelectedAppointmentId(null)
                    setSelectedId(key)
                    focusMapPoint(Number(tech.start_lat), Number(tech.start_lng), 15)
                  }}
                >
                  <div className="flex flex-col items-center">
                    <span className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[#D1D9E6] bg-white text-[#2563EB] shadow-[0_8px_14px_rgba(0,0,0,0.28)]">
                      <Home size={13} strokeWidth={2.2} />
                      <span className="absolute -bottom-1 h-2 w-2 rotate-45 border-b border-r border-[#D1D9E6] bg-white" />
                    </span>
                    <span className="mt-1 rounded-md border border-[var(--bg-border)] bg-[var(--bg-surface)] px-2 py-0.5 text-[10px] text-[var(--text-primary)]">
                      {fullName(tech)}
                    </span>
                  </div>
                </Marker>
              )
            })}
            {filteredAppointmentsWithCoords.map((appt) => (
              <Marker
                key={`appt-${idKey(appt.id)}`}
                longitude={Number(appt.map_lng)}
                latitude={Number(appt.map_lat)}
                anchor="center"
                onClick={() => {
                  setSelectedId(null)
                  setSelectedAppointmentId(idKey(appt.id))
                  focusMapPoint(Number(appt.map_lat), Number(appt.map_lng), 16)
                }}
              >
                <span className="relative flex h-7 w-7 items-center justify-center rounded-md border border-[#E2C27A] bg-[#1E1610] text-[var(--accent-warning)] shadow-[0_6px_12px_rgba(0,0,0,0.28)]">
                  <BriefcaseBusiness size={12} strokeWidth={2.1} />
                  <span className="absolute -bottom-1 h-2 w-2 rotate-45 border-b border-r border-[#E2C27A] bg-[#1E1610]" />
                </span>
              </Marker>
            ))}

            {selected && (
              <Popup
                className="ops-popup"
                closeButton={false}
                closeOnClick={false}
                anchor="top"
                longitude={Number(selected.start_lng)}
                latitude={Number(selected.start_lat)}
                offset={18}
                onClose={resetMapSelection}
              >
                <div className="relative min-w-[280px] bg-[var(--bg-surface)] p-3 text-[var(--text-primary)]">
                  <button
                    type="button"
                    onClick={resetMapSelection}
                    className="mono absolute right-2 top-2.5 cursor-pointer bg-transparent text-[16px] leading-none text-[var(--text-secondary)] transition-all hover:bg-transparent hover:text-[var(--text-primary)] hover:text-[19px]"
                    aria-label="Close technician popup"
                  >
                    ×
                  </button>
                  <div className="mb-2 flex items-center gap-3 border-b border-[var(--bg-border)] pb-2">
                    {(() => {
                      const picUrl = technicianPicUrl(selected)
                      const showPic = Boolean(picUrl) && !brokenPics[idKey(selected.id)]
                      return showPic ? (
                        <img
                          src={picUrl ?? ''}
                          alt={fullName(selected)}
                          className="h-14 w-14 rounded-full border border-[var(--bg-border)] object-cover shadow-[0_3px_10px_rgba(0,0,0,0.28)]"
                          onError={() =>
                            setBrokenPics((prev) => ({
                              ...prev,
                              [idKey(selected.id)]: true,
                            }))
                          }
                        />
                      ) : (
                        <InitialsAvatar name={fullName(selected)} />
                      )
                    })()}
                    <div className="min-w-0 pt-0.5">
                      <p className="mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                        Technician
                      </p>
                      <p className="truncate text-lg font-semibold leading-tight">
                        {fullName(selected)}
                      </p>
                      <p className="mono text-[11px] text-[var(--text-secondary)]">
                        ID: {String(selected.id)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="mono text-[11px] uppercase text-[var(--text-secondary)]">
                        Status
                      </span>
                      <StatusBadge status={selected.active === '1' ? 'Active' : 'Inactive'} />
                    </div>

                    <div className="rounded-md border border-[var(--bg-border)] bg-[var(--bg-elevated)] p-2">
                      <p className="mono text-[10px] uppercase text-[var(--text-secondary)]">Home Address</p>
                      <p className="mt-1 text-xs">
                        {String(selected.start_address ?? '-')}, {String(selected.start_city ?? '-')},{' '}
                        {String(selected.start_state ?? '-')} {String(selected.start_zip ?? '')}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-md border border-[var(--bg-border)] bg-[var(--bg-elevated)] p-2">
                      <div>
                        <p className="mono text-[10px] uppercase text-[var(--text-secondary)]">Latitude</p>
                        <p className="mono text-xs">{String(selected.start_lat ?? '-')}</p>
                      </div>
                      <div>
                        <p className="mono text-[10px] uppercase text-[var(--text-secondary)]">Longitude</p>
                        <p className="mono text-xs">{String(selected.start_lng ?? '-')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Popup>
            )}

            {selectedAppointment && (
              <Popup
                className="ops-popup"
                closeButton={false}
                closeOnClick={false}
                anchor="top"
                longitude={Number(selectedAppointment.map_lng)}
                latitude={Number(selectedAppointment.map_lat)}
                offset={18}
                onClose={resetMapSelection}
              >
                <div className="relative min-w-[280px] bg-[var(--bg-surface)] p-3 text-[var(--text-primary)]">
                  <button
                    type="button"
                    onClick={resetMapSelection}
                    className="mono absolute right-2 top-2 cursor-pointer bg-transparent text-[16px] leading-none text-[var(--text-secondary)] transition-all hover:bg-transparent hover:text-[var(--text-primary)] hover:text-[19px]"
                    aria-label="Close appointment popup"
                  >
                    ×
                  </button>
                  <div className="mb-2 border-b border-[var(--bg-border)] pb-2">
                    <p className="mono text-[11px] uppercase tracking-wide text-[var(--text-secondary)]">
                      Work Order
                    </p>
                    <p className="mono text-base font-semibold">
                      #{String(selectedAppointment.id)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="mono text-[11px] uppercase text-[var(--text-secondary)]">
                        Status
                      </span>
                      <StatusBadge status={selectedAppointment.status_text} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-md border border-[var(--bg-border)] bg-[var(--bg-elevated)] p-2">
                      <div>
                        <p className="mono text-[10px] uppercase text-[var(--text-secondary)]">Date</p>
                        <p className="mono text-xs">{formatDate(selectedAppointment.appointment_date)}</p>
                      </div>
                      <div>
                        <p className="mono text-[10px] uppercase text-[var(--text-secondary)]">Time</p>
                        <p className="mono text-xs">
                          {formatTimeRangeEST(
                            selectedAppointment.start_time_raw,
                            selectedAppointment.end_time_raw,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-md border border-[var(--bg-border)] bg-[var(--bg-elevated)] p-2">
                      <div>
                        <p className="mono text-[10px] uppercase text-[var(--text-secondary)]">
                          Customer
                        </p>
                        <p className="mono text-xs">{String(selectedAppointment.customer_id ?? '-')}</p>
                      </div>
                      <div>
                        <p className="mono text-[10px] uppercase text-[var(--text-secondary)]">
                          Ticket
                        </p>
                        <p className="mono text-xs">{String(selectedAppointment.ticket_id ?? '-')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Popup>
            )}
          </Map>
        )}
        {MAPBOX_TOKEN && (
          <div className="pointer-events-none absolute right-3 top-3 z-10">
            <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)]/95 p-1 shadow-[0_6px_14px_rgba(0,0,0,0.28)] backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setMapTheme((prev) => (prev === 'dark' ? 'satellite' : 'dark'))}
                className="inline-flex items-center gap-1 rounded-md border border-[var(--bg-border)] bg-[var(--bg-elevated)] px-2 py-1 text-[11px] text-[var(--text-primary)]"
                title={
                  mapTheme === 'dark'
                    ? 'Switch to Satellite + Labels'
                    : 'Switch to Dark Ops'
                }
              >
                <Satellite size={12} />
                <span className="mono">{mapTheme === 'dark' ? 'Dark Ops' : 'Satellite'}</span>
              </button>
              <button
                type="button"
                onClick={zoomToFit}
                disabled={filteredTechnicians.length === 0 && filteredAppointmentsWithCoords.length === 0}
                className="mono rounded-md border border-[var(--bg-border)] bg-[var(--bg-elevated)] px-3 py-1 text-xs uppercase text-[var(--text-primary)] disabled:opacity-40"
              >
                Zoom to Fit
              </button>
            </div>
          </div>
        )}
        </section>

        <aside className="glass-panel flex min-h-0 flex-col overflow-hidden rounded-xl p-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-5 w-5 items-center justify-center rounded-md border border-[#E2C27A] bg-[#1E1610] text-[var(--accent-warning)] shadow-[0_4px_10px_rgba(0,0,0,0.24)]">
            <BriefcaseBusiness size={10} strokeWidth={2.1} />
            <span className="absolute -bottom-[3px] h-1.5 w-1.5 rotate-45 border-b border-r border-[#E2C27A] bg-[#1E1610]" />
          </span>
          <p className="mono text-xs uppercase text-[var(--text-secondary)]">Assets Map List</p>
        </div>
        <p className="mono mt-1 text-[11px] text-[var(--text-tertiary)]">
          Appointments with valid coordinates
        </p>
        <div className="mt-2 grid grid-cols-1 gap-2">
          <input
            value={apptSearch}
            onChange={(e) => setApptSearch(e.target.value)}
            placeholder="Search appointment..."
            className="mono rounded-md border border-[var(--bg-border)] bg-[var(--bg-surface)] px-2 py-1 text-xs"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={apptStatus}
              onChange={(e) => setApptStatus(e.target.value)}
              className="mono rounded-md border border-[var(--bg-border)] bg-[var(--bg-surface)] px-2 py-1 text-xs"
            >
              <option value="all">All Status</option>
              {appointmentStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <select
              value={apptSort}
              onChange={(e) => setApptSort(e.target.value as typeof apptSort)}
              className="mono rounded-md border border-[var(--bg-border)] bg-[var(--bg-surface)] px-2 py-1 text-xs"
            >
              <option value="recent_added">Recent Added</option>
              <option value="recent_updated">Recent Updated</option>
              <option value="appointment_date">Appointment Date</option>
            </select>
          </div>
        </div>
        <p className="mono mt-1 text-[11px] text-[var(--text-secondary)]">
          Appointments GPS: {filteredAppointmentsWithCoords.length}
        </p>
        <div className="mt-2 min-h-0 flex-1 space-y-2 overflow-auto pr-1">
          {filteredAppointmentsWithCoords.slice(0, 80).map((appt) => (
            <button
              type="button"
              key={`appt-list-${idKey(appt.id)}`}
              onClick={() => {
                setSelectedId(null)
                setSelectedAppointmentId(idKey(appt.id))
                focusMapPoint(Number(appt.map_lat), Number(appt.map_lng), 16)
              }}
              className={`w-full rounded-lg border p-2 text-left ${
                idKey(appt.id) === selectedAppointmentId
                  ? 'border-[var(--accent-warning)] bg-[var(--bg-elevated)]'
                  : 'border-[var(--bg-border)] bg-[var(--bg-surface)]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="mono text-xs">Appt #{String(appt.id)}</p>
                <span
                  className={`mono rounded border px-1 py-0.5 text-[9px] ${shortStatusBadgeClass(
                    appt.status_text,
                  )}`}
                >
                  {shortStatusLabel(appt.status_text)}
                </span>
              </div>
              <p className="mono text-[11px] text-[var(--text-secondary)]">
                {formatDate(appt.appointment_date)} | {String(appt.map_lat.toFixed(4))},{' '}
                {String(appt.map_lng.toFixed(4))}
              </p>
            </button>
          ))}
          {filteredAppointmentsWithCoords.length === 0 && (
            <p className="text-xs text-[var(--text-secondary)]">
              No appointments match the selected filters.
            </p>
          )}
        </div>
        </aside>
      </div>
    </div>
  )
}
