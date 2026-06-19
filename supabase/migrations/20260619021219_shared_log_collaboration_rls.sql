begin;

-- Let tagged friends collaborate on visible log content while keeping log
-- ownership and access-granting controls scoped to the creator.

do $$
begin
  if to_regclass('public.logs') is null then
    raise exception 'public.logs must exist before applying shared log collaboration RLS migration';
  end if;

  if to_regclass('public.log_people') is null then
    raise exception 'public.log_people must exist before applying shared log collaboration RLS migration';
  end if;

  if to_regclass('public.timeline_events') is null then
    raise exception 'public.timeline_events must exist before applying shared log collaboration RLS migration';
  end if;

  if to_regclass('public.notes') is null then
    raise exception 'public.notes must exist before applying shared log collaboration RLS migration';
  end if;

  if to_regprocedure('private.can_view_log(uuid)') is null then
    raise exception 'private.can_view_log(uuid) must exist before applying shared log collaboration RLS migration';
  end if;

  if to_regprocedure('private.can_view_log(uuid, uuid)') is null then
    raise exception 'private.can_view_log(uuid, uuid) must exist before applying shared log collaboration RLS migration';
  end if;
end $$;

create or replace function private.can_contribute_to_log(p_log_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.can_view_log(p_log_id);
$$;

create or replace function private.can_contribute_to_log(
  p_log_id uuid,
  p_creator_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.can_view_log(p_log_id, p_creator_id);
$$;

revoke all on function private.can_contribute_to_log(uuid) from public;
revoke all on function private.can_contribute_to_log(uuid) from anon;
revoke all on function private.can_contribute_to_log(uuid) from authenticated;
grant execute on function private.can_contribute_to_log(uuid) to authenticated;

revoke all on function private.can_contribute_to_log(uuid, uuid) from public;
revoke all on function private.can_contribute_to_log(uuid, uuid) from anon;
revoke all on function private.can_contribute_to_log(uuid, uuid) from authenticated;
grant execute on function private.can_contribute_to_log(uuid, uuid) to authenticated;

drop policy if exists logs_update_own on public.logs;
drop policy if exists logs_update_visible_contributors on public.logs;

create policy logs_update_visible_contributors
  on public.logs
  for update
  to authenticated
  using (private.can_contribute_to_log(logs.id, logs.creator_id))
  with check (private.can_contribute_to_log(logs.id, logs.creator_id));

drop policy if exists timeline_events_insert_for_own_logs on public.timeline_events;
drop policy if exists timeline_events_insert_for_visible_contributors on public.timeline_events;

create policy timeline_events_insert_for_visible_contributors
  on public.timeline_events
  for insert
  to authenticated
  with check (private.can_contribute_to_log(timeline_events.log_id));

drop policy if exists timeline_events_update_for_own_logs on public.timeline_events;
drop policy if exists timeline_events_update_for_visible_contributors on public.timeline_events;

create policy timeline_events_update_for_visible_contributors
  on public.timeline_events
  for update
  to authenticated
  using (private.can_contribute_to_log(timeline_events.log_id))
  with check (private.can_contribute_to_log(timeline_events.log_id));

drop policy if exists timeline_events_delete_for_own_logs on public.timeline_events;
drop policy if exists timeline_events_delete_for_visible_contributors on public.timeline_events;

create policy timeline_events_delete_for_visible_contributors
  on public.timeline_events
  for delete
  to authenticated
  using (private.can_contribute_to_log(timeline_events.log_id));

drop policy if exists notes_insert_for_own_logs on public.notes;
drop policy if exists notes_insert_for_visible_contributors on public.notes;

create policy notes_insert_for_visible_contributors
  on public.notes
  for insert
  to authenticated
  with check (
    notes.author_id = (select auth.uid())
    and private.can_contribute_to_log(notes.log_id)
  );

drop policy if exists notes_update_for_own_logs on public.notes;
drop policy if exists notes_update_for_visible_contributors on public.notes;

create policy notes_update_for_visible_contributors
  on public.notes
  for update
  to authenticated
  using (private.can_contribute_to_log(notes.log_id))
  with check (private.can_contribute_to_log(notes.log_id));

drop policy if exists notes_delete_for_own_logs on public.notes;
drop policy if exists notes_delete_for_visible_contributors on public.notes;

create policy notes_delete_for_visible_contributors
  on public.notes
  for delete
  to authenticated
  using (private.can_contribute_to_log(notes.log_id));

drop policy if exists log_people_delete_self_tag on public.log_people;

create policy log_people_delete_self_tag
  on public.log_people
  for delete
  to authenticated
  using (
    log_people.user_id is not null
    and log_people.user_id = (select auth.uid())
  );

comment on function private.can_contribute_to_log(uuid)
  is 'RLS helper: true when auth.uid() can collaborate on a visible log. Creators and tagged accepted friends can contribute.';

comment on function private.can_contribute_to_log(uuid, uuid)
  is 'RLS helper: row-aware overload for logs update policies; avoids re-reading logs when creator_id is already available.';

comment on policy logs_update_visible_contributors on public.logs
  is 'Creators and tagged accepted friends can update shared log metadata; log deletion remains creator-only.';

comment on policy log_people_delete_self_tag on public.log_people
  is 'Tagged users can remove only their own account-backed person row to leave a shared log.';

notify pgrst, 'reload schema';

commit;
