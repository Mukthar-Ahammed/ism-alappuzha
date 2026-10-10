-- Phase 1 repair: allow server-only Supabase secret key operations.
-- Public anon/authenticated roles remain blocked by RLS and revoked privileges.

grant usage on schema public to service_role;

grant select, insert, update, delete on table public.questions to service_role;
grant select, insert, update, delete on table public.admins to service_role;
grant select, insert, update, delete on table public.audit_log to service_role;
grant select, insert, update, delete on table public.email_log to service_role;
grant select, insert, update, delete on table public.issues to service_role;
grant select, insert, update, delete on table public.live_status to service_role;
grant select, insert, update, delete on table public.programs to service_role;
grant select, insert, update, delete on table public.dhikr_entries to service_role;
grant select, insert, update, delete on table public.rate_limits to service_role;

grant usage, select on sequence public.question_ticket_seq to service_role;
grant usage, select on sequence public.audit_log_id_seq to service_role;
grant usage, select on sequence public.email_log_id_seq to service_role;

grant execute on function public.make_question_ticket_id() to service_role;
grant execute on function public.set_updated_at() to service_role;
grant execute on function public.check_rate_limit(text, int, int) to service_role;
