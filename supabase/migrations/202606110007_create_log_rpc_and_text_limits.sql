begin;

-- Checkpoint 2:
-- - Add server-side text length limits as a backup to stricter UI limits.
-- - Add an atomic create-log RPC so the parent log and child rows are inserted
--   in one transaction.
-- - Bound create payload size and child-row counts to avoid accidental or
--   abusive bulk inserts.

do $$
begin
  if to_regclass('public.logs') is null then
    raise exception 'public.logs must exist before applying create_log RPC migration';
  end if;

  if to_regclass('public.log_people') is null then
    raise exception 'public.log_people must exist before applying create_log RPC migration';
  end if;

  if to_regclass('public.timeline_events') is null then
    raise exception 'public.timeline_events must exist before applying create_log RPC migration';
  end if;

  if to_regclass('public.notes') is null then
    raise exception 'public.notes must exist before applying create_log RPC migration';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.logs'::regclass
      and conname = 'logs_title_max_length_check'
  ) then
    alter table public.logs
      add constraint logs_title_max_length_check
      check (
        title = btrim(title)
        and char_length(title) between 1 and 120
      )
      not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.logs'::regclass
      and conname = 'logs_general_location_max_length_check'
  ) then
    alter table public.logs
      add constraint logs_general_location_max_length_check
      check (
        general_location = btrim(general_location)
        and char_length(general_location) between 1 and 160
      )
      not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.log_people'::regclass
      and conname = 'log_people_display_name_max_length_check'
  ) then
    alter table public.log_people
      add constraint log_people_display_name_max_length_check
      check (
        display_name = btrim(display_name)
        and char_length(display_name) between 1 and 80
      )
      not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.timeline_events'::regclass
      and conname = 'timeline_events_title_max_length_check'
  ) then
    alter table public.timeline_events
      add constraint timeline_events_title_max_length_check
      check (
        title = btrim(title)
        and char_length(title) between 1 and 120
      )
      not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.timeline_events'::regclass
      and conname = 'timeline_events_approx_time_max_length_check'
  ) then
    alter table public.timeline_events
      add constraint timeline_events_approx_time_max_length_check
      check (
        approx_time is null
        or (
          approx_time = btrim(approx_time)
          and char_length(approx_time) between 1 and 32
        )
      )
      not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.notes'::regclass
      and conname = 'notes_prompt_type_max_length_check'
  ) then
    alter table public.notes
      add constraint notes_prompt_type_max_length_check
      check (
        prompt_type = btrim(prompt_type)
        and char_length(prompt_type) between 1 and 64
      )
      not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.notes'::regclass
      and conname = 'notes_text_max_length_check'
  ) then
    alter table public.notes
      add constraint notes_text_max_length_check
      check (
        text = btrim(text)
        and char_length(text) between 1 and 1000
      )
      not valid;
  end if;
end $$;

