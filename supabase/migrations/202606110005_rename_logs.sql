begin;

-- Rename the core objects from "night log" language to generic "log" language.
-- These ALTER statements preserve existing rows, table OIDs, defaults, and RLS state.
alter table public.night_logs rename to logs;
alter table public.night_people rename to log_people;

alter table public.log_people rename column night_log_id to log_id;
alter table public.timeline_events rename column night_log_id to log_id;
alter table public.notes rename column night_log_id to log_id;

-- Rename constraints so future errors and schema diffs use the new domain language.
alter table public.logs rename constraint night_logs_pkey to logs_pkey;
alter table public.logs rename constraint night_logs_creator_id_fkey to logs_creator_id_fkey;
alter table public.logs rename constraint night_logs_title_check to logs_title_check;
alter table public.logs rename constraint night_logs_general_location_check to logs_general_location_check;

alter table public.log_people rename constraint night_people_pkey to log_people_pkey;
alter table public.log_people rename constraint night_people_night_log_id_fkey to log_people_log_id_fkey;
alter table public.log_people rename constraint night_people_display_name_check to log_people_display_name_check;

alter table public.timeline_events rename constraint timeline_events_night_log_id_fkey to timeline_events_log_id_fkey;
alter table public.timeline_events rename constraint timeline_events_id_night_log_id_key to timeline_events_id_log_id_key;

alter table public.notes rename constraint notes_night_log_id_fkey to notes_log_id_fkey;
alter table public.notes rename constraint notes_timeline_event_same_night_fk to notes_timeline_event_same_log_fk;

-- Rename standalone indexes. Constraint-backed indexes are renamed with their constraints above.
alter index public.night_logs_creator_id_date_idx rename to logs_creator_id_date_idx;
alter index public.night_people_night_log_id_idx rename to log_people_log_id_idx;
alter index public.timeline_events_night_log_id_sort_order_idx rename to timeline_events_log_id_sort_order_idx;
alter index public.notes_night_log_id_idx rename to notes_log_id_idx;
alter index public.notes_timeline_event_id_night_log_id_idx rename to notes_timeline_event_id_log_id_idx;

-- Rename trigger names for clarity. Trigger behavior stays the same.
alter trigger night_logs_set_updated_at on public.logs rename to logs_set_updated_at;
alter trigger night_people_set_updated_at on public.log_people rename to log_people_set_updated_at;

-- RLS remains enabled through table renames, but keep it explicit in this migration.
alter table public.logs enable row level security;
alter table public.log_people enable row level security;
alter table public.timeline_events enable row level security;
alter table public.notes enable row level security;

-- Re-apply grants against the renamed tables/columns.
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
grant insert (title, date, general_location) on table public.logs to authenticated;
grant update (title, date, general_location) on table public.logs to authenticated;

grant select, delete on table public.log_people to authenticated;
grant insert (log_id, display_name) on table public.log_people to authenticated;
grant update (display_name) on table public.log_people to authenticated;

grant select, delete on table public.timeline_events to authenticated;
grant insert (log_id, title, approx_time, sort_order) on table public.timeline_events to authenticated;
grant update (title, approx_time, sort_order) on table public.timeline_events to authenticated;

grant select, delete on table public.notes to authenticated;
grant insert (log_id, timeline_event_id, prompt_type, text) on table public.notes to authenticated;
grant update (timeline_event_id, prompt_type, text) on table public.notes to authenticated;

-- Recreate policies with the same ownership model using the renamed tables/columns.
drop policy night_logs_select_own on public.logs;
drop policy night_logs_insert_own on public.logs;
drop policy night_logs_update_own on public.logs;
drop policy night_logs_delete_own on public.logs;

drop policy night_people_select_for_own_logs on public.log_people;
drop policy night_people_insert_for_own_logs on public.log_people;
drop policy night_people_update_for_own_logs on public.log_people;
drop policy night_people_delete_for_own_logs on public.log_people;

drop policy timeline_events_select_for_own_logs on public.timeline_events;
drop policy timeline_events_insert_for_own_logs on public.timeline_events;
drop policy timeline_events_update_for_own_logs on public.timeline_events;
drop policy timeline_events_delete_for_own_logs on public.timeline_events;

drop policy notes_select_for_own_logs on public.notes;
drop policy notes_insert_for_own_logs on public.notes;
drop policy notes_update_for_own_logs on public.notes;
drop policy notes_delete_for_own_logs on public.notes;

create policy logs_select_own
  on public.logs
  for select
  to authenticated
  using (creator_id = (select auth.uid()));

create policy logs_insert_own
  on public.logs
  for insert
  to authenticated
  with check (creator_id = (select auth.uid()));

create policy logs_update_own
  on public.logs
  for update
  to authenticated
  using (creator_id = (select auth.uid()))
  with check (creator_id = (select auth.uid()));

create policy logs_delete_own
  on public.logs
  for delete
  to authenticated
  using (creator_id = (select auth.uid()));

create policy log_people_select_for_own_logs
  on public.log_people
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.logs l
      where l.id = log_people.log_id
        and l.creator_id = (select auth.uid())
    )
  );

create policy log_people_insert_for_own_logs
  on public.log_people
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.logs l
      where l.id = log_people.log_id
        and l.creator_id = (select auth.uid())
    )
  );

create policy log_people_update_for_own_logs
  on public.log_people
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.logs l
      where l.id = log_people.log_id
        and l.creator_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.logs l
      where l.id = log_people.log_id
        and l.creator_id = (select auth.uid())
    )
  );

create policy log_people_delete_for_own_logs
  on public.log_people
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.logs l
      where l.id = log_people.log_id
        and l.creator_id = (select auth.uid())
    )
  );

create policy timeline_events_select_for_own_logs
  on public.timeline_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.logs l
      where l.id = timeline_events.log_id
        and l.creator_id = (select auth.uid())
    )
  );

create policy timeline_events_insert_for_own_logs
  on public.timeline_events
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.logs l
      where l.id = timeline_events.log_id
        and l.creator_id = (select auth.uid())
    )
  );

create policy timeline_events_update_for_own_logs
  on public.timeline_events
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.logs l
      where l.id = timeline_events.log_id
        and l.creator_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.logs l
      where l.id = timeline_events.log_id
        and l.creator_id = (select auth.uid())
    )
  );

create policy timeline_events_delete_for_own_logs
  on public.timeline_events
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.logs l
      where l.id = timeline_events.log_id
        and l.creator_id = (select auth.uid())
    )
  );

create policy notes_select_for_own_logs
  on public.notes
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.logs l
      where l.id = notes.log_id
        and l.creator_id = (select auth.uid())
    )
  );

create policy notes_insert_for_own_logs
  on public.notes
  for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1
      from public.logs l
      where l.id = notes.log_id
        and l.creator_id = (select auth.uid())
    )
  );

create policy notes_update_for_own_logs
  on public.notes
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.logs l
      where l.id = notes.log_id
        and l.creator_id = (select auth.uid())
    )
  )
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1
      from public.logs l
      where l.id = notes.log_id
        and l.creator_id = (select auth.uid())
    )
  );

create policy notes_delete_for_own_logs
  on public.notes
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.logs l
      where l.id = notes.log_id
        and l.creator_id = (select auth.uid())
    )
  );

-- Ask PostgREST/Supabase Data API to refresh schema metadata after the rename.
notify pgrst, 'reload schema';

commit;
