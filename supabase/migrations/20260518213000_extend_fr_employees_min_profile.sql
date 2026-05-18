alter table public.fr_employees
  add column if not exists initials text,
  add column if not exists employee_type text,
  add column if not exists linked_employee_ids text,
  add column if not exists access_control_profile_id bigint,
  add column if not exists access_control_profile_name text,
  add column if not exists primary_team bigint,
  add column if not exists license_number text,
  add column if not exists start_address text,
  add column if not exists start_city text,
  add column if not exists start_state text,
  add column if not exists start_zip text,
  add column if not exists start_lat numeric,
  add column if not exists start_lng numeric;
