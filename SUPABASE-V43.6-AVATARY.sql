-- BRADAVICE v43.6 — rozšíření kolejních avatarů na 10 pro každou kolej
begin;
create or replace function public.update_own_profile(p_bio text, p_avatar_key text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare uid uuid := auth.uid(); h text;
begin
  if uid is null then raise exception 'Student není přihlášen.'; end if;
  select house_code into h from public.profiles where id=uid;
  if h is null then raise exception 'Profilový obrázek lze vybrat až po rozřazení.'; end if;
  if not (
    (h='N' and p_avatar_key in ('n1','n2','n3','n4','n5','n6','n7','n8','n9','n10')) or
    (h='H' and p_avatar_key in ('h1','h2','h3','h4','h5','h6','h7','h8','h9','h10')) or
    (h='M' and p_avatar_key in ('m1','m2','m3','m4','m5','m6','m7','m8','m9','m10')) or
    (h='Z' and p_avatar_key in ('z1','z2','z3','z4','z5','z6','z7','z8','z9','z10'))
  ) then raise exception 'Vybraný portrét nepatří do studentovy koleje.'; end if;
  update public.profiles set bio=left(coalesce(trim(p_bio),''),500),avatar_key=p_avatar_key,updated_at=now() where id=uid;
  return found;
end; $$;
revoke all on function public.update_own_profile(text,text) from public, anon;
grant execute on function public.update_own_profile(text,text) to authenticated;
commit;
