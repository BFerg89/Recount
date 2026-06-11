begin;

-- Run this after SupabaseMisc/supabase_migration_friendships.sql.
-- The app calls public.list_friendships() through supabase.rpc('list_friendships').
-- The private function can join profiles, but it only returns friendship rows
-- involving the signed-in user.

do $$
begin
  if to_regclass('public.profiles') is null then
    raise exception 'public.profiles must exist before applying list_friendships RPC';
  end if;

  if to_regclass('public.friendships') is null then
    raise exception 'public.friendships must exist before applying list_friendships RPC';
  end if;
end $$;

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

drop function if exists public.list_friendships();
drop function if exists private.list_friendships();

create function private.list_friendships()
returns table (
  friendship_id uuid,
  status text,
  direction text,
  other_profile_id uuid,
  other_username text,
  other_nickname text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    friendships.id as friendship_id,
    friendships.status,
    case
      when friendships.requester_id = (select auth.uid()) then 'outgoing'
      else 'incoming'
    end as direction,
    other_profile.id as other_profile_id,
    other_profile.username as other_username,
    other_profile.nickname as other_nickname,
    friendships.created_at,
    friendships.updated_at
  from public.friendships
  join public.profiles as other_profile
    on other_profile.id = case
      when friendships.requester_id = (select auth.uid()) then friendships.addressee_id
      else friendships.requester_id
    end
  where (select auth.uid()) is not null
    and (
      friendships.requester_id = (select auth.uid())
      or friendships.addressee_id = (select auth.uid())
    )
  order by
    case when friendships.status = 'pending' then 0 else 1 end,
    friendships.updated_at desc;
$$;

revoke all on function private.list_friendships() from public;
revoke all on function private.list_friendships() from anon;
revoke all on function private.list_friendships() from authenticated;
grant usage on schema private to authenticated;
grant execute on function private.list_friendships() to authenticated;

create function public.list_friendships()
returns table (
  friendship_id uuid,
  status text,
  direction text,
  other_profile_id uuid,
  other_username text,
  other_nickname text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    friendship_rows.friendship_id,
    friendship_rows.status,
    friendship_rows.direction,
    friendship_rows.other_profile_id,
    friendship_rows.other_username,
    friendship_rows.other_nickname,
    friendship_rows.created_at,
    friendship_rows.updated_at
  from private.list_friendships() as friendship_rows;
$$;

revoke all on function public.list_friendships() from public;
revoke all on function public.list_friendships() from anon;
revoke all on function public.list_friendships() from authenticated;
grant execute on function public.list_friendships() to authenticated;

comment on function public.list_friendships()
  is 'Returns friendship rows involving auth.uid() with the other profile display fields for the Profile screen.';

notify pgrst, 'reload schema';

commit;
