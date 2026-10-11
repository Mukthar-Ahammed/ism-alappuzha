-- Phase 11: the Namaz guide's step cards, edited in the admin.
-- Safe to run more than once. Requires the Phase 1 set_updated_at() and audit_log.
-- The 12 cards the website already shows are loaded once, published, so nothing disappears.

create table if not exists public.namaz_steps (
  id uuid primary key default gen_random_uuid(),
  position int not null,
  name text not null check (char_length(name) between 1 and 120),
  what_to_do text not null check (char_length(what_to_do) between 1 and 600),
  arabic text not null check (char_length(arabic) between 1 and 2000),
  transliteration text check (transliteration is null or char_length(transliteration) <= 1000),
  malayalam text check (malayalam is null or char_length(malayalam) <= 2000),
  dos text[] not null default '{}' check (cardinality(dos) <= 8),
  donts text[] not null default '{}' check (cardinality(donts) <= 8),
  is_repeat_node boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_namaz_steps_status_position on public.namaz_steps (status, position);

drop trigger if exists set_namaz_steps_updated_at on public.namaz_steps;
create trigger set_namaz_steps_updated_at
  before update on public.namaz_steps
  for each row execute function public.set_updated_at();

alter table public.namaz_steps enable row level security;
revoke all on table public.namaz_steps from anon, authenticated;
grant select, insert, update, delete on table public.namaz_steps to service_role;

-- Creates (p_id null, added at the end) or updates a step card.
create or replace function public.admin_save_namaz_step(
  p_id uuid,
  p_name text,
  p_what_to_do text,
  p_arabic text,
  p_transliteration text,
  p_malayalam text,
  p_dos text[],
  p_donts text[],
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
      position, name, what_to_do, arabic, transliteration, malayalam, dos, donts, is_repeat_node
    )
    values (
      (select coalesce(max(position), 0) + 1 from public.namaz_steps),
      p_name, p_what_to_do, p_arabic, p_transliteration, p_malayalam,
      coalesce(p_dos, '{}'), coalesce(p_donts, '{}'), coalesce(p_is_repeat_node, false)
    )
    returning * into saved;
  else
    update public.namaz_steps
    set name = p_name,
        what_to_do = p_what_to_do,
        arabic = p_arabic,
        transliteration = p_transliteration,
        malayalam = p_malayalam,
        dos = coalesce(p_dos, '{}'),
        donts = coalesce(p_donts, '{}'),
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

create or replace function public.admin_set_namaz_step_status(
  p_id uuid,
  p_status text,
  p_actor_email text
)
returns void
language plpgsql
as $$
begin
  if p_status not in ('draft', 'published') then
    raise exception 'invalid_namaz_step_status' using errcode = 'P0001';
  end if;

  update public.namaz_steps set status = p_status where id = p_id;

  if not found then
    raise exception 'namaz_step_not_found' using errcode = 'P0001';
  end if;

  insert into public.audit_log (actor_email, action, entity, entity_id)
  values (
    p_actor_email,
    case when p_status = 'published' then 'namaz_step_published' else 'namaz_step_unpublished' end,
    'namaz_step',
    p_id::text
  );
end;
$$;

-- Swaps a step with its neighbour. Positions are renumbered 1..n first so the order is exact.
create or replace function public.admin_move_namaz_step(
  p_id uuid,
  p_direction text,
  p_actor_email text
)
returns void
language plpgsql
as $$
declare
  current_position int;
  neighbour_id uuid;
begin
  if p_direction not in ('up', 'down') then
    raise exception 'invalid_namaz_step_direction' using errcode = 'P0001';
  end if;

  perform 1 from public.namaz_steps for update;

  update public.namaz_steps as step
  set position = ordered.new_position
  from (
    select id, row_number() over (order by position, created_at, id)::int as new_position
    from public.namaz_steps
  ) as ordered
  where step.id = ordered.id and step.position is distinct from ordered.new_position;

  select position into current_position from public.namaz_steps where id = p_id;

  if current_position is null then
    raise exception 'namaz_step_not_found' using errcode = 'P0001';
  end if;

  select id into neighbour_id
  from public.namaz_steps
  where position = current_position + case when p_direction = 'up' then -1 else 1 end;

  -- Already first or last: nothing to do.
  if neighbour_id is null then
    return;
  end if;

  update public.namaz_steps set position = current_position where id = neighbour_id;
  update public.namaz_steps
  set position = current_position + case when p_direction = 'up' then -1 else 1 end
  where id = p_id;

  insert into public.audit_log (actor_email, action, entity, entity_id, detail)
  values (p_actor_email, 'namaz_step_moved', 'namaz_step', p_id::text, jsonb_build_object('direction', p_direction));
end;
$$;

create or replace function public.admin_delete_namaz_step(
  p_id uuid,
  p_actor_email text
)
returns void
language plpgsql
as $$
begin
  delete from public.namaz_steps where id = p_id;

  if not found then
    raise exception 'namaz_step_not_found' using errcode = 'P0001';
  end if;

  insert into public.audit_log (actor_email, action, entity, entity_id)
  values (p_actor_email, 'namaz_step_deleted', 'namaz_step', p_id::text);
end;
$$;

revoke all on function public.admin_save_namaz_step(uuid, text, text, text, text, text, text[], text[], boolean, text) from public, anon, authenticated;
revoke all on function public.admin_set_namaz_step_status(uuid, text, text) from public, anon, authenticated;
revoke all on function public.admin_move_namaz_step(uuid, text, text) from public, anon, authenticated;
revoke all on function public.admin_delete_namaz_step(uuid, text) from public, anon, authenticated;

grant execute on function public.admin_save_namaz_step(uuid, text, text, text, text, text, text[], text[], boolean, text) to service_role;
grant execute on function public.admin_set_namaz_step_status(uuid, text, text) to service_role;
grant execute on function public.admin_move_namaz_step(uuid, text, text) to service_role;
grant execute on function public.admin_delete_namaz_step(uuid, text) to service_role;

-- The cards already on the website, loaded once and published so the guide looks the same.
-- Nothing is added if the table already has steps.
insert into public.namaz_steps (position, name, what_to_do, arabic, transliteration, malayalam, dos, donts, is_repeat_node, status)
select seed.position, seed.name, seed.what_to_do, seed.arabic, seed.transliteration, seed.malayalam, seed.dos, seed.donts, seed.is_repeat_node, 'published'
from (
  values
    (1, 'Niyyah (Intention)',
     'Stand facing the Qiblah with a clear, sincere intention in your heart for the specific prayer.',
     'نَوَيْتُ أَنْ أُصَلِّيَ لِلَّهِ تَعَالَى',
     'Nawaytu an usalliya lillahi ta''ala',
     'TODO: മലയാളം വിശദീകരണം — പണ്ഡിത പരിശോധനക്കായി മാറ്റിവെച്ചിരിക്കുന്നു.',
     array['Face the Qiblah squarely', 'Keep intention quiet in the heart']::text[],
     array['Do not utter loud verbal intentions that distract others']::text[],
     false),
    (2, 'Takbeer al-Ihram',
     'Raise hands to shoulders or earlobes and utter ''Allahu Akbar'' to enter the sacred state of prayer.',
     'اللَّهُ أَكْبَرُ',
     'Allahu Akbar',
     'TODO: മലയാളം വിശദീകരണം — അല്ലാഹു ഏറ്റവും വലിയവൻ എന്ന പ്രഖ്യാപനത്തോടെ കൈകൾ ഉയർത്തുക.',
     array['Palms facing the Qiblah', 'Raise hands to ears or shoulder level']::text[],
     array['Do not swing hands excessively or bow before Takbeer']::text[],
     false),
    (3, 'Qiyam & Recitation',
     'Place right hand over left over the chest, recite opening supplication, Surah Al-Fatiha, and a portion of Qur''an.',
     'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ • الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
     'Bismillahir-Rahmanir-Raheem. Al-hamdu lillahi Rabbil-''Alameen...',
     'TODO: മലയാളം വിശദീകരണം — നിൽക്കുന്ന അവസ്ഥയിൽ സൂറത്തുൽ ഫാത്തിഹയും മറ്റൊരു സൂറത്തും ഓതുക.',
     array['Look down toward the spot of prostration', 'Recite Al-Fatiha attentively']::text[],
     array['Do not look around or look up at the ceiling']::text[],
     false),
    (4, 'Ruku (Bowing)',
     'Say ''Allahu Akbar'', bow flat from the waist with hands grasping knees, and recite praises of Allah.',
     'سُبْحَانَ رَبِّيَ الْعَظِيمِ وَبِحَمْدِهِ',
     'Subhana Rabbiyal-''Azeemi wa bihamdih (3x)',
     'TODO: മലയാളം വിശദീകരണം — മുതുക് സമമാക്കി കുനിഞ്ഞ് തസ്ബീഹ് ചൊല്ലുക.',
     array['Keep back flat like a tabletop', 'Grasp knees with fingers spread']::text[],
     array['Do not arch or arch shoulders downward excessiveiy']::text[],
     false),
    (5, 'I''tidal (Rising from Ruku)',
     'Rise back to a full standing posture saying ''Sami''allahu liman hamidah'', then recite praises.',
     'سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ • رَبَّنَا وَلَكَ الْحَمْدُ',
     'Sami''allahu liman hamidah. Rabbana wa lakal-hamd',
     'TODO: മലയാളം വിശദീകരണം — റുകൂഇൽ നിന്ന് നേരെ നിവർന്ന് പ്രശംസ ചൊല്ലുക.',
     array['Stand upright until every vertebra settles', 'Maintain calm stillness']::text[],
     array['Do not rush directly into Sujood without standing upright']::text[],
     false),
    (6, 'Sujood (First Prostration)',
     'Prostrate with forehead, nose, palms, knees, and toes touching the ground firmly.',
     'سُبْحَانَ رَبِّيَ الْأَعْلَى وَبِحَمْدِهِ',
     'Subhana Rabbiyal-A''la wa bihamdih (3x)',
     'TODO: മലയാളം വിശദീകരണം — ഏഴ് അവയവങ്ങൾ നിലത്തുറപ്പിച്ച് സുജൂദ് ചെയ്യുക.',
     array['Ensure 7 limbs touch ground', 'Keep elbows away from ribs']::text[],
     array['Do not lay forearms flat on the ground like an animal']::text[],
     false),
    (7, 'Jalsa (Sitting Between Sujoods)',
     'Rise from prostration to sit upright on left foot with right foot erect, and pray for forgiveness.',
     'رَبِّ اغْفِرْ لِي ، رَبِّ اغْفِرْ لِي',
     'Rabbighfir li, Rabbighfir li',
     'TODO: മലയാളം വിശദീകരണം — രണ്ട് സുജൂദുകൾക്കിടയിൽ ഇരുന്ന് പാപമോചനം തേടുക.',
     array['Sit upright calmly', 'Hands rested gently on knees']::text[],
     array['Do not bounce up and down rapidly']::text[],
     false),
    (8, 'Sujood (Second Prostration)',
     'Perform the second prostration exactly as the first, praising the Supreme Sustainer.',
     'سُبْحَانَ رَبِّيَ الْأَعْلَى وَبِحَمْدِهِ',
     'Subhana Rabbiyal-A''la wa bihamdih (3x)',
     'TODO: മലയാളം വിശദീകരണം — രണ്ടാമത്തെ സുജൂദ് നിർവ്വഹിക്കുക.',
     array['Focus deeply on humility before Allah', 'Recite tasbeeh 3 times']::text[],
     array['Do not lift feet or toes off the floor']::text[],
     false),
    (9, 'Second Rakah (Repeat Cycle)',
     'Stand back up for the 2nd Rakah and repeat steps 3 through 8 (Qiyam, Ruku, I''tidal, Sujoods).',
     'اللَّهُ أَكْبَرُ (الرَّكْعَةُ الثَّانِيَةُ)',
     'Allahu Akbar (Second Rakah Cycle)',
     'TODO: മലയാളം വിശദീകരണം — രണ്ടാമത്തെ റക്അത്തിനായി എഴുന്നേറ്റ് ആവർത്തിക്കുക.',
     array['Rise smoothly using legs', 'Begin Al-Fatiha for 2nd Rakah']::text[],
     array['Do not repeat opening supplication (Thana) in 2nd Rakah']::text[],
     true),
    (10, 'Tashahhud (Sitting Testimony)',
     'Sit after the 2nd Rakah (and final Rakah) to recite the testimonial of faith and praise Allah.',
     'التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ',
     'At-tahiyyatu lillahi was-salawatu wat-tayyibat...',
     'TODO: മലയാളം വിശദീകരണം — അത്തഹിയ്യാത്ത് ഇരിപ്പും സാക്ഷ്യപ്രഖ്യാപനവും.',
     array['Raise and point right index finger during Shahadah', 'Maintain tranquil posture']::text[],
     array['Do not move left leg erratically']::text[],
     false),
    (11, 'Salawat & Closing Supplication',
     'In the final sitting, send blessings upon Prophet Muhammad (PBUH) and Prophet Ibrahim, followed by personal dua.',
     'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ...',
     'Allahumma salli ''ala Muhammadin wa ''ala ali Muhammad...',
     'TODO: മലയാളം വിശദീകരണം — പ്രവാചകന്റെ മേലുള്ള സ്വലാത്തും സമാപന ദുആയും.',
     array['Recite Ibrahimic Salawat thoughtfully', 'Seek protection from trial of grave']::text[],
     array['Do not skip Salawat in the final Sitting']::text[],
     false),
    (12, 'Tasleem (Salam)',
     'Turn face to the right, then to the left, uttering ''As-salamu alaykum wa rahmatullah'' to conclude prayer.',
     'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ',
     'As-salamu alaykum wa rahmatullah (Right & Left)',
     'TODO: മലയാളം വിശദീകരണം — വലത്തോട്ടും ഇടത്തോട്ടും സലാം വീട്ടുക.',
     array['Turn head until right cheek is visible from behind', 'Wish peace upon angels and believers']::text[],
     array['Do not turn shoulders away from Qiblah during Salam']::text[],
     false)
) as seed (position, name, what_to_do, arabic, transliteration, malayalam, dos, donts, is_repeat_node)
where not exists (select 1 from public.namaz_steps);
