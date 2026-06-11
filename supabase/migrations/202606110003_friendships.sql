begin;

do $$
begin
  if to_regclass('public.profiles') is null then
    raise exception 'public.profiles must exist before applying the friendships migration';
  end if;

  if to_regprocedure('public.set_updated_at()') is null then
    raise exception 'public.set_updated_at() must exist before applying the friendships migration';
  end if;
end $$;

drop policy if exists profiles_select_authenticated on public.profiles;

-- Keep direct profile table reads scoped by the existing profiles_select_own RLS
-- policy. Username lookup goes through an exact-match RPC instead of allowing
-- authenticated users to enumerate the full profiles table.
revoke select on table public.profiles from authenticated;
grant select (id, username, nickname, created_at, updated_at)
  on table public.profiles to authenticated;

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

drop function if exists public.lookup_profile_by_username(text);
drop function if exists private.lookup_profile_by_username(text);

create function private.lookup_profile_by_username(p_username text)
returns table (
  id uuid,
  username text,
  nickname text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    profiles.id,
    profiles.username,
    profiles.nickname
  from public.profiles
  where lower(btrim(p_username)) ~ '^[a-z0-9_]{3,24}$'
    and profiles.username = lower(btrim(p_username))
  limit 1;
$$;

revoke all on function private.lookup_profile_by_username(text) from public;
revoke all on function private.lookup_profile_by_username(text) from anon;
revoke all on function private.lookup_profile_by_username(text) from authenticated;
grant usage on schema private to authenticated;
grant execute on function private.lookup_profile_by_username(text) to authenticated;

create function public.lookup_profile_by_username(p_username text)
returns table (
  id uuid,
  username text,
  nickname text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    found_profile.id,
    found_profile.username,
    found_profile.nickname
  from private.lookup_profile_by_username(p_username) as found_profile;
$$;

revoke all on function public.lookup_profile_by_username(text) from public;
revoke all on function public.lookup_profile_by_username(text) from anon;
revoke all on function public.lookup_profile_by_username(text) from authenticated;
grant execute on function public.lookup_profile_by_username(text) to authenticated;

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null default (auth.uid()) references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint friendships_no_self_check check (requester_id <> addressee_id),
  constraint friendships_status_check check (status in ('pending', 'accepted'))
);

create unique index friendships_pair_unique_idx
  on public.friendships (
    least(requester_id, addressee_id),
    greatest(requester_id, addressee_id)
  );

create index friendships_requester_id_idx
  on public.friendships (requester_id);

create index friendships_addressee_id_idx
  on public.friendships (addressee_id);

create index friendships_status_idx
  on public.friendships (status);

create trigger friendships_set_updated_at
  before update on public.friendships
  for each row
  execute function public.set_updated_at();

alter table public.friendships enable row level security;

revoke all on table public.friendships from public;
revoke all on table public.friendships from anon;
revoke all on table public.friendships from authenticated;

grant select, delete on table public.friendships to authenticated;
grant insert (addressee_id) on table public.friendships to authenticated;
grant update (status) on table public.friendships to authenticated;

create policy friendships_select_involved
  on public.friendships
  for select
  to authenticated
  using (
    requester_id = (select auth.uid())
    or addressee_id = (select auth.uid())
  );

create policy friendships_insert_as_requester
  on public.friendships
  for insert
  to authenticated
  with check (
    requester_id = (select auth.uid())
    and addressee_id <> (select auth.uid())
    and status = 'pending'
  );

create policy friendships_accept_pending_incoming
  on public.friendships
  for update
  to authenticated
  using (
    addressee_id = (select auth.uid())
    and status = 'pending'
  )
  with check (
    addressee_id = (select auth.uid())
    and status = 'accepted'
  );

create policy friendships_delete_involved
  on public.friendships
  for delete
  to authenticated
  using (
    requester_id = (select auth.uid())
    or addressee_id = (select auth.uid())
  );

notify pgrst, 'reload schema';

commit;
