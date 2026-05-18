import type { ReactNode } from 'react'

export function Table({ children }: { children: ReactNode }) {
  return <table className="w-full border-collapse">{children}</table>
}

export function TableHeader({ children }: { children: ReactNode }) {
  return <thead className="bg-[var(--bg-elevated)]">{children}</thead>
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>
}

export function TableRow({
  children,
  onClick,
}: {
  children: ReactNode
  onClick?: () => void
}) {
  return (
    <tr
      onClick={onClick}
      className="border-b border-[var(--bg-border)] transition hover:bg-[var(--bg-elevated)]"
    >
      {children}
    </tr>
  )
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <th className="px-3 py-2 text-left text-xs uppercase tracking-wide text-[var(--text-secondary)]">
      {children}
    </th>
  )
}

export function TableCell({ children }: { children: ReactNode }) {
  return <td className="px-3 py-3 text-sm text-[var(--text-primary)]">{children}</td>
}
