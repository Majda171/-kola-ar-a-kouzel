-- BRADAVICE v43.6.6 — Tchoříčky online pro dva studenty
-- Spusť jednou v Supabase SQL Editoru.
begin;

create table if not exists public.tchoricky_rooms(
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique,
  host_id uuid not null references public.profiles(id) on delete cascade,
  guest_id uuid references public.profiles(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  version integer not null default 0,
  status text not null default 'waiting' check(status in ('waiting','playing','ended','abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tchoricky_rooms_updated_idx on public.tchoricky_rooms(updated_at desc);
alter table public.tchoricky_rooms enable row level security;
drop policy if exists tchoricky_room_participants_read on public.tchoricky_rooms;
create policy tchoricky_room_participants_read on public.tchoricky_rooms for select to authenticated
using(auth.uid()=host_id or auth.uid()=guest_id);
revoke insert,update,delete on public.tchoricky_rooms from anon,authenticated;
grant select on public.tchoricky_rooms to authenticated;

drop function if exists public.v4366_leave_tchoricky_room(text);
drop function if exists public.v4366_update_tchoricky_room(text,jsonb,integer);
drop function if exists public.v4366_get_tchoricky_room(text);
drop function if exists public.v4366_join_tchoricky_room(text);
drop function if exists public.v4366_create_tchoricky_room(jsonb);
drop function if exists public.v4366_tchoricky_room_json(public.tchoricky_rooms);

create or replace function public.v4366_tchoricky_room_json(r public.tchoricky_rooms)
returns jsonb language sql stable security definer set search_path=public as $$
  select to_jsonb(r) || jsonb_build_object(
    'host_name',coalesce((select nullif(trim(coalesce(p.first_name,'')||' '||coalesce(p.last_name,'')),'') from public.profiles p where p.id=r.host_id),'Student'),
    'guest_name',coalesce((select nullif(trim(coalesce(p.first_name,'')||' '||coalesce(p.last_name,'')),'') from public.profiles p where p.id=r.guest_id),'')
  );
$$;
revoke all on function public.v4366_tchoricky_room_json(public.tchoricky_rooms) from public,anon,authenticated;

create or replace function public.v4366_create_tchoricky_room(p_state jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); code text; r public.tchoricky_rooms; tries integer:=0;
begin
  if uid is null then raise exception 'Student není přihlášen.'; end if;
  if exists(select 1 from public.profiles where id=uid and banned_at is not null) then raise exception 'Účet je vyloučen ze školy.'; end if;
  update public.tchoricky_rooms set status='abandoned',updated_at=now(),version=version+1 where host_id=uid and status in ('waiting','playing');
  loop
    tries:=tries+1; code:=upper(substr(md5(random()::text||clock_timestamp()::text||uid::text),1,6));
    begin
      insert into public.tchoricky_rooms(room_code,host_id,state,status)
      values(code,uid,coalesce(p_state,'{}'::jsonb),'waiting') returning * into r; exit;
    exception when unique_violation then if tries>8 then raise; end if; end;
  end loop;
  return public.v4366_tchoricky_room_json(r);
end; $$;
revoke all on function public.v4366_create_tchoricky_room(jsonb) from public,anon;
grant execute on function public.v4366_create_tchoricky_room(jsonb) to authenticated;

create or replace function public.v4366_join_tchoricky_room(p_room_code text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); r public.tchoricky_rooms; code text:=upper(trim(coalesce(p_room_code,'')));
begin
  if uid is null then raise exception 'Student není přihlášen.'; end if;
  if exists(select 1 from public.profiles where id=uid and banned_at is not null) then raise exception 'Účet je vyloučen ze školy.'; end if;
  select * into r from public.tchoricky_rooms where room_code=code for update;
  if not found then raise exception 'Partie s tímto kódem neexistuje.'; end if;
  if r.status<>'waiting' then raise exception 'Tahle partie už není otevřená.'; end if;
  if r.host_id=uid then raise exception 'Nemůžeš se připojit do vlastní partie jako soupeř.'; end if;
  update public.tchoricky_rooms set guest_id=uid,status='playing',updated_at=now(),version=version+1 where id=r.id returning * into r;
  return public.v4366_tchoricky_room_json(r);
end; $$;
revoke all on function public.v4366_join_tchoricky_room(text) from public,anon;
grant execute on function public.v4366_join_tchoricky_room(text) to authenticated;

create or replace function public.v4366_get_tchoricky_room(p_room_code text)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare uid uuid:=auth.uid(); r public.tchoricky_rooms;
begin
  if uid is null then raise exception 'Student není přihlášen.'; end if;
  select * into r from public.tchoricky_rooms where room_code=upper(trim(coalesce(p_room_code,''))) and (host_id=uid or guest_id=uid);
  if not found then raise exception 'Partie nebyla nalezena.'; end if;
  return public.v4366_tchoricky_room_json(r);
end; $$;
revoke all on function public.v4366_get_tchoricky_room(text) from public,anon;
grant execute on function public.v4366_get_tchoricky_room(text) to authenticated;

create or replace function public.v4366_update_tchoricky_room(p_room_code text,p_state jsonb,p_expected_version integer)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); r public.tchoricky_rooms; role text; old_turn text; new_turn text;
begin
  if uid is null then raise exception 'Student není přihlášen.'; end if;
  select * into r from public.tchoricky_rooms where room_code=upper(trim(coalesce(p_room_code,''))) for update;
  if not found or not(uid=r.host_id or uid=r.guest_id) then raise exception 'Partie nebyla nalezena.'; end if;
  if r.status<>'playing' then raise exception 'Partie není rozehraná.'; end if;
  if r.version<>coalesce(p_expected_version,-1) then raise exception 'Partie se mezitím změnila.'; end if;
  role:=case when uid=r.host_id then 'host' else 'guest' end;
  old_turn:=coalesce(r.state->>'turn','host');new_turn:=coalesce(p_state->>'turn','');
  if old_turn<>role then raise exception 'Teď není tvůj tah.'; end if;
  if new_turn=old_turn and coalesce((p_state->>'ended')::boolean,false)=false then raise exception 'Tah nebyl dokončen.'; end if;
  update public.tchoricky_rooms set state=coalesce(p_state,'{}'::jsonb),version=version+1,updated_at=now(),
    status=case when coalesce((p_state->>'ended')::boolean,false) then 'ended' else status end
  where id=r.id returning * into r;
  return public.v4366_tchoricky_room_json(r);
end; $$;
revoke all on function public.v4366_update_tchoricky_room(text,jsonb,integer) from public,anon;
grant execute on function public.v4366_update_tchoricky_room(text,jsonb,integer) to authenticated;

create or replace function public.v4366_leave_tchoricky_room(p_room_code text)
returns boolean language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); r public.tchoricky_rooms;
begin
  if uid is null then return false; end if;
  select * into r from public.tchoricky_rooms where room_code=upper(trim(coalesce(p_room_code,''))) and (host_id=uid or guest_id=uid) for update;
  if not found then return false; end if;
  if r.status='waiting' and r.host_id=uid then delete from public.tchoricky_rooms where id=r.id;
  elsif r.status='playing' then update public.tchoricky_rooms set status='abandoned',version=version+1,updated_at=now() where id=r.id;
  end if;
  return true;
end; $$;
revoke all on function public.v4366_leave_tchoricky_room(text) from public,anon;
grant execute on function public.v4366_leave_tchoricky_room(text) to authenticated;

commit;
