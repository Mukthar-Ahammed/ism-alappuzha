-- Phase 9: dhikr and dua managed in the admin, checked before they are published.
-- Paste-ready SQL for the Supabase SQL Editor. Run after the phase8 file. Safe to run more than once.

-- Repeat counts become numbers ("33" -> 33); anything that is not a whole number is dropped.
do $$
begin
  if (
    select data_type
    from information_schema.columns
    where table_schema = 'public' and table_name = 'dhikr_entries' and column_name = 'repeat_count'
  ) = 'text' then
    alter table public.dhikr_entries
      alter column repeat_count type int
      using (case when repeat_count ~ '^\s*\d{1,4}\s*$' then trim(repeat_count)::int end);
  end if;
end;
$$;

alter table public.dhikr_entries drop constraint if exists dhikr_entries_repeat_count_check;
alter table public.dhikr_entries
  add constraint dhikr_entries_repeat_count_check
  check (repeat_count is null or repeat_count between 1 and 1000);

-- Must match dhikrCategories in src/data/dhikr.ts.
alter table public.dhikr_entries drop constraint if exists dhikr_entries_category_check;
alter table public.dhikr_entries
  add constraint dhikr_entries_category_check
  check (category in (
    'Morning & Evening', 'After Salah', 'Sleep', 'Travel', 'Food', 'Forgiveness', 'Protection'
  ));

alter table public.dhikr_entries drop constraint if exists dhikr_entries_length_check;
alter table public.dhikr_entries
  add constraint dhikr_entries_length_check
  check (
    char_length(title) between 1 and 120
    and char_length(arabic) between 1 and 2000
    and (transliteration is null or char_length(transliteration) <= 2000)
    and (malayalam is null or char_length(malayalam) <= 3000)
    and (reference is null or char_length(reference) <= 300)
  );

create index if not exists idx_dhikr_entries_status_category_sort
  on public.dhikr_entries (status, category, sort_order);

-- Creates (p_id null) or updates an entry. Changing the Arabic, transliteration, meaning or
-- source of a checked entry clears the check and takes it off the website until it is
-- checked again. A new entry, or one moved to another category, goes to the end of it.
create or replace function public.admin_save_dhikr(
  p_id uuid,
  p_title text,
  p_category text,
  p_arabic text,
  p_transliteration text,
  p_malayalam text,
  p_reference text,
  p_repeat_count int,
  p_actor_email text
)
returns jsonb
language plpgsql
as $$
declare
  saved public.dhikr_entries;
  previous public.dhikr_entries;
  next_sort int;
  review_cleared boolean := false;
begin
  select coalesce(max(sort_order), 0) + 1 into next_sort
  from public.dhikr_entries
  where category = p_category;

  if p_id is null then
    insert into public.dhikr_entries (
      title, category, arabic, transliteration, malayalam, reference, repeat_count, sort_order
    )
    values (
      p_title, p_category, p_arabic, p_transliteration, p_malayalam, p_reference, p_repeat_count, next_sort
    )
    returning * into saved;
  else
    select * into previous from public.dhikr_entries where id = p_id for update;

    if previous.id is null then
      raise exception 'dhikr_not_found' using errcode = 'P0001';
    end if;

    review_cleared := previous.reviewed_by is not null and (
      previous.arabic is distinct from p_arabic
      or previous.transliteration is distinct from p_transliteration
      or previous.malayalam is distinct from p_malayalam
      or previous.reference is distinct from p_reference
    );

    update public.dhikr_entries
    set title = p_title,
        category = p_category,
        arabic = p_arabic,
        transliteration = p_transliteration,
        malayalam = p_malayalam,
        reference = p_reference,
        repeat_count = p_repeat_count,
        sort_order = case when previous.category = p_category then sort_order else next_sort end,
        status = case when review_cleared then 'draft' else status end,
        reviewed_by = case when review_cleared then null else reviewed_by end,
        reviewed_at = case when review_cleared then null else reviewed_at end
    where id = p_id
    returning * into saved;
  end if;

  insert into public.audit_log (actor_email, action, entity, entity_id, detail)
  values (
    p_actor_email,
    case when p_id is null then 'dhikr_created' else 'dhikr_updated' end,
    'dhikr',
    saved.id::text,
    jsonb_build_object('review_cleared', review_cleared)
  );

  return jsonb_build_object('id', saved.id, 'review_cleared', review_cleared);
