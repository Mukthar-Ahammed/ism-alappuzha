-- Phase 6B: shared image pipeline storage and leadership management.
-- Safe to run more than once.

-- Storage buckets. site-images only ever receives pipeline output (WebP);
-- uploads-tmp holds originals for the few seconds before processing.
-- Some projects do not let the SQL Editor write to the storage schema. A failure here
-- is reported as a notice so the tables below are still created; the buckets can then
-- be created in Storage in the dashboard with the same settings.
do $$
begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values
    ('site-images', 'site-images', true, 8388608, array['image/webp']),
    ('uploads-tmp', 'uploads-tmp', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
  on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
exception
  when insufficient_privilege then
    raise notice 'Could not create storage buckets from SQL. Create them in Storage instead.';
end;
$$;

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  purpose text not null check (purpose in ('leader_photo', 'issue_cover', 'program_poster')),
  path text not null unique,
  thumb_path text not null,
  width int not null check (width > 0),
  height int not null check (height > 0),
  thumb_width int not null check (thumb_width > 0),
  thumb_height int not null check (thumb_height > 0),
  bytes int not null check (bytes > 0),
  thumb_bytes int not null check (thumb_bytes > 0),
  blur_data_url text not null check (char_length(blur_data_url) <= 2000),
  alt text not null default '' check (char_length(alt) <= 200),
  content_hash text not null,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists idx_media_assets_purpose_created_at
  on public.media_assets (purpose, created_at desc);

create table if not exists public.leaders (
  id uuid primary key default gen_random_uuid(),
  import_key text unique,
  name text not null check (char_length(name) between 1 and 120),
  role text not null check (char_length(role) between 1 and 120),
  bio text not null default '' check (char_length(bio) <= 600),
  linkedin_url text check (linkedin_url is null or linkedin_url like 'https://%'),
  instagram_url text check (instagram_url is null or instagram_url like 'https://%'),
  photo_media_id uuid references public.media_assets (id) on delete set null,
  sort_order int not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_leaders_status_sort_order
  on public.leaders (status, sort_order);
create index if not exists idx_leaders_sort_order
  on public.leaders (sort_order);
create index if not exists idx_leaders_photo_media_id
  on public.leaders (photo_media_id);

drop trigger if exists set_leaders_updated_at on public.leaders;
create trigger set_leaders_updated_at
  before update on public.leaders
  for each row execute function public.set_updated_at();

alter table public.issues
  add column if not exists cover_media_id uuid references public.media_assets (id) on delete set null;
alter table public.programs
  add column if not exists poster_media_id uuid references public.media_assets (id) on delete set null;

create index if not exists idx_issues_cover_media_id on public.issues (cover_media_id);
create index if not exists idx_programs_poster_media_id on public.programs (poster_media_id);

-- RLS on, no public policies: every read and write goes through server code.
alter table public.media_assets enable row level security;
alter table public.leaders enable row level security;

revoke all on table public.media_assets from anon, authenticated;
revoke all on table public.leaders from anon, authenticated;
grant select, insert, update, delete on table public.media_assets to service_role;
grant select, insert, update, delete on table public.leaders to service_role;

-- Records a processed image. The same content hash maps to the same path, so a
-- repeat upload returns the existing row instead of a duplicate.
create or replace function public.admin_record_media_asset(
  p_actor_email text,
  p_purpose text,
  p_path text,
  p_thumb_path text,
  p_width int,
  p_height int,
  p_thumb_width int,
  p_thumb_height int,
  p_bytes int,
  p_thumb_bytes int,
  p_blur_data_url text,
  p_content_hash text
)
returns public.media_assets
language plpgsql
as $$
declare
  asset public.media_assets;
begin
  select * into asset from public.media_assets where path = p_path;

  if asset.id is not null then
    return asset;
  end if;

  insert into public.media_assets (
    purpose, path, thumb_path, width, height, thumb_width, thumb_height,
    bytes, thumb_bytes, blur_data_url, content_hash, created_by
  )
  values (
    p_purpose, p_path, p_thumb_path, p_width, p_height, p_thumb_width, p_thumb_height,
    p_bytes, p_thumb_bytes, p_blur_data_url, p_content_hash, p_actor_email
  )
  returning * into asset;

  insert into public.audit_log (actor_email, action, detail, entity, entity_id)
  values (
    p_actor_email,
    'media_uploaded',
    jsonb_build_object('purpose', p_purpose, 'bytes', p_bytes),
    'media',
    asset.id::text
  );

  return asset;
end;
$$;

-- Deletes a media row when nothing references it any more and returns its file
-- paths so the caller can remove the stored files.
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
    or exists (select 1 from public.programs where poster_media_id = p_media_id) then
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

-- Creates (p_id null) or updates a leader. Returns the leader id and the files of a
-- replaced photo that is no longer used anywhere.
create or replace function public.admin_save_leader(
  p_id uuid,
  p_name text,
  p_role text,
  p_bio text,
  p_linkedin_url text,
  p_instagram_url text,
  p_photo_media_id uuid,
  p_photo_alt text,
  p_actor_email text
)
returns jsonb
language plpgsql
as $$
declare
  saved public.leaders;
  previous_media_id uuid;
  released jsonb;
begin
  if p_id is null then
    insert into public.leaders (
      name, role, bio, linkedin_url, instagram_url, photo_media_id, sort_order
    )
    values (
      p_name, p_role, coalesce(p_bio, ''), p_linkedin_url, p_instagram_url, p_photo_media_id,
      coalesce((select max(sort_order) + 1 from public.leaders), 0)
    )
    returning * into saved;
  else
    select photo_media_id into previous_media_id
    from public.leaders
    where id = p_id
    for update;

    if not found then
      raise exception 'leader_not_found' using errcode = 'P0001';
    end if;

    update public.leaders
    set name = p_name,
        role = p_role,
        bio = coalesce(p_bio, ''),
        linkedin_url = p_linkedin_url,
        instagram_url = p_instagram_url,
        photo_media_id = p_photo_media_id
    where id = p_id
    returning * into saved;
  end if;

  if p_photo_media_id is not null then
    update public.media_assets
    set alt = coalesce(p_photo_alt, '')
    where id = p_photo_media_id;
  end if;

  insert into public.audit_log (actor_email, action, entity, entity_id)
  values (
    p_actor_email,
    case when p_id is null then 'leader_created' else 'leader_updated' end,
    'leader',
    saved.id::text
  );

  if previous_media_id is distinct from p_photo_media_id then
    released := public.admin_release_media_asset(previous_media_id, p_actor_email);
  end if;

  return jsonb_build_object('id', saved.id, 'released', released);
end;
$$;

create or replace function public.admin_set_leader_status(
  p_id uuid,
  p_status text,
  p_actor_email text
)
returns void
language plpgsql
as $$
begin
  if p_status not in ('draft', 'published') then
    raise exception 'invalid_leader_status' using errcode = 'P0001';
  end if;

  update public.leaders set status = p_status where id = p_id;

  if not found then
    raise exception 'leader_not_found' using errcode = 'P0001';
  end if;

  insert into public.audit_log (actor_email, action, entity, entity_id)
  values (
    p_actor_email,
    case when p_status = 'published' then 'leader_published' else 'leader_unpublished' end,
    'leader',
    p_id::text
  );
end;
$$;

-- Swaps a leader with its neighbour. Moving past either end is a no-op.
create or replace function public.admin_move_leader(
  p_id uuid,
  p_direction text,
  p_actor_email text
)
returns boolean
language plpgsql
as $$
declare
  current_leader public.leaders;
  neighbour public.leaders;
begin
  if p_direction not in ('up', 'down') then
    raise exception 'invalid_direction' using errcode = 'P0001';
  end if;

  select * into current_leader from public.leaders where id = p_id for update;

  if current_leader.id is null then
    raise exception 'leader_not_found' using errcode = 'P0001';
  end if;

  if p_direction = 'up' then
    select * into neighbour
    from public.leaders
    where (sort_order, id) < (current_leader.sort_order, current_leader.id)
    order by sort_order desc, id desc
    limit 1
    for update;
  else
    select * into neighbour
    from public.leaders
    where (sort_order, id) > (current_leader.sort_order, current_leader.id)
    order by sort_order asc, id asc
    limit 1
    for update;
  end if;

  if neighbour.id is null then
    return false;
  end if;

  -- Equal sort orders (possible after manual edits) would make a plain swap a no-op.
  if neighbour.sort_order = current_leader.sort_order then
    update public.leaders
    set sort_order = current_leader.sort_order + case when p_direction = 'up' then 1 else -1 end
    where id = neighbour.id;
  else
    update public.leaders set sort_order = neighbour.sort_order where id = current_leader.id;
    update public.leaders set sort_order = current_leader.sort_order where id = neighbour.id;
  end if;

  insert into public.audit_log (actor_email, action, detail, entity, entity_id)
  values (
    p_actor_email,
    'leader_reordered',
    jsonb_build_object('direction', p_direction),
    'leader',
    p_id::text
  );

  return true;
end;
$$;

create or replace function public.admin_delete_leader(
  p_id uuid,
  p_actor_email text
)
returns jsonb
language plpgsql
as $$
declare
  deleted public.leaders;
begin
  delete from public.leaders where id = p_id returning * into deleted;

  if deleted.id is null then
    raise exception 'leader_not_found' using errcode = 'P0001';
  end if;

  insert into public.audit_log (actor_email, action, entity, entity_id)
  values (p_actor_email, 'leader_deleted', 'leader', p_id::text);

  return jsonb_build_object(
    'released', public.admin_release_media_asset(deleted.photo_media_id, p_actor_email)
  );
end;
$$;

-- One-time import of the bundled leaders as drafts. import_key makes it idempotent.
create or replace function public.admin_import_leaders(
  p_leaders jsonb,
  p_actor_email text
)
returns int
language plpgsql
as $$
declare
  entry jsonb;
  inserted_id uuid;
  inserted_count int := 0;
  next_order int := coalesce((select max(sort_order) + 1 from public.leaders), 0);
begin
  for entry in select * from jsonb_array_elements(p_leaders)
  loop
    insert into public.leaders (
      import_key, name, role, bio, linkedin_url, instagram_url, photo_media_id, sort_order
    )
    values (
      entry ->> 'import_key',
      entry ->> 'name',
      entry ->> 'role',
      coalesce(entry ->> 'bio', ''),
      nullif(entry ->> 'linkedin_url', ''),
      nullif(entry ->> 'instagram_url', ''),
      nullif(entry ->> 'photo_media_id', '')::uuid,
      next_order
    )
    on conflict (import_key) do nothing
    returning id into inserted_id;

    if inserted_id is not null then
      inserted_count := inserted_count + 1;
      next_order := next_order + 1;

      insert into public.audit_log (actor_email, action, detail, entity, entity_id)
      values (
        p_actor_email,
        'leader_imported',
        jsonb_build_object('import_key', entry ->> 'import_key'),
        'leader',
        inserted_id::text
      );
    end if;

    inserted_id := null;
  end loop;

  return inserted_count;
end;
$$;

revoke all on function public.admin_record_media_asset(text, text, text, text, int, int, int, int, int, int, text, text) from public, anon, authenticated;
revoke all on function public.admin_release_media_asset(uuid, text) from public, anon, authenticated;
revoke all on function public.admin_save_leader(uuid, text, text, text, text, text, uuid, text, text) from public, anon, authenticated;
revoke all on function public.admin_set_leader_status(uuid, text, text) from public, anon, authenticated;
revoke all on function public.admin_move_leader(uuid, text, text) from public, anon, authenticated;
revoke all on function public.admin_delete_leader(uuid, text) from public, anon, authenticated;
revoke all on function public.admin_import_leaders(jsonb, text) from public, anon, authenticated;

grant execute on function public.admin_record_media_asset(text, text, text, text, int, int, int, int, int, int, text, text) to service_role;
grant execute on function public.admin_release_media_asset(uuid, text) to service_role;
grant execute on function public.admin_save_leader(uuid, text, text, text, text, text, uuid, text, text) to service_role;
grant execute on function public.admin_set_leader_status(uuid, text, text) to service_role;
grant execute on function public.admin_move_leader(uuid, text, text) to service_role;
grant execute on function public.admin_delete_leader(uuid, text) to service_role;
grant execute on function public.admin_import_leaders(jsonb, text) to service_role;
