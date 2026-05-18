import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

type JsonObject = Record<string, unknown>;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SERVICE_ROLE_KEY") ??
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  "";
const FR_PIC_CDN_BASE = (Deno.env.get("FIELD_ROUTE_PIC_CDN_BASE_URL") ?? "https://d282x1mqo546ey.cloudfront.net").replace(/\/+$/, "");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const ALLOWED_SORT_FIELDS = new Set([
  "id",
  "date_updated",
  "fname",
  "lname",
  "active",
  "employee_type",
  "access_control_profile_id",
  "primary_team",
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
      .from("fr_employees")
      .select("*", { count: "exact" })
      .eq("office_id", officeId);

    const activeIn = asStringArray(body.active_in);
    if (activeIn.length) query = query.in("active", activeIn);

    const employeeTypeIn = asStringArray(body.employee_type_in);
    if (employeeTypeIn.length) query = query.in("employee_type", employeeTypeIn);

    const accessProfileIn = asNumberArray(body.access_control_profile_id_in);
    if (accessProfileIn.length) query = query.in("access_control_profile_id", accessProfileIn);

    const primaryTeamIn = asNumberArray(body.primary_team_in);
    if (primaryTeamIn.length) query = query.in("primary_team", primaryTeamIn);

    const dateUpdatedFrom = asString(body.date_updated_from);
    if (dateUpdatedFrom) query = query.gte("date_updated", dateUpdatedFrom);
    const dateUpdatedTo = asString(body.date_updated_to);
    if (dateUpdatedTo) query = query.lte("date_updated", dateUpdatedTo);

    const nameQuery = asString(body.name_query);
    if (nameQuery) query = query.or(`fname.ilike.%${nameQuery}%,lname.ilike.%${nameQuery}%`);

    const linkedId = asString(body.linked_employee_id_contains);
    if (linkedId) query = query.ilike("linked_employee_ids", `%${linkedId}%`);

    query = query.order(sortBy, { ascending: sortDir }).order("id", { ascending: sortDir });
    query = query.range(offset, offset + pageSize - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    const dataWithPicUrl = (data ?? []).map((row) => {
      const pic = row.pic == null ? null : String(row.pic).trim();
      return {
        ...row,
        pic_url: pic ? `${FR_PIC_CDN_BASE}/${pic}` : null,
      };
    });

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
        data: dataWithPicUrl,
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