end;
$$;

-- Records who checked the text, or withdraws the check (which also unpublishes).
create or replace function public.admin_set_dhikr_review(
  p_id uuid,
  p_reviewed boolean,
  p_actor_email text
)
returns void
language plpgsql
as $$
begin
  update public.dhikr_entries
  set reviewed_by = case when p_reviewed then p_actor_email end,
      reviewed_at = case when p_reviewed then now() end,
      status = case when p_reviewed then status else 'draft' end
  where id = p_id;

  if not found then
    raise exception 'dhikr_not_found' using errcode = 'P0001';
  end if;

  insert into public.audit_log (actor_email, action, entity, entity_id)
  values (
    p_actor_email,
    case when p_reviewed then 'dhikr_checked' else 'dhikr_check_withdrawn' end,
    'dhikr',
    p_id::text
  );
end;
$$;

create or replace function public.admin_set_dhikr_status(
  p_id uuid,
  p_status text,
  p_actor_email text
)
returns void
language plpgsql
as $$
declare
  current_entry public.dhikr_entries;
begin
  if p_status not in ('draft', 'published') then
    raise exception 'invalid_dhikr_status' using errcode = 'P0001';
  end if;

  select * into current_entry from public.dhikr_entries where id = p_id for update;

  if current_entry.id is null then
    raise exception 'dhikr_not_found' using errcode = 'P0001';
  end if;

  if p_status = 'published' and current_entry.reviewed_by is null then
    raise exception 'dhikr_not_reviewed' using errcode = 'P0001';
  end if;

  update public.dhikr_entries set status = p_status where id = p_id;

  insert into public.audit_log (actor_email, action, entity, entity_id)
  values (
    p_actor_email,
    case when p_status = 'published' then 'dhikr_published' else 'dhikr_unpublished' end,
    'dhikr',
    p_id::text
  );
end;
$$;

-- Swaps an entry with its neighbour in the same category. The category is renumbered
-- 1..n first so the order is always well defined.
create or replace function public.admin_move_dhikr(
  p_id uuid,
  p_direction text,
  p_actor_email text
)
returns void
language plpgsql
as $$
declare
  entry_category text;
  entry_position int;
  neighbour_id uuid;
begin
  if p_direction not in ('up', 'down') then
    raise exception 'invalid_dhikr_direction' using errcode = 'P0001';
  end if;

  select category into entry_category from public.dhikr_entries where id = p_id;

  if entry_category is null then
    raise exception 'dhikr_not_found' using errcode = 'P0001';
  end if;

  perform 1 from public.dhikr_entries where category = entry_category for update;

  update public.dhikr_entries as entry
  set sort_order = ordered.position
  from (
    select id, row_number() over (order by sort_order, created_at, id)::int as position
    from public.dhikr_entries
    where category = entry_category
  ) as ordered
  where entry.id = ordered.id and entry.sort_order is distinct from ordered.position;

  select sort_order into entry_position from public.dhikr_entries where id = p_id;

  select id into neighbour_id
  from public.dhikr_entries
  where category = entry_category
    and sort_order = entry_position + case when p_direction = 'up' then -1 else 1 end;

  -- Already first or last: nothing to do.
  if neighbour_id is null then
    return;
  end if;

  update public.dhikr_entries set sort_order = entry_position where id = neighbour_id;
  update public.dhikr_entries
  set sort_order = entry_position + case when p_direction = 'up' then -1 else 1 end
  where id = p_id;

  insert into public.audit_log (actor_email, action, entity, entity_id, detail)
  values (p_actor_email, 'dhikr_moved', 'dhikr', p_id::text, jsonb_build_object('direction', p_direction));
end;
$$;

create or replace function public.admin_delete_dhikr(
  p_id uuid,
  p_actor_email text
)
returns void
language plpgsql
as $$
begin
  delete from public.dhikr_entries where id = p_id;

  if not found then
    raise exception 'dhikr_not_found' using errcode = 'P0001';
  end if;

  insert into public.audit_log (actor_email, action, entity, entity_id)
  values (p_actor_email, 'dhikr_deleted', 'dhikr', p_id::text);
end;
$$;

