-- BRADAVICE v42.2.2 — SQL HOTFIX PRO EXISTUJÍCÍ INSTALACI v42/v42.1/v42.2
-- Spusť JEDNOU v Supabase SQL Editoru nad stávající databází.
-- Skript nemaže studenty, body ani postup. Je navržen jako opakovatelný.

begin;

-- ============================================================
-- 1) Jádro postupu: odznaky, úkoly, návštěvy a kolejní body
-- ============================================================
-- Tabulky už běžná instalace Bradavic obsahuje. CREATE IF NOT EXISTS je zde
-- pouze jako pojistka pro starší testovací databáze.
create table if not exists public.student_achievements(
  student_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id text not null,
  unlocked_at timestamptz not null default now(),
  primary key(student_id,achievement_id)
);
create table if not exists public.student_quests(
  student_id uuid not null references public.profiles(id) on delete cascade,
  quest_id text not null,
  completed_at timestamptz not null default now(),
  primary key(student_id,quest_id)
);
create table if not exists public.student_location_visits(
  student_id uuid not null references public.profiles(id) on delete cascade,
  location_id text not null,
  first_visited_at timestamptz not null default now(),
  primary key(student_id,location_id)
);

alter table public.student_achievements enable row level security;
alter table public.student_quests enable row level security;
alter table public.student_location_visits enable row level security;

drop policy if exists student_achievements_own_read_v422 on public.student_achievements;
create policy student_achievements_own_read_v422 on public.student_achievements
  for select to authenticated using(auth.uid()=student_id);
drop policy if exists student_quests_own_read_v422 on public.student_quests;
create policy student_quests_own_read_v422 on public.student_quests
  for select to authenticated using(auth.uid()=student_id);
drop policy if exists student_location_visits_own_read_v422 on public.student_location_visits;
create policy student_location_visits_own_read_v422 on public.student_location_visits
  for select to authenticated using(auth.uid()=student_id);

grant select on public.student_achievements,public.student_quests,public.student_location_visits to authenticated;
revoke insert,update,delete on public.student_achievements,public.student_quests,public.student_location_visits from anon,authenticated;

-- Základní odznaky v42.2. Každý z nich přidá při PRVNÍM odemčení +5 bodů.
-- Kompatibilita: starší instalace mohly mít stejné signatury s jinými návratovými typy.
-- PostgreSQL takovou změnu přes CREATE OR REPLACE nepovolí, proto je nejdřív bezpečně odstraníme.
drop function if exists public.unlock_achievement(text);
drop function if exists public.complete_quest(text);
drop function if exists public.visit_location(text);
drop function if exists public.set_house_once(text);
drop function if exists public.get_house_standings();

create or replace function public.unlock_achievement(p_achievement_id text)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
declare
  uid uuid:=auth.uid();
  aid text:=trim(coalesce(p_achievement_id,''));
  inserted integer:=0;
  title text;
  is_core boolean:=false;
begin
  if uid is null then raise exception 'Student není přihlášen.'; end if;
  if aid='' or length(aid)>80 then raise exception 'Neplatný odznak.'; end if;
  if not exists(select 1 from public.profiles p where p.id=uid and p.banned_at is null and not coalesce(p.is_admin,false)) then
    raise exception 'Studentský účet není aktivní.';
  end if;

  title:=case aid
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
    when 'prvni-test' then 'První test'
    when 'bystra-mysl' then 'Bystrá mysl'
    when 'bez-jedine-chyby' then 'Bez jediné chyby'
    when 'pilny-student' then 'Pilný student'
    when 'rocnikova-zkouska' then 'Ročníková zkouška'
    when 's-vyznamenanim' then 'S vyznamenáním'
    when 'opora-koleje' then 'Opora koleje'
    when 'sto-bodu' then 'Sto bodů'
    when 'legenda-koleje' then 'Legenda koleje'
    when 'kolejni-hlas' then 'Kolejní hlas'
    when 'aktivni-student' then 'Aktivní student'
    when 'duchove-bradavic' then 'Duchové Bradavic'
    when 'mistr-vyzev' then 'Mistr výzev'
    when 'bradavicky-znalec' then 'Bradavický znalec'
    else null
  end;
  is_core:=title is not null;

  insert into public.student_achievements(student_id,achievement_id,unlocked_at)
  values(uid,aid,now()) on conflict(student_id,achievement_id) do nothing;
  get diagnostics inserted=row_count;
  if inserted=0 then return false; end if;

  if is_core then
    perform public.add_points_internal(uid,5,'Odznak: '||title,'achievement',aid);
  end if;
  return true;
end;
$$;
revoke all on function public.unlock_achievement(text) from public,anon;
grant execute on function public.unlock_achievement(text) to authenticated;

