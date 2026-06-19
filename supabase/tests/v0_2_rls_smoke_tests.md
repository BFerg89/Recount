# Shared Log Collaboration RLS Smoke Tests

Purpose: lightweight acceptance checks for the current tagged-log collaboration
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

1. Owner can view, edit, and delete
- As the owner session:
  - `select` from `logs`, `log_people`, `timeline_events`, and `notes` for the
    test log returns rows.
  - `update public.logs set title = ... where id = :log_id` updates one row.
  - `insert` into `log_people`, `timeline_events`, and `notes` succeeds.
  - `delete from public.logs where id = :disposable_log_id` affects one row when
    run against a disposable owner-created log.

2. Tagged accepted friend can view and edit shared content
- As `tagged_friend_profile_id`:
  - `select` from `logs` for the test log returns exactly one row.
  - `select` from `log_people`, `timeline_events`, and `notes` for the test log
    returns rows.
  - `private.can_view_log(:log_id)` should evaluate true when tested from that
    authenticated context.
  - `private.can_contribute_to_log(:log_id)` should evaluate true when tested
    from that authenticated context.
  - `update public.logs set title = ... where id = :log_id` updates one row.
  - `insert` into `timeline_events` for the test log succeeds.
  - `update public.timeline_events ... where log_id = :log_id` updates one
    visible row.
  - `delete from public.timeline_events where id = :friend_created_event_id`
    affects one row.
  - `insert` into `notes` for the test log succeeds with
    `author_id = tagged_friend_profile_id`.
  - `update public.notes ... where log_id = :log_id` updates one visible row.
  - `delete from public.notes where id = :friend_created_note_id` affects one
    row.

3. Untagged accepted friend cannot view
- As `untagged_friend_profile_id`:
  - `select` from `logs` for the test log returns zero rows.
  - child-table selects keyed by the test `log_id` return zero rows.
  - `private.can_view_log(:log_id)` should evaluate false from that context.
  - `private.can_contribute_to_log(:log_id)` should evaluate false from that
    context.
  - update, insert, and delete attempts against the test log's child rows fail
    or affect zero rows under RLS.

4. Stranger cannot view
- As `stranger_profile_id` with no accepted friendship to the owner:
  - `select` from `logs` for the test log returns zero rows.
  - child-table selects keyed by the test `log_id` return zero rows.
  - `private.can_view_log(:log_id)` should evaluate false from that context.
  - `private.can_contribute_to_log(:log_id)` should evaluate false from that
    context.
  - update, insert, and delete attempts against the test log's child rows fail
    or affect zero rows under RLS.

5. Tagged accepted friend can leave but cannot delete the log
- As `tagged_friend_profile_id`:
  - `delete from public.logs where id = :log_id` affects zero rows.
  - `delete from public.log_people where log_id = :log_id and user_id = :tagged_friend_profile_id`
    affects one row.
  - After leaving, `select` from `logs` for the test log returns zero rows unless
    the user is re-added.
  - After leaving, `private.can_view_log(:log_id)` and
    `private.can_contribute_to_log(:log_id)` both evaluate false.

Run the leave checks after cases that require tagged access, or reseed the
account-backed `log_people` row before continuing.

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
- `private.can_contribute_to_log(uuid)`
- `private.can_contribute_to_log(uuid, uuid)`
- `logs_update_visible_contributors`
- `timeline_events_insert_for_visible_contributors`
- `timeline_events_update_for_visible_contributors`
- `timeline_events_delete_for_visible_contributors`
- `notes_insert_for_visible_contributors`
- `notes_update_for_visible_contributors`
- `notes_delete_for_visible_contributors`
- `log_people_delete_self_tag`
