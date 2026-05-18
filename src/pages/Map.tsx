import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useMemo, useRef, useState } from 'react'
import Map, { Marker, Popup, type MapRef } from 'react-map-gl/mapbox'
import { InitialsAvatar } from '../components/ui/InitialsAvatar'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useAppointments } from '../hooks/useAppointments'
import { useTechnicians } from '../hooks/useTechnicians'
import type { Appointment, Employee } from '../lib/types'
import { formatDate, fullName, idKey } from '../lib/utils'

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

export function MapPage() {
  const { data: technicians, loading } = useTechnicians()
  const { data: appointments } = useAppointments({ onlyToday: false })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)
  const [brokenPics, setBrokenPics] = useState<Record<string, boolean>>({})
  const mapRef = useRef<MapRef | null>(null)

  const withCoords = useMemo(
    () =>
      technicians.filter(
        (tech) => typeof tech.start_lat === 'number' && typeof tech.start_lng === 'number',
      ),
    [technicians],
  )

  const sortedWithCoords = useMemo(() => {
    return [...withCoords].sort((a, b) => {
      const aHasPic = Boolean(technicianPicUrl(a))
      const bHasPic = Boolean(technicianPicUrl(b))
      if (aHasPic !== bHasPic) return aHasPic ? -1 : 1
      return fullName(a).localeCompare(fullName(b))
    })
  }, [withCoords])

  const mapCenter = useMemo(() => {
    if (withCoords.length === 0) return { latitude: 35.2271, longitude: -80.8431, zoom: 4 }
    return {
      latitude: Number(withCoords[0].start_lat),
      longitude: Number(withCoords[0].start_lng),
      zoom: 8,
    }
  }, [withCoords])

  const selected =
    sortedWithCoords.find((t) => idKey(t.id) === selectedId) ?? sortedWithCoords[0] ?? null

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

  const zoomToFit = () => {
    if (!mapRef.current || (sortedWithCoords.length === 0 && appointmentsWithCoords.length === 0)) return

    let minLng = Number.POSITIVE_INFINITY
    let minLat = Number.POSITIVE_INFINITY
    let maxLng = Number.NEGATIVE_INFINITY
    let maxLat = Number.NEGATIVE_INFINITY

    sortedWithCoords.forEach((tech) => {
      const lng = Number(tech.start_lng)
      const lat = Number(tech.start_lat)
      if (lng < minLng) minLng = lng
      if (lat < minLat) minLat = lat
      if (lng > maxLng) maxLng = lng
      if (lat > maxLat) maxLat = lat
    })
    appointmentsWithCoords.forEach((appt) => {
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

  return (
    <div className="grid h-[calc(100vh-8.5rem)] grid-cols-1 gap-4 xl:grid-cols-[360px_1fr]">
      <aside className="glass-panel rounded-xl p-4">
        <h2 className="text-sm uppercase tracking-[0.12em] text-[var(--text-secondary)]">
          Technician Map
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)] p-3">
            <p className="mono text-xs text-[var(--text-secondary)]">Active</p>
            <p className="mono mt-1 text-xl font-bold">{technicians.length}</p>
          </div>
          <div className="rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)] p-3">
            <p className="mono text-xs text-[var(--text-secondary)]">With GPS</p>
            <p className="mono mt-1 text-xl font-bold">{withCoords.length}</p>
          </div>
          <div className="rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)] p-3">
            <p className="mono text-xs text-[var(--text-secondary)]">Appointments GPS</p>
            <p className="mono mt-1 text-xl font-bold">{appointmentsWithCoords.length}</p>
          </div>
        </div>
        <div className="mt-4 space-y-2 overflow-auto pr-1 xl:max-h-[calc(100vh-17rem)]">
          {sortedWithCoords.map((tech) => {
            const key = idKey(tech.id)
            const isActive = key === idKey(selected?.id)
            const picUrl = technicianPicUrl(tech)
            const showPic = Boolean(picUrl) && !brokenPics[key]
            return (
              <button
                type="button"
                key={key}
                onClick={() => setSelectedId(key)}
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
          {appointmentsWithCoords.slice(0, 20).map((appt) => (
            <button
              type="button"
              key={`appt-list-${idKey(appt.id)}`}
              onClick={() => setSelectedAppointmentId(idKey(appt.id))}
              className="w-full rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)] p-2 text-left"
            >
              <p className="mono text-xs">Appt #{String(appt.id)}</p>
              <p className="mono text-[11px] text-[var(--text-secondary)]">
                {formatDate(appt.appointment_date)} | {String(appt.map_lat.toFixed(4))},{' '}
                {String(appt.map_lng.toFixed(4))}
              </p>
            </button>
          ))}
          {!loading && sortedWithCoords.length === 0 && (
            <p className="text-sm text-[var(--text-secondary)]">
              No technicians with latitude/longitude found.
            </p>
          )}
        </div>
      </aside>

      <section className="glass-panel relative overflow-hidden rounded-xl">
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
            mapStyle="mapbox://styles/mapbox/dark-v11"
          >
            {sortedWithCoords.map((tech) => {
              const key = idKey(tech.id)
              return (
                <Marker
                  key={key}
                  longitude={Number(tech.start_lng)}
                  latitude={Number(tech.start_lat)}
                  anchor="bottom"
                  onClick={() => setSelectedId(key)}
                >
                  <div className="flex flex-col items-center">
                    <span className="h-2 w-2 rounded-full bg-[var(--accent-primary)] shadow-[0_0_10px_var(--accent-glow)]" />
                    <span className="mt-1 rounded-md border border-[var(--bg-border)] bg-[var(--bg-surface)] px-2 py-0.5 text-[10px] text-[var(--text-primary)]">
                      {fullName(tech)}
                    </span>
                  </div>
                </Marker>
              )
            })}
            {appointmentsWithCoords.map((appt) => (
              <Marker
                key={`appt-${idKey(appt.id)}`}
                longitude={Number(appt.map_lng)}
                latitude={Number(appt.map_lat)}
                anchor="center"
                onClick={() => setSelectedAppointmentId(idKey(appt.id))}
              >
                <span className="block h-2.5 w-2.5 rounded-full border border-[var(--bg-base)] bg-[var(--accent-warning)] shadow-[0_0_8px_var(--accent-warning)]" />
              </Marker>
            ))}

            {selected && (
              <Popup
                closeButton={false}
                closeOnClick={false}
                anchor="top"
                longitude={Number(selected.start_lng)}
                latitude={Number(selected.start_lat)}
                offset={20}
              >
                <div className="min-w-[220px] bg-[var(--bg-surface)] p-2 text-[var(--text-primary)]">
                  <p className="text-sm font-medium">{fullName(selected)}</p>
                  <p className="mono text-xs text-[var(--text-secondary)]">ID {String(selected.id)}</p>
                  <p className="mono mt-1 text-xs text-[var(--text-secondary)]">
                    {String(selected.start_address ?? '-')}, {String(selected.start_city ?? '-')},{' '}
                    {String(selected.start_state ?? '-')} {String(selected.start_zip ?? '')}
                  </p>
                  <p className="mono mt-1 text-xs text-[var(--text-secondary)]">
                    {Number(selected.start_lat).toFixed(4)}, {Number(selected.start_lng).toFixed(4)}
                  </p>
                </div>
              </Popup>
            )}
            {selectedAppointment && (
              <Popup
                closeButton={false}
                closeOnClick={false}
                anchor="top"
                longitude={Number(selectedAppointment.map_lng)}
                latitude={Number(selectedAppointment.map_lat)}
                offset={18}
              >
                <div className="min-w-[230px] bg-[var(--bg-surface)] p-2 text-[var(--text-primary)]">
                  <p className="mono text-xs">Appointment #{String(selectedAppointment.id)}</p>
                  <p className="mono mt-1 text-xs text-[var(--text-secondary)]">
                    {formatDate(selectedAppointment.appointment_date)} |{' '}
                    {selectedAppointment.start_time_raw ?? '-'} -{' '}
                    {selectedAppointment.end_time_raw ?? '-'}
                  </p>
                  <div className="mt-1">
                    <StatusBadge status={selectedAppointment.status_text} />
                  </div>
                  <p className="mono mt-1 text-xs text-[var(--text-secondary)]">
                    Customer: {String(selectedAppointment.customer_id ?? '-')}
                  </p>
                </div>
              </Popup>
            )}
          </Map>
        )}
        {MAPBOX_TOKEN && (
          <div className="pointer-events-none absolute right-3 top-3 z-10">
            <button
              type="button"
              onClick={zoomToFit}
              disabled={sortedWithCoords.length === 0 && appointmentsWithCoords.length === 0}
              className="mono pointer-events-auto rounded-md border border-[var(--bg-border)] bg-[var(--bg-surface)] px-3 py-1 text-xs uppercase text-[var(--text-primary)] disabled:opacity-40"
            >
              Zoom to Fit
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
