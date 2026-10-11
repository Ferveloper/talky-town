# Phase 7 Mock walkthrough and administration

Use the configured local PostgreSQL database with existing migrations. No AI keys
are needed. Run `pnpm gamification:catalog` to initialize the seven definitions
independently of demo data; a second run reports `changed: []`.

For demo fixtures, run `pnpm db:seed`, `pnpm db:verify`, then repeat both. Expected
fixture counts: 2 profiles, 7 definitions, 4 sessions, 22 turns, 14 XP events,
7 awards and 6 vocabulary items. Sofia has 120 XP, numeric level 3, 20/50 progress;
Leo has 35 XP, numeric level 1, 35/50 progress. Both current streaks are zero after
May 19, 2026. Sofia retains the historical three-day badge. Seed preserves existing
runtime awards; verification reports `awardProvenance.demo` and `preservedNonDemo`.
Only demo-owned awards must have exact fixture timestamps. Durable fingerprints
exclude the time-dependent streak cache, which is separately validated as of now.

## Deterministic HTTP/PostgreSQL walkthrough

```bash
pnpm --filter @talkytown/api exec vitest run --config vitest.database.config.ts test/gamification.database-spec.ts -t "deterministic Mock walkthrough"
```

The test injects Madrid-aware dates through ApplicationClock and uses the selected
deterministic Mock provider. No cloud/local inference is called.

1. Create alias-only profile, age 9, proficiency hero, avatar Luna.
2. On May 16, complete Animal Adventure with `dogs`, `I likes dogs`, `cats`.
   Earn 45 XP, First Talk, Kind Corrector, Animal Explorer and Mission Complete.
3. On May 17, repeat with `dogs`, `I like dogs`, `cats`; reach 90 XP.
4. On May 18, repeat; reach 135 XP, Mission Hero and 3 Day Streak.
5. Send three `hello` messages in free talk; the tenth overall event unlocks
   Brave Speaker. End grants 10 completion XP. End again returns identical results.
6. Progress reports 160 XP, numeric level 4, 10/50 progress, streak 3, seven badges,
   four completed sessions, one distinct completed mission, 16 ledger events.

Manual Swagger demo at `/api/docs`: authenticate using `/auth/demo`, create a new
profile and select Mock for new sessions. Complete the same mission sequence and
free talk. Calendar streak advancement is tested with injected dates rather than
changing the machine clock. Selected providers remain pinned per session.

## Historical reconciliation

Set DATABASE_URL to the intended administrative target before running:

```bash
pnpm gamification:reconcile
pnpm gamification:reconcile --child-profile-id PROFILE_ID
pnpm gamification:reconcile --apply --child-profile-id PROFILE_ID
pnpm gamification:reconcile --apply --child-profile-id PROFILE_ID
```

Default dry-run has no writes, including catalog writes. Omitted profile ID scans
all profiles; the command is an administrative CLI, not a child-facing endpoint.
Unknown scoped IDs fail before catalog mutation. Preview lists definition changes,
profile/session cache repairs, supported missing awards and unlinked event IDs.
Apply synchronizes the catalog, then locks each profile using its current owner
and commits each profile independently. Interrupted runs can be rerun safely;
earlier profile commits may already exist. It never creates XP, grants retroactive
free-talk bonuses, changes existing awards, providers, turns, proficiency or vocabulary.
New awards use earliest supported evidence timestamps and source
`phase7-reconciliation`. Historical streak timestamps can differ from preserved
demo fixture dates because reconciliation uses the first third-day practice event.
Repeat apply should report no catalog changes, missing awards or cache changes.
Clock-driven streak decay between runs can legitimately require another cache update.

The acceptance run uses `talkytown_phase7_acceptance`, separate from the normal
development database. Existing migration files are deployed there without creating
or modifying a Prisma migration.
