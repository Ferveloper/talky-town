# Phase 2 — Technical Setup Checklist

## Goal

Build a professional, clean and defensible technical foundation for TalkyTown.

## Tasks

- [x] Create pnpm monorepo.
- [x] Configure Turborepo.
- [x] Configure TypeScript.
- [x] Configure ESLint and Prettier.
- [x] Initialize `apps/web` with Next.js.
- [x] Initialize `apps/api` with NestJS.
- [x] Create `packages/shared`.
- [x] Create `packages/ai-core`.
- [x] Configure PostgreSQL with Docker Compose.
- [x] Configure Prisma in the API app.
- [x] Create `.env.example`.
- [ ] Add root scripts:
  - [x] `dev`
  - [x] `build`
  - [x] `test`
  - [x] `lint`
  - [x] `db:migrate`
  - [x] `db:seed`
- [x] Add README.
- [x] Add AGENTS.md.
- [x] Add license.
- [x] Add CI workflow.
- [x] Ensure local execution works.
- [ ] Create internal tag `v0.1-setup`.

## Definition of done

- `pnpm install` works.
- `docker compose up -d postgres` works.
- `pnpm dev` starts web and API.
- `pnpm build` succeeds.
- `pnpm lint` succeeds.
- `pnpm test` succeeds or runs scaffolded tests.
- Prisma migrations and seed are configured.
- Documentation explains how to run the project.
