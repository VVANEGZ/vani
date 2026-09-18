begin;
-- One private workspace per authenticated account. Optimistic revisions prevent
-- a stale device from silently replacing another device's changes.
create table if not exists public.vani_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  materias jsonb not null check (jsonb_typeof(materias) = 'array'),
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);
alter table public.vani_workspaces enable row level security;
revoke all on public.vani_workspaces from anon;
grant select, insert, update on public.vani_workspaces to authenticated;
create policy vani_read_own on public.vani_workspaces for select to authenticated
  using ((select auth.uid()) = user_id);
create policy vani_insert_own on public.vani_workspaces for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy vani_update_own on public.vani_workspaces for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.save_vani_workspace(p_materias jsonb, p_revision bigint, p_user_id uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare saved public.vani_workspaces;
begin
  if auth.uid() is null or auth.uid() is distinct from p_user_id then raise exception 'Authentication required'; end if;
  if jsonb_typeof(p_materias) is distinct from 'array' then
    raise exception 'Expected subjects array';
  end if;
  if p_revision = 0 then
    insert into public.vani_workspaces(user_id, materias)
    values (auth.uid(), p_materias)
    on conflict (user_id) do nothing returning * into saved;
  else
    update public.vani_workspaces
    set materias = p_materias, revision = revision + 1, updated_at = now()
    where user_id = auth.uid() and revision = p_revision
    returning * into saved;
  end if;
  if saved.user_id is null then return null; end if;
  return to_jsonb(saved);
end;
$$;
revoke all on function public.save_vani_workspace(jsonb, bigint, uuid) from public, anon;
grant execute on function public.save_vani_workspace(jsonb, bigint, uuid) to authenticated;

commit;
