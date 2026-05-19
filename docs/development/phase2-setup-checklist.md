# Phase 2 — Technical Setup Checklist

## Goal

Build a professional, clean and defensible technical foundation for TalkyTown.

## Tasks

- [ ] Create pnpm monorepo.
- [ ] Configure Turborepo.
- [ ] Configure TypeScript.
- [ ] Configure ESLint and Prettier.
- [ ] Initialize `apps/web` with Next.js.
- [ ] Initialize `apps/api` with NestJS.
- [ ] Create `packages/shared`.
- [ ] Create `packages/ai-core`.
- [ ] Configure PostgreSQL with Docker Compose.
- [ ] Configure Prisma in the API app.
- [ ] Create `.env.example`.
- [ ] Add root scripts:
  - [ ] `dev`
  - [ ] `build`
  - [ ] `test`
  - [ ] `lint`
  - [ ] `db:migrate`
  - [ ] `db:seed`
- [ ] Add README.
- [ ] Add AGENTS.md.
- [ ] Add license.
- [ ] Add CI workflow.
- [ ] Ensure local execution works.
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
