# TalkyTown

**TalkyTown** is a gamified AI language learning web application for children aged 5 to 12.

The goal of the project is to let children practice English through friendly AI avatars, guided missions, free conversation, gentle corrections, XP, badges and visible learning progress.

This repository is being developed as a Master's Final Project. It prioritizes a professional, demonstrable and well-documented MVP over an oversized unfinished product.

---

## 1. Product vision

TalkyTown is a playful digital town where children can practice English by talking to friendly AI avatars.

The first MVP focuses on:

- Children aged **5 to 12**.
- Spanish-speaking children learning **English**.
- A web application.
- A safe and child-friendly experience.
- Conversation with AI avatars.
- Guided missions and free talk.
- XP, badges, streaks and progress.
- AI provider abstraction, including mock, cloud and local OpenAI-compatible providers.

---

## 2. MVP scope

The first version should allow an evaluator or user to:

1. Enter the app using demo mode.
2. Select or create a child profile.
3. Choose an avatar.
4. Start a free conversation or guided mission.
5. Interact with the avatar by text.
6. Optionally use basic voice input/output if available.
7. Receive friendly language corrections.
8. Gain XP.
9. Unlock basic badges.
10. Review learning progress from a parent dashboard.
11. Switch or configure AI providers.
12. Run the project locally with clear documentation.
13. Access a deployed demo if available.

---

## 3. Tech stack

| Layer         | Technology                          |
| ------------- | ----------------------------------- |
| Monorepo      | pnpm workspaces + Turborepo         |
| Frontend      | Next.js + TypeScript                |
| UI            | Tailwind CSS + shadcn/ui            |
| Animation     | Framer Motion / Lottie              |
| Backend       | NestJS + TypeScript                 |
| Database      | PostgreSQL                          |
| ORM           | Prisma                              |
| AI            | OpenAI-compatible provider adapters |
| Testing       | Vitest + Supertest                  |
| E2E           | Playwright                          |
| Local infra   | Docker Compose                      |
| Deploy target | Vercel + Railway/Render/Fly.io      |

---

## 4. Repository structure

```txt
talkytown/
  apps/
    web/                 # Next.js frontend
    api/                 # NestJS backend
  packages/
    shared/              # Shared TypeScript types, DTOs and utilities
    ai-core/             # AI provider interfaces and adapters
  docs/
    product-scope.md
    ux-flow.md
    development/
    design/
    architecture/
    api/
    setup/
  docker-compose.yml
  pnpm-workspace.yaml
  package.json
  turbo.json
  README.md
  AGENTS.md
```

---

## 5. Local development

### 5.1 Prerequisites

- Node.js 20+
- pnpm 9+
- Docker and Docker Compose
- Git

### 5.2 Install dependencies

```bash
pnpm install
```

### 5.3 Configure environment

```bash
cp .env.example .env
```

Set a private `JWT_SECRET` of at least 32 characters in `.env`. Runtime startup
requires it; no secret is generated automatically. Tests inject a deterministic
test secret. Other example defaults work with the included Compose database.

### 5.4 Start PostgreSQL

```bash
docker compose up -d --wait postgres
```

TalkyTown PostgreSQL listens on `localhost:55432` (container port 5432), leaving
native Windows PostgreSQL on 5432 untouched. To choose another host port, set
`POSTGRES_PORT` in `.env` and update the port in `DATABASE_URL` to match.

### 5.5 Run migrations and seed

```bash
pnpm db:migrate
pnpm db:seed
pnpm db:verify
```

### 5.6 Start development

```bash
pnpm dev
```

Expected apps:

- Web: `http://localhost:3000`
- API: `http://localhost:3001`
- API docs: `http://localhost:3001/docs`
- Health: `http://localhost:3001/health`

The database scripts load defaults from `.env.example` and override them with `.env`
when present, so the first local run works with the included Docker Compose
PostgreSQL settings.

