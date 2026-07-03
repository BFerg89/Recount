begin;

-- Adds item-level people edit RPCs for existing logs. Unlike content edits,
-- people/access changes stay scoped to the log creator through private.can_edit_log.

do $$
begin
  if to_regclass('public.logs') is null then
    raise exception 'public.logs must exist before applying log person edit RPC migration';
  end if;

  if to_regclass('public.log_people') is null then
    raise exception 'public.log_people must exist before applying log person edit RPC migration';
  end if;

  if to_regprocedure('private.can_edit_log(uuid)') is null then
    raise exception 'private.can_edit_log(uuid) must exist before applying log person edit RPC migration';
  end if;

  if to_regprocedure('private.is_accepted_friend(uuid)') is null then
    raise exception 'private.is_accepted_friend(uuid) must exist before applying log person edit RPC migration';
  end if;
end $$;

create or replace function public.create_log_person(
  p_log_id uuid,
  p_display_name text,
  p_user_id uuid default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_display_name text;
  v_log_person public.log_people%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'You must be signed in to add a person.'
      using errcode = '42501';
  end if;

  if p_log_id is null then
    raise exception 'Log id is required.'
      using errcode = '22023';
  end if;

  if not private.can_edit_log(p_log_id) then
    raise exception 'Log not found or you do not have permission to manage people.'
      using errcode = '42501';
  end if;

  v_display_name := btrim(coalesce(p_display_name, ''));

  if v_display_name = '' then
    raise exception 'Person name is required.'
      using errcode = '22023';
  end if;

  if char_length(v_display_name) > 80 then
    raise exception 'Person name must be 80 characters or fewer.'
      using errcode = '22001';
  end if;

  if p_user_id is not null and not private.is_accepted_friend(p_user_id) then
    raise exception 'Account-backed people must be accepted friends.'
      using errcode = '42501';
  end if;

  if p_user_id is not null and exists (
    select 1
    from public.log_people
    where log_people.log_id = p_log_id
      and log_people.user_id = p_user_id
  ) then
    raise exception 'This person is already on the log.'
      using errcode = '23505';
  end if;

  insert into public.log_people (log_id, display_name, user_id)
  values (p_log_id, v_display_name, p_user_id)
  returning *
  into v_log_person;

  return to_jsonb(v_log_person);
end;
$$;

create or replace function public.delete_log_person(
  p_log_person_id uuid,
  p_expected_updated_at timestamptz
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_existing_log_person public.log_people%rowtype;
  v_deleted_log_person public.log_people%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'You must be signed in to remove a person.'
      using errcode = '42501';
  end if;

  if p_log_person_id is null then
    raise exception 'Person id is required.'
      using errcode = '22023';
  end if;

  if p_expected_updated_at is null then
    raise exception 'Expected updated_at is required.'
      using errcode = '22023';
  end if;

  select log_people.*
  into v_existing_log_person
  from public.log_people
  where log_people.id = p_log_person_id;

  if not found or not private.can_edit_log(v_existing_log_person.log_id) then
    raise exception 'Person not found or you do not have permission to remove them.'
      using errcode = '42501';
  end if;

  delete from public.log_people
  where log_people.id = p_log_person_id
    and log_people.updated_at = p_expected_updated_at
  returning *
  into v_deleted_log_person;

  if not found then
    raise exception 'This person was updated by someone else.'
      using errcode = 'P0001';
  end if;

  return jsonb_build_object(
    'id', v_deleted_log_person.id,
    'log_id', v_deleted_log_person.log_id,
    'user_id', v_deleted_log_person.user_id
  );
end;
$$;

revoke all on function public.create_log_person(uuid, text, uuid) from public;
revoke all on function public.create_log_person(uuid, text, uuid) from anon;
revoke all on function public.create_log_person(uuid, text, uuid) from authenticated;
grant execute on function public.create_log_person(uuid, text, uuid) to authenticated;

revoke all on function public.delete_log_person(uuid, timestamptz) from public;
revoke all on function public.delete_log_person(uuid, timestamptz) from anon;
revoke all on function public.delete_log_person(uuid, timestamptz) from authenticated;
grant execute on function public.delete_log_person(uuid, timestamptz) to authenticated;

comment on function public.create_log_person(uuid, text, uuid)
  is 'Adds one manual or accepted-friend person to a log. Only the log creator can manage people/access.';

comment on function public.delete_log_person(uuid, timestamptz)
  is 'Removes one person from a log after checking creator access and the caller''s expected updated_at value.';

notify pgrst, 'reload schema';

commit;
