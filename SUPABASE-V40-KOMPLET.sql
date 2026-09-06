-- BRADAVICE v40 — KOMPLETNÍ DATABÁZOVÁ MIGRACE
-- Spusť v Supabase SQL Editoru po SUPABASE-V29-DENNI-VYZVA.sql a SUPABASE-V35-ADMIN-PROFILY-AVATARY.sql.
-- Tento jediný soubor obsahuje i opravenou v37 (chyba 42P13), Hagridův úkol a všechny databázové novinky v40.
-- Je určený pro stávající instalaci projektu a většina částí je idempotentní.

begin;

-- ============================================================
-- A) OPRAVENÁ v37: bezpečnost, bany, unikátní jména a Hagrid
-- ============================================================
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

-- ============================================================
-- B) v40: bezpečné vrácení Hagridových hrabáků
-- ============================================================
-- 2) Bezpečné dokončení Hagridova úkolu: pomocný quest záznam už nesmí rollbacknout body.
create or replace function public.hagrid_return_nifflers()
returns boolean language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); n integer; already timestamptz;
begin
  if uid is null then raise exception 'Student není přihlášen.'; end if;
  select coalesce(array_length(found_ids,1),0),rewarded_at into n,already
  from public.student_hagrid_nifflers where student_id=uid for update;
  if not found then raise exception 'Hagridův úkol nebyl přijat.'; end if;
  if n<5 then raise exception 'Ještě nemáš všech pět hrabáků.'; end if;
  if already is not null then return false; end if;
  perform public.add_points_internal(uid,50,'Hagridovi hrabáci','quest','hagrid-nifflers');
  update public.student_hagrid_nifflers set completed_at=now(),rewarded_at=now() where student_id=uid;
  begin
    insert into public.student_quests(student_id,quest_id,completed_at) values(uid,'hagrid-nifflers',now()) on conflict do nothing;
  exception when others then null;
  end;
  return true;
end;
$$;
grant execute on function public.hagrid_return_nifflers() to authenticated;

-- ============================================================
-- C) NOVINKY v40
-- ============================================================
-- 3) Jednorázové odměny v40.
create table if not exists public.student_v40_rewards(
  student_id uuid not null references public.profiles(id) on delete cascade,
  activity_key text not null,
  claimed_at timestamptz not null default now(),
  primary key(student_id,activity_key)
);
alter table public.student_v40_rewards enable row level security;
drop policy if exists own_v40_rewards_read on public.student_v40_rewards;
create policy own_v40_rewards_read on public.student_v40_rewards for select to authenticated using(student_id=auth.uid());
grant select on public.student_v40_rewards to authenticated;

create or replace function public.v40_claim_activity(p_activity_key text)
returns boolean language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); pts integer; label text; affected integer:=0;
begin
  if uid is null then raise exception 'Student není přihlášen.'; end if;
  if exists(select 1 from public.profiles where id=uid and banned_at is not null) then raise exception 'Účet je vyloučen ze školy.'; end if;
  case p_activity_key
    when 'brew-first-potion' then pts:=15; label:='První správně uvařený lektvar';
    when 'chess-first-win' then pts:=15; label:='První výhra v kouzelnických šachách';
    when 'requirement-focus' then pts:=25; label:='Komnata nejvyšší potřeby: zkouška soustředění';
    when 'secret-chamber-trials' then pts:=30; label:='Tři zkoušky před Tajemnou komnatou';
    when 'test-potions' then pts:=10; label:='První úspěch: test z lektvarů';
    when 'test-transfiguration' then pts:=10; label:='První úspěch: test z přeměňování';
    when 'test-defense' then pts:=10; label:='První úspěch: test z obrany proti černé magii';
    when 'test-herbology' then pts:=10; label:='První úspěch: test z bylinkářství';
    when 'test-astronomy' then pts:=10; label:='První úspěch: test z astronomie';
    when 'exam-year1' then pts:=25; label:='První úspěch: ročníková zkouška';
    when 'room-candles' then pts:=10; label:='Komnata: světlo ve tmě';
    when 'room-books' then pts:=10; label:='Komnata: ztracené svazky';
    when 'room-key' then pts:=15; label:='Komnata: klíč bez zámku';
    else raise exception 'Neznámá aktivita.';
  end case;
  insert into public.student_v40_rewards(student_id,activity_key) values(uid,p_activity_key)
  on conflict do nothing;
  get diagnostics affected = row_count;
  if affected>0 then perform public.add_points_internal(uid,pts,label,'v40',p_activity_key); end if;
  return affected>0;
