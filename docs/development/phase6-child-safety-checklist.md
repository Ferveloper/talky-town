# Phase 6 — Child Safety and Guardrails acceptance

## Required behavior

- [x] Extend existing SafetyService; no redundant moderation infrastructure.
- [x] Contextual EN/ES rules, controlled taxonomy and age-band responses.
- [x] Allow educational avatar identity; block real identifying disclosures.
- [x] Spanish support for child distress; no provider-derived distress inference.
- [x] Accepted/blocked-input/blocked-output isolation before persistence.
- [x] Input before inference configuration; output before persistence.
- [x] Atomic safety metadata/controlled responses, no blocked learning rewards.
- [x] Filter provider history without changing accepted mission evidence.
- [x] Historical response barriers outside internal reads and transactional commits.
- [x] Historical alias ownership isolation and documented administrative recovery.
- [x] Preserve Phase 4/5 pinning, rewards, replay and real-provider error behavior.
- [x] No frontend, schema, migration, seed, CI or real-audio changes.

## Initial validation record

Validation date: 2026-10-11. Local Windows, Node 24.19.0, pnpm 9.15.0,
Compose PostgreSQL 16. No skipped tests. No CI configuration changes.
Automated tests use deterministic Mock, injected cloud transports and local fake
OpenAI-compatible servers. No model downloads or paid/real inference required.

| Gate                                      | Result                                                                           |
| ----------------------------------------- | -------------------------------------------------------------------------------- |
| Frozen install                            | Passed                                                                           |
| Format, lint, typecheck                   | Passed; lint/typecheck forced without cache                                      |
| Full default unit/HTTP suite              | 289 passed: API 243, ai-core 41, shared 5; forced without cache                  |
| Full PostgreSQL suite                     | 72 passed: domain 5, Phase 4 7, Phase 5 8, Phase 6 52                            |
| Three fresh safety PostgreSQL runs        | 52/52 each, consecutive standalone runs; also passed inside the full suite       |
| Schema and seed verification before/after | Passed; demo fingerprint unchanged                                               |
| Forced build and compiled startup         | Passed; all four packages built without cache, compiled API started on port 3106 |
| Swagger/deterministic HTTP walkthrough    | Passed; 31 HTTP checks against compiled API, Mock only                           |
| Diff and scope inspection                 | Passed; approved branch, no staged changes or forbidden-scope edits              |

Existing web test scaffolding contains no test files; its unchanged script reports
that fact and exits successfully. No frontend or Playwright work was introduced.
Docker Desktop initially failed and was restarted by the developer. A build attempt
overlapping DB tests hit Windows' loaded Prisma DLL lock; validation separates those
operations instead of changing application code or build scripts.

Demo fingerprint before/after database suites:
`e085833a46cebdefc854dc011af2c189646db7c25cf332835d7f4b55808e27e4`.

The compiled walkthrough verified health, Swagger 0.6.0, demo authentication,
owned profiles, educational inputs, blocked-message replay, Spanish distress
support, progress, Animal Adventure rewards and historical alias recovery with
usable session metadata/termination. It used a temporary adult with Mock selection;
all owned records were removed afterward. Seed verification retained the same
fingerprint. The temporary API process was stopped after validation.

Initial status: approved Phase 6 local demo acceptance passed. No commits, pushes,
pull requests or tags were created.

## Final targeted correction validation

The independent review found missed self-harm intentions, provider school/home
requests, parental secrecy and direct mistreatment disclosures. Reviewed fixtures
now assert child support versus provider redirection, exact existing responses,
pre-inference rejection, no learning rewards and idempotent coded persistence.
Eleven additional benign examples cover school, family, fictional/educational secrets
and neutral politics in unit/HTTP tests and against PostgreSQL with a fake provider.

Only seven files change relative to the preserved Phase 6 commit `e3c52d8`:
`safety-rules.ts`, the reviewed fixture helper, safety unit/HTTP/database tests,
`docs/safety.md` and this checklist. SafetyService, deterministic response strings,
transactions, public contracts and provider infrastructure are unchanged.

