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
- Mock runtime only in Phase 4; OpenAI-compatible adapters remain future work.
- Safety-related types.

Phase 5 extends ai-core with pedagogical Zod schema/parser, pure prompt composition,
provider errors and the shared OpenAI-compatible adapter/transport interface.
API ai-providers owns runtime registry, configuration/test routes, SSRF URL policy,
safe fetch and the in-memory limiter. Non-secret server policy lives in
config/ai-runtime-policy.json. Existing conversations retain orchestration and
transactions with pinned-session resolution; domain rule owners remain unchanged.
Tests include local fake HTTP servers and actual PostgreSQL persistence checks.
