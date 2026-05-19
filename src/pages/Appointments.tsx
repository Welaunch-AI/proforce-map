import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../components/ui/dialog'
import { DetailSheet } from '../components/ui/DetailSheet'
import { StatusBadge } from '../components/ui/StatusBadge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import { useAppointments } from '../hooks/useAppointments'
import { useTechnicians } from '../hooks/useTechnicians'
import {
  formatDate,
  formatRelative,
  formatTimeRangeEST,
  fullName,
  idKey,
} from '../lib/utils'

const PAGE_SIZE = 25
const ATTRIBUTE_FILTERS = [
  { key: 'has_notes', label: 'Has notes', fields: ['notes'] },
  { key: 'has_office_notes', label: 'Has office notes', fields: ['office_notes'] },
  {
    key: 'has_appointment_notes',
    label: 'Has appointment notes',
    fields: ['appointment_notes'],
  },
  { key: 'has_assigned_tech', label: 'Has assigned tech', fields: ['assigned_tech_id'] },
  { key: 'has_serviced_by', label: 'Has serviced by', fields: ['serviced_by_id'] },
  { key: 'has_completed_by', label: 'Has completed by', fields: ['completed_by_id'] },
  { key: 'has_ticket', label: 'Has ticket ID', fields: ['ticket_id'] },
  { key: 'has_group', label: 'Has group ID', fields: ['group_id'] },
  { key: 'has_checkin', label: 'Has check-in', fields: ['check_in'] },
  { key: 'has_checkout', label: 'Has check-out', fields: ['check_out'] },
  { key: 'has_time_in', label: 'Has time-in', fields: ['time_in'] },
  { key: 'has_time_out', label: 'Has time-out', fields: ['time_out'] },
  { key: 'has_geo_in', label: 'Has geo in (lat/long)', fields: ['lat_in', 'long_in'] },
  { key: 'has_geo_out', label: 'Has geo out (lat/long)', fields: ['lat_out', 'long_out'] },
] as const
type AttributeFilterKey = (typeof ATTRIBUTE_FILTERS)[number]['key']

function hasValue(value: unknown): boolean {
  if (value == null) return false
  if (typeof value === 'string') return value.trim() !== ''
  return true
}

