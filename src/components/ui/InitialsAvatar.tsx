import { initialsFromName } from '../../lib/utils'

const palette = [
  'var(--accent-primary)',
  'var(--accent-success)',
  'var(--accent-warning)',
  'var(--accent-danger)',
  'var(--accent-muted)',
  'var(--accent-glow)',
  'var(--text-secondary)',
  'var(--text-tertiary)',
]

type Props = {
  name: string
  color?: string
}

export function InitialsAvatar({ name, color }: Props) {
  const initial = initialsFromName(name)
  const index = Math.abs(name.charCodeAt(0) || 0) % palette.length
  const bg = color ?? palette[index]
  return (
    <div
      className="mono flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
      style={{ background: bg }}
    >
      {initial}
    </div>
  )
}
