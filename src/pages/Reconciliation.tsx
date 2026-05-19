import {
  ambiguousNames,
  identifierCoverage,
  matchBreakdown,
  matchedList,
  reconciliationTotals,
} from '../data/userReconciliationReport'

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="glass-panel rounded-xl border border-[var(--bg-border)] p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-secondary)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{value}</p>
    </article>
  )
}

export function ReconciliationPage() {
  return (
    <div className="space-y-4">
      <section className="glass-panel rounded-xl border border-[var(--bg-border)] p-5">
        <h1 className="text-xl font-semibold">FieldRoutes vs Motive User Reconciliation</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Snapshot report generated from raw JSON responses in the `data/responses/raw` directory.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="FieldRoutes Total Users" value={reconciliationTotals.fieldroutes_total_users} />
        <StatCard label="Motive Total Users" value={reconciliationTotals.motive_total_users} />
        <StatCard label="Matched Pairs" value={reconciliationTotals.matched_pairs} />
        <StatCard label="FieldRoutes Unmatched" value={reconciliationTotals.fieldroutes_unmatched} />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StatCard label="Motive Unmatched" value={reconciliationTotals.motive_unmatched} />
        <StatCard
          label="Match Rate (FR / Motive)"
          value={`${reconciliationTotals.fieldroutes_match_rate_pct}% / ${reconciliationTotals.motive_match_rate_pct}%`}
        />
      </section>

      <section className="glass-panel rounded-xl border border-[var(--bg-border)] p-4">
        <h2 className="mb-3 text-sm uppercase tracking-[0.12em] text-[var(--text-secondary)]">
          Identifier Coverage
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--bg-border)] text-left text-[var(--text-secondary)]">
                <th className="py-2 pr-3">Platform</th>
                <th className="py-2 pr-3">With Email</th>
                <th className="py-2 pr-3">With Phone</th>
                <th className="py-2 pr-3">With Name</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[var(--bg-border)]">
                <td className="py-2 pr-3">FieldRoutes</td>
                <td className="mono py-2 pr-3">{identifierCoverage.fieldroutes_with_email}</td>
                <td className="mono py-2 pr-3">{identifierCoverage.fieldroutes_with_phone}</td>
                <td className="mono py-2 pr-3">{identifierCoverage.fieldroutes_with_name}</td>
              </tr>
              <tr>
                <td className="py-2 pr-3">Motive</td>
                <td className="mono py-2 pr-3">{identifierCoverage.motive_with_email}</td>
                <td className="mono py-2 pr-3">{identifierCoverage.motive_with_phone}</td>
                <td className="mono py-2 pr-3">{identifierCoverage.motive_with_name}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="glass-panel rounded-xl border border-[var(--bg-border)] p-4">
          <h2 className="mb-3 text-sm uppercase tracking-[0.12em] text-[var(--text-secondary)]">
            Match Breakdown
          </h2>
          <div className="space-y-2">
            {Object.entries(matchBreakdown).map(([method, count]) => (
              <div
                key={method}
                className="flex items-center justify-between rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)] px-3 py-2"
              >
                <span className="mono text-xs text-[var(--text-secondary)]">{method}</span>
                <span className="mono text-sm">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-xl border border-[var(--bg-border)] p-4">
          <h2 className="mb-3 text-sm uppercase tracking-[0.12em] text-[var(--text-secondary)]">
            Ambiguous Name Overlaps
          </h2>
          <div className="max-h-[240px] overflow-auto">
            <table className="w-full min-w-[420px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--bg-border)] text-left text-[var(--text-secondary)]">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">FR</th>
                  <th className="py-2 pr-3">Motive</th>
                </tr>
              </thead>
              <tbody>
                {ambiguousNames.map((item) => (
                  <tr key={item.name} className="border-b border-[var(--bg-border)] last:border-b-0">
                    <td className="py-2 pr-3">{item.name}</td>
                    <td className="mono py-2 pr-3">{item.fieldroutes_count}</td>
                    <td className="mono py-2 pr-3">{item.motive_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-xl border border-[var(--bg-border)] p-4">
        <h2 className="mb-3 text-sm uppercase tracking-[0.12em] text-[var(--text-secondary)]">
          Matched List
        </h2>
        <div className="max-h-[540px] overflow-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--bg-border)] text-left text-[var(--text-secondary)]">
                <th className="py-2 pr-3">FR Employee ID</th>
                <th className="py-2 pr-3">FR Name</th>
                <th className="py-2 pr-3">Motive User ID</th>
                <th className="py-2 pr-3">Motive Name</th>
                <th className="py-2 pr-3">Method</th>
                <th className="py-2 pr-3">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {matchedList.map((row) => (
                <tr
                  key={`${row.fieldroutes_employee_id}-${row.motive_user_id}`}
                  className="border-b border-[var(--bg-border)] last:border-b-0"
                >
                  <td className="mono py-2 pr-3">{row.fieldroutes_employee_id}</td>
                  <td className="py-2 pr-3">{row.fieldroutes_name}</td>
                  <td className="mono py-2 pr-3">{row.motive_user_id}</td>
                  <td className="py-2 pr-3">{row.motive_name}</td>
                  <td className="mono py-2 pr-3 text-xs text-[var(--text-secondary)]">{row.method}</td>
                  <td className="py-2 pr-3">{row.confidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
