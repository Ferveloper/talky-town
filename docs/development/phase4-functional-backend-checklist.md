# Phase 4 — Functional MVP Backend

## Implementation

- [x] Explicit-secret demo JWT authentication and ownership.
- [x] Profiles, active avatars and inclusive mission eligibility.
- [x] learningLevel proficiency mapping; no XP recalculation.
- [x] Profile avatar exclusively determines session character.
- [x] Database-authoritative Mock-only provider selection/activation.
- [x] Controlled invalid/unsupported provider errors; no silent substitution.
- [x] Central PersistenceIds and request replay.
- [x] Deterministic openings; generation outside transactions.
- [x] Mandatory pre-persistence input/output screening; no raw unsafe storage/logging.
- [x] Isolated mission engine: 0 → 33 → 67 → 100.
- [x] Atomic ledger/caches, vocabulary, progress and awards.
- [x] Ledger-derived progress and chronological pagination.
- [x] Text/already-transcribed voice input.
- [x] Default tests database-independent; PostgreSQL concurrency/rollback suite.
- [x] Existing schema/migrations/seed/frontend preserved.

## Verification

Final execution evidence/counts recorded after acceptance run. Commands: frozen install, Compose startup, schema validation, existing migrations, seed verification, formatting, lint, typecheck, unit/HTTP tests, PostgreSQL tests, full build, compiled HTTP demo, root dev startup.

Tests clean own records only. Phase 3 suite still validates reruns/constraints. No reset or volume deletion.

## Test-transform implementation

Vitest uses installed TypeScript compiler via vitest-transform.ts to emit Nest decorator metadata. Initial SWC native binding failed on Windows; this test-only replacement avoids native dependency without altering production compilation.

## Deferred

Real adapters, frontend integration, audio/STT, registration/refresh tokens, advanced moderation/retention, remaining badges, streak recalculation, numeric gamification level. learningLevel remains proficiency permanently.

## Execution Results — October 7, 2026

| Gate                                                          | Result                                                                                  |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Frozen pnpm install                                           | Passed, including Prisma generation                                                     |
| Compose startup, schema validation, existing migration deploy | Passed; no pending migration                                                            |
| Root seed/verification                                        | Passed; original fingerprint unchanged                                                  |
| Format, lint, typecheck                                       | Passed across repository                                                                |
| Default tests                                                 | 68 passed: API 61, shared 4, AI-core 3; frontend scaffold unchanged                     |
| PostgreSQL tests                                              | 12 passed: Phase 4 seven, Phase 3 five                                                  |
| Full build                                                    | All four packages passed                                                                |
| Compiled API startup and HTTP demo                            | Passed: 33/67/100, 45 XP, seven turns, both awards, replay, voice, safety, provider 422 |
| Missing JWT_SECRET runtime probe                              | Explicit startup rejection passed                                                       |
| Root pnpm dev                                                 | Frontend/API started; web, health, Swagger all HTTP 200                                 |
| Preservation                                                  | No frontend or Prisma/schema/migration/seed file changes                                |

Original seed fingerprint: e085833a46cebdefc854dc011af2c189646db7c25cf332835d7f4b55808e27e4. Temporary database/demo records cleaned without resetting database.

CI workflow now validates types, applies existing migrations/seed and runs PostgreSQL tests. Remote GitHub Actions run was not triggered. Nonblocking inherited toolchain deprecation warnings remain.

Private persistent JWT configuration was created in ignored local .env for acceptance; example JWT_SECRET remains blank. Application never generates a secret.

Prettier endOfLine auto accepts existing Windows CRLF checkout without modifying frontend or seed files. Conversation/progress coverage is grouped in HTTP/PostgreSQL suites. No behavioral deviations from approved plan.

## Changed Files

