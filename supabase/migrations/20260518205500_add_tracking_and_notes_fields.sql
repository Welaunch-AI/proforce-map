alter table public.fr_appointments
  add column if not exists lat_in numeric,
  add column if not exists lat_out numeric,
  add column if not exists long_in numeric,
  add column if not exists long_out numeric,
  add column if not exists notes text,
  add column if not exists office_notes text,
  add column if not exists appointment_notes text;
