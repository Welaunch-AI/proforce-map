import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from './sheet'

type Props = {
  open: boolean
  onOpenChange: (value: boolean) => void
  title: string
  data: Record<string, unknown> | null
}

export function DetailSheet({ open, onOpenChange, title, data }: Props) {
  const entries = Object.entries(data ?? {})
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <div className="mb-4 border-b border-[var(--bg-border)] pb-3">
          <SheetTitle className="text-lg font-semibold">{title}</SheetTitle>
          <SheetDescription className="mono text-xs text-[var(--text-secondary)]">
            Live record details
          </SheetDescription>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className="rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)] p-2"
            >
              <p className="mono text-xs uppercase text-[var(--text-secondary)]">
                {key}
              </p>
              <p className="mt-1 break-all text-sm">
                {typeof value === 'number' || key.includes('id') || key.includes('date')
                  ? <span className="mono">{String(value ?? '-')}</span>
                  : String(value ?? '-')}
              </p>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
