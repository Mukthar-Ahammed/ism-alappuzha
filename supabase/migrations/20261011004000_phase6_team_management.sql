-- Phase 6 team management and recovery actions.
-- Safe to run more than once on the same project.

-- No pgcrypto extension needed; built-in md5() is used for audit entity_id.


drop function if exists public.admin_add_admin_allowlist(text, text, text);
create or replace function public.admin_add_admin_allowlist(
  p_target_email text,
  p_role text,
  p_actor_email text
)
returns public.admins
language plpgsql
as $$
declare
  normalized_email text := lower(trim(p_target_email));
  changed public.admins;
begin
  if normalized_email = '' or p_role not in ('admin', 'reviewer') then
    raise exception 'invalid_admin_input' using errcode = 'P0001';
  end if;

  insert into public.admins (email, role, added_by)
  values (normalized_email, p_role, p_actor_email)
  on conflict (email) do nothing
  returning * into changed;

  if changed.email is null then
    select * into changed
    from public.admins
    where lower(email) = normalized_email;
  else
    insert into public.audit_log (actor_email, action, detail, entity, entity_id)
    values (
      p_actor_email,
      'admin_added',
      jsonb_build_object('role', p_role),
      'admin',
      md5(normalized_email)
    );
  end if;

  return changed;
end;
$$;

drop function if exists public.admin_set_admin_role(text, text, text);
create or replace function public.admin_set_admin_role(
  p_target_email text,
  p_new_role text,
  p_actor_email text
)
returns public.admins
language plpgsql
as $$
declare
  normalized_email text := lower(trim(p_target_email));
  normalized_actor text := lower(trim(p_actor_email));
  current_role text;
  admin_count int;
  changed public.admins;
begin
  if normalized_email = normalized_actor then
    raise exception 'self_role_change' using errcode = 'P0001';
  end if;

  if p_new_role not in ('admin', 'reviewer') then
    raise exception 'invalid_admin_role' using errcode = 'P0001';
  end if;

  select role into current_role
  from public.admins
  where lower(email) = normalized_email;

  if current_role is null then
    raise exception 'admin_not_found' using errcode = 'P0001';
  end if;

  if current_role = 'admin' and p_new_role <> 'admin' then
    select count(*) into admin_count
    from public.admins
    where role = 'admin';

    if admin_count <= 1 then
      raise exception 'last_admin' using errcode = 'P0001';
    end if;
  end if;

  update public.admins
  set role = p_new_role
  where lower(email) = normalized_email
  returning * into changed;

  insert into public.audit_log (actor_email, action, detail, entity, entity_id)
  values (
    p_actor_email,
    'admin_role_changed',
    jsonb_build_object('from', current_role, 'to', p_new_role),
    'admin',
    md5(normalized_email)
  );

  return changed;
end;
$$;

drop function if exists public.admin_remove_admin_allowlist(text, text);
create or replace function public.admin_remove_admin_allowlist(
  p_target_email text,
  p_actor_email text
)
returns text
language plpgsql
as $$
declare
  normalized_email text := lower(trim(p_target_email));
  normalized_actor text := lower(trim(p_actor_email));
  current_role text;
  admin_count int;
  deleted_email text;
begin
  if normalized_email = normalized_actor then
    raise exception 'self_removal' using errcode = 'P0001';
  end if;

  select role into current_role
  from public.admins
  where lower(email) = normalized_email;

  if current_role is null then
    raise exception 'admin_not_found' using errcode = 'P0001';
  end if;

  if current_role = 'admin' then
    select count(*) into admin_count
    from public.admins
    where role = 'admin';

    if admin_count <= 1 then
      raise exception 'last_admin' using errcode = 'P0001';
    end if;
  end if;

  delete from public.admins
  where lower(email) = normalized_email
  returning email into deleted_email;

  insert into public.audit_log (actor_email, action, entity, entity_id)
  values (
    p_actor_email,
    'admin_removed',
    'admin',
    md5(normalized_email)
  );

  return deleted_email;
end;
$$;

drop function if exists public.admin_audit_admin_event(text, text, text, jsonb);
create or replace function public.admin_audit_admin_event(
  p_actor_email text,
  p_action text,
  p_target_email text,
  p_detail jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
as $$
declare
  inserted_id bigint;
  normalized_email text := lower(trim(p_target_email));
begin
  insert into public.audit_log (actor_email, action, detail, entity, entity_id)
  values (
    p_actor_email,
    p_action,
    coalesce(p_detail, '{}'::jsonb),
    'admin',
    md5(normalized_email)
  )
  returning id into inserted_id;

  return inserted_id;
end;
$$;

grant execute on function public.admin_add_admin_allowlist(text, text, text) to service_role;
grant execute on function public.admin_set_admin_role(text, text, text) to service_role;
grant execute on function public.admin_remove_admin_allowlist(text, text) to service_role;
grant execute on function public.admin_audit_admin_event(text, text, text, jsonb) to service_role;
