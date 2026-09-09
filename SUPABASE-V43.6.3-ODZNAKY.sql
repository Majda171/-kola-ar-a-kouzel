-- ============================================================
-- BRADAVICE v43.6.3 — POUZE OPRAVA ODZNAKŮ
-- Avatary tento soubor NEŘEŠÍ — jejich SQL už bylo spuštěno.
-- Bezpečné i při opakovaném spuštění.
-- ============================================================

begin;

create or replace function public.unlock_achievement(p_achievement_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  aid text := trim(coalesce(p_achievement_id, ''));
  inserted integer := 0;
  title text;
  is_core boolean := false;
  valid_ids text[] := array[
    'prvni-kroky',
    'novy-domov',
    'prvni-body',
    'zvidavy-student',
    'pruzkumnik-bradavic',
    'tajemstvi-hradu',
    'godrikuv-nalezce',
    'mistnost-se-ukazala',
    'lechtiva-hruska',
    'nocni-pozorovatel',
    'rocnikova-zkouska',
    'ctyri-zakladatele',
    'prvni-lektvar',
    'prvni-promena',
    'obrance-hradu',
    'famfrpalova-hvezda',
    'pritel-duchu',
    'srdce-velke-sine',
    'strazce-koleje',
    'znalec-hesel',
    'orli-hadanka',
    'rytmus-sudu',
    'dama-otevrela',
    'septane-heslo',
    'herbarnik',
    'mandragorovy-pestitel',
    'sachovy-mistr',
    'mistr-lektvaru',
    'mistr-premen',
    'pritel-hagrida',
    'jezerni-badatel',
    'prvni-test',
    'bystra-mysl',
    'bez-jedine-chyby',
    'pilny-student',
    's-vyznamenanim',
    'opora-koleje',
    'sto-bodu',
    'legenda-koleje',
    'kolejni-hlas'
  ];
  core_ids text[] := array[
    'prvni-kroky',
    'novy-domov',
    'prvni-body',
    'zvidavy-student',
    'pruzkumnik-bradavic',
    'tajemstvi-hradu',
    'godrikuv-nalezce',
    'mistnost-se-ukazala',
    'lechtiva-hruska',
    'nocni-pozorovatel',
    'rocnikova-zkouska'
  ];
begin
  if uid is null then
    raise exception 'Student není přihlášen.';
  end if;

  if aid = '' or length(aid) > 80 or not (aid = any(valid_ids)) then
    raise exception 'Neplatný odznak.';
  end if;

  if not exists(
    select 1
    from public.profiles p
    where p.id = uid
      and p.banned_at is null
      and not coalesce(p.is_admin, false)
  ) then
    raise exception 'Studentský účet není aktivní.';
  end if;

  is_core := aid = any(core_ids);

  title := case aid
    when 'prvni-kroky' then 'První kroky'
    when 'novy-domov' then 'Nový domov'
    when 'prvni-body' then 'První body'
    when 'zvidavy-student' then 'Zvídavý student'
    when 'pruzkumnik-bradavic' then 'Průzkumník Bradavic'
    when 'tajemstvi-hradu' then 'Tajemství hradu'
    when 'godrikuv-nalezce' then 'Godrikův nálezce'
    when 'mistnost-se-ukazala' then 'Místnost se ukázala'
    when 'lechtiva-hruska' then 'Lechtivá hruška'
    when 'nocni-pozorovatel' then 'Noční pozorovatel'
    when 'rocnikova-zkouska' then 'Ročníková zkouška'
    else aid
  end;

  insert into public.student_achievements(student_id, achievement_id, unlocked_at)
  values(uid, aid, now())
  on conflict(student_id, achievement_id) do nothing;

  get diagnostics inserted = row_count;

  if inserted = 0 then
    return false;
  end if;

  -- +5 bodů dostávají jen základní odznaky.
  if is_core then
    perform public.add_points_internal(
      uid,
      5,
      'Odznak: ' || title,
      'achievement',
      aid
    );
  end if;

  return true;
end;
$$;

revoke all on function public.unlock_achievement(text) from public, anon;
grant execute on function public.unlock_achievement(text) to authenticated;

commit;

notify pgrst, 'reload schema';
