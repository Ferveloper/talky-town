# Codex Prompt — Phase 2 Technical Setup

Use the following prompt to ask Codex to implement the project foundation.

---

I am building **TalkyTown**, a gamified AI language learning web application for children aged 5 to 12.

The repository currently contains initial documentation and root configuration files. Your task is to implement **Phase 2 — Technical project setup**.

## Product context

TalkyTown lets children practice English through friendly AI avatars, guided missions, free conversation, gentle corrections, XP, badges and learning progress.

The MVP must support:

- Demo mode without external AI keys.
- Child profiles.
- AI provider abstraction.
- Mock provider.
- Cloud OpenAI-compatible provider later.
- Local OpenAI-compatible provider later, for Ollama or LM Studio.
- Parent dashboard later.
- Child-safe UX and safety guardrails later.

For this task, focus only on the technical foundation. Do not implement the full product yet.

## Required stack

- Monorepo: pnpm workspaces + Turborepo
- Frontend: Next.js + TypeScript
- UI: Tailwind CSS + shadcn/ui-ready structure
- Backend: NestJS + TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Testing: Vitest + Supertest
- E2E: Playwright-ready structure
- Local infra: Docker Compose

## Required structure

Create or complete this structure:

```txt
apps/
  web/
  api/

packages/
  shared/
  ai-core/

docs/
  development/
  design/
  architecture/
  api/
  setup/
```

## Tasks

1. Configure the pnpm monorepo.
2. Configure Turborepo.
3. Configure shared TypeScript settings.
4. Initialize `apps/web` as a Next.js TypeScript app.
5. Configure Tailwind in `apps/web`.
6. Create a minimal TalkyTown landing page in `apps/web`.
7. Initialize `apps/api` as a NestJS TypeScript app.
8. Add a basic health endpoint in the API:
   - `GET /health`
   - returns `{ "status": "ok", "service": "talkytown-api" }`
9. Configure Swagger/OpenAPI in the API at `/docs`.
10. Configure Prisma in `apps/api`.
11. Add a basic Prisma schema with placeholder models:
    - `User`
    - `ChildProfile`
    - `Avatar`
    - `Mission`
    - `ConversationSession`
    - `ConversationTurn`
    - `Badge`
    - `XpEvent`
    - `AiProviderConfig`
    - `SafetyEvent`
12. Create a seed script with:
    - one demo user
    - two demo child profiles
    - two avatars
    - four missions
    - five badges
13. Configure PostgreSQL through the root `docker-compose.yml`.
14. Create `packages/shared` with initial exported types.
15. Create `packages/ai-core` with:
    - provider interface
    - mock provider skeleton
    - conversation request/response types
16. Configure root scripts:
    - `dev`
    - `build`
    - `test`
    - `lint`
    - `typecheck`
    - `db:migrate`
    - `db:seed`
    - `db:studio`
17. Configure linting and formatting.
18. Configure basic tests:
    - API health test
    - mock AI provider test
19. Make sure `.env.example` matches the implementation.
20. Update README if any setup step changes.

## Important rules

- Keep the app runnable after every change.
- Do not implement real external AI calls yet.
- Do not require real API keys.
- Use the mock provider as the default.
- Do not hardcode secrets.
- Keep code clean and typed.
- Prefer simple working implementation over over-engineering.
- Do not remove documentation files.
- Follow AGENTS.md.

## Acceptance criteria

After your changes, these commands should work:

```bash
pnpm install
docker compose up -d postgres
pnpm db:migrate
pnpm db:seed
pnpm dev
pnpm lint
pnpm test
pnpm build
```

Expected local URLs:

- Web: `http://localhost:3000`
- API: `http://localhost:3001`
- API docs: `http://localhost:3001/docs`
- Health: `http://localhost:3001/health`

When done, provide a concise summary of:

- What you created.
- How to run it.
- Any assumptions.
- Any pending manual steps.
