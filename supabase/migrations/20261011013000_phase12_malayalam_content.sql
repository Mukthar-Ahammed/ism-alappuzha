-- Phase 12: optional Malayalam versions of admin-edited content.
-- Safe to run more than once. Requires phases 6B, 7, 7B, 8, 9 and 11.
-- Empty Malayalam fields fall back to the English text on the website.

alter table public.programs
  add column if not exists title_ml text,
  add column if not exists speaker_ml text,
  add column if not exists venue_ml text,
  add column if not exists description_ml text;

alter table public.videos
  add column if not exists title_ml text,
  add column if not exists speaker_ml text;

alter table public.live_status
  add column if not exists title_ml text,
  add column if not exists speaker_ml text;

alter table public.issues
  add column if not exists title_ml text,
  add column if not exists description_ml text;

alter table public.leaders
  add column if not exists name_ml text,
  add column if not exists role_ml text,
  add column if not exists bio_ml text;

alter table public.dhikr_entries
  add column if not exists transliteration_ml text,
  add column if not exists reference_ml text;

alter table public.namaz_steps
  add column if not exists name_ml text,
  add column if not exists what_to_do_ml text,
  add column if not exists transliteration_ml text,
  add column if not exists dos_ml text[] not null default '{}',
  add column if not exists donts_ml text[] not null default '{}';

