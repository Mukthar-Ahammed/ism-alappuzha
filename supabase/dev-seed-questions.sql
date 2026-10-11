-- DEV ONLY: sample questions for local/admin inbox testing.
-- Do not run this against production.

insert into public.questions
  (ticket_id, name, email, category, question, status, is_private, draft_answer, answer, answered_at, public_question, is_published, internal_notes, archive_reason)
values
  ('DEV-2026-000001', 'Ahmed', 'ahmed@example.test', 'Prayer', 'What should I do if I miss Fajr because I overslept?', 'pending', false, null, null, null, null, false, null, null),
  ('DEV-2026-000002', null, null, 'Faith', 'How can I strengthen iman when I feel distracted during the week?', 'pending', true, null, null, null, null, false, 'Sensitive personal context. Keep private.', null),
  ('DEV-2026-000003', 'Fathima', 'fathima@example.test', 'Daily life', 'Is it permissible to make dua in Malayalam after salah?', 'draft', false, 'You may make dua in any language outside the fixed prayer words.', null, null, null, false, null, null),
  ('DEV-2026-000004', 'Niyas', null, 'Family', 'How should I speak with my parents when there is a disagreement about studies?', 'answered', false, 'Reply draft', 'Speak gently, avoid raising your voice, and choose a calm time to explain your situation.', now() - interval '2 days', 'How should a student handle disagreement with parents about studies?', true, null, null),
  ('DEV-2026-000005', null, 'private@example.test', 'Other', 'This is a private question with personal identifying details that should not be public.', 'answered', true, 'Private reply', 'This reply should remain available only through the ticket status flow.', now() - interval '1 day', null, false, null, null),
  ('DEV-2026-000006', 'Salman', 'salman@example.test', 'Prayer', 'Can I combine prayers while travelling from Alappuzha to Bengaluru?', 'archived', false, null, null, null, null, false, null, 'Duplicate'),
  ('DEV-2026-000007', 'Hana', null, 'Daily life', 'എനിക്ക് ദിവസവും ദിഖ്ര് പതിവാക്കാൻ എങ്ങനെ തുടങ്ങാം?', 'pending', false, null, null, null, null, false, null, null),
  ('DEV-2026-000008', 'Rasheed', 'rasheed@example.test', 'Faith', 'What is the best way to learn basic aqeedah with reliable references?', 'answered', false, 'Draft', 'Start with a qualified teacher and a concise beginner text recommended by local scholars.', now() - interval '3 days', null, false, null, null),
  ('DEV-2026-000009', 'Aisha', 'aisha@example.test', 'Family', 'How can siblings divide household responsibilities fairly?', 'draft', false, 'Make expectations clear and agree on a simple weekly plan.', null, null, null, false, null, null),
  ('DEV-2026-000010', null, null, 'Other', 'Spam-like repeated message for archive testing in the admin inbox.', 'archived', false, null, null, null, null, false, null, 'Spam')
on conflict (ticket_id) do nothing;