export function AppointmentsPage() {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [search, setSearch] = useState('')
  const { data: appointments, loading } = useAppointments({
    onlyToday: false,
    dateFrom: fromDate || undefined,
    dateTo: toDate || undefined,
  })
  const { data: technicians } = useTechnicians()
  const [statusFilter, setStatusFilter] = useState('all')
  const [techFilter, setTechFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [attributeFilters, setAttributeFilters] = useState<AttributeFilterKey[]>([])
  const [draftAttributeFilters, setDraftAttributeFilters] = useState<AttributeFilterKey[]>([])
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null)

  const employeeMap = useMemo(
    () => new Map(technicians.map((tech) => [idKey(tech.id), tech])),
    [technicians],
  )

  const statuses = useMemo(() => {
    return Array.from(new Set(appointments.map((a) => a.status_text).filter(Boolean))).map(String)
  }, [appointments])

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      if (statusFilter !== 'all' && a.status_text !== statusFilter) return false
      if (techFilter !== 'all' && idKey(a.assigned_tech_id) !== techFilter) return false
      if (search.trim()) {
        const query = search.trim().toLowerCase()
        const assignedTech = fullName(employeeMap.get(idKey(a.assigned_tech_id)))
        const employee = fullName(employeeMap.get(idKey(a.employee_id)))
        const servicedBy = fullName(employeeMap.get(idKey(a.serviced_by_id)))
        const haystack = [
          String(a.id ?? ''),
          String(a.customer_id ?? ''),
          String(a.status_text ?? ''),
          String(a.appointment_date ?? ''),
          assignedTech,
          employee,
          servicedBy,
        ]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(query)) return false
      }
      if (attributeFilters.length > 0) {
        const map = new Map(ATTRIBUTE_FILTERS.map((f) => [f.key, f]))
        const matches = attributeFilters.every((filterKey) => {
          const filter = map.get(filterKey)
          if (!filter) return true
          return filter.fields.every((field) => hasValue(a[field]))
        })
        if (!matches) return false
      }
      return true
    })
  }, [appointments, statusFilter, techFilter, attributeFilters, search, employeeMap])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-4">
      <div className="glass-panel rounded-xl p-3">
        <div className="mb-3">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search by appointment ID, customer ID, status, technician..."
            className="mono w-full rounded-md border border-[var(--bg-border)] bg-[var(--bg-surface)] p-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="mono rounded-md border border-[var(--bg-border)] bg-[var(--bg-surface)] p-2 text-sm"
          >
            <option value="all">All Statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            value={techFilter}
            onChange={(e) => {
              setTechFilter(e.target.value)
              setPage(1)
            }}
            className="rounded-md border border-[var(--bg-border)] bg-[var(--bg-surface)] p-2 text-sm"
          >
            <option value="all">All Technicians</option>
            {technicians.map((tech) => (
              <option key={idKey(tech.id)} value={idKey(tech.id)}>
                {fullName(tech)}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value)
              setPage(1)
            }}
            className="mono rounded-md border border-[var(--bg-border)] bg-[var(--bg-surface)] p-2 text-sm"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value)
              setPage(1)
            }}
            className="mono rounded-md border border-[var(--bg-border)] bg-[var(--bg-surface)] p-2 text-sm"
          />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setDraftAttributeFilters(attributeFilters)
              setModalOpen(true)
            }}
            className="mono rounded-md border border-[var(--bg-border)] bg-[var(--bg-surface)] px-3 py-1 text-xs uppercase"
          >
            Filter Attributes
          </button>
          {attributeFilters.length > 0 && (
            <p className="mono text-xs text-[var(--text-secondary)]">
              {attributeFilters.length} attribute filter(s) applied
            </p>
          )}
        </div>
      </div>

      <div className="glass-panel overflow-hidden rounded-xl">
        {loading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="skeleton h-11 rounded-md" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--text-secondary)]">
            No appointments match current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Assigned Tech</TableHead>
                  <TableHead>Serviced By</TableHead>
                  <TableHead>Customer ID</TableHead>
                  <TableHead>Synced</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((appt) => (
                  <TableRow key={idKey(appt.id)} onClick={() => setSelected(appt)}>
                    <TableCell><span className="mono">{String(appt.id)}</span></TableCell>
                    <TableCell>{formatDate(appt.appointment_date)}</TableCell>
                    <TableCell>
                      <span className="mono">{formatTimeRangeEST(appt.start_time_raw, appt.end_time_raw)}</span>
                    </TableCell>
                    <TableCell><StatusBadge status={appt.status_text} /></TableCell>
                    <TableCell>{fullName(employeeMap.get(idKey(appt.employee_id)))}</TableCell>
                    <TableCell>{fullName(employeeMap.get(idKey(appt.assigned_tech_id)))}</TableCell>
                    <TableCell>{fullName(employeeMap.get(idKey(appt.serviced_by_id)))}</TableCell>
                    <TableCell><span className="mono">{String(appt.customer_id ?? '-')}</span></TableCell>
                    <TableCell><span className="mono">{formatRelative(appt.synced_at)}</span></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          className="mono rounded-md border border-[var(--bg-border)] px-3 py-1 text-sm disabled:opacity-40"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </button>
        <span className="mono text-sm text-[var(--text-secondary)]">
          Page {page} / {pageCount}
        </span>
        <button
          type="button"
          className="mono rounded-md border border-[var(--bg-border)] px-3 py-1 text-sm disabled:opacity-40"
          disabled={page === pageCount}
          onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
        >
          Next
        </button>
      </div>

      <DetailSheet
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
        title="Appointment details"
        data={selected}
      />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <div className="mb-3">
            <DialogTitle className="text-lg font-semibold">Attribute Filters</DialogTitle>
            <DialogDescription className="mono text-xs text-[var(--text-secondary)]">
              Check required attributes, then apply to appointment list.
            </DialogDescription>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {ATTRIBUTE_FILTERS.map((filter) => (
              <label
                key={filter.key}
                className="flex items-center gap-2 rounded-md border border-[var(--bg-border)] bg-[var(--bg-surface)] p-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={draftAttributeFilters.includes(filter.key)}
                  onChange={(e) => {
                    setDraftAttributeFilters((prev) =>
                      e.target.checked
                        ? [...prev, filter.key]
                        : prev.filter((key) => key !== filter.key),
                    )
                  }}
                />
                <span>{filter.label}</span>
              </label>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setDraftAttributeFilters([])}
              className="mono rounded-md border border-[var(--bg-border)] px-3 py-1 text-xs uppercase"
            >
              Clear
            </button>
            <DialogClose asChild>
              <button
                type="button"
                className="mono rounded-md border border-[var(--bg-border)] px-3 py-1 text-xs uppercase"
              >
                Cancel
              </button>
            </DialogClose>
            <button
              type="button"
              onClick={() => {
                setAttributeFilters(draftAttributeFilters)
                setPage(1)
                setModalOpen(false)
              }}
              className="mono rounded-md border border-[var(--accent-primary)] bg-[var(--accent-primary)] px-3 py-1 text-xs uppercase text-white"
            >
              Apply
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