- .env.example
- .github/workflows/ci.yml
- .prettierrc.json
- README.md
- apps/api/package.json
- apps/api/src/ai-providers/ai-providers.controller.ts
- apps/api/src/ai-providers/ai-providers.module.ts
- apps/api/src/ai-providers/ai-providers.service.ts
- apps/api/src/ai-providers/dto/set-active-ai-provider.dto.ts
- apps/api/src/app.module.ts
- apps/api/src/auth/auth.controller.ts
- apps/api/src/auth/auth.module.ts
- apps/api/src/auth/auth.service.ts
- apps/api/src/auth/current-user.decorator.ts
- apps/api/src/auth/jwt-auth.guard.ts
- apps/api/src/avatars/avatars.controller.ts
- apps/api/src/avatars/avatars.module.ts
- apps/api/src/avatars/avatars.service.ts
- apps/api/src/child-profiles/child-profiles.controller.ts
- apps/api/src/child-profiles/child-profiles.module.ts
- apps/api/src/child-profiles/child-profiles.service.ts
- apps/api/src/child-profiles/dto/create-child-profile.dto.ts
- apps/api/src/child-profiles/profile-ownership.service.ts
- apps/api/src/common/api-error.ts
- apps/api/src/common/api-exception.filter.ts
- apps/api/src/common/application-clock.ts
- apps/api/src/common/common.module.ts
- apps/api/src/common/persistence-ids.service.ts
- apps/api/src/common/response-mappers.ts
- apps/api/src/common/swagger-contracts.ts
- apps/api/src/config/api-config.ts
- apps/api/src/configure-app.ts
- apps/api/src/conversations/conversation-store.service.ts
- apps/api/src/conversations/conversations.controller.ts
- apps/api/src/conversations/conversations.module.ts
- apps/api/src/conversations/conversations.service.ts
- apps/api/src/conversations/dto/list-turns-query.dto.ts
- apps/api/src/conversations/dto/send-message.dto.ts
- apps/api/src/conversations/dto/start-session.dto.ts
- apps/api/src/gamification/gamification-rules.ts
- apps/api/src/gamification/gamification.module.ts
- apps/api/src/gamification/gamification.service.ts
- apps/api/src/gamification/vocabulary-rules.ts
- apps/api/src/main.ts
- apps/api/src/missions/mission-evaluation.service.ts
- apps/api/src/missions/mission-rules.ts
- apps/api/src/missions/missions.controller.ts
- apps/api/src/missions/missions.module.ts
- apps/api/src/missions/missions.service.ts
- apps/api/src/progress/progress.controller.ts
- apps/api/src/progress/progress.module.ts
- apps/api/src/progress/progress.service.ts
- apps/api/src/safety/safety-rules.ts
- apps/api/src/safety/safety.module.ts
- apps/api/src/safety/safety.service.ts
- apps/api/test/ai-providers.spec.ts
- apps/api/test/auth.spec.ts
- apps/api/test/child-profiles.spec.ts
- apps/api/test/functional-backend.database-spec.ts
- apps/api/test/functional-backend.e2e-spec.ts
- apps/api/test/gamification.spec.ts
- apps/api/test/helpers/memory-prisma.ts
- apps/api/test/helpers/test-app.ts
- apps/api/test/missions.spec.ts
- apps/api/test/safety.spec.ts
- apps/api/tsconfig.build.json
- apps/api/vitest-transform.ts
- apps/api/vitest.config.ts
- apps/api/vitest.database.config.ts
- docs/README.md
- docs/api/phase4-backend-contracts.md
- docs/architecture/adr/0004-derived-learning-progress.md
- docs/architecture/adr/0006-demo-authentication-and-ownership.md
- docs/architecture/adr/0007-authoritative-conversation-rewards.md
- docs/architecture/adr/0008-pre-persistence-safety.md
- docs/architecture/domain-model.md
- docs/development/conventions.md
- docs/development/phase4-functional-backend-checklist.md
- docs/development/project-structure.md
- docs/product-scope.md
- docs/setup/local-development.md
- docs/setup/phase4-demo-walkthrough.md
- docs/ux-flow.md
- packages/ai-core/package.json
- packages/ai-core/src/index.ts
- packages/ai-core/src/mock-ai-provider.test.ts
- packages/ai-core/tsconfig.build.json
- packages/shared/package.json
- packages/shared/src/api-contracts.test.ts
- packages/shared/src/api-contracts.ts
- packages/shared/src/conversation-contracts.ts
- packages/shared/src/index.ts
- packages/shared/tsconfig.build.json
- pnpm-lock.yaml
- turbo.json