end;
$$;
revoke all on function public.v40_claim_activity(text) from public,anon;
grant execute on function public.v40_claim_activity(text) to authenticated;

-- 4) Školní a kolejní chat.
create table if not exists public.chat_messages(
  id bigint generated by default as identity primary key,
  student_id uuid not null references public.profiles(id) on delete cascade,
  scope text not null check(scope in ('school','house')),
  house_code text,
  message text not null check(char_length(message) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_created_idx on public.chat_messages(created_at desc);
create index if not exists chat_messages_house_idx on public.chat_messages(house_code,created_at desc);
alter table public.chat_messages enable row level security;
revoke all on public.chat_messages from anon,authenticated;

create or replace function public.v40_post_chat_message(p_scope text,p_message text)
returns bigint language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); hc text; mid bigint; cleaned text:=trim(coalesce(p_message,''));
begin
  if uid is null then raise exception 'Student není přihlášen.'; end if;
  if p_scope not in ('school','house') then raise exception 'Neplatný typ chatu.'; end if;
  if char_length(cleaned)<1 or char_length(cleaned)>500 then raise exception 'Zpráva musí mít 1 až 500 znaků.'; end if;
  select house_code into hc from public.profiles where id=uid and banned_at is null;
  if not found then raise exception 'Studentský účet není aktivní.'; end if;
  if p_scope='house' and hc is null then raise exception 'Nejdřív musíš být rozřazen/a do koleje.'; end if;
  insert into public.chat_messages(student_id,scope,house_code,message)
  values(uid,p_scope,case when p_scope='house' then hc else null end,cleaned) returning id into mid;
  return mid;
end;
$$;
revoke all on function public.v40_post_chat_message(text,text) from public,anon;
grant execute on function public.v40_post_chat_message(text,text) to authenticated;

create or replace function public.v40_get_chat_messages(p_scope text default 'school',p_limit integer default 80)
returns table(id bigint,student_id uuid,author_name text,house_code text,house_name text,message text,created_at timestamptz)
language plpgsql stable security definer set search_path=public as $$
declare uid uuid:=auth.uid(); caller_house text;
begin
  if uid is null then raise exception 'Student není přihlášen.'; end if;
  select p.house_code into caller_house from public.profiles p where p.id=uid;
  if p_scope='house' and caller_house is null then raise exception 'Nejdřív musíš být rozřazen/a do koleje.'; end if;
  return query
  select m.id,m.student_id,trim(coalesce(p.first_name,'')||' '||coalesce(p.last_name,''))::text,p.house_code::text,
    (case p.house_code when 'N' then 'Nebelvír' when 'H' then 'Havraspár' when 'M' then 'Mrzimor' when 'Z' then 'Zmijozel' else 'Bradavice' end)::text,
    m.message::text,m.created_at
  from public.chat_messages m join public.profiles p on p.id=m.student_id
  where (p_scope='school' and m.scope='school') or (p_scope='house' and m.scope='house' and m.house_code=caller_house)
  order by m.created_at desc limit least(greatest(coalesce(p_limit,80),1),100);
end;
$$;
revoke all on function public.v40_get_chat_messages(text,integer) from public,anon;
grant execute on function public.v40_get_chat_messages(text,integer) to authenticated;

-- 5) Turnaje. U každého studenta se uchovává jeho nejlepší skóre.
create table if not exists public.student_tournament_scores(
  student_id uuid not null references public.profiles(id) on delete cascade,
  tournament_id text not null,
  score integer not null check(score between 0 and 100),
  updated_at timestamptz not null default now(),
  primary key(student_id,tournament_id)
);
create index if not exists tournament_score_rank_idx on public.student_tournament_scores(tournament_id,score desc,updated_at asc);
alter table public.student_tournament_scores enable row level security;
revoke all on public.student_tournament_scores from anon,authenticated;

