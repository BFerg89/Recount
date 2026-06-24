begin;

-- Adds item-level edit RPCs for shared log editing. These replace the abandoned
-- full-log replacement RPC shape so edits only touch the specific item the user
-- changed. The functions are security invoker, so table grants and RLS policies
-- remain authoritative for creators and collaborators.

do $$
begin
  if to_regclass('public.logs') is null then
    raise exception 'public.logs must exist before applying item-level edit RPC migration';
  end if;

  if to_regclass('public.timeline_events') is null then
    raise exception 'public.timeline_events must exist before applying item-level edit RPC migration';
  end if;

  if to_regclass('public.notes') is null then
    raise exception 'public.notes must exist before applying item-level edit RPC migration';
  end if;

  if to_regprocedure('private.can_contribute_to_log(uuid)') is null then
    raise exception 'private.can_contribute_to_log(uuid) must exist before applying item-level edit RPC migration';
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from (
      select timeline_events.log_id, timeline_events.sort_order
      from public.timeline_events
      group by timeline_events.log_id, timeline_events.sort_order
      having count(*) > 1
    ) duplicate_timeline_event_orders
  ) then
    raise exception 'Duplicate timeline event sort_order values must be resolved before adding timeline_events_log_id_sort_order_unique_idx.'
      using errcode = '23505';
  end if;

  if exists (
    select 1
    from (
      select notes.log_id, notes.prompt_type
      from public.notes
      where notes.timeline_event_id is null
      group by notes.log_id, notes.prompt_type
      having count(*) > 1
    ) duplicate_whole_log_notes
  ) then
    raise exception 'Duplicate whole-log prompted notes must be resolved before adding notes_log_prompt_whole_log_unique_idx.'
      using errcode = '23505';
  end if;
end $$;

create unique index if not exists timeline_events_log_id_sort_order_unique_idx
  on public.timeline_events (log_id, sort_order);

create unique index if not exists notes_log_prompt_whole_log_unique_idx
  on public.notes (log_id, prompt_type)
  where timeline_event_id is null;

