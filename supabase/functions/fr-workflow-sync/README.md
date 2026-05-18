# `fr-workflow-sync` Function README

## Purpose

`fr-workflow-sync` pulls FieldRoutes workflow data and updates a minimal Supabase cache for dashboard/workflow use.

It is intentionally **not** a full FieldRoutes mirror.

## What it does

1. Calls `POST /api/appointment/search` to get `appointmentIDs`.
2. Calls `POST /api/appointment/get` in batches (`80` IDs per batch).
3. Extracts employee IDs from appointment role fields:
   - `employeeID`
   - `assignedTech`
   - `servicedBy`
   - `completedBy`
4. Calls `POST /api/employee/get` in batches (`80` IDs per batch).
5. Normalizes payload values (date/id sentinels -> `null`).
6. Performs stale-safe upserts into:
   - `app_public.fr_appointments`
   - `app_public.fr_employees`
7. Updates `app_public.fr_sync_meta` for watermark tracking.

## Important behavior

- No appointment fetch filter by office ID is applied.
- Appointments missing `officeID` are skipped for DB write.
- Older payloads do not overwrite newer rows (`date_updated` check).
- Employee IDs are treated as **operational account IDs**, not canonical person identity.

## Identity caveat (important)

FieldRoutes employee records can contain the same human-readable name across multiple `employeeID` values (including cross-`type` variants).

Implication for this function and schema:
- keep appointment role links as scalar IDs (`employee_id`, `assigned_tech_id`, `serviced_by_id`, `completed_by_id`)
- do not assume one person = one `employeeID`
- avoid person-level dedup assumptions inside workflow cache writes

## Environment variables

- `FIELD_ROUTE_BASE_URL`
- `FIELD_ROUTE_ACCESS_KEY`
- `FIELD_ROUTE_ACCESS_TOKEN`
- `SUPABASE_URL`
- `SERVICE_ROLE_KEY` (preferred secret name in Supabase)
  - fallback supported in code: `SUPABASE_SERVICE_ROLE_KEY`

## Database objects used

- `app_public.fr_appointments`
- `app_public.fr_employees`
- `app_public.fr_sync_meta`

Migration reference:
- `supabase/migrations/20260518191500_fr_workflow_cache.sql`

## Normalization rules

- Date/time sentinels treated as null:
  - `0000-00-00`
  - `0000-00-00 00:00:00`
  - empty string
- ID sentinels treated as null:
  - `0`
  - `-1`

## Write/update rules

- Upsert conflict key for appointments: `id` (`appointmentID`)
- Upsert conflict key for employees: `id` (`employeeID`)
- Row updates only if incoming `date_updated >= existing date_updated`
- `fr_sync_meta` upserted on `office_id`

## Response shape

Success:
- `ok`
- `appointment_ids_fetched`
- `appointments_seen`
- `appointments_skipped_missing_office_id`
- `appointments_upserted`
- `employees_seen`
- `employees_upserted`

Failure:
- `ok: false`
- `error`

## Deployment

```bash
supabase functions deploy fr-workflow-sync
```

## Local invocation (example)

```bash
supabase functions serve fr-workflow-sync --env-file .env
```

```bash
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/fr-workflow-sync' \
  --header 'Authorization: Bearer <SUPABASE_ANON_OR_SERVICE_JWT>' \
  --header 'Content-Type: application/json' \
  --data '{}'
```

## Ownership notes

- This function is workflow-cache infrastructure.
- If product requirements expand, add columns selectively (do not mirror full payloads).
