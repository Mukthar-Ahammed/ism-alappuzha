-- Phase 7: live broadcast (YouTube, Facebook, Instagram) and upcoming programs.
-- Safe to run more than once.

alter table public.live_status
  add column if not exists platform text not null default 'youtube',
  add column if not exists watch_url text;

alter table public.live_status drop constraint if exists live_status_platform_check;
alter table public.live_status
  add constraint live_status_platform_check check (platform in ('youtube', 'facebook', 'instagram'));

alter table public.live_status drop constraint if exists live_status_watch_url_https_check;
alter table public.live_status
  add constraint live_status_watch_url_https_check check (watch_url is null or watch_url like 'https://%');

-- Keep the single row in place even if it was deleted by hand.
insert into public.live_status (id) values (1) on conflict (id) do nothing;

alter table public.programs
  add column if not exists ends_at timestamptz;

alter table public.programs drop constraint if exists programs_ends_after_start_check;
alter table public.programs
  add constraint programs_ends_after_start_check check (ends_at is null or ends_at > starts_at);

alter table public.programs drop constraint if exists programs_link_url_https_check;
alter table public.programs
  add constraint programs_link_url_https_check check (link_url is null or link_url like 'https://%');

create index if not exists idx_programs_status_starts_at
  on public.programs (status, starts_at);
create index if not exists idx_programs_starts_at
  on public.programs (starts_at);
create index if not exists idx_audit_log_entity_created_at
  on public.audit_log (entity, created_at desc);

create or replace function public.admin_set_live(
  p_platform text,
  p_youtube_id text,
  p_watch_url text,
  p_title text,
  p_speaker text,
  p_actor_email text
)
returns public.live_status
language plpgsql
as $$
declare
  saved public.live_status;
begin
  if p_platform not in ('youtube', 'facebook', 'instagram') then
    raise exception 'invalid_platform' using errcode = 'P0001';
  end if;

  if p_platform = 'youtube' and (p_youtube_id is null or p_youtube_id !~ '^[A-Za-z0-9_-]{11}$') then
    raise exception 'invalid_youtube_id' using errcode = 'P0001';
  end if;

  update public.live_status
  set is_live = true,
      platform = p_platform,
      youtube_id = case when p_platform = 'youtube' then p_youtube_id else null end,
      watch_url = p_watch_url,
      title = p_title,
      speaker = p_speaker,
      updated_by = p_actor_email
  where id = 1
  returning * into saved;

  insert into public.audit_log (actor_email, action, detail, entity, entity_id)
  values (
    p_actor_email,
    'live_started',
    jsonb_build_object(
      'platform', p_platform,
      'watch_url', p_watch_url,
      'title', p_title,
      'speaker', p_speaker
    ),
    'live',
    '1'
  );

  return saved;
end;
$$;

create or replace function public.admin_end_live(p_actor_email text)
returns public.live_status
language plpgsql
as $$
declare
  saved public.live_status;
begin
  update public.live_status
  set is_live = false,
      updated_by = p_actor_email
  where id = 1
  returning * into saved;

  insert into public.audit_log (actor_email, action, entity, entity_id)
  values (p_actor_email, 'live_ended', 'live', '1');

  return saved;
end;
$$;

-- Creates (p_id null) or updates a program. Returns the program id and the files of a
-- replaced poster that is no longer used anywhere.
create or replace function public.admin_save_program(
  p_id uuid,
  p_title text,
  p_speaker text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_venue text,
  p_description text,
  p_link_url text,
  p_poster_media_id uuid,
  p_poster_alt text,
  p_actor_email text
)
returns jsonb
language plpgsql
as $$
declare
  saved public.programs;
  previous_media_id uuid;
  released jsonb;
begin
  if p_id is null then
    insert into public.programs (
      title, speaker, starts_at, ends_at, venue, description, link_url, poster_media_id
    )
    values (
      p_title, p_speaker, p_starts_at, p_ends_at, p_venue, p_description, p_link_url, p_poster_media_id
    )
    returning * into saved;
  else
    select poster_media_id into previous_media_id
    from public.programs
    where id = p_id
    for update;

    if not found then
      raise exception 'program_not_found' using errcode = 'P0001';
    end if;

    update public.programs
    set title = p_title,
        speaker = p_speaker,
        starts_at = p_starts_at,
        ends_at = p_ends_at,
        venue = p_venue,
        description = p_description,
        link_url = p_link_url,
        poster_media_id = p_poster_media_id
    where id = p_id
    returning * into saved;
  end if;

  if p_poster_media_id is not null then
    update public.media_assets
    set alt = coalesce(p_poster_alt, '')
    where id = p_poster_media_id;
  end if;

  insert into public.audit_log (actor_email, action, entity, entity_id)
  values (
    p_actor_email,
    case when p_id is null then 'program_created' else 'program_updated' end,
    'program',
    saved.id::text
  );

  if previous_media_id is distinct from p_poster_media_id then
    released := public.admin_release_media_asset(previous_media_id, p_actor_email);
  end if;

  return jsonb_build_object('id', saved.id, 'released', released);
end;
$$;

create or replace function public.admin_cancel_program(
  p_id uuid,
  p_actor_email text
)
returns void
language plpgsql
as $$
begin
  update public.programs set status = 'cancelled' where id = p_id;

  if not found then
    raise exception 'program_not_found' using errcode = 'P0001';
  end if;

  insert into public.audit_log (actor_email, action, entity, entity_id)
  values (p_actor_email, 'program_cancelled', 'program', p_id::text);
end;
$$;

-- Copies a program as a new scheduled program, so recurring events start from a template.
create or replace function public.admin_duplicate_program(
  p_id uuid,
  p_actor_email text
)
returns uuid
language plpgsql
as $$
declare
  copy_id uuid;
begin
  insert into public.programs (
    title, speaker, starts_at, ends_at, venue, description, link_url, poster_media_id, status
  )
  select title, speaker, starts_at, ends_at, venue, description, link_url, poster_media_id, 'scheduled'
  from public.programs
  where id = p_id
  returning id into copy_id;

  if copy_id is null then
    raise exception 'program_not_found' using errcode = 'P0001';
  end if;

  insert into public.audit_log (actor_email, action, detail, entity, entity_id)
  values (
    p_actor_email,
    'program_duplicated',
    jsonb_build_object('source_id', p_id),
    'program',
    copy_id::text
  );

  return copy_id;
end;
$$;

revoke all on function public.admin_set_live(text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.admin_end_live(text) from public, anon, authenticated;
revoke all on function public.admin_save_program(uuid, text, text, timestamptz, timestamptz, text, text, text, uuid, text, text) from public, anon, authenticated;
revoke all on function public.admin_cancel_program(uuid, text) from public, anon, authenticated;
revoke all on function public.admin_duplicate_program(uuid, text) from public, anon, authenticated;

grant execute on function public.admin_set_live(text, text, text, text, text, text) to service_role;
grant execute on function public.admin_end_live(text) to service_role;
grant execute on function public.admin_save_program(uuid, text, text, timestamptz, timestamptz, text, text, text, uuid, text, text) to service_role;
grant execute on function public.admin_cancel_program(uuid, text) to service_role;
grant execute on function public.admin_duplicate_program(uuid, text) to service_role;
