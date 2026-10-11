-- Phase 4 question inbox and reply workflow.
-- Safe to run more than once on the same project.

create extension if not exists pg_trgm;

drop function if exists public.admin_list_questions(text, text, boolean, boolean, boolean, text, text, int, int);
create or replace function public.admin_list_questions(
  p_status text,
  p_category text,
  p_private_only boolean,
  p_published_only boolean,
  p_has_email boolean,
  p_search text,
  p_sort text,
  p_limit int,
  p_offset int
)
returns table (
  total_count bigint,
  id uuid,
  ticket_id text,
  created_at timestamptz,
  updated_at timestamptz,
  category text,
  question text,
  status text,
  is_private boolean,
  is_published boolean,
  email text
)
language sql
stable
as $$
  with filtered as (
    select q.*
    from public.questions q
    where (p_status is null or q.status = p_status)
      and (p_category is null or q.category = p_category)
      and (p_private_only is not true or q.is_private is true)
      and (p_published_only is not true or q.is_published is true)
      and (p_has_email is not true or nullif(trim(q.email), '') is not null)
      and (
        p_search is null
        or q.ticket_id = p_search
        or q.question % p_search
        or q.question ilike ('%' || p_search || '%')
      )
  )
  select
    count(*) over () as total_count,
    filtered.id,
    filtered.ticket_id,
    filtered.created_at,
    filtered.updated_at,
    filtered.category,
    filtered.question,
    filtered.status,
    filtered.is_private,
    filtered.is_published,
    filtered.email
  from filtered
  order by
    case when p_sort = 'oldest' then filtered.created_at end asc,
    case when p_sort <> 'oldest' then filtered.created_at end desc,
    filtered.id desc
  limit least(greatest(p_limit, 1), 25)
  offset greatest(p_offset, 0);
$$;

drop function if exists public.admin_question_status_counts(text, boolean, boolean, boolean, text);
create or replace function public.admin_question_status_counts(
  p_category text,
  p_private_only boolean,
  p_published_only boolean,
  p_has_email boolean,
  p_search text
)
returns table (
  status text,
  count bigint
)
language sql
stable
as $$
  select q.status, count(*)::bigint
  from public.questions q
  where (p_category is null or q.category = p_category)
    and (p_private_only is not true or q.is_private is true)
    and (p_published_only is not true or q.is_published is true)
    and (p_has_email is not true or nullif(trim(q.email), '') is not null)
    and (
      p_search is null
      or q.ticket_id = p_search
      or q.question % p_search
      or q.question ilike ('%' || p_search || '%')
    )
  group by q.status;
$$;

create or replace function public.raise_stale_question()
returns void
language plpgsql
as $$
begin
  raise exception 'stale_question' using errcode = 'P0001';
end;
$$;

drop function if exists public.admin_save_question_draft(uuid, text, timestamptz, text, uuid);
create or replace function public.admin_save_question_draft(
  p_question_id uuid,
  p_answer text,
  p_expected_updated_at timestamptz,
  p_actor_email text,
  p_actor_id uuid
)
returns public.questions
language plpgsql
as $$
declare
  changed public.questions;
begin
  update public.questions
  set draft_answer = p_answer,
      status = 'draft',
      answered_by = p_actor_id
  where id = p_question_id
    and updated_at = p_expected_updated_at
  returning * into changed;

  if changed.id is null then
    perform public.raise_stale_question();
  end if;

  insert into public.audit_log (question_id, ticket_id, actor_email, action, entity, entity_id)
  values (changed.id, changed.ticket_id, p_actor_email, 'draft_saved', 'question', changed.id::text);

  return changed;
end;
$$;

drop function if exists public.admin_send_question_reply(uuid, text, timestamptz, text, uuid);
create or replace function public.admin_send_question_reply(
  p_question_id uuid,
  p_answer text,
  p_expected_updated_at timestamptz,
  p_actor_email text,
  p_actor_id uuid
)
returns public.questions
language plpgsql
as $$
declare
  changed public.questions;
begin
  update public.questions
  set answer = p_answer,
      draft_answer = p_answer,
      status = 'answered',
      answered_by = p_actor_id,
      answered_at = now(),
      needs_review = false
  where id = p_question_id
    and updated_at = p_expected_updated_at
  returning * into changed;

  if changed.id is null then
    perform public.raise_stale_question();
  end if;

  insert into public.audit_log (question_id, ticket_id, actor_email, action, entity, entity_id)
  values (changed.id, changed.ticket_id, p_actor_email, 'reply_sent', 'question', changed.id::text);

  return changed;
end;
$$;

drop function if exists public.admin_send_question_correction(uuid, text, timestamptz, text, uuid);
create or replace function public.admin_send_question_correction(
  p_question_id uuid,
  p_answer text,
  p_expected_updated_at timestamptz,
  p_actor_email text,
  p_actor_id uuid
)
returns public.questions
language plpgsql
as $$
declare
  changed public.questions;
begin
  update public.questions
  set answer = p_answer,
      draft_answer = p_answer,
      status = 'answered',
      answered_by = p_actor_id,
      answered_at = now()
  where id = p_question_id
    and status = 'answered'
    and updated_at = p_expected_updated_at
  returning * into changed;

  if changed.id is null then
    perform public.raise_stale_question();
  end if;

  insert into public.audit_log (question_id, ticket_id, actor_email, action, entity, entity_id)
  values (changed.id, changed.ticket_id, p_actor_email, 'correction_sent', 'question', changed.id::text);

  return changed;
end;
$$;

drop function if exists public.admin_publish_question(uuid, text, timestamptz, text);
create or replace function public.admin_publish_question(
  p_question_id uuid,
  p_public_question text,
  p_expected_updated_at timestamptz,
  p_actor_email text
)
returns public.questions
language plpgsql
as $$
declare
  changed public.questions;
