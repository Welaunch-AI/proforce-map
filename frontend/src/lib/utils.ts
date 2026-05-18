import type { Employee } from './types'

export const OFFICE_ID = 12

export function fullName(employee?: Employee | null): string {
  if (!employee) return 'Unassigned'
  return `${employee.fname ?? ''} ${employee.lname ?? ''}`.trim() || 'Unnamed'
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'NA'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function formatDate(value?: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

export function formatRelative(value?: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const delta = Math.floor((Date.now() - date.getTime()) / 1000)
  if (delta < 60) return `${delta}s ago`
  if (delta < 3600) return `${Math.floor(delta / 60)}m ago`
  if (delta < 86400) return `${Math.floor(delta / 3600)}h ago`
  return `${Math.floor(delta / 86400)}d ago`
}

export function isoToday(): string {
  return new Date().toISOString().slice(0, 10)
}

export function idKey(value: unknown): string {
  return String(value ?? '')
}