-- The save functions gain Malayalam parameters, so the old signatures are dropped first.
drop function if exists public.admin_save_program(uuid, text, text, timestamptz, timestamptz, text, text, text, text, uuid, text, text);
drop function if exists public.admin_save_video(uuid, text, text, text, text, text, text, date, text, uuid, text, text);
drop function if exists public.admin_set_live(text, text, text, text, text, text);
drop function if exists public.admin_save_issue(uuid, text, date, text, uuid, text, text, int, text);
drop function if exists public.admin_save_leader(uuid, text, text, text, text, text, uuid, text, text);
drop function if exists public.admin_save_dhikr(uuid, text, text, text, text, text, text, int, text);
drop function if exists public.admin_save_namaz_step(uuid, text, text, text, text, text, text[], text[], boolean, text);

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
  p_title_ml text,
  p_speaker_ml text,
  p_venue_ml text,
  p_description_ml text,
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
      title, speaker, starts_at, ends_at, format, venue, description, link_url, poster_media_id,
      title_ml, speaker_ml, venue_ml, description_ml
    )
    values (
      p_title, p_speaker, p_starts_at, p_ends_at, p_format, p_venue, p_description, p_link_url, p_poster_media_id,
      p_title_ml, p_speaker_ml, p_venue_ml, p_description_ml
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
        poster_media_id = p_poster_media_id,
        title_ml = p_title_ml,
        speaker_ml = p_speaker_ml,
        venue_ml = p_venue_ml,
        description_ml = p_description_ml
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

create or replace function public.admin_save_video(
  p_id uuid,
  p_title text,
  p_title_ml text,
  p_speaker text,
  p_speaker_ml text,
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
      title, title_ml, speaker, speaker_ml, category, platform, watch_url, youtube_id, recorded_on, duration,
      thumbnail_media_id
    )
    values (
      p_title, p_title_ml, coalesce(p_speaker, ''), p_speaker_ml, p_category, p_platform, p_watch_url, p_youtube_id,
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
        title_ml = p_title_ml,
        speaker = coalesce(p_speaker, ''),
        speaker_ml = p_speaker_ml,
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

create or replace function public.admin_set_live(
  p_platform text,
  p_youtube_id text,
  p_watch_url text,
  p_title text,
  p_title_ml text,
  p_speaker text,
  p_speaker_ml text,
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
      title_ml = p_title_ml,
      speaker = p_speaker,
      speaker_ml = p_speaker_ml,
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

create or replace function public.admin_save_issue(
  p_id uuid,
  p_title text,
  p_issue_date date,
  p_description text,
  p_cover_media_id uuid,
  p_cover_alt text,
  p_pdf_path text,
  p_pdf_bytes int,
  p_title_ml text,
  p_description_ml text,
  p_actor_email text
)
returns jsonb
language plpgsql
as $$
declare
  saved public.issues;
  previous public.issues;
  released jsonb;
begin
  if p_id is null then
    insert into public.issues (
      title, issue_date, description, cover_media_id, pdf_path, pdf_bytes, title_ml, description_ml
    )
    values (
      p_title, p_issue_date, p_description, p_cover_media_id, p_pdf_path, p_pdf_bytes, p_title_ml, p_description_ml
    )
    returning * into saved;
  else
    select * into previous from public.issues where id = p_id for update;

    if previous.id is null then
      raise exception 'issue_not_found' using errcode = 'P0001';
    end if;

    update public.issues
    set title = p_title,
        issue_date = p_issue_date,
        description = p_description,
        cover_media_id = p_cover_media_id,
        pdf_path = p_pdf_path,
        pdf_bytes = p_pdf_bytes,
        title_ml = p_title_ml,
        description_ml = p_description_ml
    where id = p_id
    returning * into saved;
  end if;

  if p_cover_media_id is not null then
    update public.media_assets
    set alt = coalesce(p_cover_alt, '')
    where id = p_cover_media_id;
  end if;

  insert into public.audit_log (actor_email, action, entity, entity_id)
  values (
    p_actor_email,
    case when p_id is null then 'issue_created' else 'issue_updated' end,
    'issue',
    saved.id::text
  );

  if previous.id is not null and previous.cover_media_id is distinct from p_cover_media_id then
    released := public.admin_release_media_asset(previous.cover_media_id, p_actor_email);
  end if;

  return jsonb_build_object(
    'id', saved.id,
    'released', released,
    'released_pdf',
    case when previous.id is not null and previous.pdf_path is distinct from p_pdf_path
      then previous.pdf_path
    end
  );
end;
$$;

create or replace function public.admin_save_leader(
  p_id uuid,
  p_name text,
  p_name_ml text,
  p_role text,
  p_role_ml text,
  p_bio text,
  p_bio_ml text,
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
      name, name_ml, role, role_ml, bio, bio_ml, linkedin_url, instagram_url, photo_media_id, sort_order
    )
    values (
      p_name, p_name_ml, p_role, p_role_ml, coalesce(p_bio, ''), p_bio_ml, p_linkedin_url, p_instagram_url,
      p_photo_media_id, coalesce((select max(sort_order) + 1 from public.leaders), 0)
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
        name_ml = p_name_ml,
        role = p_role,
        role_ml = p_role_ml,
        bio = coalesce(p_bio, ''),
        bio_ml = p_bio_ml,
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

create or replace function public.admin_save_dhikr(
  p_id uuid,
  p_title text,
  p_category text,
  p_arabic text,
  p_transliteration text,
  p_transliteration_ml text,
  p_malayalam text,
  p_reference text,
  p_reference_ml text,
  p_repeat_count int,
  p_actor_email text
)
returns jsonb
language plpgsql
as $$
declare
  saved public.dhikr_entries;
  previous public.dhikr_entries;
  next_sort int;
  review_cleared boolean := false;
begin
  select coalesce(max(sort_order), 0) + 1 into next_sort
  from public.dhikr_entries
  where category = p_category;

  if p_id is null then
    insert into public.dhikr_entries (
      title, category, arabic, transliteration, transliteration_ml, malayalam, reference, reference_ml,
      repeat_count, sort_order
    )
    values (
      p_title, p_category, p_arabic, p_transliteration, p_transliteration_ml, p_malayalam, p_reference,
      p_reference_ml, p_repeat_count, next_sort
    )
    returning * into saved;
  else
    select * into previous from public.dhikr_entries where id = p_id for update;

    if previous.id is null then
      raise exception 'dhikr_not_found' using errcode = 'P0001';
    end if;

    -- Any change to reviewed religious text, in either language, needs a fresh review.
    review_cleared := previous.reviewed_by is not null and (
      previous.arabic is distinct from p_arabic
      or previous.transliteration is distinct from p_transliteration
      or previous.transliteration_ml is distinct from p_transliteration_ml
      or previous.malayalam is distinct from p_malayalam
      or previous.reference is distinct from p_reference
      or previous.reference_ml is distinct from p_reference_ml
    );

    update public.dhikr_entries
    set title = p_title,
        category = p_category,
        arabic = p_arabic,
        transliteration = p_transliteration,
        transliteration_ml = p_transliteration_ml,
        malayalam = p_malayalam,
        reference = p_reference,
        reference_ml = p_reference_ml,
        repeat_count = p_repeat_count,
        sort_order = case when previous.category = p_category then sort_order else next_sort end,
        status = case when review_cleared then 'draft' else status end,
        reviewed_by = case when review_cleared then null else reviewed_by end,
        reviewed_at = case when review_cleared then null else reviewed_at end
    where id = p_id
    returning * into saved;
  end if;

  insert into public.audit_log (actor_email, action, entity, entity_id, detail)
  values (
    p_actor_email,
    case when p_id is null then 'dhikr_created' else 'dhikr_updated' end,
    'dhikr',
    saved.id::text,
    jsonb_build_object('review_cleared', review_cleared)
  );

  return jsonb_build_object('id', saved.id, 'review_cleared', review_cleared);
end;
$$;

create or replace function public.admin_save_namaz_step(
  p_id uuid,
  p_name text,
  p_name_ml text,
  p_what_to_do text,
  p_what_to_do_ml text,
  p_arabic text,
  p_transliteration text,
  p_transliteration_ml text,
  p_malayalam text,
  p_dos text[],
  p_dos_ml text[],
  p_donts text[],
  p_donts_ml text[],
  p_is_repeat_node boolean,
  p_actor_email text
)
returns jsonb
language plpgsql
as $$
declare
  saved public.namaz_steps;
begin
  if p_id is null then
    insert into public.namaz_steps (
      position, name, name_ml, what_to_do, what_to_do_ml, arabic, transliteration, transliteration_ml,
      malayalam, dos, dos_ml, donts, donts_ml, is_repeat_node
    )
    values (
      (select coalesce(max(position), 0) + 1 from public.namaz_steps),
      p_name, p_name_ml, p_what_to_do, p_what_to_do_ml, p_arabic, p_transliteration, p_transliteration_ml,
      p_malayalam, coalesce(p_dos, '{}'), coalesce(p_dos_ml, '{}'), coalesce(p_donts, '{}'),
      coalesce(p_donts_ml, '{}'), coalesce(p_is_repeat_node, false)
    )
    returning * into saved;
  else
    update public.namaz_steps
    set name = p_name,
        name_ml = p_name_ml,
        what_to_do = p_what_to_do,
        what_to_do_ml = p_what_to_do_ml,
        arabic = p_arabic,
        transliteration = p_transliteration,
        transliteration_ml = p_transliteration_ml,
        malayalam = p_malayalam,
        dos = coalesce(p_dos, '{}'),
        dos_ml = coalesce(p_dos_ml, '{}'),
        donts = coalesce(p_donts, '{}'),
        donts_ml = coalesce(p_donts_ml, '{}'),
        is_repeat_node = coalesce(p_is_repeat_node, false)
    where id = p_id
    returning * into saved;

    if saved.id is null then
      raise exception 'namaz_step_not_found' using errcode = 'P0001';
    end if;
  end if;

  insert into public.audit_log (actor_email, action, entity, entity_id)
  values (
    p_actor_email,
    case when p_id is null then 'namaz_step_created' else 'namaz_step_updated' end,
    'namaz_step',
    saved.id::text
  );

  return jsonb_build_object('id', saved.id);
end;
$$;

revoke all on function public.admin_save_program(uuid, text, text, timestamptz, timestamptz, text, text, text, text, uuid, text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.admin_save_video(uuid, text, text, text, text, text, text, text, text, date, text, uuid, text, text) from public, anon, authenticated;
revoke all on function public.admin_set_live(text, text, text, text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.admin_save_issue(uuid, text, date, text, uuid, text, text, int, text, text, text) from public, anon, authenticated;
revoke all on function public.admin_save_leader(uuid, text, text, text, text, text, text, text, text, uuid, text, text) from public, anon, authenticated;
revoke all on function public.admin_save_dhikr(uuid, text, text, text, text, text, text, text, text, int, text) from public, anon, authenticated;
revoke all on function public.admin_save_namaz_step(uuid, text, text, text, text, text, text, text, text, text[], text[], text[], text[], boolean, text) from public, anon, authenticated;

grant execute on function public.admin_save_program(uuid, text, text, timestamptz, timestamptz, text, text, text, text, uuid, text, text, text, text, text, text) to service_role;
grant execute on function public.admin_save_video(uuid, text, text, text, text, text, text, text, text, date, text, uuid, text, text) to service_role;
grant execute on function public.admin_set_live(text, text, text, text, text, text, text, text) to service_role;
grant execute on function public.admin_save_issue(uuid, text, date, text, uuid, text, text, int, text, text, text) to service_role;
grant execute on function public.admin_save_leader(uuid, text, text, text, text, text, text, text, text, uuid, text, text) to service_role;
grant execute on function public.admin_save_dhikr(uuid, text, text, text, text, text, text, text, text, int, text) to service_role;
grant execute on function public.admin_save_namaz_step(uuid, text, text, text, text, text, text, text, text, text[], text[], text[], text[], boolean, text) to service_role;

-- Let the API see the new columns and function signatures straight away.
notify pgrst, 'reload schema';
