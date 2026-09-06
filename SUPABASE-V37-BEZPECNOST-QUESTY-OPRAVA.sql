-- BRADAVICE v37 — bezpečnost, bany, unikátní jména a Hagridův úkol
-- Spusť JEDNOU po V29 a V35 v Supabase SQL Editoru.

begin;

alter table public.profiles add column if not exists banned_at timestamptz;
alter table public.profiles add column if not exists ban_reason text not null default '';

-- Žádní dva aktivně registrovaní studenti nemají stejné jméno + příjmení.
-- OPRAVA v37.1: starší verze funkce měla jiné názvy vstupních parametrů.
-- PostgreSQL je neumí přejmenovat přes CREATE OR REPLACE, proto starou signaturu nejdřív odstraníme.
drop function if exists public.student_name_available(text,text);

create function public.student_name_available(p_first text, p_last text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.profiles p
    where not coalesce(p.is_admin,false)
      and lower(trim(coalesce(p.first_name,''))) = lower(trim(coalesce(p_first,'')))
      and lower(trim(coalesce(p.last_name,''))) = lower(trim(coalesce(p_last,'')))
  );
$$;
revoke all on function public.student_name_available(text,text) from public;
grant execute on function public.student_name_available(text,text) to anon, authenticated;

create or replace function public.prevent_duplicate_student_name()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(new.is_admin,false) then return new; end if;
  if exists (
    select 1 from public.profiles p
    where p.id <> new.id
      and not coalesce(p.is_admin,false)
      and lower(trim(coalesce(p.first_name,''))) = lower(trim(coalesce(new.first_name,'')))
      and lower(trim(coalesce(p.last_name,''))) = lower(trim(coalesce(new.last_name,'')))
  ) then
    raise exception 'Student s tímto jménem už je registrován.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_unique_student_name on public.profiles;
create trigger profiles_unique_student_name
before insert or update of first_name,last_name,is_admin on public.profiles
for each row execute function public.prevent_duplicate_student_name();

create or replace function public.student_access_state()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when auth.uid() is null then
    jsonb_build_object('authenticated',false,'banned',false,'is_admin',false)
  else coalesce((
    select jsonb_build_object(
      'authenticated',true,
      'banned',p.banned_at is not null,
      'banned_at',p.banned_at,
      'reason',coalesce(p.ban_reason,''),
      'is_admin',coalesce(p.is_admin,false),
      'house_code',p.house_code
    ) from public.profiles p where p.id=auth.uid()
  ), jsonb_build_object('authenticated',true,'banned',false,'is_admin',false)) end;
$$;
revoke all on function public.student_access_state() from public, anon;
grant execute on function public.student_access_state() to authenticated;

create or replace function public.admin_set_student_ban(p_student_id uuid, p_banned boolean, p_reason text default '')
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin_user() then raise exception 'Administrátorský přístup byl zamítnut.'; end if;
  if p_student_id = auth.uid() then raise exception 'Administrátor nemůže zabanovat vlastní účet.'; end if;
  if exists(select 1 from public.profiles where id=p_student_id and is_admin) then
    raise exception 'Administrátorský účet nelze tímto způsobem zabanovat.';
  end if;
  update public.profiles
     set banned_at = case when p_banned then now() else null end,
         ban_reason = case when p_banned then left(coalesce(trim(p_reason),''),500) else '' end,
         updated_at = now()
   where id=p_student_id;
  return found;
end;
$$;
revoke all on function public.admin_set_student_ban(uuid,boolean,text) from public, anon;
grant execute on function public.admin_set_student_ban(uuid,boolean,text) to authenticated;

-- Hagridův úkol: 5 hrabáků, odměna přesně jednou +50 bodů.
create table if not exists public.student_hagrid_nifflers (
  student_id uuid primary key references public.profiles(id) on delete cascade,
  accepted_at timestamptz,
  found_ids text[] not null default '{}',
  completed_at timestamptz,
  rewarded_at timestamptz
);
alter table public.student_hagrid_nifflers enable row level security;
drop policy if exists own_hagrid_nifflers_read on public.student_hagrid_nifflers;
create policy own_hagrid_nifflers_read on public.student_hagrid_nifflers
for select to authenticated using(student_id=auth.uid());
grant select on public.student_hagrid_nifflers to authenticated;

create or replace function public.hagrid_niffler_status()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when auth.uid() is null then jsonb_build_object('accepted',false,'found',0,'completed',false,'rewarded',false,'ids','[]'::jsonb)
  else coalesce((select jsonb_build_object(
    'accepted',x.accepted_at is not null,
    'found',coalesce(array_length(x.found_ids,1),0),
    'completed',x.completed_at is not null,
    'rewarded',x.rewarded_at is not null,
    'ids',to_jsonb(x.found_ids)
  ) from public.student_hagrid_nifflers x where x.student_id=auth.uid()),
  jsonb_build_object('accepted',false,'found',0,'completed',false,'rewarded',false,'ids','[]'::jsonb)) end;
