-- Phase 5 public Q&A ticket hardening.
-- Existing rows keep their current ticket IDs. New rows must provide
-- application-generated random ticket IDs.

alter table public.questions
  alter column ticket_id drop default;
