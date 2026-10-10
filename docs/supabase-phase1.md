# Supabase Phase 1

## Files

- `supabase/migrations/20260928000000_phase1_supabase_foundation.sql`
- `supabase/phase1-combined.sql`
- `supabase/seed.sql` after the first admin email is confirmed

## Apply With Supabase CLI

1. Link the project if needed.
2. Run the migration against an empty project:

```bash
supabase db push
```

3. After confirming the first admin email, run the seed file:

```bash
supabase db seed
```

## Apply With SQL Editor

1. Open the Supabase SQL Editor.
2. Paste all of `supabase/phase1-combined.sql`.
3. Run it once.
4. After confirming the first admin email, run `supabase/seed.sql`.

## Verify RLS

Run this after the migration has applied:

```bash
npm run verify:rls
```

The script uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` only. It passes only when the publishable key cannot read or write any Phase 1 table.
