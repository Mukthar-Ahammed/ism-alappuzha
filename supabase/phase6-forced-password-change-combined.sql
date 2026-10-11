-- Forced password change after a temporary password.
-- Paste-ready SQL for the Supabase SQL Editor. Safe to run more than once.

alter table public.admins
  add column if not exists must_change_password boolean not null default false;

-- Same signature as before; the guard reads the flag in its existing single round trip.
create or replace function public.admin_get_guard_context(p_email text, p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_role text;
  v_must_change_password boolean;
  v_session_active boolean;
begin
  select role, must_change_password
  into v_role, v_must_change_password
  from public.admins
  where lower(email) = lower(trim(p_email));

  if p_session_id is null then
    v_session_active := false;
  else
    v_session_active := public.admin_session_is_active(p_session_id);
  end if;

  return jsonb_build_object(
    'role', v_role,
    'session_active', v_session_active,
    'must_change_password', coalesce(v_must_change_password, false)
  );
end;
$$;

revoke all on function public.admin_get_guard_context(text, uuid) from public, anon, authenticated;
grant execute on function public.admin_get_guard_context(text, uuid) to service_role;
