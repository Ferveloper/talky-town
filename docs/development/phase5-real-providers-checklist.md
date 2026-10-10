# Phase 5 — Real OpenAI-Compatible Providers

Status: implementation, automated acceptance and mandatory real-runtime checks
passed. The documented llama.cpp acceptance run was completed on 2026-10-09.

## Implementation

- Shared cloud/local Chat Completions adapter; existing Mock/interface preserved.
- Native fetch, injected transport, bounded body/time and pinned validated DNS.
- Adult-scoped DB configuration; environment-only credentials; server policy.
- Configuration/test endpoints, activation without credential-validity claims.
- Complete synthetic test: runtime → envelope → JSON → same Zod schema.
- Strict correction/safety discriminated unions and exact optional original.
- Provider/model fixed per session; base URL lock only for active owned sessions.
- One fresh malformed-response repair; no real-provider fallback to Mock.
- Existing safety/rewards/vocabulary/missions/progress and atomic replay preserved.
- Simple per-process limiter; no new schema, distributed system or frontend work.
- Seed selection preservation; no schema/migration changes.

## Acceptance

Executed locally on 2026-10-07, Windows, Node v24.19.0 and pnpm 9.15.0.

| Gate                                     | Result                                                                                                               |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile`         | Passed, including Prisma generation                                                                                  |
| `pnpm format:check` / `git diff --check` | Passed                                                                                                               |
| `pnpm lint` / `pnpm typecheck`           | Passed across all four workspaces                                                                                    |
| `pnpm test`                              | 140 passed: API 98, ai-core 37, shared 5; unchanged frontend has no unit tests                                       |
| `docker compose up -d --wait postgres`   | Passed; PostgreSQL healthy on port 55432                                                                             |
| `pnpm test:db`                           | 19 passed: Phase 3 five, Phase 4 seven, Phase 5 seven                                                                |
| `pnpm db:validate` / `pnpm db:migrate`   | Passed; existing two migrations, none pending                                                                        |
| `pnpm db:seed` / `pnpm db:verify`        | Passed; original demo fingerprint unchanged                                                                          |
| `pnpm build`                             | Passed across all four workspaces                                                                                    |
| Compiled API / Swagger                   | Startup passed; health, docs and docs-json returned 200; both new routes present                                     |
| Compiled HTTP demo                       | Mock test passed; configuration errors controlled; mission 33/67/100, 45 XP, replay deduplicated, unsafe raw omitted |
| `pnpm dev`                               | Web, API health and Swagger returned 200; watch compiler reported zero errors                                        |
| Manual real-runtime validation           | Pending on 2026-10-07; superseded by the successful 2026-10-09 llama.cpp run below                                   |

The first full build attempt overlapped a PostgreSQL test process and Windows
locked Prisma's DLL during generation. After the test process exited, the same
build command passed. No code workaround or dependency change was needed.

Original seed fingerprint:
`e085833a46cebdefc854dc011af2c189646db7c25cf332835d7f4b55808e27e4`.
Test-owned database records and the compiled-demo profile were cleaned without
resetting the database. App processes started for verification were stopped;
PostgreSQL remains running.

Existing CI already executes default/database suites on Node 20; its glob picks
up Phase 5 tests without real provider credentials or Internet inference. No
remote CI result or local Node 20 execution is claimed.

## Final local acceptance — 2026-10-09

Initial branch: clean `develop`, commit `2e3df04` (`v0.4-ai-providers`). Windows 11
Pro 10.0.26200, Node v24.19.0, pnpm 9.15.0. All baseline commands were completed
before real-model inference; default tests and builds were forced past Turbo cache.

| Gate                                                    | Result                                                                                                                                                         |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Install / format / lint / typecheck / Prisma validation | Passed                                                                                                                                                         |
| Default tests                                           | 140 passed: API 98, ai-core 37, shared 5                                                                                                                       |
| PostgreSQL / migrations / seed / verification           | Healthy; two existing migrations, none pending; seed fingerprint unchanged                                                                                     |
| PostgreSQL integration tests                            | 19 passed: Phase 3 five, Phase 4 seven, Phase 5 seven                                                                                                          |
| Full build / compiled startup / Swagger                 | Four workspaces built; API health/docs/docs-json 200                                                                                                           |
| Real runtime                                            | Existing llama-server 9354 (`9777256c3`), Qwen3-4B-Instruct-2507 Q4_K_M, Intel Iris Xe Vulkan, KV Q4, context 8192                                             |
| Real `/test`                                            | 200, available=true, 20,823 ms; real inference/envelope/JSON/Zod; no generated-content return or persistence                                                   |
| Real mission / progress / metadata                      | 33 → 67 → 100; 45 ledger XP; First Talk/Animal Explorer; dog/cat counters; proficiency hero unchanged; persisted local/original model                          |
| Correction quality                                      | No correction observed for `I likes dogs`; model returned needed=false; optional quality check recorded honestly                                               |
| Replay / pinning                                        | No duplicate turns, XP or vocabulary; replay did not infer; existing session kept local/original model after active/default changes; new session selected Mock |
| URL protection                                          | Active session blocked URL change with 409/count 1; completed/abandoned sessions allowed it                                                                    |
| Runtime down / retry                                    | 503 PROVIDER_UNAVAILABLE, no domain writes or Mock fallback; same UUID/message succeeded after identical restart                                               |
| Input / output safety                                   | Live unsafe input bypassed runtime and stored only controlled redirection/event; automated unsafe-output coverage passed                                       |
| Cleanup                                                 | Own profiles/data removed; original provider configs/selection restored; API/runtime stopped; PostgreSQL healthy; original seed fingerprint verified again     |

**PHASE 5 REAL-PROVIDER ACCEPTANCE: PASS** for the mandatory live checks.
The [walkthrough](../setup/phase5-real-provider-walkthrough.md) records the exact
model revision/hash, launch flags, measurements, initial model/environment failures
and recovery. These are real-model results, separate from the deterministic fake
server used in automated tests. No production code, tests, schema, migrations,
seed, CI or frontend changes were required for this validation.

The successful run used the existing server policy and explicit configured JWT
secret; no local API key or timeout/parser relaxation was introduced. Temporary
diagnostics, a same-database IPv4 override and downloaded models stayed outside
Git. The smaller trial models failed response-format compliance; CPU-only 4B
timed out. The tested Vulkan/KV-Q4 configuration passed. Missing correction quality
and limited machine memory remain observations for future model selection.

The first final PostgreSQL suite produced a false positive in
`real-provider.database-spec.ts:244`: its whole-record substring assertion matched
`612` in a generated session ID, although stored content was safe. An unchanged
rerun passed all 19 tests. The assertion needs a separately scoped correction;
this validation did not change or skip tests.

See [contracts](../api/phase5-provider-contracts.md),
[manual real-runtime gate](../setup/phase5-real-provider-walkthrough.md),
[runtime ADR](../architecture/adr/0009-openai-compatible-runtime.md) and
[pinning ADR](../architecture/adr/0010-session-provider-pinning.md).

## Scope and limitations

No streaming, Responses, tools/agents/MCP/RAG/embeddings or speech features.
No frontend changes. Safety remains documented pattern screening, not production
certification. Limiter is per process. Keys are runtime-wide, not per adult.
Runtime policy edits require restart. External model aliases can change behavior.
Real model quality and JSON compliance must be observed through the manual gate.

## Changed files

69 source/configuration/test/documentation files; no frontend, Prisma schema or
migration changes. Existing modules/interfaces were extended. Test coverage is
grouped in meaningful protocol/HTTP/database suites rather than adding a test
for an abstract transport declaration. CI required no workflow changes.

```text
.env.example
README.md
pnpm-lock.yaml
config/ai-runtime-policy.json
apps/api/package.json
apps/api/prisma/seed-demo.ts
apps/api/prisma/seed-verification.ts
apps/api/src/ai-providers/ai-provider-registry.service.ts
apps/api/src/ai-providers/ai-providers.controller.ts
apps/api/src/ai-providers/ai-providers.module.ts
apps/api/src/ai-providers/ai-providers.service.ts
apps/api/src/ai-providers/dto/update-ai-provider-config.dto.ts
apps/api/src/ai-providers/provider-operation-limiter.service.ts
apps/api/src/ai-providers/provider-url-policy.service.ts
apps/api/src/ai-providers/safe-fetch-transport.service.ts
apps/api/src/common/swagger-contracts.ts
apps/api/src/config/ai-runtime-policy.ts
apps/api/src/config/api-config.ts
apps/api/src/configure-app.ts
apps/api/src/conversations/conversation-store.service.ts
apps/api/src/conversations/conversations.service.ts
apps/api/src/missions/mission-evaluation.service.ts
apps/api/src/safety/safety.service.ts
apps/api/test/ai-providers.spec.ts
apps/api/test/functional-backend.database-spec.ts
apps/api/test/helpers/fake-openai-server.ts
apps/api/test/helpers/memory-prisma.ts
apps/api/test/helpers/test-app.ts
apps/api/test/provider-operation-limiter.spec.ts
apps/api/test/provider-runtime-config.spec.ts
apps/api/test/provider-url-policy.spec.ts
apps/api/test/real-provider.database-spec.ts
apps/api/test/real-provider.e2e-spec.ts
apps/api/test/safe-fetch-transport.spec.ts
apps/api/vitest.config.ts
apps/api/vitest.database.config.ts
packages/ai-core/package.json
packages/ai-core/src/ai-response.parser.test.ts
packages/ai-core/src/ai-response.parser.ts
packages/ai-core/src/ai-response.schema.test.ts
packages/ai-core/src/ai-response.schema.ts
packages/ai-core/src/conversation-prompt.test.ts
packages/ai-core/src/conversation-prompt.ts
packages/ai-core/src/index.ts
packages/ai-core/src/mock-ai-provider.test.ts
packages/ai-core/src/openai-compatible.provider.test.ts
packages/ai-core/src/openai-compatible.provider.ts
packages/ai-core/src/openai-compatible.transport.ts
packages/ai-core/src/provider-errors.test.ts
packages/ai-core/src/provider-errors.ts
packages/shared/src/api-contracts.ts
packages/shared/src/index.ts
packages/shared/src/provider-contracts.test.ts
packages/shared/src/provider-contracts.ts
docs/README.md
docs/api/phase4-backend-contracts.md
docs/api/phase5-provider-contracts.md
docs/architecture/adr/0002-ai-provider-abstraction.md
docs/architecture/adr/0008-pre-persistence-safety.md
docs/architecture/adr/0009-openai-compatible-runtime.md
docs/architecture/adr/0010-session-provider-pinning.md
docs/architecture/domain-model.md
docs/development/conventions.md
docs/development/phase5-real-providers-checklist.md
docs/development/project-structure.md
docs/product-scope.md
docs/setup/local-development.md
docs/setup/phase5-real-provider-walkthrough.md
docs/ux-flow.md
```