create or replace function public.update_log_metadata(
  p_log_id uuid,
  p_title text,
  p_date date,
  p_general_location text,
  p_expected_updated_at timestamptz
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_title text;
  v_general_location text;
  v_log public.logs%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'You must be signed in to update a log.'
      using errcode = '42501';
  end if;

  if p_log_id is null then
    raise exception 'Log id is required.'
      using errcode = '22023';
  end if;

  if p_expected_updated_at is null then
    raise exception 'Expected updated_at is required.'
      using errcode = '22023';
  end if;

  if p_date is null then
    raise exception 'Log date is required.'
      using errcode = '22023';
  end if;

  if not private.can_contribute_to_log(p_log_id) then
    raise exception 'Log not found or you do not have permission to update it.'
      using errcode = '42501';
  end if;

  v_title := btrim(coalesce(p_title, ''));
  v_general_location := btrim(coalesce(p_general_location, ''));

  if v_title = '' then
    raise exception 'Log title is required.'
      using errcode = '22023';
  end if;

  if char_length(v_title) > 120 then
    raise exception 'Log title must be 120 characters or fewer.'
      using errcode = '22001';
  end if;

  if v_general_location = '' then
    raise exception 'Log location is required.'
      using errcode = '22023';
  end if;

  if char_length(v_general_location) > 160 then
    raise exception 'Log location must be 160 characters or fewer.'
      using errcode = '22001';
  end if;

  update public.logs
  set
    title = v_title,
    date = p_date,
    general_location = v_general_location
  where logs.id = p_log_id
    and logs.updated_at = p_expected_updated_at
  returning *
  into v_log;

  if not found then
    raise exception 'This log was updated by someone else.'
      using errcode = 'P0001';
  end if;

  return to_jsonb(v_log);
end;
$$;

create or replace function public.create_timeline_event(
  p_log_id uuid,
  p_title text,
  p_approx_time text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_title text;
  v_approx_time text;
  v_sort_order integer;
  v_timeline_event public.timeline_events%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'You must be signed in to add a timeline event.'
      using errcode = '42501';
  end if;

  if p_log_id is null then
    raise exception 'Log id is required.'
      using errcode = '22023';
  end if;

  if not private.can_contribute_to_log(p_log_id) then
    raise exception 'Log not found or you do not have permission to update it.'
      using errcode = '42501';
  end if;

  v_title := btrim(coalesce(p_title, ''));
  v_approx_time := nullif(btrim(coalesce(p_approx_time, '')), '');

  if v_title = '' then
    raise exception 'Timeline event title is required.'
      using errcode = '22023';
  end if;

  if char_length(v_title) > 120 then
    raise exception 'Timeline event title must be 120 characters or fewer.'
      using errcode = '22001';
  end if;

  if v_approx_time is not null and char_length(v_approx_time) > 32 then
    raise exception 'Timeline event approximate time must be 32 characters or fewer.'
      using errcode = '22001';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('timeline_events_sort_order'),
    pg_catalog.hashtext(p_log_id::text)
  );

  select coalesce(max(timeline_events.sort_order) + 1, 0)
  into v_sort_order
  from public.timeline_events
  where timeline_events.log_id = p_log_id;

  insert into public.timeline_events (log_id, title, approx_time, sort_order)
  values (p_log_id, v_title, v_approx_time, v_sort_order)
  returning *
  into v_timeline_event;

  return to_jsonb(v_timeline_event);
end;
$$;

create or replace function public.update_timeline_event(
  p_timeline_event_id uuid,
  p_title text,
  p_approx_time text default null,
  p_expected_updated_at timestamptz default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_existing_timeline_event public.timeline_events%rowtype;
  v_timeline_event public.timeline_events%rowtype;
  v_title text;
  v_approx_time text;
begin
  if (select auth.uid()) is null then
    raise exception 'You must be signed in to update a timeline event.'
      using errcode = '42501';
  end if;

  if p_timeline_event_id is null then
    raise exception 'Timeline event id is required.'
      using errcode = '22023';
  end if;

  if p_expected_updated_at is null then
    raise exception 'Expected updated_at is required.'
      using errcode = '22023';
  end if;

  select timeline_events.*
  into v_existing_timeline_event
  from public.timeline_events
  where timeline_events.id = p_timeline_event_id;

  if not found or not private.can_contribute_to_log(v_existing_timeline_event.log_id) then
    raise exception 'Timeline event not found or you do not have permission to update it.'
      using errcode = '42501';
  end if;

  v_title := btrim(coalesce(p_title, ''));
  v_approx_time := nullif(btrim(coalesce(p_approx_time, '')), '');

  if v_title = '' then
    raise exception 'Timeline event title is required.'
      using errcode = '22023';
  end if;

  if char_length(v_title) > 120 then
    raise exception 'Timeline event title must be 120 characters or fewer.'
      using errcode = '22001';
  end if;

  if v_approx_time is not null and char_length(v_approx_time) > 32 then
    raise exception 'Timeline event approximate time must be 32 characters or fewer.'
      using errcode = '22001';
  end if;

  update public.timeline_events
  set
    title = v_title,
    approx_time = v_approx_time
  where timeline_events.id = p_timeline_event_id
    and timeline_events.updated_at = p_expected_updated_at
  returning *
  into v_timeline_event;

  if not found then
    raise exception 'This timeline event was updated by someone else.'
      using errcode = 'P0001';
  end if;

  return to_jsonb(v_timeline_event);
end;
$$;

create or replace function public.delete_timeline_event(
  p_timeline_event_id uuid,
  p_expected_updated_at timestamptz
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_existing_timeline_event public.timeline_events%rowtype;
  v_deleted_timeline_event public.timeline_events%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'You must be signed in to delete a timeline event.'
      using errcode = '42501';
  end if;

  if p_timeline_event_id is null then
    raise exception 'Timeline event id is required.'
      using errcode = '22023';
  end if;

  if p_expected_updated_at is null then
    raise exception 'Expected updated_at is required.'
      using errcode = '22023';
  end if;

  select timeline_events.*
  into v_existing_timeline_event
  from public.timeline_events
  where timeline_events.id = p_timeline_event_id;

  if not found or not private.can_contribute_to_log(v_existing_timeline_event.log_id) then
    raise exception 'Timeline event not found or you do not have permission to delete it.'
      using errcode = '42501';
  end if;

  delete from public.timeline_events
  where timeline_events.id = p_timeline_event_id
    and timeline_events.updated_at = p_expected_updated_at
  returning *
  into v_deleted_timeline_event;

  if not found then
    raise exception 'This timeline event was updated by someone else.'
      using errcode = 'P0001';
  end if;

  return jsonb_build_object(
    'id', v_deleted_timeline_event.id,
    'log_id', v_deleted_timeline_event.log_id
  );
end;
$$;

create or replace function public.upsert_log_note(
  p_log_id uuid,
  p_prompt_type text,
  p_text text,
  p_note_id uuid default null,
  p_expected_updated_at timestamptz default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_existing_note public.notes%rowtype;
  v_note public.notes%rowtype;
  v_prompt_type text;
  v_note_text text;
begin
  if (select auth.uid()) is null then
    raise exception 'You must be signed in to save a note.'
      using errcode = '42501';
  end if;

  if p_log_id is null then
    raise exception 'Log id is required.'
      using errcode = '22023';
  end if;

  if not private.can_contribute_to_log(p_log_id) then
    raise exception 'Log not found or you do not have permission to update it.'
      using errcode = '42501';
  end if;

  v_prompt_type := btrim(coalesce(p_prompt_type, ''));
  v_note_text := btrim(coalesce(p_text, ''));

  if v_prompt_type = '' then
    raise exception 'Note prompt_type is required.'
      using errcode = '22023';
  end if;

  if char_length(v_prompt_type) > 64 then
    raise exception 'Note prompt_type must be 64 characters or fewer.'
      using errcode = '22001';
  end if;

  if v_note_text = '' then
    raise exception 'Note text is required.'
      using errcode = '22023';
  end if;

  if char_length(v_note_text) > 1000 then
    raise exception 'Note text must be 1000 characters or fewer.'
      using errcode = '22001';
  end if;

  if p_note_id is null then
    begin
      insert into public.notes (log_id, prompt_type, text)
      values (p_log_id, v_prompt_type, v_note_text)
      returning *
      into v_note;
    exception
      when unique_violation then
        raise exception 'This note was updated by someone else.'
          using errcode = 'P0001';
    end;

    return to_jsonb(v_note);
  end if;

  if p_expected_updated_at is null then
    raise exception 'Expected updated_at is required.'
      using errcode = '22023';
  end if;

  select notes.*
  into v_existing_note
  from public.notes
  where notes.id = p_note_id
    and notes.log_id = p_log_id
    and notes.timeline_event_id is null;

  if not found then
    raise exception 'Note not found or you do not have permission to update it.'
      using errcode = '42501';
  end if;

  begin
    update public.notes
    set
      prompt_type = v_prompt_type,
      text = v_note_text
    where notes.id = p_note_id
      and notes.log_id = p_log_id
      and notes.timeline_event_id is null
      and notes.updated_at = p_expected_updated_at
    returning *
    into v_note;
  exception
    when unique_violation then
      raise exception 'This note was updated by someone else.'
        using errcode = 'P0001';
  end;

  if not found then
    raise exception 'This note was updated by someone else.'
      using errcode = 'P0001';
  end if;

  return to_jsonb(v_note);
end;
$$;

create or replace function public.delete_log_note(
  p_note_id uuid,
  p_expected_updated_at timestamptz
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_existing_note public.notes%rowtype;
  v_deleted_note public.notes%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'You must be signed in to delete a note.'
      using errcode = '42501';
  end if;

  if p_note_id is null then
    raise exception 'Note id is required.'
      using errcode = '22023';
  end if;

  if p_expected_updated_at is null then
    raise exception 'Expected updated_at is required.'
      using errcode = '22023';
  end if;

  select notes.*
  into v_existing_note
  from public.notes
  where notes.id = p_note_id
    and notes.timeline_event_id is null;

  if not found or not private.can_contribute_to_log(v_existing_note.log_id) then
    raise exception 'Note not found or you do not have permission to delete it.'
      using errcode = '42501';
  end if;

  delete from public.notes
  where notes.id = p_note_id
    and notes.timeline_event_id is null
    and notes.updated_at = p_expected_updated_at
  returning *
  into v_deleted_note;

  if not found then
    raise exception 'This note was updated by someone else.'
      using errcode = 'P0001';
  end if;

  return jsonb_build_object(
    'id', v_deleted_note.id,
    'log_id', v_deleted_note.log_id,
    'prompt_type', v_deleted_note.prompt_type
  );
end;
$$;

revoke all on function public.update_log_metadata(uuid, text, date, text, timestamptz) from public;
revoke all on function public.update_log_metadata(uuid, text, date, text, timestamptz) from anon;
revoke all on function public.update_log_metadata(uuid, text, date, text, timestamptz) from authenticated;
grant execute on function public.update_log_metadata(uuid, text, date, text, timestamptz) to authenticated;

revoke all on function public.create_timeline_event(uuid, text, text) from public;
revoke all on function public.create_timeline_event(uuid, text, text) from anon;
revoke all on function public.create_timeline_event(uuid, text, text) from authenticated;
grant execute on function public.create_timeline_event(uuid, text, text) to authenticated;

revoke all on function public.update_timeline_event(uuid, text, text, timestamptz) from public;
revoke all on function public.update_timeline_event(uuid, text, text, timestamptz) from anon;
revoke all on function public.update_timeline_event(uuid, text, text, timestamptz) from authenticated;
grant execute on function public.update_timeline_event(uuid, text, text, timestamptz) to authenticated;

revoke all on function public.delete_timeline_event(uuid, timestamptz) from public;
revoke all on function public.delete_timeline_event(uuid, timestamptz) from anon;
revoke all on function public.delete_timeline_event(uuid, timestamptz) from authenticated;
grant execute on function public.delete_timeline_event(uuid, timestamptz) to authenticated;

revoke all on function public.upsert_log_note(uuid, text, text, uuid, timestamptz) from public;
revoke all on function public.upsert_log_note(uuid, text, text, uuid, timestamptz) from anon;
revoke all on function public.upsert_log_note(uuid, text, text, uuid, timestamptz) from authenticated;
grant execute on function public.upsert_log_note(uuid, text, text, uuid, timestamptz) to authenticated;

revoke all on function public.delete_log_note(uuid, timestamptz) from public;
revoke all on function public.delete_log_note(uuid, timestamptz) from anon;
revoke all on function public.delete_log_note(uuid, timestamptz) from authenticated;
grant execute on function public.delete_log_note(uuid, timestamptz) to authenticated;

comment on function public.update_log_metadata(uuid, text, date, text, timestamptz)
  is 'Updates one log metadata row after checking contributor access and the caller''s expected updated_at value.';

comment on function public.create_timeline_event(uuid, text, text)
  is 'Appends one timeline event to a visible editable log.';

comment on function public.update_timeline_event(uuid, text, text, timestamptz)
  is 'Updates one timeline event after checking contributor access and the caller''s expected updated_at value.';

comment on function public.delete_timeline_event(uuid, timestamptz)
  is 'Deletes one timeline event after checking contributor access and the caller''s expected updated_at value.';

comment on function public.upsert_log_note(uuid, text, text, uuid, timestamptz)
  is 'Creates or updates one whole-log prompted note. Existing notes require the caller''s expected updated_at value.';

comment on function public.delete_log_note(uuid, timestamptz)
  is 'Deletes one whole-log prompted note after checking contributor access and the caller''s expected updated_at value.';

notify pgrst, 'reload schema';

commit;
