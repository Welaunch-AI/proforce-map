import { useEffect, useMemo, useState } from 'react'
import { useSyncMeta } from '../../hooks/useSyncMeta'
import { formatRelative } from '../../lib/utils'

export function SyncIndicator() {
  const { data } = useSyncMeta()
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick((x) => x + 1), 30000)
    return () => clearInterval(interval)
  }, [])

  const label = useMemo(
    () => {
      void tick
      return `Live - synced ${formatRelative(data?.last_successful_sync_at)}`
    },
    [data?.last_successful_sync_at, tick],
  )

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--bg-border)] bg-[var(--bg-surface)] px-3 py-1">
      <span className="pulse-dot" />
      <span className="mono text-xs text-[var(--text-secondary)]">{label}</span>
    </div>
  )
}
