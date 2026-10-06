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

Phase 3 adds persistence only; domain CRUD modules belong to the next backend phase.

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
- OpenAI-compatible adapter.
- Safety-related types.
