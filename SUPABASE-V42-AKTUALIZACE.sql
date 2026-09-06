-- BRADAVICE v42 — AKTUALIZACE PRO ONLINE TESTOVÁNÍ
-- Spusť v Supabase SQL Editoru NAD již nainstalovanou databází v41.
-- Přidává jednorázové serverové odměny nových úkolů v42 a realtime školní/kolejní chat.

begin;

-- ============================================================
-- 1) Jednorázové odměny nových praktických úkolů v42
-- ============================================================
create table if not exists public.student_v42_rewards(
  student_id uuid not null references public.profiles(id) on delete cascade,
  activity_key text not null,
  score integer not null default 0,
  points integer not null default 0,
  claimed_at timestamptz not null default now(),
  primary key(student_id,activity_key)
);

alter table public.student_v42_rewards enable row level security;
drop policy if exists student_v42_rewards_own_read on public.student_v42_rewards;
create policy student_v42_rewards_own_read
  on public.student_v42_rewards
  for select to authenticated
  using(auth.uid()=student_id);
revoke insert,update,delete on public.student_v42_rewards from anon,authenticated;
grant select on public.student_v42_rewards to authenticated;

create or replace function public.v42_claim_activity(p_activity_key text,p_score integer default 0)
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare
  uid uuid:=auth.uid();
  pts integer:=0;
  label text:='';
  affected integer:=0;
  s integer:=greatest(coalesce(p_score,0),0);
begin
  if uid is null then raise exception 'Student není přihlášen.'; end if;
  if not exists(select 1 from public.profiles p where p.id=uid and p.banned_at is null) then
    raise exception 'Studentský účet není aktivní.';
  end if;

  case p_activity_key
    when 'mcgonagall-feather' then
      pts:=10;
      label:='Profesorka McGonagallová – Lehké jako pírko';
    when 'lupin-boggart' then
      pts:=20;
      label:='Profesor Lupin – praktická zkouška s bubákem';
    when 'herbarium-prytova' then
      if s>=15 then pts:=50;
      elsif s>=10 then pts:=20;
      elsif s>=5 then pts:=5;
      else return 0;
      end if;
      label:='Profesorka Prýtová – herbář a mandragory';
    else
      raise exception 'Neznámá aktivita v42.';
  end case;

  insert into public.student_v42_rewards(student_id,activity_key,score,points)
  values(uid,p_activity_key,s,pts)
  on conflict(student_id,activity_key) do nothing;
  get diagnostics affected=row_count;

  if affected=0 then return 0; end if;

  perform public.add_points_internal(uid,pts,label,'v42',p_activity_key);
  insert into public.student_quests(student_id,quest_id,completed_at)
  values(uid,p_activity_key,now())
  on conflict do nothing;

  return pts;
end;
$$;
revoke all on function public.v42_claim_activity(text,integer) from public,anon;
grant execute on function public.v42_claim_activity(text,integer) to authenticated;

-- ============================================================
-- 2) Realtime chat pro testování ve dvou
-- ============================================================
-- Klient stále načítá zprávy přes bezpečnou RPC funkci. Realtime pouze oznámí,
-- že přibyla nová zpráva; obsah se znovu načte podle oprávnění uživatele.
drop policy if exists chat_messages_v42_realtime_read on public.chat_messages;
create policy chat_messages_v42_realtime_read
  on public.chat_messages
  for select to authenticated
  using(
    exists(select 1 from public.profiles me where me.id=auth.uid() and me.banned_at is null)
    and (
      scope='school'
      or (scope='house' and house_code=(select me2.house_code from public.profiles me2 where me2.id=auth.uid()))
    )
  );
grant select on public.chat_messages to authenticated;

do $$ begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') and not exists(
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='chat_messages'
  ) then
    execute 'alter publication supabase_realtime add table public.chat_messages';
  end if;
exception when insufficient_privilege then null;
end $$;

commit;
