-- Phase 7B: how a program is attended, and the recorded video library.
-- Paste-ready SQL for the Supabase SQL Editor. Run after the phase6b and phase7 files. Safe to run more than once.

-- How people attend a program: at the venue, through a live stream, or both.
alter table public.programs
  add column if not exists format text not null default 'in_person';

alter table public.programs drop constraint if exists programs_format_check;
alter table public.programs
  add constraint programs_format_check check (format in ('in_person', 'online', 'hybrid'));

-- Video thumbnails join the shared image pipeline.
alter table public.media_assets drop constraint if exists media_assets_purpose_check;
alter table public.media_assets
  add constraint media_assets_purpose_check
  check (purpose in ('leader_photo', 'issue_cover', 'program_poster', 'video_thumbnail'));

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  speaker text not null default '' check (char_length(speaker) <= 120),
  category text not null check (category in ('Speeches', 'Campaigns', 'Youth')),
  platform text not null check (platform in ('youtube', 'facebook', 'instagram')),
  watch_url text not null check (watch_url like 'https://%'),
  youtube_id text check (youtube_id is null or youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  recorded_on date not null,
  duration text check (duration is null or duration ~ '^([0-9]{1,2}:)?[0-5]?[0-9]:[0-5][0-9]$'),
  thumbnail_media_id uuid references public.media_assets (id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_videos_status_recorded_on
  on public.videos (status, recorded_on desc);
create index if not exists idx_videos_recorded_on
  on public.videos (recorded_on desc);
create index if not exists idx_videos_thumbnail_media_id
  on public.videos (thumbnail_media_id);

drop trigger if exists set_videos_updated_at on public.videos;
create trigger set_videos_updated_at
  before update on public.videos
  for each row execute function public.set_updated_at();

alter table public.videos enable row level security;
revoke all on table public.videos from anon, authenticated;
grant select, insert, update, delete on table public.videos to service_role;

-- Same as Phase 6B, now also checking video thumbnails before deleting a media row.
create or replace function public.admin_release_media_asset(
  p_media_id uuid,
  p_actor_email text
)
returns jsonb
language plpgsql
as $$
declare
  asset public.media_assets;
begin
  if p_media_id is null then
    return null;
  end if;

  if exists (select 1 from public.leaders where photo_media_id = p_media_id)
    or exists (select 1 from public.issues where cover_media_id = p_media_id)
    or exists (select 1 from public.programs where poster_media_id = p_media_id)
    or exists (select 1 from public.videos where thumbnail_media_id = p_media_id) then
    return null;
  end if;

  delete from public.media_assets where id = p_media_id returning * into asset;

  if asset.id is null then
    return null;
  end if;

  insert into public.audit_log (actor_email, action, detail, entity, entity_id)
  values (
    p_actor_email,
    'media_deleted',
    jsonb_build_object('purpose', asset.purpose),
    'media',
    asset.id::text
  );

  return jsonb_build_object('path', asset.path, 'thumb_path', asset.thumb_path);
end;
$$;

-- admin_save_program gains p_format, so the old signature is replaced.
drop function if exists public.admin_save_program(uuid, text, text, timestamptz, timestamptz, text, text, text, uuid, text, text);
create or replace function public.admin_save_program(
  p_id uuid,
  p_title text,
  p_speaker text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_format text,
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
      title, speaker, starts_at, ends_at, format, venue, description, link_url, poster_media_id
    )
    values (
      p_title, p_speaker, p_starts_at, p_ends_at, p_format, p_venue, p_description, p_link_url, p_poster_media_id
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
        format = p_format,
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

  insert into public.audit_log (actor_email, action, detail, entity, entity_id)
  values (
    p_actor_email,
    case when p_id is null then 'program_created' else 'program_updated' end,
    jsonb_build_object('format', p_format),
    'program',
    saved.id::text
  );

  if previous_media_id is distinct from p_poster_media_id then
    released := public.admin_release_media_asset(previous_media_id, p_actor_email);
  end if;

  return jsonb_build_object('id', saved.id, 'released', released);
end;
$$;

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
    title, speaker, starts_at, ends_at, format, venue, description, link_url, poster_media_id, status
  )
  select title, speaker, starts_at, ends_at, format, venue, description, link_url, poster_media_id, 'scheduled'
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

-- Creates (p_id null) or updates a video. Returns the id and the files of a replaced
-- thumbnail that is no longer used anywhere.
create or replace function public.admin_save_video(
  p_id uuid,
  p_title text,
  p_speaker text,
  p_category text,
  p_platform text,
  p_watch_url text,
  p_youtube_id text,
  p_recorded_on date,
  p_duration text,
  p_thumbnail_media_id uuid,
  p_thumbnail_alt text,
  p_actor_email text
)
returns jsonb
language plpgsql
as $$
declare
  saved public.videos;
  previous_media_id uuid;
  released jsonb;
begin
  if p_id is null then
    insert into public.videos (
      title, speaker, category, platform, watch_url, youtube_id, recorded_on, duration, thumbnail_media_id
    )
    values (
      p_title, coalesce(p_speaker, ''), p_category, p_platform, p_watch_url, p_youtube_id,
      p_recorded_on, p_duration, p_thumbnail_media_id
    )
    returning * into saved;
  else
    select thumbnail_media_id into previous_media_id
    from public.videos
    where id = p_id
    for update;

    if not found then
      raise exception 'video_not_found' using errcode = 'P0001';
    end if;

    update public.videos
    set title = p_title,
        speaker = coalesce(p_speaker, ''),
        category = p_category,
        platform = p_platform,
        watch_url = p_watch_url,
        youtube_id = p_youtube_id,
        recorded_on = p_recorded_on,
        duration = p_duration,
        thumbnail_media_id = p_thumbnail_media_id
    where id = p_id
    returning * into saved;
  end if;

  if p_thumbnail_media_id is not null then
    update public.media_assets
    set alt = coalesce(p_thumbnail_alt, '')
    where id = p_thumbnail_media_id;
  end if;

  insert into public.audit_log (actor_email, action, detail, entity, entity_id)
  values (
    p_actor_email,
    case when p_id is null then 'video_created' else 'video_updated' end,
    jsonb_build_object('platform', p_platform),
    'video',
    saved.id::text
  );

  if previous_media_id is distinct from p_thumbnail_media_id then
    released := public.admin_release_media_asset(previous_media_id, p_actor_email);
  end if;

  return jsonb_build_object('id', saved.id, 'released', released);
end;
$$;

create or replace function public.admin_set_video_status(
  p_id uuid,
  p_status text,
  p_actor_email text
)
returns void
language plpgsql
as $$
begin
  if p_status not in ('draft', 'published') then
    raise exception 'invalid_video_status' using errcode = 'P0001';
  end if;

  update public.videos set status = p_status where id = p_id;

  if not found then
    raise exception 'video_not_found' using errcode = 'P0001';
  end if;

  insert into public.audit_log (actor_email, action, entity, entity_id)
  values (
    p_actor_email,
    case when p_status = 'published' then 'video_published' else 'video_unpublished' end,
    'video',
    p_id::text
  );
end;
$$;

create or replace function public.admin_delete_video(
  p_id uuid,
  p_actor_email text
)
returns jsonb
language plpgsql
as $$
declare
  deleted public.videos;
begin
  delete from public.videos where id = p_id returning * into deleted;

  if deleted.id is null then
    raise exception 'video_not_found' using errcode = 'P0001';
  end if;

  insert into public.audit_log (actor_email, action, entity, entity_id)
  values (p_actor_email, 'video_deleted', 'video', p_id::text);

  return jsonb_build_object(
    'released', public.admin_release_media_asset(deleted.thumbnail_media_id, p_actor_email)
  );
end;
$$;

revoke all on function public.admin_save_program(uuid, text, text, timestamptz, timestamptz, text, text, text, text, uuid, text, text) from public, anon, authenticated;
revoke all on function public.admin_duplicate_program(uuid, text) from public, anon, authenticated;
revoke all on function public.admin_release_media_asset(uuid, text) from public, anon, authenticated;
revoke all on function public.admin_save_video(uuid, text, text, text, text, text, text, date, text, uuid, text, text) from public, anon, authenticated;
revoke all on function public.admin_set_video_status(uuid, text, text) from public, anon, authenticated;
revoke all on function public.admin_delete_video(uuid, text) from public, anon, authenticated;

grant execute on function public.admin_save_program(uuid, text, text, timestamptz, timestamptz, text, text, text, text, uuid, text, text) to service_role;
grant execute on function public.admin_duplicate_program(uuid, text) to service_role;
grant execute on function public.admin_release_media_asset(uuid, text) to service_role;
grant execute on function public.admin_save_video(uuid, text, text, text, text, text, text, date, text, uuid, text, text) to service_role;
grant execute on function public.admin_set_video_status(uuid, text, text) to service_role;
grant execute on function public.admin_delete_video(uuid, text) to service_role;