create or replace function public.create_log(payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_title text;
  v_date date;
  v_date_text text;
  v_general_location text;
  v_people jsonb;
  v_timeline_events jsonb;
  v_notes jsonb;
  v_log public.logs%rowtype;
  v_person record;
  v_moment record;
  v_note record;
  v_display_name text;
  v_user_id uuid;
  v_moment_title text;
  v_approx_time text;
  v_prompt_type text;
  v_note_text text;
begin
  if (select auth.uid()) is null then
    raise exception 'You must be signed in to create a log.'
      using errcode = '42501';
  end if;

  if jsonb_typeof(payload) is distinct from 'object' then
    raise exception 'create_log payload must be a JSON object.'
      using errcode = '22023';
  end if;

  if pg_column_size(payload) > 262144 then
    raise exception 'create_log payload must be 256 KB or smaller.'
      using errcode = '22023';
  end if;

  v_title := btrim(coalesce(payload ->> 'title', ''));
  v_date_text := btrim(coalesce(payload ->> 'date', ''));
  v_general_location := btrim(coalesce(payload ->> 'general_location', ''));
  v_people := coalesce(payload -> 'people', '[]'::jsonb);
  v_timeline_events := coalesce(payload -> 'timeline_events', '[]'::jsonb);
  v_notes := coalesce(payload -> 'notes', '[]'::jsonb);

  if v_title = '' then
    raise exception 'Log title is required.'
      using errcode = '22023';
  end if;

  if char_length(v_title) > 120 then
    raise exception 'Log title must be 120 characters or fewer.'
      using errcode = '22001';
  end if;

  if v_date_text = '' then
    raise exception 'Log date is required.'
      using errcode = '22023';
  end if;

  begin
    v_date := v_date_text::date;
  exception
    when invalid_datetime_format or datetime_field_overflow then
      raise exception 'Log date must be a valid date.'
        using errcode = '22007';
  end;

  if v_general_location = '' then
    raise exception 'Log location is required.'
      using errcode = '22023';
  end if;

  if char_length(v_general_location) > 160 then
    raise exception 'Log location must be 160 characters or fewer.'
      using errcode = '22001';
  end if;

  if jsonb_typeof(v_people) is distinct from 'array' then
    raise exception 'create_log people must be an array.'
      using errcode = '22023';
  end if;

  if jsonb_typeof(v_timeline_events) is distinct from 'array' then
    raise exception 'create_log timeline_events must be an array.'
      using errcode = '22023';
  end if;

  if jsonb_typeof(v_notes) is distinct from 'array' then
    raise exception 'create_log notes must be an array.'
      using errcode = '22023';
  end if;

  if jsonb_array_length(v_people) > 50 then
    raise exception 'A log can include at most 50 people.'
      using errcode = '22023';
  end if;

  if jsonb_array_length(v_timeline_events) > 100 then
    raise exception 'A log can include at most 100 timeline events.'
      using errcode = '22023';
  end if;

  if jsonb_array_length(v_notes) > 50 then
    raise exception 'A log can include at most 50 notes.'
      using errcode = '22023';
  end if;

  insert into public.logs (title, date, general_location)
  values (v_title, v_date, v_general_location)
  returning *
  into v_log;

  for v_person in
    select person.item
    from jsonb_array_elements(v_people) as person(item)
  loop
    if jsonb_typeof(v_person.item) is distinct from 'object' then
      raise exception 'Each person must be a JSON object.'
        using errcode = '22023';
    end if;

    v_display_name := btrim(coalesce(v_person.item ->> 'display_name', ''));

    if v_display_name = '' then
      raise exception 'Person display name is required.'
        using errcode = '22023';
    end if;

    if char_length(v_display_name) > 80 then
      raise exception 'Person display name must be 80 characters or fewer.'
        using errcode = '22001';
    end if;

    begin
      v_user_id := nullif(btrim(coalesce(v_person.item ->> 'user_id', '')), '')::uuid;
    exception
      when invalid_text_representation then
        raise exception 'Person user_id must be a valid UUID.'
          using errcode = '22P02';
    end;

    insert into public.log_people (log_id, display_name, user_id)
    values (v_log.id, v_display_name, v_user_id);
  end loop;

  for v_moment in
    select moment.item, moment.ordinality
    from jsonb_array_elements(v_timeline_events) with ordinality as moment(item, ordinality)
    order by moment.ordinality
  loop
    if jsonb_typeof(v_moment.item) is distinct from 'object' then
      raise exception 'Each timeline event must be a JSON object.'
        using errcode = '22023';
    end if;

    v_moment_title := btrim(coalesce(v_moment.item ->> 'title', ''));
    v_approx_time := nullif(btrim(coalesce(v_moment.item ->> 'approx_time', '')), '');

    if v_moment_title = '' then
      raise exception 'Timeline event title is required.'
        using errcode = '22023';
    end if;

    if char_length(v_moment_title) > 120 then
      raise exception 'Timeline event title must be 120 characters or fewer.'
        using errcode = '22001';
    end if;

    if v_approx_time is not null and char_length(v_approx_time) > 32 then
      raise exception 'Timeline event approximate time must be 32 characters or fewer.'
        using errcode = '22001';
    end if;

    insert into public.timeline_events (log_id, title, approx_time, sort_order)
    values (
      v_log.id,
      v_moment_title,
      v_approx_time,
      (v_moment.ordinality - 1)::integer
    );
  end loop;

  for v_note in
    select note.item
    from jsonb_array_elements(v_notes) as note(item)
  loop
    if jsonb_typeof(v_note.item) is distinct from 'object' then
      raise exception 'Each note must be a JSON object.'
        using errcode = '22023';
    end if;

    v_prompt_type := btrim(coalesce(v_note.item ->> 'prompt_type', ''));
    v_note_text := btrim(coalesce(v_note.item ->> 'text', ''));

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

    insert into public.notes (log_id, prompt_type, text)
    values (v_log.id, v_prompt_type, v_note_text);
  end loop;

  return jsonb_build_object(
    'id', v_log.id,
    'creator_id', v_log.creator_id,
    'title', v_log.title,
    'date', v_log.date,
    'general_location', v_log.general_location,
    'created_at', v_log.created_at,
    'updated_at', v_log.updated_at,
    'log_people', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', log_people.id,
            'user_id', log_people.user_id,
            'log_id', log_people.log_id,
            'display_name', log_people.display_name,
            'created_at', log_people.created_at,
            'updated_at', log_people.updated_at
          )
          order by log_people.created_at, log_people.id
        )
        from public.log_people
        where log_people.log_id = v_log.id
      ),
      '[]'::jsonb
    ),
    'timeline_events', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', timeline_events.id,
            'log_id', timeline_events.log_id,
            'title', timeline_events.title,
            'approx_time', timeline_events.approx_time,
            'sort_order', timeline_events.sort_order,
            'created_at', timeline_events.created_at,
            'updated_at', timeline_events.updated_at
          )
          order by timeline_events.sort_order, timeline_events.created_at, timeline_events.id
        )
        from public.timeline_events
        where timeline_events.log_id = v_log.id
      ),
      '[]'::jsonb
    ),
    'notes', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', notes.id,
            'log_id', notes.log_id,
            'prompt_type', notes.prompt_type,
            'text', notes.text,
            'created_at', notes.created_at,
            'updated_at', notes.updated_at
          )
          order by notes.created_at, notes.id
        )
        from public.notes
        where notes.log_id = v_log.id
      ),
      '[]'::jsonb
    )
  );
end;
$$;

revoke all on function public.create_log(jsonb) from public;
revoke all on function public.create_log(jsonb) from anon;
revoke all on function public.create_log(jsonb) from authenticated;
grant execute on function public.create_log(jsonb) to authenticated;

comment on function public.create_log(jsonb)
  is 'Creates a log, people, timeline events, and notes atomically from a JSON payload. Uses security invoker so table RLS remains authoritative.';

notify pgrst, 'reload schema';

commit;
