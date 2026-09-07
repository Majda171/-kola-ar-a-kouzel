-- BRADAVICE v43 — aktualizace databáze
-- Spusť jednou po nasazení v43. Nemění stávající studenty ani jejich postup.

begin;

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

  -- Nejdřív odstraníme profil. Navázané studentské tabulky mají ON DELETE CASCADE.
  -- Teprve potom smažeme Auth účet; kdyby druhý krok selhal, celá transakce RPC se vrátí zpět.
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
select 'Bradavice v43 — databázová aktualizace připravena.' as status;
