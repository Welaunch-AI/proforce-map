# FieldRoutes Read Endpoints

These endpoints provide pagination + filtering for frontend consumption.

## 1) `fr-appointments-list`

Path:
- `POST /functions/v1/fr-appointments-list`

Required body:
- `office_id` (number)

Optional pagination/sort:
- `page` (default `1`)
- `page_size` (default `25`, max `200`)
- `sort_by` (`id`, `appointment_date`, `date_updated`, `date_added`, `date_completed`, `status`, `customer_id`, `route_id`, `ticket_id`, `group_id`)
- `sort_dir` (`asc` | `desc`, default `desc`)

Optional filters:
- `status_in` (string[])
- `status_text_in` (string[])
- `appointment_date_from`, `appointment_date_to` (ISO date string)
- `date_updated_from`, `date_updated_to` (ISO datetime string)
- `customer_id`, `route_id`, `ticket_id`, `group_id` (number)
- `appointment_type_in` (string[])
- `time_window_in` (string[])
- `actor_employee_ids` (number[]) -> matches any role field:
  - `employee_id`, `assigned_tech_id`, `serviced_by_id`, `completed_by_id`

Response:
- `ok`
- `pagination` (`page`, `page_size`, `total_count`, `total_pages`, `has_next`, `has_prev`)
- `sort`
- `data` (rows from `public.fr_appointments`)

---

## 2) `fr-employees-list`

Path:
- `POST /functions/v1/fr-employees-list`

Required body:
- `office_id` (number)

Optional pagination/sort:
- `page` (default `1`)
- `page_size` (default `25`, max `200`)
- `sort_by` (`id`, `date_updated`, `fname`, `lname`, `active`, `employee_type`, `access_control_profile_id`, `primary_team`)
- `sort_dir` (`asc` | `desc`, default `desc`)

Optional filters:
- `active_in` (string[]) e.g. `["1"]`
- `employee_type_in` (string[])
- `access_control_profile_id_in` (number[])
- `primary_team_in` (number[])
- `date_updated_from`, `date_updated_to` (ISO datetime string)
- `name_query` (string; fuzzy search on `fname`/`lname`)
- `linked_employee_id_contains` (string; `linked_employee_ids` contains value)

Response:
- `ok`
- `pagination`
- `sort`
- `data` (rows from `public.fr_employees`)
  - includes computed `pic_url` = `<FIELD_ROUTE_PIC_CDN_BASE_URL>/<pic>` when `pic` exists

---

## Example invoke

```bash
curl -sS -X POST "$SUPABASE_URL/functions/v1/fr-appointments-list" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"office_id":12,"page":1,"page_size":20,"status_in":["1","0"],"sort_by":"date_updated","sort_dir":"desc"}'
```

```bash
curl -sS -X POST "$SUPABASE_URL/functions/v1/fr-employees-list" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"office_id":12,"page":1,"page_size":20,"active_in":["1"],"name_query":"Peter","sort_by":"lname","sort_dir":"asc"}'
```
