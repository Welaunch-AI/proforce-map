import {
  crossPlatformOverlap,
  fieldroutesBreakdown,
  interpretationNotes,
  motiveBreakdown,
  profileFields,
  technicianTotals,
  topOperationalEmployees,
} from '../data/technicianBreakdownReport'

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="glass-panel rounded-xl border border-[var(--bg-border)] p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-secondary)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{value}</p>
    </article>
  )
}

export function UserKindDetailsPage() {
  return (
    <div className="space-y-4">
      <section className="glass-panel rounded-xl border border-[var(--bg-border)] p-5">
        <h1 className="text-xl font-semibold">User Kind and Technician Detail Report</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Deep breakdown of FieldRoutes employees, Motive user roles, cross-platform overlap, and
          per-user field availability.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="FR Operational Employees"
          value={`${technicianTotals.fieldroutes_operational_employees_from_appointments} (${technicianTotals.fieldroutes_operational_pct}%)`}
        />
        <StatCard label="Motive Drivers" value={technicianTotals.motive_driver_users} />
        <StatCard label="Motive Fleet Users" value={technicianTotals.motive_fleet_users} />
        <StatCard label="Matched Pairs" value={technicianTotals.matched_pairs_total} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="glass-panel rounded-xl border border-[var(--bg-border)] p-4">
          <h2 className="mb-3 text-sm uppercase tracking-[0.12em] text-[var(--text-secondary)]">
            FieldRoutes Type Breakdown
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--bg-border)] text-left text-[var(--text-secondary)]">
                  <th className="py-2 pr-3">Type Code</th>
                  <th className="py-2 pr-3">Employees</th>
                  <th className="py-2 pr-3">Operational</th>
                  <th className="py-2 pr-3">Operational %</th>
                </tr>
              </thead>
              <tbody>
                {fieldroutesBreakdown.operational_by_type_code.map((row) => (
                  <tr
                    key={row.fieldroutes_type_code}
                    className="border-b border-[var(--bg-border)] last:border-b-0"
                  >
                    <td className="mono py-2 pr-3">{row.fieldroutes_type_code}</td>
                    <td className="mono py-2 pr-3">{row.employee_count}</td>
                    <td className="mono py-2 pr-3">{row.operational_count}</td>
                    <td className="mono py-2 pr-3">{row.operational_pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel rounded-xl border border-[var(--bg-border)] p-4">
          <h2 className="mb-3 text-sm uppercase tracking-[0.12em] text-[var(--text-secondary)]">
            Motive Role and Status Breakdown
          </h2>
          <div className="space-y-2">
            {Object.entries(motiveBreakdown.role_counts).map(([role, count]) => (
              <div
                key={role}
                className="flex items-center justify-between rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)] px-3 py-2"
              >
                <span className="mono text-xs text-[var(--text-secondary)]">{role}</span>
                <span className="mono text-sm">{count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <StatCard label="Active Users" value={motiveBreakdown.status_counts.active} />
            <StatCard label="Deactivated Users" value={motiveBreakdown.status_counts.deactivated} />
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-xl border border-[var(--bg-border)] p-4">
        <h2 className="mb-3 text-sm uppercase tracking-[0.12em] text-[var(--text-secondary)]">
          Cross-Platform Technician Overlap
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Matched FR Operational"
            value={crossPlatformOverlap.matched_pairs_where_fieldroutes_operational}
          />
          <StatCard
            label="Matched Motive Driver"
            value={crossPlatformOverlap.matched_pairs_where_motive_role_driver}
          />
          <StatCard
            label="Matched Motive Fleet User"
            value={crossPlatformOverlap.matched_pairs_where_motive_role_fleet_user}
          />
          <StatCard
            label="Operational -> Driver"
            value={crossPlatformOverlap.matched_pairs_operational_to_driver}
          />
          <StatCard
            label="Operational -> Fleet User"
            value={crossPlatformOverlap.matched_pairs_operational_to_fleet_user}
          />
        </div>
      </section>

      <section className="glass-panel rounded-xl border border-[var(--bg-border)] p-4">
        <h2 className="mb-3 text-sm uppercase tracking-[0.12em] text-[var(--text-secondary)]">
          Top FieldRoutes Operational Employees (By Appointment Actor Events)
        </h2>
        <div className="max-h-[360px] overflow-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--bg-border)] text-left text-[var(--text-secondary)]">
                <th className="py-2 pr-3">Employee ID</th>
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Type Code</th>
                <th className="py-2 pr-3">Actor Events</th>
              </tr>
            </thead>
            <tbody>
              {topOperationalEmployees.map((row) => (
                <tr
                  key={row.fieldroutes_employee_id}
                  className="border-b border-[var(--bg-border)] last:border-b-0"
                >
                  <td className="mono py-2 pr-3">{row.fieldroutes_employee_id}</td>
                  <td className="py-2 pr-3">{row.name ?? 'Unknown'}</td>
                  <td className="mono py-2 pr-3">{row.type_code ?? 'N/A'}</td>
                  <td className="mono py-2 pr-3">{row.appointment_actor_events}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="glass-panel rounded-xl border border-[var(--bg-border)] p-4">
          <h2 className="mb-3 text-sm uppercase tracking-[0.12em] text-[var(--text-secondary)]">
            FieldRoutes User Fields Available
          </h2>
          <div className="max-h-[240px] overflow-auto rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)] p-3">
            <div className="flex flex-wrap gap-2">
              {profileFields.fieldroutes_user_fields_available.map((field) => (
                <span
                  key={field}
                  className="mono rounded-md border border-[var(--bg-border)] px-2 py-1 text-xs text-[var(--text-secondary)]"
                >
                  {field}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-xl border border-[var(--bg-border)] p-4">
          <h2 className="mb-3 text-sm uppercase tracking-[0.12em] text-[var(--text-secondary)]">
            Motive User Fields Available
          </h2>
          <div className="max-h-[240px] overflow-auto rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)] p-3">
            <div className="flex flex-wrap gap-2">
              {profileFields.motive_user_fields_available.map((field) => (
                <span
                  key={field}
                  className="mono rounded-md border border-[var(--bg-border)] px-2 py-1 text-xs text-[var(--text-secondary)]"
                >
                  {field}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-xl border border-[var(--bg-border)] p-4">
        <h2 className="mb-3 text-sm uppercase tracking-[0.12em] text-[var(--text-secondary)]">
          Interpretation Notes
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
          {interpretationNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
