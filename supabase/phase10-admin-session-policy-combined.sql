-- Phase 10: admin session policy enforced on the server.
--   * maximum session duration: 8 hours from sign-in
--   * inactivity timeout: 30 minutes without an admin request
--   * an expired session is revoked (its auth.sessions row and refresh tokens are deleted)
-- Paste-ready SQL for the Supabase SQL Editor. Run after the phase9 file. Safe to run more than once.
-- Keep the limits in step with src/lib/auth/session-policy.ts.

-- Last time each admin session made a guarded request. Rows are removed with the session.
create table if not exists public.admin_session_activity (
  session_id uuid primary key,
  user_id uuid not null,
  last_seen_at timestamptz not null default now()
);

alter table public.admin_session_activity enable row level security;
revoke all on table public.admin_session_activity from anon, authenticated;

create index if not exists idx_admin_session_activity_last_seen
  on public.admin_session_activity (last_seen_at);

-- Same signature and single round trip as before. It now also applies the session policy,
-- so it records activity and may revoke: it is volatile, no longer stable.
create or replace function public.admin_get_guard_context(p_email text, p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  max_session_age constant interval := interval '8 hours';
  inactivity_timeout constant interval := interval '30 minutes';
  -- Activity is written at most once a minute per session to keep writes cheap.
  activity_write_interval constant interval := interval '1 minute';

  v_role text;
  v_must_change_password boolean;
  v_session auth.sessions;
  v_last_seen timestamptz;
  v_expired_reason text;
begin
  select role, must_change_password
  into v_role, v_must_change_password
  from public.admins
  where lower(email) = lower(trim(p_email));

  if p_session_id is not null then
    select * into v_session from auth.sessions where id = p_session_id;
  end if;

  if v_session.id is null then
    v_expired_reason := 'revoked';
  else
    select last_seen_at into v_last_seen
    from public.admin_session_activity
    where session_id = v_session.id;

    if now() - v_session.created_at > max_session_age
      or (v_session.not_after is not null and v_session.not_after <= now()) then
      v_expired_reason := 'max_age';
    elsif now() - coalesce(v_last_seen, v_session.refreshed_at, v_session.updated_at, v_session.created_at)
      > inactivity_timeout then
      v_expired_reason := 'inactive';
    end if;
  end if;

  if v_expired_reason is null then
    if v_last_seen is null or now() - v_last_seen >= activity_write_interval then
      insert into public.admin_session_activity (session_id, user_id, last_seen_at)
      values (v_session.id, v_session.user_id, now())
      on conflict (session_id) do update set last_seen_at = excluded.last_seen_at;
    end if;
  elsif v_session.id is not null then
    -- Revoke for real: deleting the session also deletes its refresh tokens.
    delete from auth.sessions where id = v_session.id;
    delete from public.admin_session_activity where session_id = v_session.id;
  end if;

  -- Housekeeping: drop activity rows whose sessions are long gone.
  delete from public.admin_session_activity
  where last_seen_at < now() - interval '1 day';

  return jsonb_build_object(
    'role', v_role,
    'session_active', v_expired_reason is null,
    'expired_reason', v_expired_reason,
    'must_change_password', coalesce(v_must_change_password, false)
  );
end;
$$;

revoke all on function public.admin_get_guard_context(text, uuid) from public, anon, authenticated;
grant execute on function public.admin_get_guard_context(text, uuid) to service_role;

-- Logout: ends one session (and its refresh tokens) on the server, whatever the token state.
create or replace function public.admin_end_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.sessions where id = p_session_id;
  delete from public.admin_session_activity where session_id = p_session_id;
end;
$$;

revoke all on function public.admin_end_session(uuid) from public, anon, authenticated;
grant execute on function public.admin_end_session(uuid) to service_role;
