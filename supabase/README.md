# Supabase Local Canonical Files

This folder is now the canonical repo-local location for NightLog Supabase
migrations and backend smoke-test notes.

## What changed on 2026-06-11

- `supabase/migrations/` was created inside the real app repo at `NightLog/`.
- The existing SQL files from outer-workspace `SupabaseMisc/` were mirrored into
  ordered migration files here.
- The mirrored files preserve the original SQL content exactly.

## Important status

- These migration filenames were created locally on 2026-06-11 to establish a
  canonical order for this checkout.
- They are not proof that remote Supabase migration history already matches
  these timestamps.
- `SupabaseMisc/` remains the source archive for the older standalone SQL files,
  but new local migration work should start here.

## Current local migration order

1. `migrations/202606110001_v0_1.sql`
2. `migrations/202606110002_profiles.sql`
3. `migrations/202606110003_friendships.sql`
4. `migrations/202606110004_list_friendships_rpc.sql`
5. `migrations/202606110005_rename_logs.sql`
6. `migrations/202606110006_log_friend_tags.sql`
7. `migrations/202606110007_create_log_rpc_and_text_limits.sql`
8. `migrations/202606120001_validate_text_limit_constraints.sql`
9. `migrations/20260619021219_shared_log_collaboration_rls.sql`

## Known backend state

- `log_people.user_id` is present in the local tagged-friends migration.
- The 2026-06-10 review handoff says live metadata also showed
  `log_people.user_id` and visible-log RLS.
- Users added to a log through `log_people.user_id` can view and edit shared log
  content once they have access through the tagged-friends rules.
- Added users can leave a shared log by deleting only their own account-backed
  `log_people` row.
- Only the log creator can delete the parent `logs` row.
- create-log is handled through `public.create_log(payload jsonb)` so parent and
  child inserts happen in one transaction.

## Manual follow-up when Bennett is ready

1. Install or expose the Supabase CLI locally.
2. Inspect `supabase --version` and `supabase --help`.
3. Decide whether to initialize/link the repo and reconcile remote history with
   this local migration set.
4. Only after that, treat CLI migration status as authoritative.