create or replace function public.complete_quest(p_quest_id text)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
declare uid uuid:=auth.uid(); qid text:=trim(coalesce(p_quest_id,'')); inserted integer:=0;
begin
  if uid is null then raise exception 'Student není přihlášen.'; end if;
  if qid='' or length(qid)>100 then raise exception 'Neplatný úkol.'; end if;
  if not exists(select 1 from public.profiles p where p.id=uid and p.banned_at is null) then raise exception 'Studentský účet není aktivní.'; end if;
  insert into public.student_quests(student_id,quest_id,completed_at) values(uid,qid,now()) on conflict(student_id,quest_id) do nothing;
  get diagnostics inserted=row_count; return inserted>0;
end;
$$;
revoke all on function public.complete_quest(text) from public,anon;
grant execute on function public.complete_quest(text) to authenticated;

create or replace function public.visit_location(p_location_id text)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
declare uid uuid:=auth.uid(); lid text:=trim(coalesce(p_location_id,'')); inserted integer:=0;
begin
  if uid is null then raise exception 'Student není přihlášen.'; end if;
  if lid='' or length(lid)>100 then raise exception 'Neplatná lokace.'; end if;
  if not exists(select 1 from public.profiles p where p.id=uid and p.banned_at is null) then raise exception 'Studentský účet není aktivní.'; end if;
  insert into public.student_location_visits(student_id,location_id,first_visited_at) values(uid,lid,now()) on conflict(student_id,location_id) do nothing;
  get diagnostics inserted=row_count; return inserted>0;
end;
$$;
revoke all on function public.visit_location(text) from public,anon;
grant execute on function public.visit_location(text) to authenticated;

create or replace function public.set_house_once(p_house_code text)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
declare uid uuid:=auth.uid(); code text:=upper(trim(coalesce(p_house_code,''))); changed integer:=0;
begin
  if uid is null then raise exception 'Student není přihlášen.'; end if;
  if code not in ('N','H','M','Z') then raise exception 'Neplatná kolej.'; end if;
  update public.profiles set house_code=code,updated_at=now()
  where id=uid and house_code is null and banned_at is null and not coalesce(is_admin,false);
  get diagnostics changed=row_count; return changed>0;
end;
$$;
revoke all on function public.set_house_once(text) from public,anon;
grant execute on function public.set_house_once(text) to authenticated;

create or replace function public.get_house_standings()
returns table(house_code text,total_points bigint)
language sql
stable
security definer
set search_path=public
as $$
  with houses(code) as (values ('N'::text),('H'::text),('M'::text),('Z'::text))
  select h.code,
         coalesce(sum(case when p.banned_at is null and not coalesce(p.is_admin,false) then p.personal_points else 0 end),0)::bigint
  from houses h left join public.profiles p on p.house_code=h.code
  group by h.code
  order by case h.code when 'N' then 1 when 'H' then 2 when 'M' then 3 else 4 end;
$$;
revoke all on function public.get_house_standings() from public,anon;
grant execute on function public.get_house_standings() to authenticated;

-- ============================================================
-- 2) ONLINE ŠACHY — znovu vytvořené RPC + Realtime pojistka
-- ============================================================
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

-- Kompatibilita RPC šachů: odstraníme starší varianty funkcí před novou definicí.
drop function if exists public.v40_leave_chess_room(text);
drop function if exists public.v40_update_chess_room(text,jsonb,integer);
drop function if exists public.v40_get_chess_room(text);
drop function if exists public.v40_join_chess_room(text);
drop function if exists public.v40_create_chess_room(jsonb);
drop function if exists public.v40_chess_room_json(public.chess_rooms);

do $$ begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') and not exists(
    select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='chess_rooms'
  ) then execute 'alter publication supabase_realtime add table public.chess_rooms'; end if;
exception when insufficient_privilege then null;
end $$;

