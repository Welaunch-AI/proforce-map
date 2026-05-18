-- FieldRoutes workflow cache (operational index only)
-- Scope: appointments + employees + sync watermark metadata.

create schema if not exists app_public;

create table if not exists app_public.fr_employees (
  id bigint primary key,
  office_id bigint,
  active text,
  fname text,
  lname text,
  display_name text generated always as (btrim(coalesce(fname, '') || ' ' || coalesce(lname, ''))) stored,
  date_updated timestamptz,
  synced_at timestamptz not null default now()
);

create table if not exists app_public.fr_appointments (
  id bigint primary key,
  office_id bigint not null,
  status text,
  status_text text,
  date_added timestamptz,
  date_updated timestamptz,
  date_completed timestamptz,
  date_cancelled timestamptz,
  cancelled_by bigint,
  employee_id bigint,
  assigned_tech_id bigint,
  serviced_by_id bigint,
  completed_by_id bigint,
  appointment_date date,
  due_date date,
  start_time_raw text,
  end_time_raw text,
  duration_minutes integer,
  time_window text,
  route_id bigint,
  spot_id bigint,
  temp_spot_id bigint,
  customer_id bigint,
  subscription_id bigint,
  ticket_id bigint,
  group_id bigint,
  appointment_type text,
  time_in timestamptz,
  time_out timestamptz,
  check_in timestamptz,
  check_out timestamptz,
  synced_at timestamptz not null default now()
);

create table if not exists app_public.fr_sync_meta (
  office_id bigint primary key,
  last_successful_sync_at timestamptz,
  max_appointment_date_updated timestamptz,
  max_employee_date_updated timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists fr_employees_office_id_idx on app_public.fr_employees (office_id);
create index if not exists fr_employees_date_updated_idx on app_public.fr_employees (date_updated desc nulls last);

create index if not exists fr_appointments_office_date_idx on app_public.fr_appointments (office_id, appointment_date desc);
create index if not exists fr_appointments_office_status_date_idx on app_public.fr_appointments (office_id, status, appointment_date desc);
create index if not exists fr_appointments_date_updated_idx on app_public.fr_appointments (date_updated desc nulls last);
create index if not exists fr_appointments_customer_id_idx on app_public.fr_appointments (customer_id);
create index if not exists fr_appointments_employee_id_idx on app_public.fr_appointments (employee_id);
create index if not exists fr_appointments_assigned_tech_id_idx on app_public.fr_appointments (assigned_tech_id);
create index if not exists fr_appointments_serviced_by_id_idx on app_public.fr_appointments (serviced_by_id);
create index if not exists fr_appointments_completed_by_id_idx on app_public.fr_appointments (completed_by_id);

create or replace function app_public.current_office_id()
returns bigint
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'office_id', '')::bigint
$$;

grant usage on schema app_public to authenticated;
grant select, insert, update, delete on app_public.fr_employees to authenticated;
grant select, insert, update, delete on app_public.fr_appointments to authenticated;
grant select, insert, update, delete on app_public.fr_sync_meta to authenticated;

alter table app_public.fr_employees enable row level security;
alter table app_public.fr_appointments enable row level security;
alter table app_public.fr_sync_meta enable row level security;

-- Service role bypasses RLS automatically. For authenticated users, require office-scoped access.
create policy fr_employees_office_read
on app_public.fr_employees
for select
to authenticated
using (office_id = app_public.current_office_id());

create policy fr_appointments_office_read
on app_public.fr_appointments
for select
to authenticated
using (office_id = app_public.current_office_id());

create policy fr_sync_meta_office_read
on app_public.fr_sync_meta
for select
to authenticated
using (office_id = app_public.current_office_id());

create policy fr_employees_office_write
on app_public.fr_employees
for all
to authenticated
using (office_id = app_public.current_office_id())
with check (office_id = app_public.current_office_id());

create policy fr_appointments_office_write
on app_public.fr_appointments
for all
to authenticated
using (office_id = app_public.current_office_id())
with check (office_id = app_public.current_office_id());

create policy fr_sync_meta_office_write
on app_public.fr_sync_meta
for all
to authenticated
using (office_id = app_public.current_office_id())
with check (office_id = app_public.current_office_id());
