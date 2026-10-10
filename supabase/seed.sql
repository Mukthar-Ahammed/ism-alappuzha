insert into public.admins (email, role, added_by)
values ('ismalappuzhaofficial@gmail.com', 'admin', 'phase1_seed')
on conflict (email) do update
  set role = excluded.role,
      updated_at = now();