$$;
grant execute on function public.hagrid_niffler_status() to authenticated;

create or replace function public.hagrid_accept_quest()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare uid uuid:=auth.uid();
begin
  if uid is null then raise exception 'Student není přihlášen.'; end if;
  if exists(select 1 from public.profiles where id=uid and banned_at is not null) then raise exception 'Účet je vyloučen ze školy.'; end if;
  insert into public.student_hagrid_nifflers(student_id,accepted_at)
  values(uid,now())
  on conflict(student_id) do update set accepted_at=coalesce(public.student_hagrid_nifflers.accepted_at,excluded.accepted_at);
  return true;
end;
$$;
grant execute on function public.hagrid_accept_quest() to authenticated;

create or replace function public.hagrid_find_niffler(p_niffler_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare uid uuid:=auth.uid(); n integer;
begin
  if uid is null then raise exception 'Student není přihlášen.'; end if;
  if p_niffler_id not in ('n1','n2','n3','n4','n5') then raise exception 'Neplatný hrabák.'; end if;
  if exists(select 1 from public.profiles where id=uid and banned_at is not null) then raise exception 'Účet je vyloučen ze školy.'; end if;
  if not exists(select 1 from public.student_hagrid_nifflers where student_id=uid and accepted_at is not null) then
    raise exception 'Nejdřív přijmi Hagridův úkol.';
  end if;
  update public.student_hagrid_nifflers
     set found_ids = case when not (p_niffler_id=any(found_ids)) then array_append(found_ids,p_niffler_id) else found_ids end
   where student_id=uid and rewarded_at is null;
  select coalesce(array_length(found_ids,1),0) into n from public.student_hagrid_nifflers where student_id=uid;
  return coalesce(n,0);
end;
$$;
grant execute on function public.hagrid_find_niffler(text) to authenticated;

create or replace function public.hagrid_return_nifflers()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare uid uuid:=auth.uid(); n integer; already timestamptz;
begin
  if uid is null then raise exception 'Student není přihlášen.'; end if;
  select coalesce(array_length(found_ids,1),0),rewarded_at into n,already
  from public.student_hagrid_nifflers where student_id=uid for update;
  if n < 5 then raise exception 'Ještě nemáš všech pět hrabáků.'; end if;
  if already is not null then return false; end if;
  perform public.add_points_internal(uid,50,'Hagridovi hrabáci','quest','hagrid-nifflers');
  update public.student_hagrid_nifflers set completed_at=now(),rewarded_at=now() where student_id=uid;
  insert into public.student_quests(student_id,quest_id,completed_at)
  values(uid,'hagrid-nifflers',now()) on conflict do nothing;
  return true;
end;
$$;
grant execute on function public.hagrid_return_nifflers() to authenticated;

-- Admin seznam rozšířený o stav banu.
drop function if exists public.admin_search_students(text,integer);
create function public.admin_search_students(p_query text default '', p_limit integer default 50)
returns table(
  id uuid, email text, first_name text, last_name text, house_code text, school_year integer,
  personal_points bigint, bio text, avatar_key text, created_at timestamptz, updated_at timestamptz,
  achievement_count bigint, quest_count bigint, banned_at timestamptz, ban_reason text
)
language plpgsql stable security definer set search_path=public
as $$
begin
  if not public.is_admin_user() then raise exception 'Administrátorský přístup byl zamítnut.'; end if;
  return query
  select p.id,u.email::text,p.first_name::text,p.last_name::text,p.house_code::text,p.school_year::integer,
         p.personal_points::bigint,p.bio::text,p.avatar_key::text,p.created_at::timestamptz,p.updated_at::timestamptz,
         (select count(*) from public.student_achievements a where a.student_id=p.id),
         (select count(*) from public.student_quests q where q.student_id=p.id),p.banned_at,p.ban_reason::text
  from public.profiles p left join auth.users u on u.id=p.id
  where not p.is_admin and (coalesce(trim(p_query),'')=''
     or lower(coalesce(p.first_name,'')||' '||coalesce(p.last_name,'')) like '%'||lower(trim(p_query))||'%'
     or lower(coalesce(u.email,'')) like '%'||lower(trim(p_query))||'%')
  order by p.created_at desc limit least(greatest(coalesce(p_limit,50),1),100);
end;
$$;
grant execute on function public.admin_search_students(text,integer) to authenticated;

commit;

select 'v37 připravena: bezpečnost, bany, unikátní jména a Hagridův úkol.' as status;
