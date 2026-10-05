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

Edit `.env` if needed.

### 5.4 Start PostgreSQL

```bash
docker compose up -d postgres
```

### 5.5 Run migrations and seed

```bash
pnpm db:migrate
pnpm db:seed
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

---

## 6. Root scripts

| Script            | Purpose                                   |
| ----------------- | ----------------------------------------- |
| `pnpm dev`        | Start all development apps                |
| `pnpm build`      | Build all apps/packages                   |
| `pnpm test`       | Run all tests                             |
| `pnpm lint`       | Run linting                               |
| `pnpm format`     | Format the repository                     |
| `pnpm db:migrate` | Run Prisma migrations in the API app      |
| `pnpm db:seed`    | Seed demo data                            |
| `pnpm db:studio`  | Open Prisma Studio                        |
| `pnpm typecheck`  | Run TypeScript checks                     |
| `pnpm e2e`        | Run Playwright tests when E2E specs exist |

---

## 7. AI providers

TalkyTown must support provider abstraction from the beginning.

Initial providers:

| Provider                  | Purpose                                         |
| ------------------------- | ----------------------------------------------- |
| `mock`                    | Demo, tests and no-cost evaluation              |
| `openai-compatible-cloud` | Cloud LLM provider                              |
| `local-openai-compatible` | Ollama / LM Studio using configurable `baseUrl` |

The MVP must work using the mock provider without external API keys.

---

## 8. Safety principles

TalkyTown is designed for children, so the application must follow these principles:

- Do not ask children for personal data.
- Use aliases instead of real names.
- Do not store raw audio by default.
- Redirect unsafe or inappropriate topics.
- Use age-adapted prompts.
- Keep corrections friendly and motivational.
- Provide fallback when AI or voice features fail.
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

Current phase: **Phase 2 — Technical project setup**

Expected outcome:

- Professional monorepo structure.
- Next.js frontend initialized.
- NestJS backend initialized.
- PostgreSQL configured with Docker Compose.
- Prisma configured.
- Shared packages created.
- Root scripts working.
- Initial documentation committed.
- First internal tag: `v0.1-setup`.

---

## 12. License

This project uses the license defined in `LICENSE`.