create or replace function public.v40_submit_tournament_score(p_tournament_id text,p_score integer)
returns boolean language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); affected integer:=0;
begin
  if uid is null then raise exception 'Student není přihlášen.'; end if;
  if p_tournament_id not in ('keeper-cup','potions-cup','chess-cup') then raise exception 'Neznámý turnaj.'; end if;
  if p_score<0 or p_score>100 then raise exception 'Neplatné skóre.'; end if;
  if exists(select 1 from public.profiles where id=uid and banned_at is not null) then raise exception 'Účet je vyloučen ze školy.'; end if;
  insert into public.student_tournament_scores(student_id,tournament_id,score)
  values(uid,p_tournament_id,p_score)
  on conflict(student_id,tournament_id) do update set score=excluded.score,updated_at=now()
  where excluded.score>public.student_tournament_scores.score;
  get diagnostics affected = row_count;
  return affected>0;
end;
$$;
revoke all on function public.v40_submit_tournament_score(text,integer) from public,anon;
grant execute on function public.v40_submit_tournament_score(text,integer) to authenticated;

create or replace function public.v40_get_tournament_board(p_tournament_id text,p_limit integer default 10)
returns table(student_name text,house_code text,score integer,updated_at timestamptz)
language sql stable security definer set search_path=public as $$
  select trim(coalesce(p.first_name,'')||' '||left(coalesce(p.last_name,''),1)||case when coalesce(p.last_name,'')<>'' then '.' else '' end)::text,
         p.house_code::text,s.score::integer,s.updated_at
  from public.student_tournament_scores s join public.profiles p on p.id=s.student_id
  where s.tournament_id=p_tournament_id and p.banned_at is null
  order by s.score desc,s.updated_at asc limit least(greatest(coalesce(p_limit,10),1),50);
$$;
revoke all on function public.v40_get_tournament_board(text,integer) from public,anon;
grant execute on function public.v40_get_tournament_board(text,integer) to authenticated;

-- 6) Ruční přičítání / odečítání bodů administrátorem s auditní historií.
create table if not exists public.student_point_adjustments(
  id bigint generated by default as identity primary key,
  student_id uuid not null references public.profiles(id) on delete cascade,
  admin_id uuid not null references public.profiles(id) on delete restrict,
  amount integer not null check(amount between -200 and 200 and amount<>0),
  reason text not null check(char_length(reason) between 2 and 300),
  created_at timestamptz not null default now()
);
create index if not exists student_point_adjustments_student_idx on public.student_point_adjustments(student_id,created_at desc);
alter table public.student_point_adjustments enable row level security;
drop policy if exists own_point_adjustments_read on public.student_point_adjustments;
create policy own_point_adjustments_read on public.student_point_adjustments for select to authenticated using(student_id=auth.uid());
grant select on public.student_point_adjustments to authenticated;

create or replace function public.admin_adjust_student_points(p_student_id uuid,p_amount integer,p_reason text)
returns integer language plpgsql security definer set search_path=public as $$
declare aid uuid:=auth.uid(); current_pts integer; actual integer; cleaned text:=trim(coalesce(p_reason,''));
begin
  if not public.is_admin_user() then raise exception 'Administrátorský přístup byl zamítnut.'; end if;
  if p_amount=0 or p_amount is null or abs(p_amount)>200 then raise exception 'Úprava musí být od -200 do +200 bodů.'; end if;
  if char_length(cleaned)<2 then raise exception 'Uveď důvod změny bodů.'; end if;
  select personal_points::integer into current_pts from public.profiles where id=p_student_id and not coalesce(is_admin,false) for update;
  if not found then raise exception 'Student nebyl nalezen.'; end if;
  actual:=case when current_pts+p_amount<0 then -current_pts else p_amount end;
  if actual=0 then return 0; end if;
  update public.profiles set personal_points=personal_points+actual,updated_at=now() where id=p_student_id;
  insert into public.student_point_adjustments(student_id,admin_id,amount,reason) values(p_student_id,aid,actual,left(cleaned,300));
  return actual;
end;
$$;
revoke all on function public.admin_adjust_student_points(uuid,integer,text) from public,anon;
grant execute on function public.admin_adjust_student_points(uuid,integer,text) to authenticated;