| Gate                                                  | Result                                                                            |
| ----------------------------------------------------- | --------------------------------------------------------------------------------- |
| Targeted safety unit/HTTP suite                       | 353 passed: rules 127, responses 4, HTTP 222                                      |
| Targeted PostgreSQL safety suite, three isolated runs | 122/122 each; consecutive standalone runs with owned UUID records and cleanup     |
| Format, forced lint and typecheck                     | Passed; lint/typecheck without cache                                              |
| Forced general suite                                  | 479 passed: API 433, ai-core 41, shared 5                                         |
| Full PostgreSQL suite                                 | 142 passed: domain 5, Phase 4 7, Phase 5 8, Phase 6 122                           |
| Forced build                                          | Passed; all four packages without cache                                           |
| Seed verification before/after and diff scope         | Passed; initial fingerprint/counts preserved, seven-file scope, no staged changes |

Validation date: 2026-10-11. No skipped tests, model downloads or real/paid inference.
Run the targeted database suite with `pnpm run test:db test/safety.database-spec.ts`;
each execution creates and removes its own adult/profile/session records, without resets.
All 14 reported English/Spanish counterexamples and additional reviewed variants pass.
General harmful-topic requests retain redirection; provider-generated disclosures
never select the child-support response. The previous 31-file implementation remains
preserved in `e3c52d8`. No commits, pushes, pull requests or tags were created for
this correction.

Final status: **PHASE 6 READY FOR PR**, within the documented demo-level limitations.

## Changed files

```txt
AGENTS.md
README.md
apps/api/src/child-profiles/child-profiles.service.ts
apps/api/src/common/swagger-contracts.ts
apps/api/src/configure-app.ts
apps/api/src/conversations/conversation-store.service.ts
apps/api/src/conversations/conversations.service.ts
apps/api/src/conversations/prepared-operation.ts
apps/api/src/safety/safety-responses.ts
apps/api/src/safety/safety-rules.ts
apps/api/src/safety/safety.service.ts
apps/api/test/helpers/fake-openai-server.ts
apps/api/test/helpers/safety-fixtures.ts
apps/api/test/safety-responses.spec.ts
apps/api/test/safety.database-spec.ts
apps/api/test/safety.e2e-spec.ts
apps/api/test/safety.spec.ts
docs/README.md
docs/architecture/adr/0003-child-safety-first.md
docs/architecture/adr/0008-pre-persistence-safety.md
docs/architecture/adr/0011-contextual-safety-policy.md
docs/development/conventions.md
docs/development/phase6-child-safety-checklist.md
docs/development/project-structure.md
docs/product-scope.md
docs/safety.md
docs/ux-flow.md
packages/ai-core/src/conversation-prompt.test.ts
packages/ai-core/src/conversation-prompt.ts
packages/ai-core/src/index.ts
packages/ai-core/src/mock-ai-provider.test.ts
```

## Reproducible walkthrough

Use `/docs` with an adult bearer token from `POST /auth/demo`. Create a child-safe
profile using learningLevel/avatarCode, then start a free-talk session. Send
"What is your name?" and "My mother uses a phone": neither is blocked by the API
or Mock. Mock need not implement a realistic identity answer to demonstrate moderation.

Send a synthetic identifying disclosure: response has null childTurn, zero XP,
empty rewards/vocabulary and a controlled redirect. Replay the same requestId:
no extra turn/event/reward. Send a synthetic distress fixture: deterministic Spanish
trusted-adult support, with no false notification claim. Use fixtures only, not real
child disclosures. End remains usable; progress is ledger-derived.

Start Animal Adventure and send `dog` → `I likes dogs` → `cat`: progress 33/67/100,
45 XP, Animal Explorer once. Automated cases also cover blocking near completion
and newly unsafe historical content without corrupting first-animal semantics.

Fake-provider tests exercise complete envelope/schema/output moderation across
all generated fields. Historical fixtures verify transcript/opening/message replay
409 responses, metadata/termination availability and owner-isolated alias recovery.

## Acceptance boundary

Passing gates establishes the approved Phase 6 demo implementation only. It does
not certify production child safety, legal compliance, emergency response or teaching
quality. [Safety policy](../safety.md) lists limitations and remediation. Preserve
the historical Phase 5 real-runtime evidence; do not repeat inference for this phase.
