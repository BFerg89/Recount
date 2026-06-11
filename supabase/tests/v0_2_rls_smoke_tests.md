# v0.2 RLS Smoke Tests

Purpose: lightweight acceptance checks for the current tagged-log visibility
model.

Scope:
- `public.logs`
- `public.log_people`
- `public.timeline_events`
- `public.notes`
- helper functions in `private`

Assumptions:
- `owner_profile_id`
- `tagged_friend_profile_id`
- `untagged_friend_profile_id`
- `stranger_profile_id`
- the owner has an accepted friendship with both friend profiles
- only `tagged_friend_profile_id` is attached to the test log through
  `log_people.user_id`

## Seed shape

Create one owner log with:
- one `logs` row owned by `owner_profile_id`
- one `log_people` row with only `display_name`
- one `log_people` row with `user_id = tagged_friend_profile_id`
- at least one `timeline_events` row
- at least one `notes` row

Do not tag `untagged_friend_profile_id`.

## Expected cases

1. Owner can view and edit
- As the owner session:
  - `select` from `logs`, `log_people`, `timeline_events`, and `notes` for the
    test log returns rows.
  - `update public.logs set title = ... where id = :log_id` updates one row.
  - `insert` into `log_people`, `timeline_events`, and `notes` succeeds.

2. Tagged accepted friend can view
- As `tagged_friend_profile_id`:
  - `select` from `logs` for the test log returns exactly one row.
  - `select` from `log_people`, `timeline_events`, and `notes` for the test log
    returns rows.
  - `private.can_view_log(:log_id)` should evaluate true when tested from that
    authenticated context.

3. Untagged accepted friend cannot view
- As `untagged_friend_profile_id`:
  - `select` from `logs` for the test log returns zero rows.
  - child-table selects keyed by the test `log_id` return zero rows.
  - `private.can_view_log(:log_id)` should evaluate false from that context.

4. Stranger cannot view
- As `stranger_profile_id` with no accepted friendship to the owner:
  - `select` from `logs` for the test log returns zero rows.
  - child-table selects keyed by the test `log_id` return zero rows.
  - `private.can_view_log(:log_id)` should evaluate false from that context.

5. Tagged friend cannot edit
- As `tagged_friend_profile_id`:
  - `update public.logs ... where id = :log_id` updates zero rows.
  - `insert` into `log_people`, `timeline_events`, or `notes` for the test log
    fails or affects zero rows under RLS.
  - `delete from public.logs where id = :log_id` affects zero rows.

## How to run

Use any one of these approaches:
- real app sessions for four test users
- Supabase SQL editor or psql with authenticated-role JWT context switching
- a future automated Postgres policy test harness

## Useful policy/function checkpoints

- `logs_select_visible`
- `log_people_select_for_visible_logs`
- `timeline_events_select_for_visible_logs`
- `notes_select_for_visible_logs`
- `private.can_edit_log(uuid)`
- `private.is_accepted_friend(uuid)`
- `private.can_view_log(uuid)`
- `private.can_view_log(uuid, uuid)`
