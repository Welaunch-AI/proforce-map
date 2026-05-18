# FieldRoutes Workflow Cache Ingest Mapping

This document defines how FieldRoutes payloads map into Supabase workflow cache tables.

## Tenant and RLS decision

- Current operational dataset is single-office (`officeID = 12`).
- Schema remains multi-office ready via `office_id` on all tables.
- RLS strategy:
  - service-role writes (Edge sync) are allowed by service-role bypass.
  - authenticated reads/writes require JWT claim `office_id` matching row `office_id`.

## Source APIs and ingestion flow

1. `POST /api/appointment/search` -> collect `appointmentIDs`.
2. `POST /api/appointment/get` -> upsert `app_public.fr_appointments`.
3. extract employee IDs from appointment role columns.
4. `POST /api/employee/get` -> upsert `app_public.fr_employees`.
5. update `app_public.fr_sync_meta` watermark values.

## Sentinel normalization rules

- Treat the following as `null`:
  - `"0000-00-00"`
  - `"0000-00-00 00:00:00"`
  - `""`
  - `null`
- Numeric sentinel handling:
  - for ID-like fields (`subscriptionID`, `subscriptionRegionID`, `routeID`, `spotID`, `tempSpotID`, `ticketID`, `groupID`, employee role IDs), map `"-1"` and `"0"` to `null` unless domain semantics explicitly require `0`.
  - for `subscription_id`, use `null` for `-1` in cache.
- Keep `status` and `statusText` as-is from FieldRoutes (no enum coercion in v1).
- Preserve `start`/`end` as raw text fields (`start_time_raw`, `end_time_raw`).

## Upsert conflict rules

### `fr_appointments`

- Conflict key: `(id)` where `id = appointmentID`.
- Update rule:
  - if incoming `dateUpdated` is newer than stored `date_updated`, update row.
  - if equal, update only `synced_at`.
  - if older, skip mutation (stale payload protection).

### `fr_employees`

- Conflict key: `(id)` where `id = employeeID`.
- Update rule:
  - if incoming `employee.dateUpdated` is newer than stored `date_updated`, update row.
  - if equal, update only `synced_at`.
  - if older, skip mutation.

### `fr_sync_meta`

- Conflict key: `(office_id)`.
- Always update:
  - `last_successful_sync_at` at end of successful run.
  - `max_appointment_date_updated` with max parsed appointment `dateUpdated` seen.
  - `max_employee_date_updated` with max parsed employee `dateUpdated` seen.

## Field mappings

### `app_public.fr_employees`

- `id` <- `employee.employeeID` (bigint)
- `office_id` <- `employee.officeID` (bigint nullable)
- `active` <- `employee.active` (text)
- `fname` <- `employee.fname` (text)
- `lname` <- `employee.lname` (text)
- `date_updated` <- normalized `employee.dateUpdated` (timestamptz nullable)
- `synced_at` <- sync timestamp (`now()`)

### `app_public.fr_appointments`

- `id` <- `appointment.appointmentID`
- `office_id` <- `appointment.officeID`
- `status` <- `appointment.status`
- `status_text` <- `appointment.statusText`
- `date_added` <- normalized `appointment.dateAdded`
- `date_updated` <- normalized `appointment.dateUpdated`
- `date_completed` <- normalized `appointment.dateCompleted`
- `date_cancelled` <- normalized `appointment.dateCancelled`
- `cancelled_by` <- normalized bigint `appointment.cancelledBy`

Operational role columns:
- `employee_id` <- normalized bigint `appointment.employeeID`
- `assigned_tech_id` <- normalized bigint `appointment.assignedTech`
- `serviced_by_id` <- normalized bigint `appointment.servicedBy`
- `completed_by_id` <- normalized bigint `appointment.completedBy`

Scheduling and routing:
- `appointment_date` <- normalized date `appointment.date`
- `due_date` <- normalized date `appointment.dueDate`
- `start_time_raw` <- `appointment.start` (text)
- `end_time_raw` <- `appointment.end` (text)
- `duration_minutes` <- normalized int `appointment.duration`
- `time_window` <- `appointment.timeWindow`
- `route_id` <- normalized bigint `appointment.routeID`
- `spot_id` <- normalized bigint `appointment.spotID`
- `temp_spot_id` <- normalized bigint `appointment.tempSpotID`

Light links:
- `customer_id` <- normalized bigint `appointment.customerID`
- `subscription_id` <- normalized bigint `appointment.subscriptionID`
- `ticket_id` <- normalized bigint `appointment.ticketID`
- `group_id` <- normalized bigint `appointment.groupID`
- `appointment_type` <- `appointment.type`

Execution timestamps:
- `time_in` <- normalized `appointment.timeIn`
- `time_out` <- normalized `appointment.timeOut`
- `check_in` <- normalized `appointment.checkIn`
- `check_out` <- normalized `appointment.checkOut`

- `synced_at` <- sync timestamp (`now()`)

## Excluded from workflow cache v1

- notes fields (`notes`, `officeNotes`, `appointmentNotes`)
- payment/weather/location detail fields (`amountCollected`, `wind*`, `lat*`, `long*`)
- full nested arrays/objects (`unitIDs`, full employee profile extras)

These remain available from direct FieldRoutes API reads when needed.
