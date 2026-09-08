-- BRADAVICE v43.3 — databázová aktualizace
-- Obsahuje:
-- 1) trvalé odečítání bodů profesorem lektvarů,
-- 2) administrátorské smazání studenta (zahrnuto z v43, aby stačil tento jeden update).
-- Bezpečné pro existující instalaci: staré signatury se nejdřív odstraní.

begin;

-- ============================================================
-- SNAPE: trest za zkažený lektvar (-5 až -50 bodů)
-- ============================================================
drop function if exists public.v41_snape_penalty();
create function public.v41_snape_penalty()
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare
  uid uuid:=auth.uid();
  r double precision:=random();
  pts integer;
begin
  if uid is null then raise exception 'Student není přihlášen.'; end if;
  if exists(select 1 from public.profiles where id=uid and banned_at is not null) then
    raise exception 'Účet je vyloučen ze školy.';
  end if;

  pts:=case
    when r < .28 then 5
    when r < .50 then 10
    when r < .66 then 15
    when r < .77 then 20
    when r < .85 then 25
    when r < .91 then 30
    when r < .95 then 35
    when r < .975 then 40
    when r < .99 then 45
    else 50
  end;

  perform public.add_points_internal(
    uid,
    -pts,
    'Profesor lektvarů – zkažený lektvar',
    'v43.3',
    'snape-penalty'
  );
  return -pts;
end;
$$;
revoke all on function public.v41_snape_penalty() from public,anon;
grant execute on function public.v41_snape_penalty() to authenticated;

-- ============================================================
-- ADMIN: trvalé smazání studenta
-- ============================================================
drop function if exists public.admin_delete_student(uuid);
create function public.admin_delete_student(p_student_id uuid)
returns boolean
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  aid uuid:=auth.uid();
  target_admin boolean:=false;
  found_target boolean:=false;
  removed integer:=0;
begin
  if aid is null or not public.is_admin_user() then
    raise exception 'Administrátorský přístup byl zamítnut.';
  end if;
  if p_student_id is null then raise exception 'Chybí student.'; end if;
  if p_student_id=aid then raise exception 'Nelze smazat vlastní administrátorský účet.'; end if;

  select true,coalesce(is_admin,false) into found_target,target_admin
  from public.profiles where id=p_student_id;

  if not coalesce(found_target,false) then return false; end if;
  if target_admin then raise exception 'Administrátorský účet nelze smazat touto funkcí.'; end if;

  delete from public.profiles where id=p_student_id;
  get diagnostics removed=row_count;
  if removed=0 then return false; end if;

  delete from auth.users where id=p_student_id;
  return true;
end;
$$;
revoke all on function public.admin_delete_student(uuid) from public,anon;
grant execute on function public.admin_delete_student(uuid) to authenticated;

commit;
select 'Bradavice v43.3 — databázová aktualizace připravena.' as status;
