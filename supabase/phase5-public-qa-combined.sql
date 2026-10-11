-- Phase 5 public Q&A ticket hardening.
-- Paste this into the Supabase SQL Editor after the previous migrations.
-- Safe to run more than once on the same project.

alter table public.questions
  alter column ticket_id drop default;
