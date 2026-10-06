# Phase 3 - Domain Model and Database Consolidation

## Implementation

- [x] Evolve the existing Prisma schema without replacing the Phase 2 migration.
- [x] Add ChildBadge with inverse relations, unique award and child index.
- [x] Add VocabularyItem with normalization, counters, dates, unique key and child index.
- [x] Replace Mission.ageBand with inclusive minAge/maxAge in schema, shared contracts and seed.
- [x] Add session progress/provider snapshot and turn correction/input-mode fields.
- [x] Link optional XpEvent.sessionId with foreign key, inverse relation and index.
- [x] Replace SafetyEvent.inputSnippet with required category/action metadata.
- [x] Keep provider credentials out of the database; retain mock default.
- [x] Derive progress without a LearningProgress table or AI mastery score.
- [x] Add deterministic demo history, awards, vocabulary and reconciled XP.
- [x] Add migrate-dev, schema validation, read-only verification and PostgreSQL test scripts.
- [x] Document entities, invariants, Mermaid relationships and ADRs 0004/0005.
- [x] Leave frontend screens and API CRUD modules unchanged.

## Validation Procedure

```bash
pnpm install
docker compose up -d --wait postgres
pnpm db:validate
pnpm db:migrate
pnpm db:seed
pnpm db:verify
pnpm db:seed
pnpm db:verify
pnpm test:db
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Both verification fingerprints must match when no other process writes demo data.
Expected fixture counts: one adult, two children, two avatars, four missions, five
badge definitions, four awards, six vocabulary items, four sessions, 22 turns and
14 XP events. Non-demo records may coexist and are not deleted.
`pnpm test:db` requires migrated PostgreSQL and runs the demo seed; default
`pnpm test` remains database-independent. Use a disposable local/demo database.

Record actual command results below after execution. Do not claim a migration or
build passed merely because source files exist.

## Execution Results

Phase 3 acceptance passed on October 5, 2026 with Node.js 24.19.0 and pnpm 9.15.0.
Commands requiring native process spawning were validated in the user's normal
terminal because the agent sandbox denies those processes. The user supplied
successful install, migration, test, database-test and full-build logs.

| Command/check                      | Result                                                                                                                                                                        |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install`                     | Passed in the user's terminal, including all lifecycle scripts and Prisma generation. Dependency versions unchanged; lockfile adds only the shared workspace link.            |
| `pnpm format`, `pnpm format:check` | Passed in the agent environment.                                                                                                                                              |
| `pnpm lint`                        | Passed in all four packages.                                                                                                                                                  |
| `pnpm typecheck`                   | Passed in all four packages.                                                                                                                                                  |
| `pnpm db:validate`                 | Passed.                                                                                                                                                                       |
| `docker compose config --quiet`    | Passed with configurable host port 55432 and TCP healthcheck.                                                                                                                 |
| Compose startup                    | User successfully started PostgreSQL. Prisma Client confirmed readiness on 55432.                                                                                             |
| `pnpm db:migrate`                  | Passed in the user's terminal; both migrations applied. Prisma queries confirmed both finished records in \_prisma_migrations.                                                |
| Seed twice and Prisma verification | Passed using compiled seed/verification code; also passed through the formal database suite. IDs, dates, counters, relationships and fingerprint remained unchanged.          |
| `pnpm test`                        | Passed in the user's terminal: 9 tests (shared 3, AI-core 2, API 4); frontend suite remains scaffolded with no tests.                                                         |
| `pnpm test:db`                     | Passed in the user's terminal: 5 PostgreSQL tests covering rerun stability, unique awards/vocabulary, CHECK constraints and privacy columns.                                  |
| `pnpm build`                       | Passed in the user's terminal: all four packages; Next.js compiled and generated all four static pages.                                                                       |
| Compiled API with Supertest        | Passed independently: GET /health returns the expected 200 JSON response.                                                                                                     |
| Legacy-row migration upgrade       | Passed in an isolated temporary schema: IDs retained, known/custom age ranges backfilled, safety metadata preserved, raw snippet removed. Temporary schema removed afterward. |
| Phase 2 migration SHA-256          | Unchanged: `7C4F3A99B305E838FAB402EF78F086553BEDD330FE155231DF7E0283D315563D`.                                                                                                |

Verified demo counts: one adult, two children, two avatars, four missions, five
badge definitions, four awards, six vocabulary items, four sessions, 22 turns,
14 XP events. Repeated fingerprint in the validated database:
`e085833a46cebdefc854dc011af2c189646db7c25cf332835d7f4b55808e27e4`.
Fresh databases may generate different initial IDs and hashes; reruns within the
same database must match.

## Environment Notes

The user confirmed port 5432 belongs to native Windows PostgreSQL. Ports 5433 and
5434 were also occupied; 55432 was checked free. Compose and `.env.example` now
use configurable host port 55432 while the container still listens on 5432.
The native service is untouched. Initial Prisma P1001 disappeared once PostgreSQL
was ready. Setup commands now use `--wait` with a TCP healthcheck.

Agent attempts to run Docker's Windows pipe, native Prisma migrations, tsx/Vitest
and the Next.js worker hit permission denied/`spawn EPERM`. Normal-terminal logs
confirmed these are environment restrictions, not failing project commands.
Direct CLI `db:seed`/`db:verify` were blocked in that sandbox; the same seed logic
ran repeatedly through Prisma and the normal-terminal database suite.

No reset or volume deletion was used. CHECK violations expose constraint names
through Prisma's unclassified PostgreSQL error; tests match those names rather
than assuming P2004.

Nonblocking warnings in the successful logs: pnpm's Node `url.parse()`
deprecation, Vite's CJS API deprecation and a shutdown-timeout warning from the
empty frontend Vitest scaffold. Frontend test expansion and toolchain upgrades
remain future work, without changing screens in this phase.

All requested Phase 3 implementation and validation gates are satisfied.

## Changed Files

- Root: `.prettierignore`, `.env.example`, `docker-compose.yml`, `package.json`, `pnpm-lock.yaml`, `README.md`.
- API configuration: `apps/api/package.json`, `tsconfig.json`, `vitest.config.ts`, `vitest.database.config.ts`.
- API Prisma: `schema.prisma`, `seed.ts`, `seed-demo.ts`, `demo-history.ts`,
  `seed-verification.ts`, `verify-seed.ts`, `migrations/migration_lock.toml`,
  `migrations/20261005210000_phase3_domain_model/migration.sql`.
- API tests: `test/demo-history.spec.ts`, `test/domain-database.spec.ts`.
- Shared: `packages/shared/src/index.ts`, `packages/shared/src/vocabulary.test.ts`.
- Documentation: this checklist, `docs/architecture/domain-model.md`, ADRs 0004/0005,
  `docs/development/conventions.md`, `docs/development/project-structure.md`,
  `docs/setup/local-development.md`.

No frontend source or existing Phase 2 migration was changed. No real AI calls,
API CRUD modules, provider secrets or raw audio storage were added.

## Deferred Work

- Backend CRUD, authorization, DTO validation and frontend integration.
- Transactional live conversation writes, pre-persistence safety screening.
- Level/badge rules, timezone-aware streak calculation and cache rebuilding.
- Data retention limits and legacy-content review before any non-demo deployment.
