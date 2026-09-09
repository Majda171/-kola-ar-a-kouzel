-- BRADAVICE v35 — administrace + studentské profily + kolejní avatary
-- Tento soubor je samostatný a idempotentní: pro v35 stačí spustit tento SQL soubor.
-- DŮLEŽITÉ: Po spuštění nastav svůj vlastní účet jako administrátorský podle návodu na konci.

begin;

alter table public.profiles add column if not exists bio text not null default '';
alter table public.profiles add column if not exists avatar_key text not null default 'none';
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles alter column avatar_key set default 'none';

-- Staré avatarové ikonky převedeme na první portrét příslušné koleje.
update public.profiles
set avatar_key = case house_code
  when 'N' then 'n1'
  when 'H' then 'h1'
  when 'M' then 'm1'
  when 'Z' then 'z1'
  else 'none'
end,
updated_at = now()
where avatar_key not in (
  'n1','n2','n3','n4','n5','n6','n7','n8','n9','n10',
  'h1','h2','h3','h4','h5','h6','h7','h8','h9','h10',
  'm1','m2','m3','m4','m5','m6','m7','m8','m9','m10',
  'z1','z2','z3','z4','z5','z6','z7','z8','z9','z10'
);

-- Profil i admin flag se mění pouze přes bezpečné RPC funkce.
revoke insert, update, delete on public.profiles from authenticated, anon;

create or replace function public.update_own_profile(p_bio text, p_avatar_key text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  h text;
begin
  if uid is null then raise exception 'Student není přihlášen.'; end if;
  select house_code into h from public.profiles where id=uid;
  if h is null then raise exception 'Profilový obrázek lze vybrat až po rozřazení.'; end if;

  if not (
    (h='N' and p_avatar_key in ('n1','n2','n3','n4','n5','n6','n7','n8','n9','n10')) or
    (h='H' and p_avatar_key in ('h1','h2','h3','h4','h5','h6','h7','h8','h9','h10')) or
    (h='M' and p_avatar_key in ('m1','m2','m3','m4','m5','m6','m7','m8','m9','m10')) or
    (h='Z' and p_avatar_key in ('z1','z2','z3','z4','z5','z6','z7','z8','z9','z10'))
  ) then
    raise exception 'Vybraný portrét nepatří do studentovy koleje.';
  end if;

  update public.profiles
     set bio = left(coalesce(trim(p_bio),''),500),
         avatar_key = p_avatar_key,
         updated_at = now()
   where id = uid;
  return found;
end;
$$;
revoke all on function public.update_own_profile(text,text) from public, anon;
grant execute on function public.update_own_profile(text,text) to authenticated;

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()),false);
$$;
revoke all on function public.is_admin_user() from public, anon;
grant execute on function public.is_admin_user() to authenticated;

create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare result jsonb;
begin
  if not public.is_admin_user() then raise exception 'Administrátorský přístup byl zamítnut.'; end if;
  select jsonb_build_object(
    'registered', count(*) filter (where not is_admin),
    'sorted', count(*) filter (where not is_admin and house_code is not null),
    'unsorted', count(*) filter (where not is_admin and house_code is null),
    'nebelvir', count(*) filter (where not is_admin and house_code='N'),
    'havraspar', count(*) filter (where not is_admin and house_code='H'),
    'mrzimor', count(*) filter (where not is_admin and house_code='M'),
    'zmijozel', count(*) filter (where not is_admin and house_code='Z')
  ) into result from public.profiles;
  return result;
end;
$$;
revoke all on function public.admin_dashboard_stats() from public, anon;
grant execute on function public.admin_dashboard_stats() to authenticated;

create or replace function public.admin_search_students(p_query text default '', p_limit integer default 50)
returns table(
  id uuid, email text, first_name text, last_name text, house_code text, school_year integer,
  personal_points bigint, bio text, avatar_key text, created_at timestamptz, updated_at timestamptz,
  achievement_count bigint, quest_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin_user() then raise exception 'Administrátorský přístup byl zamítnut.'; end if;
  return query
  select p.id,u.email::text,p.first_name::text,p.last_name::text,p.house_code::text,p.school_year::integer,p.personal_points::bigint,p.bio::text,p.avatar_key::text,p.created_at::timestamptz,p.updated_at::timestamptz,
         (select count(*) from public.student_achievements a where a.student_id=p.id),
         (select count(*) from public.student_quests q where q.student_id=p.id)
    from public.profiles p left join auth.users u on u.id=p.id
   where not p.is_admin and (coalesce(trim(p_query),'')=''
      or lower(coalesce(p.first_name,'')||' '||coalesce(p.last_name,'')) like '%'||lower(trim(p_query))||'%'
      or lower(coalesce(u.email,'')) like '%'||lower(trim(p_query))||'%')
   order by p.created_at desc
   limit least(greatest(coalesce(p_limit,50),1),100);
end;
$$;
revoke all on function public.admin_search_students(text,integer) from public, anon;
grant execute on function public.admin_search_students(text,integer) to authenticated;

create or replace function public.admin_student_detail(p_student_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare result jsonb;
begin
  if not public.is_admin_user() then raise exception 'Administrátorský přístup byl zamítnut.'; end if;
  select jsonb_build_object(
    'profile', to_jsonb(p) || jsonb_build_object('email',u.email),
    'achievements', coalesce((select jsonb_agg(jsonb_build_object('id',a.achievement_id,'at',a.unlocked_at) order by a.unlocked_at desc) from public.student_achievements a where a.student_id=p.id),'[]'::jsonb),
    'quests', coalesce((select jsonb_agg(jsonb_build_object('id',q.quest_id,'at',q.completed_at) order by q.completed_at desc) from public.student_quests q where q.student_id=p.id),'[]'::jsonb),
    'points', coalesce((select jsonb_agg(x) from (select pe.amount,pe.reason,pe.created_at from public.point_events pe where pe.student_id=p.id order by pe.created_at desc limit 20) x),'[]'::jsonb)
  ) into result
  from public.profiles p left join auth.users u on u.id=p.id where p.id=p_student_id;
  return result;
end;
$$;
revoke all on function public.admin_student_detail(uuid) from public, anon;
grant execute on function public.admin_student_detail(uuid) to authenticated;

commit;

-- =============================================================
-- JEDNORÁZOVĚ NASTAV SVŮJ ADMIN ÚČET
-- Nahraď e-mail níže e-mailem účtu, kterým se budeš hlásit přes admin-login.html:
--
-- update public.profiles p
-- set is_admin = true
-- from auth.users u
-- where p.id = u.id and lower(u.email) = lower('TVUJ-ADMIN-EMAIL@EMAIL.CZ');
--
-- Ověření:
-- select p.first_name,p.last_name,u.email,p.is_admin
-- from public.profiles p join auth.users u on u.id=p.id
-- where p.is_admin=true;