Existing `.env` files from Phase 2 must update their database URL from port 5432 to
55432 when using this Compose service. No database reset or volume deletion is needed.

---

## 6. Root scripts

| Script                | Purpose                                                                    |
| --------------------- | -------------------------------------------------------------------------- |
| `pnpm dev`            | Start all development apps                                                 |
| `pnpm build`          | Build all apps/packages                                                    |
| `pnpm test`           | Run all tests                                                              |
| `pnpm test:db`        | Verify PostgreSQL constraints and seed reruns                              |
| `pnpm lint`           | Run linting                                                                |
| `pnpm format`         | Format the repository                                                      |
| `pnpm db:migrate`     | Run Prisma migrations in the API app                                       |
| `pnpm db:migrate:dev` | Create/apply a development Prisma migration                                |
| `pnpm db:seed`        | Seed demo data                                                             |
| `pnpm db:verify`      | Check demo relationships, counters and XP                                  |
| `pnpm db:validate`    | Validate the Prisma schema                                                 |
| `pnpm db:studio`      | Open Prisma Studio                                                         |
| `pnpm typecheck`      | Run TypeScript checks                                                      |
| `pnpm e2e`            | Build and run isolated real browser acceptance (E2E_DATABASE_URL required) |

---

## 7. AI providers

TalkyTown must support provider abstraction from the beginning.

Initial providers:

| Provider                  | Purpose                                         |
| ------------------------- | ----------------------------------------------- |
| `mock`                    | Demo, tests and no-cost evaluation              |
| `openai-compatible-cloud` | Cloud LLM provider                              |
| `local-openai-compatible` | Ollama / LM Studio using configurable `baseUrl` |

Phase 5 registers Mock and real cloud/local runtimes sharing one OpenAI-compatible
Chat Completions adapter. Adult-scoped AiProviderConfig selects the provider and
stores non-secret URL/model. Environment holds AI_CLOUD_API_KEY and optional
AI_LOCAL_API_KEY only; server destinations/limits are authorized in
config/ai-runtime-policy.json. Default policy permits local loopback servers and
no cloud origin. Configure/test/activate through Swagger; activation checks key
presence but only test/inference verifies it. Existing sessions retain their
provider/model. Real failures return controlled errors without Mock substitution.

---

## 8. Safety principles

TalkyTown is designed for children, so the application must follow these principles:

- Do not ask children for personal data.
- Use aliases instead of real names.
- Do not store raw audio by default.
- Redirect unsafe or inappropriate topics.
- Use age-adapted prompts.
- Keep corrections friendly and motivational.
- Provide safe error/retry guidance for AI failures and graceful voice fallbacks; switching to Mock requires explicit adult selection for new sessions.
- Keep parent controls separate from the child experience.

---

## 9. Design references

Design assets and Stitch exports should be placed under:

```txt
docs/design/
  stitch/
  references/
  contact-sheets/
```

The UI implementation should follow the visual direction defined in:

- `docs/product-scope.md`
- `docs/ux-flow.md`
- `docs/design/design-system.md`
- Stitch screen exports

---

## 10. Documentation required for the Master's Final Project

The final delivery should include:

- Complete `README.md`
- Public GitHub repository, preferably
- Installation and execution instructions
- Project structure
- Main features
- Deployment URL, if available
- Slides URL or slides file
- Demo user credentials
- Screenshots or demo video
- Limitations and roadmap

---

## 11. Current phase

Current phase: **Phase 8 - Functional Child Frontend**

Expected outcome:

