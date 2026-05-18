import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

type JsonObject = Record<string, unknown>;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SERVICE_ROLE_KEY") ??
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const ALLOWED_SORT_FIELDS = new Set([
  "id",
  "appointment_date",
  "date_updated",
  "date_added",
  "date_completed",
  "status",
  "customer_id",
  "route_id",
  "ticket_id",
  "group_id",
]);

function asNumber(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function asString(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x)).filter((x) => x.length > 0);
}

function asNumberArray(v: unknown): number[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => Number(x)).filter((x) => Number.isFinite(x));
}

Deno.serve(async (req) => {
  try {
    const body = req.method === "POST" ? (await req.json()) as JsonObject : {};
    const officeId = asNumber(body.office_id);
    if (!officeId) {
      return new Response(
        JSON.stringify({ ok: false, error: "office_id is required" }, null, 2),
        { headers: { "content-type": "application/json" }, status: 400 },
      );
    }

    const page = Math.max(1, asNumber(body.page) ?? 1);
    const pageSize = Math.min(200, Math.max(1, asNumber(body.page_size) ?? 25));
    const offset = (page - 1) * pageSize;

    const sortByRaw = asString(body.sort_by) ?? "date_updated";
    const sortBy = ALLOWED_SORT_FIELDS.has(sortByRaw) ? sortByRaw : "date_updated";
    const sortDir = (asString(body.sort_dir) ?? "desc").toLowerCase() === "asc";

    let query = supabase
      .from("fr_appointments")
      .select("*", { count: "exact" })
      .eq("office_id", officeId);

    const statusIn = asStringArray(body.status_in);
    if (statusIn.length) query = query.in("status", statusIn);

    const statusTextIn = asStringArray(body.status_text_in);
    if (statusTextIn.length) query = query.in("status_text", statusTextIn);

    const appointmentDateFrom = asString(body.appointment_date_from);
    if (appointmentDateFrom) query = query.gte("appointment_date", appointmentDateFrom);
    const appointmentDateTo = asString(body.appointment_date_to);
    if (appointmentDateTo) query = query.lte("appointment_date", appointmentDateTo);

    const dateUpdatedFrom = asString(body.date_updated_from);
    if (dateUpdatedFrom) query = query.gte("date_updated", dateUpdatedFrom);
    const dateUpdatedTo = asString(body.date_updated_to);
    if (dateUpdatedTo) query = query.lte("date_updated", dateUpdatedTo);

    const customerId = asNumber(body.customer_id);
    if (customerId) query = query.eq("customer_id", customerId);
    const routeId = asNumber(body.route_id);
    if (routeId) query = query.eq("route_id", routeId);
    const ticketId = asNumber(body.ticket_id);
    if (ticketId) query = query.eq("ticket_id", ticketId);
    const groupId = asNumber(body.group_id);
    if (groupId) query = query.eq("group_id", groupId);

    const appointmentTypeIn = asStringArray(body.appointment_type_in);
    if (appointmentTypeIn.length) query = query.in("appointment_type", appointmentTypeIn);

    const timeWindowIn = asStringArray(body.time_window_in);
    if (timeWindowIn.length) query = query.in("time_window", timeWindowIn);

    const actorIds = asNumberArray(body.actor_employee_ids);
    if (actorIds.length) {
      query = query.or(
        `employee_id.in.(${actorIds.join(",")}),assigned_tech_id.in.(${actorIds.join(",")}),serviced_by_id.in.(${actorIds.join(",")}),completed_by_id.in.(${actorIds.join(",")})`,
      );
    }

    query = query.order(sortBy, { ascending: sortDir }).order("id", { ascending: sortDir });
    query = query.range(offset, offset + pageSize - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    const totalCount = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    return new Response(
      JSON.stringify({
        ok: true,
        pagination: {
          page,
          page_size: pageSize,
          total_count: totalCount,
          total_pages: totalPages,
          has_next: page < totalPages,
          has_prev: page > 1,
        },
        sort: { by: sortBy, dir: sortDir ? "asc" : "desc" },
        data: data ?? [],
      }, null, 2),
      { headers: { "content-type": "application/json" }, status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    return new Response(
      JSON.stringify({ ok: false, error: message }, null, 2),
      { headers: { "content-type": "application/json" }, status: 500 },
    );
  }
});
