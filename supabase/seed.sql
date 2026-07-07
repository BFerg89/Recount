begin;

-- Recount disposable test database seed.
-- This file intentionally creates public E2E fixture accounts documented in
-- ON_DEVICE_TESTS.md. Do not run it against production.

with fixture_users (id, email) as (
  values
    ('10000000-0000-4000-8000-000000000001'::uuid, 'e2e.owner@recount.test'),
    ('10000000-0000-4000-8000-000000000002'::uuid, 'e2e.friend@recount.test'),
    ('10000000-0000-4000-8000-000000000003'::uuid, 'e2e.empty@recount.test'),
    ('10000000-0000-4000-8000-000000000004'::uuid, 'e2e.stranger@recount.test'),
    ('10000000-0000-4000-8000-000000000005'::uuid, 'e2e.pending@recount.test')
)
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
select
  fixture_users.id,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  fixture_users.email,
  extensions.crypt('RecountE2E!2026', extensions.gen_salt('bf')),
  '2026-07-06 12:00:00+00'::timestamptz,
  '2026-07-06 12:00:00+00'::timestamptz,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{}'::jsonb,
  '2026-07-06 12:00:00+00'::timestamptz,
  '2026-07-06 12:00:00+00'::timestamptz
from fixture_users
on conflict (id) do update
set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = excluded.updated_at;

do $$
declare
  fixture_created_at constant timestamptz := '2026-07-06 12:00:00+00';
  identity_id_type text;
  has_provider_id boolean;
  insert_columns text;
  insert_values text;
  fixture_user record;
begin
  select columns.data_type
    into identity_id_type
  from information_schema.columns
  where columns.table_schema = 'auth'
    and columns.table_name = 'identities'
    and columns.column_name = 'id';

  select exists (
    select 1
    from information_schema.columns
    where columns.table_schema = 'auth'
      and columns.table_name = 'identities'
      and columns.column_name = 'provider_id'
      and columns.is_generated = 'NEVER'
  )
    into has_provider_id;

  for fixture_user in
    select *
    from (
      values
        ('10000000-0000-4000-8000-000000000001'::uuid, 'e2e.owner@recount.test'),
        ('10000000-0000-4000-8000-000000000002'::uuid, 'e2e.friend@recount.test'),
        ('10000000-0000-4000-8000-000000000003'::uuid, 'e2e.empty@recount.test'),
        ('10000000-0000-4000-8000-000000000004'::uuid, 'e2e.stranger@recount.test'),
        ('10000000-0000-4000-8000-000000000005'::uuid, 'e2e.pending@recount.test')
    ) as fixture_users (id, email)
  loop
    delete from auth.identities
    where user_id = fixture_user.id
      and provider = 'email';

    insert_columns := 'id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at';
    insert_values := case
      when identity_id_type = 'uuid' then '$1::uuid'
      else '$1::text'
    end || ', $2::uuid, $3::jsonb, ''email'', $4::timestamptz, $4::timestamptz, $4::timestamptz';

    if has_provider_id then
      insert_columns := insert_columns || ', provider_id';
      insert_values := insert_values || ', $5::text';
    end if;

    execute format(
      'insert into auth.identities (%s) values (%s)',
      insert_columns,
      insert_values
    )
    using
      fixture_user.id::text,
      fixture_user.id,
      jsonb_build_object(
        'sub', fixture_user.id::text,
        'email', fixture_user.email,
        'email_verified', true,
        'phone_verified', false
      ),
      fixture_created_at,
      fixture_user.id::text;
  end loop;
end $$;

insert into public.profiles (id, username, nickname, created_at, updated_at)
values
  ('10000000-0000-4000-8000-000000000001', 'e2e_owner', 'E2E Owner', '2026-07-06 12:01:00+00', '2026-07-06 12:01:00+00'),
  ('10000000-0000-4000-8000-000000000002', 'e2e_friend', 'E2E Friend', '2026-07-06 12:01:00+00', '2026-07-06 12:01:00+00'),
  ('10000000-0000-4000-8000-000000000003', 'e2e_empty', 'E2E Empty', '2026-07-06 12:01:00+00', '2026-07-06 12:01:00+00'),
  ('10000000-0000-4000-8000-000000000004', 'e2e_stranger', 'E2E Stranger', '2026-07-06 12:01:00+00', '2026-07-06 12:01:00+00'),
  ('10000000-0000-4000-8000-000000000005', 'e2e_pending', 'E2E Pending', '2026-07-06 12:01:00+00', '2026-07-06 12:01:00+00')
on conflict (id) do update
set
  username = excluded.username,
  nickname = excluded.nickname,
  updated_at = excluded.updated_at;

insert into public.friendships (
  id,
  requester_id,
  addressee_id,
  status,
  created_at,
  updated_at
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    'accepted',
    '2026-07-06 12:02:00+00',
    '2026-07-06 12:02:00+00'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000005',
    'pending',
    '2026-07-06 12:03:00+00',
    '2026-07-06 12:03:00+00'
  )
on conflict (id) do update
set
  requester_id = excluded.requester_id,
  addressee_id = excluded.addressee_id,
  status = excluded.status,
  updated_at = excluded.updated_at;