revoke all on function public.admin_save_dhikr(uuid, text, text, text, text, text, text, int, text) from public, anon, authenticated;
revoke all on function public.admin_set_dhikr_review(uuid, boolean, text) from public, anon, authenticated;
revoke all on function public.admin_set_dhikr_status(uuid, text, text) from public, anon, authenticated;
revoke all on function public.admin_move_dhikr(uuid, text, text) from public, anon, authenticated;
revoke all on function public.admin_delete_dhikr(uuid, text) from public, anon, authenticated;

grant execute on function public.admin_save_dhikr(uuid, text, text, text, text, text, text, int, text) to service_role;
grant execute on function public.admin_set_dhikr_review(uuid, boolean, text) to service_role;
grant execute on function public.admin_set_dhikr_status(uuid, text, text) to service_role;
grant execute on function public.admin_move_dhikr(uuid, text, text) to service_role;
grant execute on function public.admin_delete_dhikr(uuid, text) to service_role;

-- The dhikr that used to be hard-coded on the website, loaded once as unchecked drafts so
-- nobody has to retype them. Nothing is added if the table already has entries.
insert into public.dhikr_entries (title, category, arabic, transliteration, malayalam, reference, repeat_count, sort_order)
select seed.title, seed.category, seed.arabic, seed.transliteration, seed.malayalam, seed.reference, seed.repeat_count, seed.sort_order
from (
  values
    ('Morning: Asbahna wa asbahal-mulku lillah', 'Morning & Evening',
     'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
     'Asbahna wa asbahal-mulku lillah, wal-hamdu lillah, la ilaha illallahu wahdahu la shareeka lah',
     'ഞങ്ങളും അല്ലാഹുവിന്റെ ആധിപത്യവും പ്രഭാതത്തിലേക്ക് പ്രവേശിച്ചിരിക്കുന്നു.',
     'Sahih Muslim 2723', 1, 1),
    ('Allahumma bika asbahna', 'Morning & Evening',
     'اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ',
     'Allahumma bika asbahna wa bika amsayna wa bika nahya wa bika namutu wa ilaykan-nushur',
     'അല്ലാഹുവേ, നിന്നാൽ ഞങ്ങൾ പ്രഭാതത്തിലേക്കും സന്ധ്യയിലേക്കും പ്രവേശിക്കുന്നു.',
     'Sunan At-Tirmidhi 3391', 1, 2),
    ('Subhanallahi wa bihamdih', 'Morning & Evening',
     'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
     'Subhanallahi wa bihamdih',
     'അല്ലാഹുവിനെ സ്തുതിച്ചും പുകഴ്ത്തിയും ഞാൻ പരിശുദ്ധനാക്കുന്നു.',
     'Sahih Bukhari 6405', 100, 3),
    ('Istighfar after salah', 'After Salah',
     'أَسْتَغْفِرُ اللَّهَ',
     'Astaghfirullah',
     'ഞാൻ അല്ലാഹുവോട് പാപമോചനം തേടുന്നു.',
     'Sahih Muslim 591', 3, 1),
    ('Allahumma antas-Salam', 'After Salah',
     'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
     'Allahumma antas-Salamu wa minkas-Salam tabarakta ya dhal-Jalali wal-Ikram',
     'അല്ലാഹുവേ, നീ സമാധാനമാണ്, നിന്നിൽ നിന്നാണ് സമാധാനം.',
     'Sahih Muslim 592', 1, 2),
    ('Tasbih after salah', 'After Salah',
     'سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَاللَّهُ أَكْبَرُ',
     'Subhanallah wal-hamdu lillah wallahu Akbar',
     'അല്ലാഹു പരിശുദ്ധൻ, സർവ്വസ്തുതിയും അല്ലാഹുവിന്, അല്ലാഹു ഏറ്റവും മഹാൻ.',
     'Sahih Muslim 595', 33, 3),
    ('Before sleeping', 'Sleep',
     'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
     'Bismika Allahumma amutu wa ahya',
     'അല്ലാഹുവേ, നിന്റെ നാമത്തിൽ ഞാൻ മരിക്കുകയും ജീവിക്കുകയും ചെയ്യുന്നു.',
     'Sahih Bukhari 6312', 1, 1),
    ('Allahumma qini adhabak', 'Sleep',
     'اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ',
     'Allahumma qini ''adhabaka yawma tab''athu ''ibadak',
     'അല്ലാഹുവേ, നിന്റെ അടിമകളെ ഉയിർത്തെഴുന്നേൽപ്പിക്കുന്ന ദിവസം നിന്റെ ശിക്ഷയിൽ നിന്ന് എന്നെ കാക്കേണമേ.',
     'Sunan Abu Dawud 5045', 1, 2),
    ('Boarding a vehicle', 'Travel',
     'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنقَلِبُونَ',
     'Subhanal-ladhi sakhkhara lana hadha wa ma kunna lahu muqrineen wa inna ila Rabbina lamunqalibun',
     'ഇതിനെ നമുക്ക് കീഴ്‌പ്പെടുത്തിത്തന്ന അല്ലാഹു പരിശുദ്ധൻ.',
     'Sunan At-Tirmidhi 3446 (Surah Az-Zukhruf 43:13-14)', 1, 1),
    ('Dua for a journey', 'Travel',
     'اللَّهُمَّ إِنِّي أَسْأَلُكَ فِي سَفَرِي هَذَا الْبِرَّ وَالتَّقْوَى وَمِنَ الْعَمَلِ مَا تَرْضَى',
     'Allahumma inni as''aluka fi safari hadhal-birra wat-taqwa wa minal-''amali ma tarda',
     'അല്ലാഹുവേ, ഈ യാത്രയിൽ നന്മയും ഭക്തിയും നിനക്ക് തൃപ്തികരമായ കർമ്മവും ഞാൻ ചോദിക്കുന്നു.',
     'Sahih Muslim 1342', 1, 2),
    ('Before eating', 'Food',
     'بِسْمِ اللَّهِ',
     'Bismillah',
     'അല്ലാഹുവിന്റെ നാമത്തിൽ.',
     'Sahih Bukhari 5376', 1, 1),
    ('After eating', 'Food',
     'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ',
     'Alhamdu lillahil-ladhi at''amani hadha wa razaqanihi min ghayri hawlin minni wa la quwwah',
     'എനിക്ക് ഇത് ഭക്ഷിപ്പിക്കുകയും എന്റെ ഭാഗത്ത് നിന്ന് ശക്തിയോ കഴിവോ ഇല്ലാതെ ഉപജീവനം നൽകുകയും ചെയ്ത അല്ലാഹുവിന് സ്തുതി.',
     'Sunan At-Tirmidhi 3458', 1, 2),
    ('Astaghfirullahal-Azeem', 'Forgiveness',
     'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ',
     'Astaghfirullahal-''Azeemal-ladhi la ilaha illa Huwal-Hayyul-Qayyumu wa atubu ilayh',
     'ജീവനുള്ളവനും നിലനിൽക്കുന്നവനുമായ അല്ലാഹുവോട് ഞാൻ പാപമോചനം തേടുന്നു.',
     'Sunan Abu Dawud 1517', 3, 1),
    ('Rabbighfir li wa tub alayya', 'Forgiveness',
     'رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ',
     'Rabbighfir li wa tub ''alayya innaka antat-Tawwabur-Raheem',
     'എന്റെ രക്ഷിതാവേ, എനിക്ക് പൊറുത്തുതരേണമേ. നീ തൗബ സ്വീകരിക്കുന്നവനും കരുണാമയനുമാണ്.',
     'Sunan At-Tirmidhi 3434', 1, 2),
    ('A''udhu bikalimatillahit-tammat', 'Protection',
     'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
     'A''udhu bikalimati-llahit-tammati min sharri ma khalaq',
     'അല്ലാഹുവിന്റെ പൂർണ്ണമായ വചനങ്ങൾ കൊണ്ട് അവൻ സൃഷ്ടിച്ചതിന്റെ തിന്മയിൽ നിന്ന് ഞാൻ ശരണം തേടുന്നു.',
     'Sahih Muslim 2708', 3, 1),
    ('Bismillahil-ladhi la yadurru', 'Protection',
     'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
     'Bismillahil-ladhi la yadurru ma''as-mihi shay''un fil-ardi wa la fis-sama''i wa huwas-Sami''ul-''Aleem',
     'അല്ലാഹുവിന്റെ നാമത്തിൽ, അവന്റെ നാമത്തോടൊപ്പം ഭൂമിയിലോ ആകാശത്തിലോ ഒന്നും ദോഷം ചെയ്യില്ല.',
     'Sunan Abu Dawud 5088', 3, 2)
) as seed (title, category, arabic, transliteration, malayalam, reference, repeat_count, sort_order)
where not exists (select 1 from public.dhikr_entries);
