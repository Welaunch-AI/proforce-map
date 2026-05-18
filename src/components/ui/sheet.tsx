import * as Dialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'

type SheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>{children}</Dialog.Portal>
    </Dialog.Root>
  )
}

export const SheetTrigger = Dialog.Trigger
export const SheetTitle = Dialog.Title
export const SheetDescription = Dialog.Description

export function SheetContent({ children }: { children: ReactNode }) {
  return (
    <>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
      <Dialog.Content className="glass-panel fixed right-0 top-0 z-50 h-full w-full max-w-2xl overflow-auto p-5 outline-none">
        {children}
      </Dialog.Content>
    </>
  )
}
