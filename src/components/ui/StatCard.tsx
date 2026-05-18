type Props = {
  label: string
  value: string | number
  sublabel?: string
  accentColor?: string
}

export function StatCard({ label, value, sublabel, accentColor }: Props) {
  return (
    <div
      className="glass-panel rounded-xl p-4"
      style={{ boxShadow: `inset 0 1px 0 ${accentColor ?? 'var(--bg-border)'}` }}
    >
      <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-secondary)]">
        {label}
      </p>
      <p className="mono mt-2 text-3xl font-bold">{value}</p>
      {sublabel && (
        <p className="mono mt-1 text-xs text-[var(--text-secondary)]">{sublabel}</p>
      )}
    </div>
  )
}