begin
  update public.questions
  set is_published = true,
      public_question = p_public_question,
      published_at = now()
  where id = p_question_id
    and status = 'answered'
    and is_private is false
    and updated_at = p_expected_updated_at
  returning * into changed;

  if changed.id is null then
    perform public.raise_stale_question();
  end if;

  insert into public.audit_log (question_id, ticket_id, actor_email, action, entity, entity_id)
  values (changed.id, changed.ticket_id, p_actor_email, 'published', 'question', changed.id::text);

  return changed;
end;
$$;

drop function if exists public.admin_unpublish_question(uuid, timestamptz, text);
create or replace function public.admin_unpublish_question(
  p_question_id uuid,
  p_expected_updated_at timestamptz,
  p_actor_email text
)
returns public.questions
language plpgsql
as $$
declare
  changed public.questions;
begin
  update public.questions
  set is_published = false,
      published_at = null
  where id = p_question_id
    and updated_at = p_expected_updated_at
  returning * into changed;

  if changed.id is null then
    perform public.raise_stale_question();
  end if;

  insert into public.audit_log (question_id, ticket_id, actor_email, action, entity, entity_id)
  values (changed.id, changed.ticket_id, p_actor_email, 'unpublished', 'question', changed.id::text);

  return changed;
end;
$$;

drop function if exists public.admin_archive_question(uuid, text, timestamptz, text);
create or replace function public.admin_archive_question(
  p_question_id uuid,
  p_reason text,
  p_expected_updated_at timestamptz,
  p_actor_email text
)
returns public.questions
language plpgsql
as $$
declare
  changed public.questions;
begin
  update public.questions
  set status = 'archived',
      archive_reason = p_reason,
      is_published = false,
      published_at = null
  where id = p_question_id
    and updated_at = p_expected_updated_at
  returning * into changed;

  if changed.id is null then
    perform public.raise_stale_question();
  end if;

  insert into public.audit_log (question_id, ticket_id, actor_email, action, detail, entity, entity_id)
  values (changed.id, changed.ticket_id, p_actor_email, 'archived', jsonb_build_object('reason', p_reason), 'question', changed.id::text);

  return changed;
end;
$$;

drop function if exists public.admin_restore_question(uuid, timestamptz, text);
create or replace function public.admin_restore_question(
  p_question_id uuid,
  p_expected_updated_at timestamptz,
  p_actor_email text
)
returns public.questions
language plpgsql
as $$
declare
  changed public.questions;
begin
  update public.questions
  set status = 'pending',
      archive_reason = null
  where id = p_question_id
    and status = 'archived'
    and updated_at = p_expected_updated_at
  returning * into changed;

  if changed.id is null then
    perform public.raise_stale_question();
  end if;

  insert into public.audit_log (question_id, ticket_id, actor_email, action, entity, entity_id)
  values (changed.id, changed.ticket_id, p_actor_email, 'restored', 'question', changed.id::text);

  return changed;
end;
$$;

drop function if exists public.admin_save_question_notes(uuid, text, timestamptz, text);
create or replace function public.admin_save_question_notes(
  p_question_id uuid,
  p_notes text,
  p_expected_updated_at timestamptz,
  p_actor_email text
)
returns public.questions
language plpgsql
as $$
declare
  changed public.questions;
begin
  update public.questions
  set internal_notes = p_notes
  where id = p_question_id
    and updated_at = p_expected_updated_at
  returning * into changed;

  if changed.id is null then
    perform public.raise_stale_question();
  end if;

  insert into public.audit_log (question_id, ticket_id, actor_email, action, entity, entity_id)
  values (changed.id, changed.ticket_id, p_actor_email, 'notes_saved', 'question', changed.id::text);

  return changed;
end;
$$;

drop function if exists public.admin_delete_question(uuid, timestamptz, text);
create or replace function public.admin_delete_question(
  p_question_id uuid,
  p_expected_updated_at timestamptz,
  p_actor_email text
)
returns text
language plpgsql
as $$
declare
  deleted_ticket_id text;
begin
  delete from public.questions
  where id = p_question_id
    and updated_at = p_expected_updated_at
  returning ticket_id into deleted_ticket_id;

  if deleted_ticket_id is null then
    perform public.raise_stale_question();
  end if;

  insert into public.audit_log (ticket_id, actor_email, action, entity, entity_id)
  values (deleted_ticket_id, p_actor_email, 'deleted', 'question', deleted_ticket_id);

  return deleted_ticket_id;
end;
$$;

grant execute on function public.admin_list_questions(text, text, boolean, boolean, boolean, text, text, int, int) to service_role;
grant execute on function public.admin_question_status_counts(text, boolean, boolean, boolean, text) to service_role;
grant execute on function public.raise_stale_question() to service_role;
grant execute on function public.admin_save_question_draft(uuid, text, timestamptz, text, uuid) to service_role;
grant execute on function public.admin_send_question_reply(uuid, text, timestamptz, text, uuid) to service_role;
grant execute on function public.admin_send_question_correction(uuid, text, timestamptz, text, uuid) to service_role;
grant execute on function public.admin_publish_question(uuid, text, timestamptz, text) to service_role;
grant execute on function public.admin_unpublish_question(uuid, timestamptz, text) to service_role;
grant execute on function public.admin_archive_question(uuid, text, timestamptz, text) to service_role;
grant execute on function public.admin_restore_question(uuid, timestamptz, text) to service_role;
grant execute on function public.admin_save_question_notes(uuid, text, timestamptz, text) to service_role;
grant execute on function public.admin_delete_question(uuid, timestamptz, text) to service_role;
