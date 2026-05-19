import type { Employee } from './types'

export const OFFICE_ID = 12
const EST_TIME_ZONE = 'America/New_York'

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
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    if (!year || !month || !day) return value
    const formatted = new Intl.DateTimeFormat('en-US', {
      timeZone: EST_TIME_ZONE,
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    }).format(new Date(Date.UTC(year, month - 1, day, 12)))
    return `${formatted} EST`
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone: EST_TIME_ZONE,
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  }).format(date)
  return `${formatted} EST`
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

export function formatDateTimeEST(value?: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone: EST_TIME_ZONE,
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
  return `${formatted} EST`
}

export function formatTimeEST(value?: string | null): string {
  if (!value) return '-'
  const timeMatch = value.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/)
  if (!timeMatch) return value
  const hour = Number(timeMatch[1])
  const minute = Number(timeMatch[2])
  const second = Number(timeMatch[3] ?? '0')
  const date = new Date(Date.UTC(1970, 0, 1, hour, minute, second))
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone: EST_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
  return `${formatted} EST`
}

export function formatTimeRangeEST(start?: string | null, end?: string | null): string {
  return `${formatTimeEST(start)} - ${formatTimeEST(end)}`
}
