-- Repair check_rate_limit again: the earlier fix still failed with
-- `column reference "key" is ambiguous` because ON CONFLICT (key) can mean either the
-- rate_limits.key column or the `key` parameter. Every admin sign-in was refused,
-- since a failed rate-limit check counts as "limited".
-- `#variable_conflict use_column` makes bare names mean columns; the parameters are
-- still read positionally ($1..$3), so the RPC argument names do not change.

create or replace function public.check_rate_limit(key text, max_hits int, window_seconds int)
returns boolean
language plpgsql
as $$
#variable_conflict use_column
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
    returning rate_limit.hit_count <= $2 as allowed
  )
  select upserted.allowed into allowed
  from upserted;

  return allowed;
end;
$$;

revoke all on function public.check_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, int, int) to service_role;
