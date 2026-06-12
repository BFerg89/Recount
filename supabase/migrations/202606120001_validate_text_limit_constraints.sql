begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

-- Validate the text-limit constraints added in
-- 202606110007_create_log_rpc_and_text_limits.sql.
--
-- Live preflight on 2026-06-12 found zero rows violating these constraints.
-- Keep the explicit checks here so the migration fails with a targeted message
-- if production data drifts before this is applied.

do $$
declare
  invalid_count integer;
begin
  select count(*)
    into invalid_count
  from public.logs
  where not (
    title = btrim(title)
    and char_length(title) between 1 and 120
  );

  if invalid_count > 0 then
    raise exception 'Cannot validate logs_title_max_length_check: % invalid public.logs rows', invalid_count;
  end if;

  select count(*)
    into invalid_count
  from public.logs
  where not (
    general_location = btrim(general_location)
    and char_length(general_location) between 1 and 160
  );

  if invalid_count > 0 then
    raise exception 'Cannot validate logs_general_location_max_length_check: % invalid public.logs rows', invalid_count;
  end if;

  select count(*)
    into invalid_count
  from public.log_people
  where not (
    display_name = btrim(display_name)
    and char_length(display_name) between 1 and 80
  );

  if invalid_count > 0 then
    raise exception 'Cannot validate log_people_display_name_max_length_check: % invalid public.log_people rows', invalid_count;
  end if;

  select count(*)
    into invalid_count
  from public.timeline_events
  where not (
    title = btrim(title)
    and char_length(title) between 1 and 120
  );

  if invalid_count > 0 then
    raise exception 'Cannot validate timeline_events_title_max_length_check: % invalid public.timeline_events rows', invalid_count;
  end if;

  select count(*)
    into invalid_count
  from public.timeline_events
  where approx_time is not null
    and not (
      approx_time = btrim(approx_time)
      and char_length(approx_time) between 1 and 32
    );

  if invalid_count > 0 then
    raise exception 'Cannot validate timeline_events_approx_time_max_length_check: % invalid public.timeline_events rows', invalid_count;
  end if;

  select count(*)
    into invalid_count
  from public.notes
  where not (
    prompt_type = btrim(prompt_type)
    and char_length(prompt_type) between 1 and 64
  );

  if invalid_count > 0 then
    raise exception 'Cannot validate notes_prompt_type_max_length_check: % invalid public.notes rows', invalid_count;
  end if;

  select count(*)
    into invalid_count
  from public.notes
  where not (
    text = btrim(text)
    and char_length(text) between 1 and 1000
  );

  if invalid_count > 0 then
    raise exception 'Cannot validate notes_text_max_length_check: % invalid public.notes rows', invalid_count;
  end if;
end $$;

alter table public.logs
  validate constraint logs_title_max_length_check;

alter table public.logs
  validate constraint logs_general_location_max_length_check;

alter table public.log_people
  validate constraint log_people_display_name_max_length_check;

alter table public.timeline_events
  validate constraint timeline_events_title_max_length_check;

alter table public.timeline_events
  validate constraint timeline_events_approx_time_max_length_check;

alter table public.notes
  validate constraint notes_prompt_type_max_length_check;

alter table public.notes
  validate constraint notes_text_max_length_check;

commit;
