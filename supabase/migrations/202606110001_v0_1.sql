-- NightLog v0.1 schema draft
-- Review before applying to Supabase.

create extension if not exists pgcrypto with schema extensions;

create table public.night_logs (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null default (auth.uid()) references auth.users(id) on delete cascade,
  title text not null check (length(btrim(title)) > 0),
  date date not null,
  general_location text not null check (length(btrim(general_location)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.night_people (
  id uuid primary key default gen_random_uuid(),
  night_log_id uuid not null references public.night_logs(id) on delete cascade,
  display_name text not null check (length(btrim(display_name)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  night_log_id uuid not null references public.night_logs(id) on delete cascade,
  title text not null check (length(btrim(title)) > 0),
  approx_time text,
  sort_order integer not null check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, night_log_id)
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  night_log_id uuid not null references public.night_logs(id) on delete cascade,
  timeline_event_id uuid,
  author_id uuid not null default (auth.uid()) references auth.users(id) on delete cascade,
  prompt_type text not null check (length(btrim(prompt_type)) > 0),
  text text not null check (length(btrim(text)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notes_timeline_event_same_night_fk
    foreign key (timeline_event_id, night_log_id)
    references public.timeline_events(id, night_log_id)
    on delete cascade
);

create index night_logs_creator_id_date_idx
  on public.night_logs (creator_id, date desc);

create index night_people_night_log_id_idx
  on public.night_people (night_log_id);

create index timeline_events_night_log_id_sort_order_idx
  on public.timeline_events (night_log_id, sort_order);

create index notes_night_log_id_idx
  on public.notes (night_log_id);

create index notes_timeline_event_id_night_log_id_idx
  on public.notes (timeline_event_id, night_log_id);

create index notes_author_id_idx
  on public.notes (author_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public;
revoke execute on function public.set_updated_at() from anon;
revoke execute on function public.set_updated_at() from authenticated;

create trigger night_logs_set_updated_at
  before update on public.night_logs
  for each row
  execute function public.set_updated_at();

create trigger night_people_set_updated_at
  before update on public.night_people
  for each row
  execute function public.set_updated_at();

create trigger timeline_events_set_updated_at
  before update on public.timeline_events
  for each row
  execute function public.set_updated_at();

create trigger notes_set_updated_at
  before update on public.notes
  for each row
  execute function public.set_updated_at();

alter table public.night_logs enable row level security;
alter table public.night_people enable row level security;
alter table public.timeline_events enable row level security;
alter table public.notes enable row level security;

revoke all on table public.night_logs from public;
revoke all on table public.night_people from public;
revoke all on table public.timeline_events from public;
revoke all on table public.notes from public;

revoke all on table public.night_logs from anon;
revoke all on table public.night_people from anon;
revoke all on table public.timeline_events from anon;
revoke all on table public.notes from anon;

revoke all on table public.night_logs from authenticated;
revoke all on table public.night_people from authenticated;
revoke all on table public.timeline_events from authenticated;
revoke all on table public.notes from authenticated;

grant select, delete on table public.night_logs to authenticated;
grant insert (title, date, general_location) on table public.night_logs to authenticated;
grant update (title, date, general_location) on table public.night_logs to authenticated;

grant select, delete on table public.night_people to authenticated;
grant insert (night_log_id, display_name) on table public.night_people to authenticated;
grant update (display_name) on table public.night_people to authenticated;

grant select, delete on table public.timeline_events to authenticated;
grant insert (night_log_id, title, approx_time, sort_order) on table public.timeline_events to authenticated;
grant update (title, approx_time, sort_order) on table public.timeline_events to authenticated;

grant select, delete on table public.notes to authenticated;
grant insert (night_log_id, timeline_event_id, prompt_type, text) on table public.notes to authenticated;
grant update (timeline_event_id, prompt_type, text) on table public.notes to authenticated;

create policy night_logs_select_own
  on public.night_logs
  for select
  to authenticated
  using (creator_id = (select auth.uid()));

create policy night_logs_insert_own
  on public.night_logs
  for insert
  to authenticated
  with check (creator_id = (select auth.uid()));

create policy night_logs_update_own
  on public.night_logs
  for update
  to authenticated
  using (creator_id = (select auth.uid()))
  with check (creator_id = (select auth.uid()));

create policy night_logs_delete_own
  on public.night_logs
  for delete
  to authenticated
  using (creator_id = (select auth.uid()));

create policy night_people_select_for_own_logs
  on public.night_people
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.night_logs nl
      where nl.id = night_people.night_log_id
        and nl.creator_id = (select auth.uid())
    )
  );

create policy night_people_insert_for_own_logs
  on public.night_people
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.night_logs nl
      where nl.id = night_people.night_log_id
        and nl.creator_id = (select auth.uid())
    )
  );

create policy night_people_update_for_own_logs
  on public.night_people
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.night_logs nl
      where nl.id = night_people.night_log_id
        and nl.creator_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.night_logs nl
      where nl.id = night_people.night_log_id
        and nl.creator_id = (select auth.uid())
    )
  );

create policy night_people_delete_for_own_logs
  on public.night_people
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.night_logs nl
      where nl.id = night_people.night_log_id
        and nl.creator_id = (select auth.uid())
    )
  );

create policy timeline_events_select_for_own_logs
  on public.timeline_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.night_logs nl
      where nl.id = timeline_events.night_log_id
        and nl.creator_id = (select auth.uid())
    )
  );

create policy timeline_events_insert_for_own_logs
  on public.timeline_events
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.night_logs nl
      where nl.id = timeline_events.night_log_id
        and nl.creator_id = (select auth.uid())
    )
  );

create policy timeline_events_update_for_own_logs
  on public.timeline_events
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.night_logs nl
      where nl.id = timeline_events.night_log_id
        and nl.creator_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.night_logs nl
      where nl.id = timeline_events.night_log_id
        and nl.creator_id = (select auth.uid())
    )
  );

create policy timeline_events_delete_for_own_logs
  on public.timeline_events
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.night_logs nl
      where nl.id = timeline_events.night_log_id
        and nl.creator_id = (select auth.uid())
    )
  );

create policy notes_select_for_own_logs
  on public.notes
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.night_logs nl
      where nl.id = notes.night_log_id
        and nl.creator_id = (select auth.uid())
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
      from public.night_logs nl
      where nl.id = notes.night_log_id
        and nl.creator_id = (select auth.uid())
    )
  );

create policy notes_update_for_own_logs
  on public.notes
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.night_logs nl
      where nl.id = notes.night_log_id
        and nl.creator_id = (select auth.uid())
    )
  )
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1
      from public.night_logs nl
      where nl.id = notes.night_log_id
        and nl.creator_id = (select auth.uid())
    )
  );

create policy notes_delete_for_own_logs
  on public.notes
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.night_logs nl
      where nl.id = notes.night_log_id
        and nl.creator_id = (select auth.uid())
    )
  );
