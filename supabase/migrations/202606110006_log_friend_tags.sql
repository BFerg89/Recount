begin;

-- Adds account-backed people tags and lets accepted friends view logs where
-- they are explicitly tagged. Mutations remain creator-only.

do $$
begin
  if to_regclass('public.profiles') is null then
    raise exception 'public.profiles must exist before applying log friend tags migration';
  end if;

  if to_regclass('public.friendships') is null then
    raise exception 'public.friendships must exist before applying log friend tags migration';
  end if;

  if to_regclass('public.logs') is null then
    raise exception 'public.logs must exist before applying log friend tags migration';
  end if;

  if to_regclass('public.log_people') is null then
    raise exception 'public.log_people must exist before applying log friend tags migration';
  end if;

  if to_regclass('public.timeline_events') is null then
    raise exception 'public.timeline_events must exist before applying log friend tags migration';
  end if;

  if to_regclass('public.notes') is null then
    raise exception 'public.notes must exist before applying log friend tags migration';
  end if;
end $$;

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;
grant usage on schema private to authenticated;

alter table public.log_people
  add column if not exists user_id uuid;

do $$
declare
  user_id_data_type text;
begin
  select columns.udt_name
    into user_id_data_type
  from information_schema.columns
  where columns.table_schema = 'public'
    and columns.table_name = 'log_people'
    and columns.column_name = 'user_id';

  if user_id_data_type is distinct from 'uuid' then
    raise exception 'public.log_people.user_id must be uuid, got %', user_id_data_type;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.log_people'::regclass
      and conname = 'log_people_user_id_fkey'
  ) then
    alter table public.log_people
      add constraint log_people_user_id_fkey
      foreign key (user_id)
      references public.profiles(id)
      on delete set null;
  end if;
end $$;

create index if not exists log_people_user_id_idx
  on public.log_people (user_id)
  where user_id is not null;

create unique index if not exists log_people_log_id_user_id_unique_idx
  on public.log_people (log_id, user_id)
  where user_id is not null;

create index if not exists friendships_requester_addressee_accepted_idx
  on public.friendships (requester_id, addressee_id)
  where status = 'accepted';

create index if not exists friendships_addressee_requester_accepted_idx
  on public.friendships (addressee_id, requester_id)
  where status = 'accepted';

alter table public.logs enable row level security;
alter table public.log_people enable row level security;
alter table public.timeline_events enable row level security;
alter table public.notes enable row level security;
alter table public.profiles enable row level security;
alter table public.friendships enable row level security;

revoke all on table public.logs from public;
revoke all on table public.log_people from public;
revoke all on table public.timeline_events from public;
revoke all on table public.notes from public;

revoke all on table public.logs from anon;
revoke all on table public.log_people from anon;
revoke all on table public.timeline_events from anon;
revoke all on table public.notes from anon;

revoke all on table public.logs from authenticated;
revoke all on table public.log_people from authenticated;
revoke all on table public.timeline_events from authenticated;
revoke all on table public.notes from authenticated;

grant select, delete on table public.logs to authenticated;
grant insert (title, date, general_location)
  on table public.logs to authenticated;
grant update (title, date, general_location)
  on table public.logs to authenticated;

grant select, delete on table public.log_people to authenticated;
grant insert (log_id, display_name, user_id)
  on table public.log_people to authenticated;
grant update (display_name, user_id)
  on table public.log_people to authenticated;

grant select, delete on table public.timeline_events to authenticated;
grant insert (log_id, title, approx_time, sort_order)
  on table public.timeline_events to authenticated;
grant update (title, approx_time, sort_order)
  on table public.timeline_events to authenticated;

grant select, delete on table public.notes to authenticated;
grant insert (log_id, timeline_event_id, prompt_type, text)
  on table public.notes to authenticated;
grant update (timeline_event_id, prompt_type, text)
  on table public.notes to authenticated;

create or replace function private.can_edit_log(p_log_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.logs
      where logs.id = p_log_id
        and logs.creator_id = (select auth.uid())
    );
$$;

