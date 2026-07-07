# ON_DEVICE_TESTS.md Maestro Coverage

## Automated

- Test setup and fixture login coverage:
  - `01_fixture_owner_home_detail_ios.yaml`
  - `02_fixture_friend_permissions_ios.yaml`
  - `03_fixture_empty_stranger_pending_ios.yaml`
- Auth and profile smoke:
  - `00_auth_validation_ios.yaml`
  - `12_profile_session_ios.yaml`
  - `13_throwaway_signup_delete_account_ios.yaml`
- Onboarding validation:
  - `13_throwaway_signup_delete_account_ios.yaml`
  - invalid username cases are also exercised through profile lookup in
    `11_friend_flow_destructive_ios.yaml`
- App navigation and protected routes:
  - `09_navigation_deep_links_ios.yaml`
  - `10_home_detail_regression_ios.yaml`
- Create log flow and input behavior:
  - `04_create_log_validation_and_draft_ios.yaml`
  - `05_create_input_caps_layout_ios.yaml`
- Creator edit flow:
  - `06_creator_edit_flow_ios.yaml`
- Shared access and permissions:
  - `02_fixture_friend_permissions_ios.yaml`
  - `07_shared_collaboration_ios.yaml`
  - `08_shared_revoke_leave_delete_ios.yaml`
- Home and detail regression:
  - `01_fixture_owner_home_detail_ios.yaml`
  - `03_fixture_empty_stranger_pending_ios.yaml`
  - `10_home_detail_regression_ios.yaml`
- Friend flow smoke:
  - `11_friend_flow_destructive_ios.yaml`
- Visual smoke:
  - `14_visual_smoke_ios.yaml`
- Release-oriented smoke:
  - covered across `04`, `07`, `12`, and `13`.

## Manual Or Deferred

- iOS offline/network tests: Maestro's `setAirplaneMode` has no effect on iOS
  simulators, so Airplane Mode, network recovery, privacy-policy offline
  fallback, and offline delete/leave/save retries remain manual unless we add an
  external simulator network control harness.
- Multi-device stale-state tests: Maestro can drive one selected local device per
  run through this MCP workflow. True two-device conflicts remain manual.
- Valid seeded deep links: the live repo references `supabase/seed.sql`, but that
  seed file is not present, so exact seeded log UUIDs are not discoverable
  locally. `09_navigation_deep_links_ios.yaml` automates signed-out, malformed,
  invalid, and unknown-route deep links. Valid owner/friend direct links need
  seeded log ids from the test database.
- Native compact date-picker edge cases: the app uses the iOS compact native date
  picker. Feb 29, Dec 31, Jan 1, far-past, future-date, and cross-month ordering
  tests remain manual until a stable test-only date selector or fixture API is
  available.
- Email confirmation: `13_throwaway_signup_delete_account_ios.yaml` handles the
  "confirmation disabled" path and tolerates the `Please Verify Email` screen.
  Completing an email confirmation loop remains manual.
- Privacy policy browser assertion: the profile flow exercises session/profile
  state. Opening and verifying the external browser and offline fallback remains
  manual because it leaves the app under test.
- Visual judgment checks: `14_visual_smoke_ios.yaml` captures the important
  screens and validates that they render. Fine-grained overlap, touch target,
  splash/icon, and card-edge tap judgment remains manual.
- Account with no profile: the throwaway signup flow covers this when email
  confirmation is disabled. If confirmation is enabled, add a seeded no-profile
  account to automate the relaunch-to-create-profile case.
