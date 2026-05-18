import * as DialogPrimitive from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogTitle = DialogPrimitive.Title
export const DialogDescription = DialogPrimitive.Description
export const DialogClose = DialogPrimitive.Close

export function DialogContent({ children }: { children: ReactNode }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/60" />
      <DialogPrimitive.Content className="glass-panel fixed left-1/2 top-1/2 z-50 w-[96vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 rounded-xl p-5 outline-none">
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