insert into public.logs (
  id,
  creator_id,
  title,
  date,
  general_location,
  created_at,
  updated_at
)
values
  (
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'E2E Shared Night',
    '2026-07-04',
    'Vancouver',
    '2026-07-04 20:00:00+00',
    '2026-07-04 20:00:00+00'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'E2E Owner Private Log',
    '2026-06-29',
    'Seattle',
    '2026-06-29 20:00:00+00',
    '2026-06-29 20:00:00+00'
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000002',
    'E2E Friend Untagged Log',
    '2026-06-21',
    'Portland',
    '2026-06-21 20:00:00+00',
    '2026-06-21 20:00:00+00'
  ),
  (
    '30000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000001',
    'E2E Minimal Log',
    '2026-06-01',
    'Victoria',
    '2026-06-01 20:00:00+00',
    '2026-06-01 20:00:00+00'
  )
on conflict (id) do update
set
  creator_id = excluded.creator_id,
  title = excluded.title,
  date = excluded.date,
  general_location = excluded.general_location,
  updated_at = excluded.updated_at;

insert into public.log_people (
  id,
  log_id,
  display_name,
  user_id,
  created_at,
  updated_at
)
values
  (
    '40000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    'E2E Owner',
    '10000000-0000-4000-8000-000000000001',
    '2026-07-04 20:01:00+00',
    '2026-07-04 20:01:00+00'
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000001',
    'E2E Friend',
    '10000000-0000-4000-8000-000000000002',
    '2026-07-04 20:01:00+00',
    '2026-07-04 20:01:00+00'
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000001',
    'Manual Guest',
    null,
    '2026-07-04 20:01:00+00',
    '2026-07-04 20:01:00+00'
  ),
  (
    '40000000-0000-4000-8000-000000000004',
    '30000000-0000-4000-8000-000000000002',
    'E2E Owner',
    '10000000-0000-4000-8000-000000000001',
    '2026-06-29 20:01:00+00',
    '2026-06-29 20:01:00+00'
  ),
  (
    '40000000-0000-4000-8000-000000000005',
    '30000000-0000-4000-8000-000000000003',
    'E2E Friend',
    '10000000-0000-4000-8000-000000000002',
    '2026-06-21 20:01:00+00',
    '2026-06-21 20:01:00+00'
  )
on conflict (id) do update
set
  log_id = excluded.log_id,
  display_name = excluded.display_name,
  user_id = excluded.user_id,
  updated_at = excluded.updated_at;

insert into public.timeline_events (
  id,
  log_id,
  title,
  approx_time,
  sort_order,
  created_at,
  updated_at
)
values
  (
    '50000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    'Pre-game at the apartment',
    '8:15 PM',
    0,
    '2026-07-04 20:15:00+00',
    '2026-07-04 20:15:00+00'
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000001',
    'Walked to the main stop',
    '10:05 PM',
    1,
    '2026-07-04 22:05:00+00',
    '2026-07-04 22:05:00+00'
  ),
  (
    '50000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000001',
    'Late-night food',
    null,
    2,
    '2026-07-05 01:30:00+00',
    '2026-07-05 01:30:00+00'
  ),
  (
    '50000000-0000-4000-8000-000000000004',
    '30000000-0000-4000-8000-000000000002',
    'Quiet dinner',
    '7:30 PM',
    0,
    '2026-06-29 19:30:00+00',
    '2026-06-29 19:30:00+00'
  ),
  (
    '50000000-0000-4000-8000-000000000005',
    '30000000-0000-4000-8000-000000000003',
    'Friend-only stop',
    '9:00 PM',
    0,
    '2026-06-21 21:00:00+00',
    '2026-06-21 21:00:00+00'
  )
on conflict (id) do update
set
  log_id = excluded.log_id,
  title = excluded.title,
  approx_time = excluded.approx_time,
  sort_order = excluded.sort_order,
  updated_at = excluded.updated_at;

insert into public.notes (
  id,
  log_id,
  timeline_event_id,
  author_id,
  prompt_type,
  text,
  created_at,
  updated_at
)
values
  (
    '60000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    null,
    '10000000-0000-4000-8000-000000000001',
    'highlight',
    'Everyone arrived before the first round ended.',
    '2026-07-04 20:30:00+00',
    '2026-07-04 20:30:00+00'
  ),
  (
    '60000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000001',
    null,
    '10000000-0000-4000-8000-000000000001',
    'quote_of_the_night',
    'We are calling this a strategy, not a detour.',
    '2026-07-04 20:31:00+00',
    '2026-07-04 20:31:00+00'
  ),
  (
    '60000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000001',
    null,
    '10000000-0000-4000-8000-000000000002',
    'side_quest',
    'A five-minute walk became the main plot.',
    '2026-07-04 20:32:00+00',
    '2026-07-04 20:32:00+00'
  ),
  (
    '60000000-0000-4000-8000-000000000004',
    '30000000-0000-4000-8000-000000000002',
    null,
    '10000000-0000-4000-8000-000000000001',
    'highlight',
    'A low-key night that still made the archive.',
    '2026-06-29 20:30:00+00',
    '2026-06-29 20:30:00+00'
  ),
  (
    '60000000-0000-4000-8000-000000000005',
    '30000000-0000-4000-8000-000000000003',
    null,
    '10000000-0000-4000-8000-000000000002',
    'highlight',
    'A friend-only control log for visibility tests.',
    '2026-06-21 21:30:00+00',
    '2026-06-21 21:30:00+00'
  )
on conflict (id) do update
set
  log_id = excluded.log_id,
  timeline_event_id = excluded.timeline_event_id,
  author_id = excluded.author_id,
  prompt_type = excluded.prompt_type,
  text = excluded.text,
  updated_at = excluded.updated_at;

commit;