-- V40 rozšíření detailu studenta: historie zahrnuje i ruční plus/minus body.
create or replace function public.admin_student_detail(p_student_id uuid)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare result jsonb;
begin
  if not public.is_admin_user() then raise exception 'Administrátorský přístup byl zamítnut.'; end if;
  select jsonb_build_object(
    'profile',to_jsonb(p)||jsonb_build_object('email',u.email),
    'achievements',coalesce((select jsonb_agg(jsonb_build_object('id',a.achievement_id,'at',a.unlocked_at) order by a.unlocked_at desc) from public.student_achievements a where a.student_id=p.id),'[]'::jsonb),
    'quests',coalesce((select jsonb_agg(jsonb_build_object('id',q.quest_id,'at',q.completed_at) order by q.completed_at desc) from public.student_quests q where q.student_id=p.id),'[]'::jsonb),
    'points',coalesce((select jsonb_agg(x order by x.created_at desc) from (
      select pe.amount::integer,pe.reason::text,pe.created_at from public.point_events pe where pe.student_id=p.id
      union all
      select pa.amount::integer,pa.reason::text,pa.created_at from public.student_point_adjustments pa where pa.student_id=p.id
      order by created_at desc limit 30
    ) x),'[]'::jsonb)
  ) into result from public.profiles p left join auth.users u on u.id=p.id where p.id=p_student_id;
  return result;
end;
$$;
revoke all on function public.admin_student_detail(uuid) from public,anon;
grant execute on function public.admin_student_detail(uuid) to authenticated;

