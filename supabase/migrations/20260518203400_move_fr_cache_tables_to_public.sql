-- Move FR workflow cache tables to public so Edge runtime PostgREST can access them.

alter table if exists app_public.fr_employees set schema public;
alter table if exists app_public.fr_appointments set schema public;
alter table if exists app_public.fr_sync_meta set schema public;
