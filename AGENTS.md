# AGENTS.md — TalkyTown Development Instructions

This file provides persistent instructions for AI-assisted development tools such as Codex, Cursor, Copilot, Claude Code or similar agents.

## 1. Project identity

TalkyTown is a child-friendly AI language learning web app for children aged 5 to 12.

The app helps children practice English through friendly AI avatars, guided missions, free conversation, gentle corrections, XP, badges, streaks and progress tracking.

This is a Master's Final Project. The codebase must be clean, demonstrable, documented and easy to run locally.

---

## 2. Product principles

Always preserve these principles:

- The child experience must be playful, safe and simple.
- The parent experience must be clean, trustworthy and understandable.
- The MVP must work without paid AI keys through a mock provider.
- Never ask children for personal data.
- Use aliases, not real names, in demo data.
- Provide safe error/retry guidance when AI or provider configuration fails, and graceful voice fallbacks.
- Gamification should support learning, not distract from it.
- Avoid dark, corporate or dense user interfaces.
- Prefer clear flows and small iterations over large unfinished features.

---

## 3. Technical stack

Use the following stack unless explicitly instructed otherwise:

- Monorepo: pnpm workspaces + Turborepo
- Frontend: Next.js + TypeScript
- UI: Tailwind CSS + shadcn/ui
- Animation: Framer Motion and/or Lottie
- Backend: NestJS + TypeScript
- Database: PostgreSQL
- ORM: Prisma
- AI: OpenAI-compatible provider adapters
- Testing: Vitest + Supertest
- E2E: Playwright
- Local infrastructure: Docker Compose

---

## 4. Target structure

```txt
apps/
  web/
  api/

packages/
  shared/
  ai-core/

docs/
  product-scope.md
  ux-flow.md
  development/
  design/
  architecture/
  api/
  setup/
```

Keep app-specific logic inside its app. Keep shared types and contracts in `packages/shared`. Keep provider interfaces and AI abstractions in `packages/ai-core`.

---

## 5. Frontend rules

- Use TypeScript strictly.
- Prefer reusable components.
- Keep pages thin.
- Put repeated UI into components.
- Use mock data before backend integration.
- Use large rounded buttons and cards.
- Child screens must be colorful, playful and accessible.
- Parent screens must be cleaner and more dashboard-like.
- Do not expose API keys in frontend code.
- Do not add complex state management until needed.

Recommended component groups:

```txt
components/
  ui/
  layout/
  avatar/
  gamification/
  missions/
  conversation/
  profiles/
  parent/
  providers/
  safety/
```

---

## 6. Backend rules

- Use NestJS modules.
- Keep domain and application logic separated from controllers.
- Validate input DTOs.
- Use Prisma for persistence.
- Provide Swagger/OpenAPI documentation.
- Do not hardcode secrets.
- Use environment variables.
- Implement a mock AI provider first.
- Keep AI provider implementations replaceable.

Recommended modules:

```txt
auth
users
child-profiles
avatars
missions
conversations
gamification
ai-providers
safety
progress
```

---

## 7. AI rules

The AI layer must be provider-agnostic.

Supported provider types (Phase 5):

- `mock`
- `openai-compatible-cloud`
- `local-openai-compatible`

Do not couple conversation logic directly to a specific vendor SDK.

The mock provider must be good enough for:

- Local demo
- Automated tests
- TFM evaluation without API keys

Use the existing `AiConversationResponse`, inferred from `aiConversationResponseSchema`
in `packages/ai-core/src/ai-response.schema.ts` and exported by `@talkytown/ai-core`.
Do not define a second provider response contract. Its strict schema contains only:

- `reply`: trimmed conversational text, 1–2000 characters.
- Optional `correction`: `{ needed: false }`, or `needed: true` with required `corrected`
  and optional `original`/`explanation`. False rejects these extra fields; supplied
  `original` must exactly match the screened current child message.
- `newVocabulary`: vocabulary suggestions, not persistence instructions.
- `avatarEmotion`: `happy | thinking | celebrating | encouraging`.
- `safety`: `{ flagged: false }`, or `flagged: true` with required `reason`:
  `personal-data-request | unsuitable-topic | instruction-override | other`.
  False rejects `reason`.

Architectural rules:

- AI providers never decide XP, award badges, decide mission progress or make persistence decisions.
- XP and badges are server-authoritative through `GamificationService`.
- The backend evaluates mission progress through `MissionEvaluationService`.
- Application/backend safety enforcement through `SafetyService` remains mandatory,
  even when a provider returns safety metadata.
- Mock has its own deterministic local runtime; cloud/local share the OpenAI-compatible runtime.
- Real-provider failures must never silently fall back to Mock. Mock's local behavior
  must never conceal failures of a selected cloud/local provider.
- Provider/model are pinned to `ConversationSession` when it starts. Changing the
  active provider affects new sessions only.

---

## 8. Child safety rules

Never implement features that ask children for:

- Full name
- Address
- Phone number
- School name
- Exact location
- Private family information
- Contact details
- Photos or sensitive personal data

Unsafe or unsuitable topics must be redirected in a friendly way.

Example redirections:

- "Let's talk about something fun and safe."
- "How about animals, space or games?"
- "Let's go back to the mission."

---

## 9. Documentation rules

Every significant technical decision should be documented.

Use:

```txt
docs/architecture/adr/
```

for Architecture Decision Records.

Keep these docs updated:

- `README.md`
- `docs/product-scope.md`
- `docs/ux-flow.md`
- `docs/development/project-structure.md`
- `docs/development/conventions.md`
- `docs/setup/local-development.md`
- `docs/design/design-system.md`

---

## 10. Testing rules

At minimum, include tests for:

- AI mock provider
- Safety rules
- XP and badge calculation
- API endpoints
- Conversation flow
- Profile creation

Use deterministic mock data.

Do not call real AI providers in automated tests.

---

## 11. Implementation strategy

Work in small increments:

1. Monorepo setup.
2. Shared TypeScript config.
3. Frontend shell.
4. Backend shell.
5. Database and Prisma.
6. Mock data.
7. Mock AI provider.
8. Basic conversation flow.
9. Gamification.
10. Safety.
11. Provider configuration.
12. Deployment.

For each task:

- Keep the app runnable.
- Avoid breaking root scripts.
- Update docs when needed.
- Prefer simple working implementation over over-engineering.

---

## 12. Definition of done for Phase 2

Phase 2 is done when:

- `pnpm install` works.
- `pnpm dev` starts frontend and backend.
- `pnpm build` works.
- `pnpm lint` works.
- `pnpm test` works or is correctly scaffolded.
- `docker compose up -d postgres` works.
- Prisma is configured.
- `.env.example` exists.
- README explains local setup.
- Apps and packages exist in the expected structure.