create or replace function private.is_accepted_friend(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and p_profile_id is not null
    and p_profile_id <> (select auth.uid())
    and exists (
      select 1
      from public.friendships
      where friendships.status = 'accepted'
        and (
          (
            friendships.requester_id = (select auth.uid())
            and friendships.addressee_id = p_profile_id
          )
          or (
            friendships.addressee_id = (select auth.uid())
            and friendships.requester_id = p_profile_id
          )
        )
    );
$$;

create or replace function private.can_view_log(p_log_id uuid, p_creator_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and p_log_id is not null
    and p_creator_id is not null
    and (
      p_creator_id = (select auth.uid())
      or (
        private.is_accepted_friend(p_creator_id)
        and exists (
          select 1
          from public.log_people
          where log_people.log_id = p_log_id
            and log_people.user_id = (select auth.uid())
        )
      )
    );
$$;

create or replace function private.can_view_log(p_log_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.logs
    where logs.id = p_log_id
      and private.can_view_log(logs.id, logs.creator_id)
  );
$$;

revoke all on function private.can_edit_log(uuid) from public;
revoke all on function private.can_edit_log(uuid) from anon;
revoke all on function private.can_edit_log(uuid) from authenticated;
grant execute on function private.can_edit_log(uuid) to authenticated;

revoke all on function private.is_accepted_friend(uuid) from public;
revoke all on function private.is_accepted_friend(uuid) from anon;
revoke all on function private.is_accepted_friend(uuid) from authenticated;
grant execute on function private.is_accepted_friend(uuid) to authenticated;

revoke all on function private.can_view_log(uuid) from public;
revoke all on function private.can_view_log(uuid) from anon;
revoke all on function private.can_view_log(uuid) from authenticated;
grant execute on function private.can_view_log(uuid) to authenticated;

revoke all on function private.can_view_log(uuid, uuid) from public;
revoke all on function private.can_view_log(uuid, uuid) from anon;
revoke all on function private.can_view_log(uuid, uuid) from authenticated;
grant execute on function private.can_view_log(uuid, uuid) to authenticated;

drop policy if exists logs_select_own on public.logs;
drop policy if exists logs_select_visible on public.logs;

create policy logs_select_visible
  on public.logs
  for select
  to authenticated
  using (private.can_view_log(logs.id, logs.creator_id));

drop policy if exists log_people_select_for_own_logs on public.log_people;
drop policy if exists log_people_select_for_visible_logs on public.log_people;

create policy log_people_select_for_visible_logs
  on public.log_people
  for select
  to authenticated
  using (private.can_view_log(log_people.log_id));

drop policy if exists log_people_insert_for_own_logs on public.log_people;
drop policy if exists log_people_insert_for_owned_logs_with_friend_tags on public.log_people;

create policy log_people_insert_for_owned_logs_with_friend_tags
  on public.log_people
  for insert
  to authenticated
  with check (
    private.can_edit_log(log_people.log_id)
    and (
      log_people.user_id is null
      or private.is_accepted_friend(log_people.user_id)
    )
  );

drop policy if exists log_people_update_for_own_logs on public.log_people;
drop policy if exists log_people_update_for_owned_logs_with_friend_tags on public.log_people;

create policy log_people_update_for_owned_logs_with_friend_tags
  on public.log_people
  for update
  to authenticated
  using (private.can_edit_log(log_people.log_id))
  with check (
    private.can_edit_log(log_people.log_id)
    and (
      log_people.user_id is null
      or private.is_accepted_friend(log_people.user_id)
    )
  );

drop policy if exists log_people_delete_for_own_logs on public.log_people;
drop policy if exists log_people_delete_for_owned_logs on public.log_people;

create policy log_people_delete_for_owned_logs
  on public.log_people
  for delete
  to authenticated
  using (private.can_edit_log(log_people.log_id));

drop policy if exists timeline_events_select_for_own_logs on public.timeline_events;
drop policy if exists timeline_events_select_for_visible_logs on public.timeline_events;

create policy timeline_events_select_for_visible_logs
  on public.timeline_events
  for select
  to authenticated
  using (private.can_view_log(timeline_events.log_id));

drop policy if exists notes_select_for_own_logs on public.notes;
drop policy if exists notes_select_for_visible_logs on public.notes;

create policy notes_select_for_visible_logs
  on public.notes
  for select
  to authenticated
  using (private.can_view_log(notes.log_id));

comment on column public.log_people.user_id
  is 'Optional profile id for an account-backed person tag. Null keeps manual MVP people supported.';

comment on function private.can_edit_log(uuid)
  is 'RLS helper: true only when auth.uid() owns the log.';

comment on function private.is_accepted_friend(uuid)
  is 'RLS helper: true only when auth.uid() has an accepted friendship with the target profile.';

comment on function private.can_view_log(uuid)
  is 'RLS helper: true when auth.uid() owns the log or is an accepted friend tagged in log_people.user_id.';

comment on function private.can_view_log(uuid, uuid)
  is 'RLS helper: row-aware overload for logs policies; avoids re-reading logs when creator_id is already available.';

notify pgrst, 'reload schema';

commit;
