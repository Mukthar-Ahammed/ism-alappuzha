-- Session revocation and real-time active session validation.
-- Safe to run more than once.

drop function if exists public.admin_revoke_user_sessions(uuid);
create or replace function public.admin_revoke_user_sessions(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if target_user_id is null then
    return;
  end if;

  delete from auth.sessions
  where user_id = target_user_id;
end;
$$;

revoke all on function public.admin_revoke_user_sessions(uuid) from public, anon, authenticated;
grant execute on function public.admin_revoke_user_sessions(uuid) to service_role;

drop function if exists public.admin_session_is_active(uuid);
create or replace function public.admin_session_is_active(p_session_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(
    (
      select true
      from auth.sessions
      where id = p_session_id
      limit 1
    ),
    false
  );
$$;

revoke all on function public.admin_session_is_active(uuid) from public, anon, authenticated;
grant execute on function public.admin_session_is_active(uuid) to service_role;

-- Combined helper to allow the guard to verify allowlist role and session validity in 1 single round trip query.
drop function if exists public.admin_get_guard_context(text, uuid);
create or replace function public.admin_get_guard_context(p_email text, p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_role text;
  v_session_active boolean;
begin
  select role into v_role
  from public.admins
  where lower(email) = lower(trim(p_email));

  if p_session_id is null then
    v_session_active := false;
  else
    v_session_active := public.admin_session_is_active(p_session_id);
  end if;

  return jsonb_build_object(
    'role', v_role,
    'session_active', v_session_active
  );
end;
$$;

revoke all on function public.admin_get_guard_context(text, uuid) from public, anon, authenticated;
grant execute on function public.admin_get_guard_context(text, uuid) to service_role;