- Explicit-secret demo authentication and adult ownership.
- Child profiles with learningLevel proficiency and selected avatar.
- Eligible missions, sessions, safe text/transcribed-voice messages and Mock responses.
- Request-ID idempotency, atomic ledger rewards, vocabulary and basic badges.
- Deterministic three-step mission progression and ledger-derived progress.
- Database-authoritative provider configuration/selection and controlled runtime errors.
- Real cloud/local inference, strict pedagogical JSON validation and safe native fetch.
- Provider/model pinning, active-session URL protection and deterministic offline tests.
- Existing Prisma schema, mission/reward/safety/provider architecture preserved.
- Spanish functional frontend: demo login, profiles, missions, text conversation, summary, rewards and adult views.
- HttpOnly-cookie BFF, bounded immutable retries, safe history restoration and deduplicated celebrations.
- Adult provider save, activate and live test as separate explicit actions; login preserves selection.
- Local Quicksand/Luna/Max assets, responsive keyboard-accessible screens and reduced motion.
- Contextual EN/ES guardrails, Spanish distress support and safe historical response boundaries.
- Derived numeric levels, Madrid streaks, seven event-based badges and stable completion rewards.
- Independent badge catalog synchronization and dry-run/apply historical reconciliation.

See [safety policy and historical alias recovery](docs/safety.md) and
[Phase 6 acceptance](docs/development/phase6-child-safety-checklist.md).

See [domain model](docs/architecture/domain-model.md),
[Phase 4 checklist](docs/development/phase4-functional-backend-checklist.md),
[backend contracts](docs/api/phase4-backend-contracts.md),
[Swagger walkthrough](docs/setup/phase4-demo-walkthrough.md) and
[local development](docs/setup/local-development.md).

The demo seed includes Sofia (age 9, 120 XP), Leo (age 6, 35 XP), Luna, Max,
four missions and seven badge definitions, plus four sessions, 22 turns, 14 XP
events, seven badge awards and six vocabulary items. Historical practice dates are
fixed in May 2026; current streaks are derived using Europe/Madrid calendar dates.
Phase 4 added functional backend APIs. Phase 5 added real provider execution.
Phase 8 integrates the functional frontend. Automated acceptance is separate from the
required manual real-runtime validation; do not claim final Phase 5 completion
until that evidence is recorded.
learningLevel is learner proficiency and never recalculated from XP. Phase 7 adds
separate numeric gamification levels, current streaks and seven event-based badges.
XP remains ledger-authoritative; badges grant no bonus XP. Speech remains deferred to Phase 9.

The demo adult is shared, with fictional profiles and no visitor privacy isolation.
Before unrestricted Phase 13 deployment, isolate visitor accounts or restrict demo access.
Login never activates Mock implicitly. Existing conversations keep their provider/model.
See the [frontend walkthrough](docs/setup/phase8-frontend-walkthrough.md),
[Phase 8 implementation report and evidence](docs/development/phase8-implementation-report.md),
[BFF decision](docs/architecture/adr/0013-frontend-bff-and-demo-session.md) and
[retry/retention decision](docs/architecture/adr/0014-frontend-replay-and-celebrations.md).

Browser acceptance requires a separate loopback PostgreSQL database ending in \_e2e:
set E2E_DATABASE_URL, install Chromium with pnpm exec playwright install chromium,
then run pnpm e2e. The runner builds real apps on ports 3100/3101 and cleans only
its uniquely owned fictional fixtures. Do not reset the development database.

Phase 7: [API and badge criteria](docs/api/phase7-gamification-contracts.md),
[Mock walkthrough and administration](docs/setup/phase7-gamification-walkthrough.md),
[acceptance checklist](docs/development/phase7-gamification-checklist.md),
[gamification ADR](docs/architecture/adr/0012-gamification-levels-streaks-and-achievements.md).

Install canonical badge definitions independently of demo data with
`pnpm gamification:catalog`. Preview historical repairs with
`pnpm gamification:reconcile`; add `--apply` to persist repairs, optionally scoped
with `--child-profile-id ID`. Reconciliation never creates XP or invokes AI.

---

Phase 5: [provider contracts](docs/api/phase5-provider-contracts.md),
[Ollama/LM Studio/cloud walkthrough and live gate](docs/setup/phase5-real-provider-walkthrough.md),
[acceptance checklist](docs/development/phase5-real-providers-checklist.md).

## 12. License

This project uses the license defined in `LICENSE`.
