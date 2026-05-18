import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useMemo, useRef, useState } from 'react'
import Map, { Marker, Popup, type MapRef } from 'react-map-gl/mapbox'
import { InitialsAvatar } from '../components/ui/InitialsAvatar'
import { useTechnicians } from '../hooks/useTechnicians'
import type { Employee } from '../lib/types'
import { fullName, idKey } from '../lib/utils'

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
  const [selectedId, setSelectedId] = useState<string | null>(null)
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

  const zoomToFit = () => {
    if (!mapRef.current || sortedWithCoords.length === 0) return

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
          </Map>
        )}
        {MAPBOX_TOKEN && (
          <div className="pointer-events-none absolute right-3 top-3 z-10">
            <button
              type="button"
              onClick={zoomToFit}
              disabled={sortedWithCoords.length === 0}
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
