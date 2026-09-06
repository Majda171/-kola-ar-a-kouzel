-- Spusť jednou v Supabase SQL Editoru, aby se denní kolejní výzva ukládala globálně.

begin;

create table if not exists public.student_daily_challenges (
  student_id uuid not null references public.profiles(id) on delete cascade,
  challenge_date date not null default current_date,
  completed_at timestamptz not null default now(),
  primary key (student_id, challenge_date)
);

alter table public.student_daily_challenges enable row level security;

drop policy if exists own_daily_challenges_read on public.student_daily_challenges;
create policy own_daily_challenges_read
on public.student_daily_challenges
for select
to authenticated
using (student_id = auth.uid());

grant select on public.student_daily_challenges to authenticated;

create or replace function public.claim_daily_challenge()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  inserted_rows integer;
  h text;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'Student není přihlášen.';
  end if;

  select house_code into h from public.profiles where id = uid;
  if h is null then
    raise exception 'Student ještě není rozřazen do koleje.';
  end if;

  insert into public.student_daily_challenges(student_id, challenge_date)
  values(uid, current_date)
  on conflict do nothing;

  get diagnostics inserted_rows = row_count;
  if inserted_rows = 0 then return false; end if;

  perform public.add_points_internal(
    uid, 5, 'Denní kolejní výzva', 'daily_challenge', current_date::text
  );

  return true;
end;
$$;

grant execute on function public.claim_daily_challenge() to authenticated;

commit;

select 'Denní kolejní výzva je napojena na databázi.' as status;
