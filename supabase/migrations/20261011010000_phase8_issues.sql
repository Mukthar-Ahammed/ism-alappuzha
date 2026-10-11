-- Phase 8: magazine issues with optimised covers and PDFs read online.
-- Safe to run more than once. Requires the Phase 6B migration (media_assets, uploads-tmp).

-- PDFs are uploaded to the private uploads-tmp bucket, checked on the server, then
-- moved to the public issue-pdfs bucket under a random name.
do $$
begin
  update storage.buckets
  set file_size_limit = 26214400,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  where id = 'uploads-tmp';

  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('issue-pdfs', 'issue-pdfs', true, 26214400, array['application/pdf'])
  on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
exception
  when insufficient_privilege then
    raise notice 'Could not update storage buckets from SQL. Update them in Storage instead.';
end;
$$;

-- Covers now come from media_assets; the old path column is kept for compatibility.
alter table public.issues alter column cover_path drop not null;

alter table public.issues
  add column if not exists pdf_bytes int check (pdf_bytes is null or pdf_bytes > 0);

alter table public.issues drop constraint if exists issues_description_length_check;
alter table public.issues
  add constraint issues_description_length_check
  check (description is null or char_length(description) <= 500);

-- At most one featured issue, enforced by the database as well as the functions below.
create unique index if not exists idx_issues_single_featured
  on public.issues ((true))
  where is_featured;

create index if not exists idx_issues_status_issue_date
  on public.issues (status, issue_date desc);
create index if not exists idx_issues_issue_date
  on public.issues (issue_date desc);

-- Creates (p_id null) or updates an issue. Returns the id, the files of a replaced cover
-- that is no longer used, and the path of a replaced PDF.
create or replace function public.admin_save_issue(
  p_id uuid,
  p_title text,
  p_issue_date date,
  p_description text,
  p_cover_media_id uuid,
  p_cover_alt text,
  p_pdf_path text,
  p_pdf_bytes int,
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
      title, issue_date, description, cover_media_id, pdf_path, pdf_bytes
    )
    values (
      p_title, p_issue_date, p_description, p_cover_media_id, p_pdf_path, p_pdf_bytes
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
        pdf_bytes = p_pdf_bytes
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

-- Unpublishing also unfeatures, so a hidden issue is never the featured one.
create or replace function public.admin_set_issue_status(
  p_id uuid,
  p_status text,
  p_actor_email text
)
returns void
language plpgsql
as $$
begin
  if p_status not in ('draft', 'published') then
    raise exception 'invalid_issue_status' using errcode = 'P0001';
  end if;

  update public.issues
  set status = p_status,
      is_featured = case when p_status = 'draft' then false else is_featured end
  where id = p_id;

  if not found then
    raise exception 'issue_not_found' using errcode = 'P0001';
  end if;

  insert into public.audit_log (actor_email, action, entity, entity_id)
  values (
    p_actor_email,
    case when p_status = 'published' then 'issue_published' else 'issue_unpublished' end,
    'issue',
    p_id::text
  );
end;
$$;

-- Features one published issue and unfeatures the previous one in the same step.
create or replace function public.admin_feature_issue(
  p_id uuid,
  p_actor_email text
)
returns void
language plpgsql
as $$
declare
  target_status text;
begin
  select status into target_status from public.issues where id = p_id for update;

  if target_status is null then
    raise exception 'issue_not_found' using errcode = 'P0001';
  end if;

  if target_status <> 'published' then
    raise exception 'issue_not_published' using errcode = 'P0001';
  end if;

  update public.issues set is_featured = false where is_featured and id <> p_id;
  update public.issues set is_featured = true where id = p_id;

  insert into public.audit_log (actor_email, action, entity, entity_id)
  values (p_actor_email, 'issue_featured', 'issue', p_id::text);
end;
$$;

create or replace function public.admin_delete_issue(
  p_id uuid,
  p_actor_email text
)
returns jsonb
language plpgsql
as $$
declare
  deleted public.issues;
begin
  delete from public.issues where id = p_id returning * into deleted;

  if deleted.id is null then
    raise exception 'issue_not_found' using errcode = 'P0001';
  end if;

  insert into public.audit_log (actor_email, action, entity, entity_id)
  values (p_actor_email, 'issue_deleted', 'issue', p_id::text);

  return jsonb_build_object(
    'released', public.admin_release_media_asset(deleted.cover_media_id, p_actor_email),
    'released_pdf', deleted.pdf_path
  );
end;
$$;

revoke all on function public.admin_save_issue(uuid, text, date, text, uuid, text, text, int, text) from public, anon, authenticated;
revoke all on function public.admin_set_issue_status(uuid, text, text) from public, anon, authenticated;
revoke all on function public.admin_feature_issue(uuid, text) from public, anon, authenticated;
revoke all on function public.admin_delete_issue(uuid, text) from public, anon, authenticated;

grant execute on function public.admin_save_issue(uuid, text, date, text, uuid, text, text, int, text) to service_role;
grant execute on function public.admin_set_issue_status(uuid, text, text) to service_role;
grant execute on function public.admin_feature_issue(uuid, text) to service_role;
grant execute on function public.admin_delete_issue(uuid, text) to service_role;
