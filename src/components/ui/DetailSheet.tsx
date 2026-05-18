import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from './dialog'

type Props = {
  open: boolean
  onOpenChange: (value: boolean) => void
  title: string
  data: Record<string, unknown> | null
}

export function DetailSheet({ open, onOpenChange, title, data }: Props) {
  const entries = Object.entries(data ?? {})
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-[var(--bg-border)] pb-3">
          <div>
            <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
            <DialogDescription className="mono text-xs text-[var(--text-secondary)]">
              Live record details
            </DialogDescription>
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
        <div className="max-h-[70vh] overflow-auto pr-1">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {entries.map(([key, value]) => (
              <div
                key={key}
                className="rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)] p-3"
              >
                <p className="mono text-xs uppercase text-[var(--text-secondary)]">
                  {key}
                </p>
                <p className="mt-1 break-all text-sm text-[var(--text-primary)]">
                  {typeof value === 'number' || key.includes('id') || key.includes('date')
                    ? <span className="mono">{String(value ?? '-')}</span>
                    : String(value ?? '-')}
                </p>
              </div>
            ))}
          </div>
          {entries.length === 0 && (
            <p className="text-sm text-[var(--text-secondary)]">No detail fields available.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
