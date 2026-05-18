import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

type JsonObject = Record<string, unknown>;

const FR_BASE_URL = Deno.env.get("FIELD_ROUTE_BASE_URL") ?? "";
const FR_KEY = Deno.env.get("FIELD_ROUTE_ACCESS_KEY") ?? "";
const FR_TOKEN = Deno.env.get("FIELD_ROUTE_ACCESS_TOKEN") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SERVICE_ROLE_KEY") ??
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  "";

const APPOINTMENT_GET_BATCH_SIZE = 80;
const EMPLOYEE_GET_BATCH_SIZE = 80;

if (!FR_BASE_URL || !FR_KEY || !FR_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required env vars for fr-workflow-sync");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  db: { schema: "app_public" },
});

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function toNullableId(v: unknown): number | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s || s === "0" || s === "-1") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function toNullableInt(v: unknown): number | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function toNullableDate(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s || s === "0000-00-00") return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function toNullableTimestamp(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s || s === "0000-00-00 00:00:00" || s === "0000-00-00") return null;
  const iso = s.includes("T") ? s : s.replace(" ", "T");
  const dt = new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
  return Number.isNaN(dt.getTime()) ? null : dt.toISOString();
}

async function callFieldRoutes(endpointPath: string, payload: JsonObject): Promise<JsonObject> {
  const res = await fetch(`${FR_BASE_URL}${endpointPath}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      authenticationKey: FR_KEY,
      authenticationToken: FR_TOKEN,
      ...payload,
    }),
  });
  if (!res.ok) {
    throw new Error(`FieldRoutes call failed ${endpointPath}: HTTP ${res.status}`);
  }
  const data = (await res.json()) as JsonObject;
  if (data.success !== true) {
    throw new Error(`FieldRoutes call failed ${endpointPath}: success=false`);
  }
  return data;
}

async function fetchAppointmentIds(): Promise<number[]> {
  const resp = await callFieldRoutes("/api/appointment/search", {});
  const ids = Array.isArray(resp.appointmentIDs) ? resp.appointmentIDs : [];
  return ids.map((x) => Number(x)).filter((x) => Number.isFinite(x));
}

async function fetchAppointments(appointmentIds: number[]): Promise<JsonObject[]> {
  const rows: JsonObject[] = [];
  for (const part of chunk(appointmentIds, APPOINTMENT_GET_BATCH_SIZE)) {
    const resp = await callFieldRoutes("/api/appointment/get", { appointmentIDs: part });
    const appointments = Array.isArray(resp.appointments) ? (resp.appointments as JsonObject[]) : [];
    rows.push(...appointments);
  }
  return rows;
}

async function fetchEmployees(employeeIds: number[]): Promise<JsonObject[]> {
  if (employeeIds.length === 0) return [];
  const rows: JsonObject[] = [];
  for (const part of chunk(employeeIds, EMPLOYEE_GET_BATCH_SIZE)) {
    const resp = await callFieldRoutes("/api/employee/get", { employeeIDs: part });
    const employees = Array.isArray(resp.employees) ? (resp.employees as JsonObject[]) : [];
    rows.push(...employees);
  }
  return rows;
}

function mapAppointmentRow(a: JsonObject) {
  return {
    id: toNullableId(a.appointmentID),
    office_id: toNullableId(a.officeID),
    status: a.status == null ? null : String(a.status),
    status_text: a.statusText == null ? null : String(a.statusText),
    date_added: toNullableTimestamp(a.dateAdded),
    date_updated: toNullableTimestamp(a.dateUpdated),
    date_completed: toNullableTimestamp(a.dateCompleted),
    date_cancelled: toNullableTimestamp(a.dateCancelled),
    cancelled_by: toNullableId(a.cancelledBy),
    employee_id: toNullableId(a.employeeID),
    assigned_tech_id: toNullableId(a.assignedTech),
    serviced_by_id: toNullableId(a.servicedBy),
    completed_by_id: toNullableId(a.completedBy),
    appointment_date: toNullableDate(a.date),
    due_date: toNullableDate(a.dueDate),
    start_time_raw: a.start == null ? null : String(a.start),
    end_time_raw: a.end == null ? null : String(a.end),
    duration_minutes: toNullableInt(a.duration),
    time_window: a.timeWindow == null ? null : String(a.timeWindow),
    route_id: toNullableId(a.routeID),
    spot_id: toNullableId(a.spotID),
    temp_spot_id: toNullableId(a.tempSpotID),
    customer_id: toNullableId(a.customerID),
    subscription_id: toNullableId(a.subscriptionID),
    ticket_id: toNullableId(a.ticketID),
    group_id: toNullableId(a.groupID),
    appointment_type: a.type == null ? null : String(a.type),
    time_in: toNullableTimestamp(a.timeIn),
    time_out: toNullableTimestamp(a.timeOut),
    check_in: toNullableTimestamp(a.checkIn),
    check_out: toNullableTimestamp(a.checkOut),
    synced_at: new Date().toISOString(),
  };
}

function mapEmployeeRow(e: JsonObject) {
  return {
    id: toNullableId(e.employeeID),
    office_id: toNullableId(e.officeID),
    active: e.active == null ? null : String(e.active),
    fname: e.fname == null ? null : String(e.fname),
    lname: e.lname == null ? null : String(e.lname),
    date_updated: toNullableTimestamp(e.dateUpdated),
    synced_at: new Date().toISOString(),
  };
}

async function filterFreshAppointments(rows: ReturnType<typeof mapAppointmentRow>[]) {
  const ids = rows.map((r) => r.id).filter((v): v is number => Number.isFinite(v));
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("fr_appointments").select("id,date_updated").in("id", ids);
  if (error) throw error;
  const existing = new Map<number, string | null>((data ?? []).map((r) => [Number(r.id), r.date_updated as string | null]));
  return rows.filter((row) => {
    if (row.id == null) return false;
    const old = existing.get(row.id);
    if (!old) return true;
    if (!row.date_updated) return false;
    return new Date(row.date_updated).getTime() >= new Date(old).getTime();
  });
}

async function filterFreshEmployees(rows: ReturnType<typeof mapEmployeeRow>[]) {
  const ids = rows.map((r) => r.id).filter((v): v is number => Number.isFinite(v));
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("fr_employees").select("id,date_updated").in("id", ids);
  if (error) throw error;
  const existing = new Map<number, string | null>((data ?? []).map((r) => [Number(r.id), r.date_updated as string | null]));
  return rows.filter((row) => {
    if (row.id == null) return false;
    const old = existing.get(row.id);
    if (!old) return true;
    if (!row.date_updated) return false;
    return new Date(row.date_updated).getTime() >= new Date(old).getTime();
  });
}

Deno.serve(async () => {
  try {
    const appointmentIds = await fetchAppointmentIds();
    const appointmentsRaw = await fetchAppointments(appointmentIds);
    const appointmentRowsAll = appointmentsRaw.map(mapAppointmentRow).filter((r) => r.id != null);
    const appointmentRows = appointmentRowsAll.filter((r) => r.office_id != null);
    const appointmentsSkippedMissingOffice = appointmentRowsAll.length - appointmentRows.length;

    const employeeIdSet = new Set<number>();
    for (const r of appointmentRows) {
      if (r.employee_id != null) employeeIdSet.add(r.employee_id);
      if (r.assigned_tech_id != null) employeeIdSet.add(r.assigned_tech_id);
      if (r.serviced_by_id != null) employeeIdSet.add(r.serviced_by_id);
      if (r.completed_by_id != null) employeeIdSet.add(r.completed_by_id);
    }

    const employeesRaw = await fetchEmployees([...employeeIdSet]);
    const employeeRows = employeesRaw.map(mapEmployeeRow).filter((r) => r.id != null);

    const freshEmployeeRows = await filterFreshEmployees(employeeRows);
    if (freshEmployeeRows.length > 0) {
      const { error } = await supabase.from("fr_employees").upsert(freshEmployeeRows, { onConflict: "id" });
      if (error) throw error;
    }

    const freshAppointmentRows = await filterFreshAppointments(appointmentRows);
    if (freshAppointmentRows.length > 0) {
      const { error } = await supabase.from("fr_appointments").upsert(freshAppointmentRows, { onConflict: "id" });
      if (error) throw error;
    }

    const maxAppointmentDateUpdated = appointmentRows
      .map((r) => r.date_updated)
      .filter((v): v is string => Boolean(v))
      .sort()
      .at(-1) ?? null;
    const maxEmployeeDateUpdated = employeeRows
      .map((r) => r.date_updated)
      .filter((v): v is string => Boolean(v))
      .sort()
      .at(-1) ?? null;

    const officeId = appointmentRows[0]?.office_id ?? null;
    if (officeId != null) {
      const { error: syncError } = await supabase.from("fr_sync_meta").upsert({
        office_id: officeId,
        last_successful_sync_at: new Date().toISOString(),
        max_appointment_date_updated: maxAppointmentDateUpdated,
        max_employee_date_updated: maxEmployeeDateUpdated,
        updated_at: new Date().toISOString(),
      }, { onConflict: "office_id" });
      if (syncError) throw syncError;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        appointment_ids_fetched: appointmentIds.length,
        appointments_seen: appointmentRowsAll.length,
        appointments_skipped_missing_office_id: appointmentsSkippedMissingOffice,
        appointments_upserted: freshAppointmentRows.length,
        employees_seen: employeeRows.length,
        employees_upserted: freshEmployeeRows.length,
      }, null, 2),
      { headers: { "content-type": "application/json" }, status: 200 },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }, null, 2),
      { headers: { "content-type": "application/json" }, status: 500 },
    );
  }
});
