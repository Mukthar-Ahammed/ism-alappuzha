-- Phase 1 Supabase foundation for ISM Alappuzha.
-- Forward-only schema for a fresh Supabase project. Storage buckets are added later.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create sequence if not exists public.question_ticket_seq;

create or replace function public.make_question_ticket_id()
returns text
language sql
as $$
  select 'ISM-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.question_ticket_seq')::text, 6, '0');
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  ticket_id text not null default public.make_question_ticket_id(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text,
  email text,
  category text not null check (category in ('Prayer', 'Faith', 'Daily life', 'Family', 'Other')),
  question text not null check (char_length(trim(question)) >= 10 and char_length(trim(question)) <= 2000),
  draft_answer text,
  answer text,
  answered_by uuid references auth.users(id),
  answered_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'draft', 'answered', 'archived')),
  needs_review boolean not null default false,
  internal_notes text,
  archive_reason text,
  public_question text,
  is_private boolean not null default false,
  is_published boolean not null default false,
  published_at timestamptz,
  constraint questions_ticket_id_unique unique (ticket_id),
  constraint private_never_published check (not (is_private and is_published)),
  constraint published_question_answered check (not is_published or status = 'answered')
);

create table if not exists public.admins (
  email text primary key,
  role text not null default 'admin' check (role in ('admin', 'reviewer')),
  added_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  question_id uuid references public.questions(id) on delete set null,
  ticket_id text,
  actor_email text not null,
  action text not null,
  detail jsonb,
  entity text not null default 'question',
  entity_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.email_log (
  id bigint generated always as identity primary key,
  question_id uuid references public.questions(id) on delete set null,
  to_email text not null,
  kind text not null check (kind in ('reply', 'correction')),
  status text not null check (status in ('sent', 'failed')),
  error text,
  created_at timestamptz not null default now()
);

create table if not exists public.issues (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  issue_date date not null,
  description text,
  cover_path text not null,
  pdf_path text not null,
  is_featured boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.live_status (
  id int primary key default 1 check (id = 1),
  is_live boolean not null default false,
  youtube_id text,
  title text,
  speaker text,
  updated_by text,
  updated_at timestamptz not null default now()
);

insert into public.live_status (id)
values (1)
on conflict (id) do nothing;

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  speaker text,
  starts_at timestamptz not null,
  venue text,
  description text,
  link_url text,
  poster_path text,
  status text not null default 'scheduled' check (status in ('scheduled', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dhikr_entries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  arabic text not null,
  transliteration text,
  malayalam text,
  reference text,
  repeat_count text,
  occasion text,
  sort_order int not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published')),
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint published_needs_review
    check (status <> 'published' or (reviewed_by is not null and reviewed_at is not null))
);

create table if not exists public.rate_limits (
  key text primary key,
  hit_count int not null default 0 check (hit_count >= 0),
  window_start timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.check_rate_limit(key text, max_hits int, window_seconds int)
returns boolean
language plpgsql
as $$
declare
  allowed boolean;
begin
  if $2 < 1 or $3 < 1 then
    raise exception 'max_hits and window_seconds must be positive';
  end if;

  with upserted as (
    insert into public.rate_limits as rate_limit (key, hit_count, window_start, updated_at)
    values ($1, 1, now(), now())
    on conflict (key) do update
      set hit_count = case
            when rate_limit.window_start <= now() - make_interval(secs => $3)
              then 1
            else rate_limit.hit_count + 1
          end,
          window_start = case
            when rate_limit.window_start <= now() - make_interval(secs => $3)
              then now()
            else rate_limit.window_start
          end,
          updated_at = now()
    returning hit_count <= $2 as allowed
  )
  select upserted.allowed into allowed
  from upserted;

  return allowed;
end;
$$;

create unique index if not exists one_featured_issue
  on public.issues (is_featured)
  where is_featured;

create index if not exists idx_questions_status_created_at
  on public.questions (status, created_at desc);

create index if not exists idx_questions_ticket_id
  on public.questions (ticket_id);

create index if not exists idx_questions_published_private
  on public.questions (is_published, is_private);

create index if not exists idx_questions_question_trgm
  on public.questions using gin (question gin_trgm_ops);

create index if not exists idx_programs_starts_at
  on public.programs (starts_at);

create index if not exists idx_dhikr_entries_category_sort_order
  on public.dhikr_entries (category, sort_order);

create index if not exists idx_audit_log_entity_entity_id_created_at
  on public.audit_log (entity, entity_id, created_at desc);

create trigger set_questions_updated_at
  before update on public.questions
  for each row execute function public.set_updated_at();

create trigger set_admins_updated_at
  before update on public.admins
  for each row execute function public.set_updated_at();

create trigger set_issues_updated_at
  before update on public.issues
  for each row execute function public.set_updated_at();

create trigger set_live_status_updated_at
  before update on public.live_status
  for each row execute function public.set_updated_at();

create trigger set_programs_updated_at
  before update on public.programs
  for each row execute function public.set_updated_at();

create trigger set_dhikr_entries_updated_at
  before update on public.dhikr_entries
  for each row execute function public.set_updated_at();

create trigger set_rate_limits_updated_at
  before update on public.rate_limits
  for each row execute function public.set_updated_at();

alter table public.questions enable row level security;
alter table public.admins enable row level security;
alter table public.audit_log enable row level security;
alter table public.email_log enable row level security;
alter table public.issues enable row level security;
alter table public.live_status enable row level security;
alter table public.programs enable row level security;
alter table public.dhikr_entries enable row level security;
alter table public.rate_limits enable row level security;

revoke all on table public.questions from anon, authenticated;
revoke all on table public.admins from anon, authenticated;
revoke all on table public.audit_log from anon, authenticated;
revoke all on table public.email_log from anon, authenticated;
revoke all on table public.issues from anon, authenticated;
revoke all on table public.live_status from anon, authenticated;
revoke all on table public.programs from anon, authenticated;
revoke all on table public.dhikr_entries from anon, authenticated;
revoke all on table public.rate_limits from anon, authenticated;

revoke all on sequence public.question_ticket_seq from anon, authenticated;
revoke all on function public.make_question_ticket_id() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.check_rate_limit(text, int, int) from public, anon, authenticated;
