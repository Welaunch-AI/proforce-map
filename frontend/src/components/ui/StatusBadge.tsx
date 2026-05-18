type Props = {
  status?: string | null
}

function statusColor(status?: string | null): string {
  const normalized = (status ?? '').toLowerCase()
  if (normalized.includes('completed')) return 'var(--accent-success)'
  if (normalized.includes('cancelled')) return 'var(--accent-danger)'
  if (normalized.includes('pending') || normalized.includes('scheduled')) {
    return 'var(--accent-warning)'
  }
  if (
    normalized.includes('in progress') ||
    normalized.includes('on the way')
  ) {
    return 'var(--accent-primary)'
  }
  return 'var(--accent-muted)'
}

export function StatusBadge({ status }: Props) {
  const color = statusColor(status)
  return (
    <span
      className="mono inline-flex items-center rounded-full border px-2 py-1 text-xs uppercase tracking-wide"
      style={{ borderColor: color, color }}
    >
      {status ?? 'Unknown'}
    </span>
  )
}
