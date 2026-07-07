# Recount Maestro Suite

These flows target the iOS app id `com.bferg89.recount`. They assume the app is installed on the simulator and pointed at the test database.

Run one flow at a time while stabilizing:

```sh
maestro test .maestro/00_auth_validation_ios.yaml
```

Run the non-destructive fixture and smoke coverage first:

```sh
maestro test .maestro/00_auth_validation_ios.yaml
maestro test .maestro/01_fixture_owner_home_detail_ios.yaml
maestro test .maestro/02_fixture_friend_permissions_ios.yaml
maestro test .maestro/03_fixture_empty_stranger_pending_ios.yaml
maestro test .maestro/09_navigation_deep_links_ios.yaml
maestro test .maestro/10_home_detail_regression_ios.yaml
maestro test .maestro/12_profile_session_ios.yaml
maestro test .maestro/14_visual_smoke_ios.yaml
```

Run destructive or state-changing flows only against a resettable test DB:

```sh
maestro test .maestro/04_create_log_validation_and_draft_ios.yaml
maestro test .maestro/05_create_input_caps_layout_ios.yaml
maestro test .maestro/06_creator_edit_flow_ios.yaml
maestro test .maestro/07_shared_collaboration_ios.yaml
maestro test .maestro/08_shared_revoke_leave_delete_ios.yaml
maestro test .maestro/11_friend_flow_destructive_ios.yaml
maestro test .maestro/13_throwaway_signup_delete_account_ios.yaml
```

The destructive flows create temporary records and usually clean up their own
logs, but friendship and account lifecycle flows still depend on seeded starting
state. Reset the disposable database if one of those flows fails halfway.

Network-offline checks, true multi-device stale-state checks, exact seeded valid
deep links, native compact date-picker edge cases, and some visual/touch-target
judgment checks are tracked in `COVERAGE.md` as manual or deferred.
