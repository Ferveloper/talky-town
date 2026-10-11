# Project Structure

## Root

```txt
talkytown/
  apps/
  packages/
  docs/
  docker-compose.yml
  package.json
  pnpm-workspace.yaml
  turbo.json
  tsconfig.base.json
  README.md
  AGENTS.md
```

## Apps

### `apps/web`

Next.js application.

Phase 8 structure:

- app/(public): landing, demo login and safe-use guidance.
- app/(authenticated): verified adult layout, profiles, child routes and adult routes.
- app/api: explicit same-origin BFF Route Handlers; no arbitrary catch-all proxy.
- lib/server: server-only cookie/BFF and layout identity verification.
- lib/api.ts and lib/pending.ts: typed browser transport and bounded immutable operations.
- components: reusable UI/layout/profile/conversation/gamification/parent/provider/safety groups.
- public/avatars: local Luna and dedicated Max PNGs.
- test: actual Route Handler, pending-storage and React boundary tests.
- e2e: real Next/Nest/PostgreSQL/Mock journeys, controlled HTTP faults and visual/axe checks.
- scripts/run-e2e.mjs: isolated database gate, fixture ownership, production servers and cleanup.

Shared frontend-contracts.ts names existing start/list wrappers without changing wire
responses. API test/helpers/browser-fixtures.ts and browser-admin.ts are test-owned
CLI fixtures only, with no HTTP test endpoint and no production domain changes.

Responsibilities:

- Child-facing UI.
- Parent dashboard.
- AI provider settings UI.
- Design system implementation.
- API consumption.

### `apps/api`

NestJS application.

Responsibilities:

- Auth and demo login.
- Child profile management.
- Conversations.
- Missions.
- Gamification.
- Safety.
- AI provider orchestration.
- Prisma database access.
- Swagger/OpenAPI.

Database assets live in `apps/api/prisma/`:

- `schema.prisma` and ordered `migrations/` define persistence.
- `seed.ts` runs transactional `seed-demo.ts` with deterministic `demo-history.ts` fixtures.
- `verify-seed.ts` runs read-only checks from `seed-verification.ts`.
- `test/domain-database.spec.ts` and `vitest.database.config.ts` provide opt-in PostgreSQL checks.

Phase 3 added persistence. Phase 4 adds auth, child-profiles, avatars, missions,
conversations, ai-providers, safety, gamification and progress modules under src.
Controllers expose transport; application services orchestrate; rule files hold
deterministic mission/reward/safety/vocabulary policies. common/PersistenceIds
centralizes idempotency IDs; MissionEvaluationService isolates mission strategy.

## Packages

### `packages/shared`

Shared TypeScript contracts:

- DTOs.
- Enums.
- Domain types.
- Validation schemas, if shared.
- Inclusive mission age ranges, badge/vocabulary summaries and English vocabulary normalization.
- Initial mission/avatar/profile definitions reused by demo database seeding.

### `packages/ai-core`

AI provider abstraction:

- Provider interface.
- Conversation request/response types.
- Mock provider.
- Mock has its own runtime; cloud/local share the OpenAI-compatible adapter introduced in Phase 5.
- Safety-related types.

Phase 5 extends ai-core with pedagogical Zod schema/parser, pure prompt composition,
provider errors and the shared OpenAI-compatible adapter/transport interface.
API ai-providers owns runtime registry, configuration/test routes, SSRF URL policy,
safe fetch and the in-memory limiter. Non-secret server policy lives in
config/ai-runtime-policy.json. Existing conversations retain orchestration and
transactions with pinned-session resolution; domain rule owners remain unchanged.
Tests include local fake HTTP servers and actual PostgreSQL persistence checks.

Phase 6 extends existing safety rules/service with pure safety-responses templates.
Conversations use a prepared-operation union and content-bearing response guards.
Safety unit/HTTP/PostgreSQL suites cover contextual rules and Phase 4/5 invariants;
policy and administrative alias recovery live in docs/safety.md.

Phase 7 expands gamification with pure level/calendar/badge rules, canonical
catalog synchronization, persisted evidence linkage and historical reconciliation.
Existing conversation persistence orchestrates atomic awards and completion XP.
Response mappers/progress derive values on reads using ApplicationClock.
`prisma/sync-badge-catalog.ts` and `prisma/reconcile-gamification.ts` expose
administrative commands. Seed shares the synchronizer and preserves award provenance.
Shared API contracts include numeric level, progress catalog and EndSessionResponse.
No Prisma schema/migration or frontend files change.