-- 7) Kouzelnické šachy student proti studentovi (soukromý kód + Realtime).
create table if not exists public.chess_rooms(
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique,
  white_id uuid not null references public.profiles(id) on delete cascade,
  black_id uuid references public.profiles(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  version integer not null default 0,
  status text not null default 'waiting' check(status in ('waiting','playing','ended','abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists chess_rooms_updated_idx on public.chess_rooms(updated_at desc);
alter table public.chess_rooms enable row level security;
drop policy if exists chess_room_participants_read on public.chess_rooms;
create policy chess_room_participants_read on public.chess_rooms for select to authenticated
using(auth.uid()=white_id or auth.uid()=black_id);
revoke insert,update,delete on public.chess_rooms from anon,authenticated;
grant select on public.chess_rooms to authenticated;

do $$ begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') and not exists(
    select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='chess_rooms'
  ) then
    execute 'alter publication supabase_realtime add table public.chess_rooms';
  end if;
exception when insufficient_privilege then null;
end $$;

create or replace function public.v40_chess_room_json(r public.chess_rooms)
returns jsonb language sql stable security definer set search_path=public as $$
  select to_jsonb(r) || jsonb_build_object(
    'white_name',coalesce((select trim(coalesce(p.first_name,'')||' '||coalesce(p.last_name,'')) from public.profiles p where p.id=r.white_id),'Student'),
    'black_name',coalesce((select trim(coalesce(p.first_name,'')||' '||coalesce(p.last_name,'')) from public.profiles p where p.id=r.black_id),'')
  );
$$;
revoke all on function public.v40_chess_room_json(public.chess_rooms) from public,anon,authenticated;

create or replace function public.v40_create_chess_room(p_state jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); code text; r public.chess_rooms; tries integer:=0;
begin
  if uid is null then raise exception 'Student není přihlášen.'; end if;
  if exists(select 1 from public.profiles where id=uid and banned_at is not null) then raise exception 'Účet je vyloučen ze školy.'; end if;
  update public.chess_rooms set status='abandoned',updated_at=now(),version=version+1 where white_id=uid and status in ('waiting','playing');
  loop
    tries:=tries+1;
    code:=upper(substr(md5(random()::text||clock_timestamp()::text||uid::text),1,6));
    begin
      insert into public.chess_rooms(room_code,white_id,state,status) values(code,uid,coalesce(p_state,'{}'::jsonb),'waiting') returning * into r;
      exit;
    exception when unique_violation then
      if tries>8 then raise; end if;
    end;
  end loop;
  return public.v40_chess_room_json(r);
end;
$$;
revoke all on function public.v40_create_chess_room(jsonb) from public,anon;
grant execute on function public.v40_create_chess_room(jsonb) to authenticated;

create or replace function public.v40_join_chess_room(p_room_code text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); r public.chess_rooms; code text:=upper(trim(coalesce(p_room_code,'')));
begin
  if uid is null then raise exception 'Student není přihlášen.'; end if;
  if exists(select 1 from public.profiles where id=uid and banned_at is not null) then raise exception 'Účet je vyloučen ze školy.'; end if;
  select * into r from public.chess_rooms where room_code=code for update;
  if not found then raise exception 'Místnost s tímto kódem neexistuje.'; end if;
  if r.status<>'waiting' then raise exception 'Tahle partie už není otevřená.'; end if;
  if r.white_id=uid then raise exception 'Nemůžeš se připojit do vlastní místnosti jako soupeř.'; end if;
  update public.chess_rooms set black_id=uid,status='playing',updated_at=now(),version=version+1 where id=r.id returning * into r;
  return public.v40_chess_room_json(r);
end;
$$;
revoke all on function public.v40_join_chess_room(text) from public,anon;
grant execute on function public.v40_join_chess_room(text) to authenticated;

create or replace function public.v40_get_chess_room(p_room_code text)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare uid uuid:=auth.uid(); r public.chess_rooms;
begin
  if uid is null then raise exception 'Student není přihlášen.'; end if;
  select * into r from public.chess_rooms where room_code=upper(trim(coalesce(p_room_code,''))) and (white_id=uid or black_id=uid);
  if not found then raise exception 'Partie nebyla nalezena.'; end if;
  return public.v40_chess_room_json(r);
end;
$$;
revoke all on function public.v40_get_chess_room(text) from public,anon;
grant execute on function public.v40_get_chess_room(text) to authenticated;

create or replace function public.v40_update_chess_room(p_room_code text,p_state jsonb,p_expected_version integer)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); r public.chess_rooms; expected_color text; old_turn text; new_turn text;
begin
  if uid is null then raise exception 'Student není přihlášen.'; end if;
  select * into r from public.chess_rooms where room_code=upper(trim(coalesce(p_room_code,''))) for update;
  if not found or not(uid=r.white_id or uid=r.black_id) then raise exception 'Partie nebyla nalezena.'; end if;
  if r.status not in ('playing','waiting') then raise exception 'Partie už skončila.'; end if;
  if r.version<>p_expected_version then raise exception 'Partie se mezitím změnila.'; end if;
  expected_color:=case when uid=r.white_id then 'w' else 'b' end;
  old_turn:=coalesce(r.state->>'turn','w');
  new_turn:=coalesce(p_state->>'turn','');
  if r.status='playing' and old_turn<>expected_color then raise exception 'Teď není tvůj tah.'; end if;
  if r.status='playing' and new_turn=old_turn and coalesce((p_state->>'ended')::boolean,false)=false then raise exception 'Tah nebyl dokončen.'; end if;
  update public.chess_rooms set state=coalesce(p_state,'{}'::jsonb),version=version+1,updated_at=now(),
    status=case when coalesce((p_state->>'ended')::boolean,false) then 'ended' else status end
  where id=r.id returning * into r;
  return public.v40_chess_room_json(r);
end;
$$;
revoke all on function public.v40_update_chess_room(text,jsonb,integer) from public,anon;
grant execute on function public.v40_update_chess_room(text,jsonb,integer) to authenticated;

create or replace function public.v40_leave_chess_room(p_room_code text)
returns boolean language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); r public.chess_rooms;
begin
  if uid is null then return false; end if;
  select * into r from public.chess_rooms where room_code=upper(trim(coalesce(p_room_code,''))) and (white_id=uid or black_id=uid) for update;
  if not found then return false; end if;
  if r.status='waiting' and r.white_id=uid then delete from public.chess_rooms where id=r.id;
  elsif r.status='playing' then update public.chess_rooms set status='abandoned',version=version+1,updated_at=now() where id=r.id;
  end if;
  return true;
end;
$$;
revoke all on function public.v40_leave_chess_room(text) from public,anon;
grant execute on function public.v40_leave_chess_room(text) to authenticated;

commit;

select 'v40 kompletní migrace připravena: v37 oprava + Hagrid + chat + turnaje + Komnata + body + online šachy.' as status;