create or replace function public.v40_chess_room_json(r public.chess_rooms)
returns jsonb language sql stable security definer set search_path=public as $$
  select to_jsonb(r) || jsonb_build_object(
    'white_name',coalesce((select nullif(trim(coalesce(p.first_name,'')||' '||coalesce(p.last_name,'')),'') from public.profiles p where p.id=r.white_id),'Student'),
    'black_name',coalesce((select nullif(trim(coalesce(p.first_name,'')||' '||coalesce(p.last_name,'')),'') from public.profiles p where p.id=r.black_id),'')
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
    tries:=tries+1; code:=upper(substr(md5(random()::text||clock_timestamp()::text||uid::text),1,6));
    begin
      insert into public.chess_rooms(room_code,white_id,state,status) values(code,uid,coalesce(p_state,'{}'::jsonb),'waiting') returning * into r; exit;
    exception when unique_violation then if tries>8 then raise; end if; end;
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
  if r.status<>'playing' then raise exception 'Partie není rozehraná.'; end if;
  if r.version<>coalesce(p_expected_version,-1) then raise exception 'Partie se mezitím změnila.'; end if;
  expected_color:=case when uid=r.white_id then 'w' else 'b' end;
  old_turn:=coalesce(r.state->>'turn','w'); new_turn:=coalesce(p_state->>'turn','');
  if old_turn<>expected_color then raise exception 'Teď není tvůj tah.'; end if;
  if new_turn=old_turn and coalesce((p_state->>'ended')::boolean,false)=false then raise exception 'Tah nebyl dokončen.'; end if;
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

-- ============================================================
-- 3) ONLINE PEXESO — soukromé místnosti pro dva studenty
-- ============================================================
create table if not exists public.memory_rooms(
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique,
  host_id uuid not null references public.profiles(id) on delete cascade,
  guest_id uuid references public.profiles(id) on delete cascade,
  pair_count integer not null default 20 check(pair_count in (12,20,32)),
  state jsonb not null default '{}'::jsonb,
  version integer not null default 0,
  status text not null default 'waiting' check(status in ('waiting','playing','ended','abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists memory_rooms_updated_idx on public.memory_rooms(updated_at desc);
alter table public.memory_rooms enable row level security;
drop policy if exists memory_room_participants_read on public.memory_rooms;
create policy memory_room_participants_read on public.memory_rooms for select to authenticated
using(auth.uid()=host_id or auth.uid()=guest_id);
revoke insert,update,delete on public.memory_rooms from anon,authenticated;
grant select on public.memory_rooms to authenticated;

-- Kompatibilita RPC pexesa: odstraníme starší varianty funkcí před novou definicí.
drop function if exists public.v422_leave_memory_room(text);
drop function if exists public.v422_update_memory_room(text,jsonb,integer);
drop function if exists public.v422_get_memory_room(text);
drop function if exists public.v422_join_memory_room(text);
drop function if exists public.v422_create_memory_room(integer,jsonb);
drop function if exists public.v422_memory_room_json(public.memory_rooms);

do $$ begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') and not exists(
    select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='memory_rooms'
  ) then execute 'alter publication supabase_realtime add table public.memory_rooms'; end if;
exception when insufficient_privilege then null;
end $$;

create or replace function public.v422_memory_room_json(r public.memory_rooms)
returns jsonb language sql stable security definer set search_path=public as $$
  select to_jsonb(r) || jsonb_build_object(
    'host_name',coalesce((select nullif(trim(coalesce(p.first_name,'')||' '||coalesce(p.last_name,'')),'') from public.profiles p where p.id=r.host_id),'Hráč 1'),
    'guest_name',coalesce((select nullif(trim(coalesce(p.first_name,'')||' '||coalesce(p.last_name,'')),'') from public.profiles p where p.id=r.guest_id),'')
  );
$$;
revoke all on function public.v422_memory_room_json(public.memory_rooms) from public,anon,authenticated;

create or replace function public.v422_create_memory_room(p_pair_count integer,p_state jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); code text; r public.memory_rooms; tries integer:=0; pairs integer:=coalesce(p_pair_count,20);
begin
  if uid is null then raise exception 'Student není přihlášen.'; end if;
  if pairs not in (12,20,32) then raise exception 'Neplatná velikost pexesa.'; end if;
  if exists(select 1 from public.profiles where id=uid and banned_at is not null) then raise exception 'Účet je vyloučen ze školy.'; end if;
  if jsonb_typeof(coalesce(p_state,'{}'::jsonb)->'deck')<>'array' or jsonb_array_length(coalesce(p_state,'{}'::jsonb)->'deck')<>pairs*2 then raise exception 'Neplatný balíček pexesa.'; end if;
  update public.memory_rooms set status='abandoned',updated_at=now(),version=version+1 where host_id=uid and status in ('waiting','playing');
  loop
    tries:=tries+1; code:=upper(substr(md5(random()::text||clock_timestamp()::text||uid::text),1,6));
    begin
      insert into public.memory_rooms(room_code,host_id,pair_count,state,status)
      values(code,uid,pairs,coalesce(p_state,'{}'::jsonb),'waiting') returning * into r; exit;
    exception when unique_violation then if tries>8 then raise; end if; end;
  end loop;
  return public.v422_memory_room_json(r);
end;
$$;
revoke all on function public.v422_create_memory_room(integer,jsonb) from public,anon;
grant execute on function public.v422_create_memory_room(integer,jsonb) to authenticated;

create or replace function public.v422_join_memory_room(p_room_code text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); r public.memory_rooms; code text:=upper(trim(coalesce(p_room_code,'')));
begin
  if uid is null then raise exception 'Student není přihlášen.'; end if;
  if exists(select 1 from public.profiles where id=uid and banned_at is not null) then raise exception 'Účet je vyloučen ze školy.'; end if;
  select * into r from public.memory_rooms where room_code=code for update;
  if not found then raise exception 'Místnost s tímto kódem neexistuje.'; end if;
  if r.status<>'waiting' then raise exception 'Tahle partie už není otevřená.'; end if;
  if r.host_id=uid then raise exception 'Nemůžeš se připojit do vlastní místnosti jako soupeř.'; end if;
  update public.memory_rooms set guest_id=uid,status='playing',updated_at=now(),version=version+1 where id=r.id returning * into r;
  return public.v422_memory_room_json(r);
end;
$$;
revoke all on function public.v422_join_memory_room(text) from public,anon;
grant execute on function public.v422_join_memory_room(text) to authenticated;

create or replace function public.v422_get_memory_room(p_room_code text)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare uid uuid:=auth.uid(); r public.memory_rooms;
begin
  if uid is null then raise exception 'Student není přihlášen.'; end if;
  select * into r from public.memory_rooms where room_code=upper(trim(coalesce(p_room_code,''))) and (host_id=uid or guest_id=uid);
  if not found then raise exception 'Partie nebyla nalezena.'; end if;
  return public.v422_memory_room_json(r);
end;
$$;
revoke all on function public.v422_get_memory_room(text) from public,anon;
grant execute on function public.v422_get_memory_room(text) to authenticated;

create or replace function public.v422_update_memory_room(p_room_code text,p_state jsonb,p_expected_version integer)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  uid uuid:=auth.uid(); r public.memory_rooms; expected_player integer; old_player integer; new_player integer;
  old_moves integer; new_moves integer; new_matches integer;
begin
  if uid is null then raise exception 'Student není přihlášen.'; end if;
  select * into r from public.memory_rooms where room_code=upper(trim(coalesce(p_room_code,''))) for update;
  if not found or not(uid=r.host_id or uid=r.guest_id) then raise exception 'Partie nebyla nalezena.'; end if;
  if r.status<>'playing' then raise exception 'Partie není rozehraná.'; end if;
  if r.version<>coalesce(p_expected_version,-1) then raise exception 'Partie se mezitím změnila.'; end if;
  if jsonb_typeof(coalesce(p_state,'{}'::jsonb)->'deck')<>'array' or jsonb_array_length(coalesce(p_state,'{}'::jsonb)->'deck')<>r.pair_count*2 then raise exception 'Neplatný stav pexesa.'; end if;
  -- Balíček určuje host při vytvoření partie a během hry se už nesmí změnit.
  if p_state->'deck' <> r.state->'deck' then raise exception 'Balíček pexesa nelze během partie měnit.'; end if;

  expected_player:=case when uid=r.host_id then 1 else 2 end;
  old_player:=greatest(1,least(2,coalesce((r.state->>'current')::integer,1)));
  new_player:=greatest(1,least(2,coalesce((p_state->>'current')::integer,old_player)));
  old_moves:=greatest(0,coalesce((r.state->>'moves')::integer,0));
  new_moves:=greatest(0,coalesce((p_state->>'moves')::integer,0));
  new_matches:=greatest(0,coalesce((p_state->>'matches')::integer,0));
  if old_player<>expected_player then raise exception 'Teď není tvůj tah.'; end if;
  if new_moves<>old_moves+1 then raise exception 'Neplatný počet tahů.'; end if;
  if new_matches>r.pair_count then raise exception 'Neplatný počet dvojic.'; end if;
  -- Při shodě hráč pokračuje; při neshodě se tah přepne. Obě varianty jsou legitimní.
  if new_player not in (1,2) then raise exception 'Neplatný hráč na tahu.'; end if;

  update public.memory_rooms set state=coalesce(p_state,'{}'::jsonb),version=version+1,updated_at=now(),
    status=case when new_matches>=r.pair_count then 'ended' else status end
  where id=r.id returning * into r;
  return public.v422_memory_room_json(r);
end;
$$;
revoke all on function public.v422_update_memory_room(text,jsonb,integer) from public,anon;
grant execute on function public.v422_update_memory_room(text,jsonb,integer) to authenticated;

create or replace function public.v422_leave_memory_room(p_room_code text)
returns boolean language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); r public.memory_rooms;
begin
  if uid is null then return false; end if;
  select * into r from public.memory_rooms where room_code=upper(trim(coalesce(p_room_code,''))) and (host_id=uid or guest_id=uid) for update;
  if not found then return false; end if;
  if r.status='waiting' and r.host_id=uid then delete from public.memory_rooms where id=r.id;
  elsif r.status='playing' then update public.memory_rooms set status='abandoned',version=version+1,updated_at=now() where id=r.id;
  end if;
  return true;
end;
$$;
revoke all on function public.v422_leave_memory_room(text) from public,anon;
grant execute on function public.v422_leave_memory_room(text) to authenticated;

commit;
select 'Bradavice v42.2.2 — databázové opravy připraveny.' as status;
