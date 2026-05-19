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

## Packages

### `packages/shared`

Shared TypeScript contracts:

- DTOs.
- Enums.
- Domain types.
- Validation schemas, if shared.

### `packages/ai-core`

AI provider abstraction:

- Provider interface.
- Conversation request/response types.
- Mock provider.
- OpenAI-compatible adapter.
- Safety-related types.
