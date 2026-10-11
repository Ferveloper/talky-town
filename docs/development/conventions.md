# Development Conventions

## Language

- Use TypeScript everywhere.
- Use strict types.
- Avoid `any` unless explicitly justified.

## Phase 8 frontend boundaries

- Spanish UI, English practice marked lang=en, exact backend safety-support text.
- Never synthesize successful profile, mission, provider or progress responses from fixtures.
- Keep pages thin, reusable view components and simple React state; authenticated layouts verify identity.
- Same-origin browser API only. JWT lives in an HttpOnly cookie; secrets remain in Nest.
- Exact Origin/custom header/JSON on mutations, including operations with no body.
- No optimistic child turns. Capture one immutable UUID/body and retry explicitly.
- Never interpret a timeout as a failed commit or completionRewardXp as a reward delta.
- No transcript persistence. Pending text is bounded to fifteen minutes; clear on resolution, logout, auth expiry and review.
- Fetch profile ownership before dependent child data; avoid bursts of progress transactions in adult views.
- Separate provider save/activate/test; login has no provider side effects; no automatic fallback.
- Real browser tests require a dedicated loopback \_e2e database and uniquely owned fixtures.
- Traces stay off; artifacts contain fictional test data only. Never call a real paid provider in automated tests.

## Naming

- Use kebab-case for files.
- Use PascalCase for React components and classes.
- Use camelCase for variables and functions.
- Use UPPER_SNAKE_CASE for environment constants.

## Commits

Recommended style:

```txt
feat: add child profile module
fix: handle provider timeout
docs: update local setup instructions
test: add gamification tests
refactor: extract provider adapter interface
```

## Branches

Suggested branches:

```txt
main
develop
feature/<short-description>
fix/<short-description>
docs/<short-description>
```

## Documentation

Update docs when:

- A new module is added.
- An architectural decision is made.
- A setup step changes.
- A provider is added.
- A safety rule changes.

## Testing

Do not call external AI providers in automated tests. Use mock providers.

Default tests must not require PostgreSQL. Keep actual database tests in the API's
`vitest.database.config.ts` suite, run with root `pnpm test:db` after migrations.
Use deterministic fixture dates and IDs; verify seed reruns without increasing XP,
awards or vocabulary counters. Never reset a developer's existing database implicitly.

## Domain Persistence

- Add migrations after the existing history; do not edit applied SQL.
- Reuse shared mission definitions and vocabulary normalization instead of copying constants.
- Normalize vocabulary before using its `(child, language, normalizedTerm)` unique key.
- Treat XP events and badge awards as facts; cached totals must reconcile with them.
- Keep ISO timestamp strings at shared transport boundaries; Prisma uses Date values.
- No LearningProgress aggregate, child personal identifiers, raw audio or provider credentials.
- Safety metadata uses controlled reason/category/action codes, never raw child snippets.
- Screen conversation/correction text before persistence.

## Application Rules

- New transport calls proficiency learningLevel; map to Prisma level without XP changes.
- Adult-scoped database configuration selects provider; environment never overrides it.
- Invalid provider selection fails explicitly without substitution.
- Use PersistenceIds for every request-linked ID; never hash child messages.
- Provider calls remain outside DB transactions; openings use deterministic prompts.
- Revalidate ownership/session/provider snapshots inside short locked persistence transactions.
- First committed message requestId wins; replay returns safe stored operation/current summary.
- Persist no unsafe input, correction or raw error log. Validation omits rejected values.
- voice means client-transcribed text; raw audio/STT remain unsupported.
- Vitest TypeScript transform emits decorator metadata required by Nest injection/DTOs.
- Prettier accepts checkout-native line endings (endOfLine auto); this avoids
  rewriting unchanged CRLF frontend/seed files on Windows. Git retains its existing normalization.

## Phase 5 Application Rules

- Supported types are `mock`, `openai-compatible-cloud` and `local-openai-compatible`.
  Mock has its own runtime; cloud/local share the OpenAI-compatible runtime architecture.
  Extend existing providers/orchestration.
- Native fetch, per-request validated DNS dispatch, no vendor SDK/global dispatcher.
- `AiProviderConfig` in PostgreSQL is the adult-scoped active-selection authority
  and stores non-secret URL/model configuration. Environment variables hold secrets
  and technical runtime settings, never the active user selection. Non-secret URL/SSRF
  policy lives in `config/ai-runtime-policy.json`; API keys are never stored in PostgreSQL.
- Cloud/local configuration and execution must obey that policy: cloud HTTPS origins
  and public addresses; explicit local hosts/ports/CIDRs; validated DNS, no redirects.
- Activation checks key presence only; test verifies envelope/parser/same Zod schema.
- Strict discriminator alternatives reject fields inappropriate to false states.
- Real malformed output repairs once; errors write nothing and never silently fall
  back to Mock. Mock's deterministic local behavior cannot conceal real-provider failures.
- Provider/model are pinned per `ConversationSession` at start. Changing the active
  provider affects new sessions only; only active owned sessions block URL updates.
- Learning, gamification and domain rules remain independent of provider implementation.
  Providers return only `AiConversationResponse` pedagogical data; `GamificationService`
  owns XP/badges, `MissionEvaluationService` evaluates progress, and application services
  enforce safety and decide persistence even when providers return safety metadata.
- Use the simple per-process limiter; no Redis/persistence/schema expansion.
- Automated tests use injected transports/local fake servers, never real paid calls.
- Final Phase 5 acceptance requires separate documented manual live-runtime evidence.

## Phase 6 Safety Rules

- Use existing SafetyService with explicit child/provider/alias context and trusted
  catalogue avatar identity; never use a fictional preface as a general bypass.
- Blocked prepared-operation variants contain no raw child/provider content.
- Filter unsafe provider history; keep accepted mission evidence unchanged in both
  projected and transactional evaluation. Do not recalculate historical rewards.
- Review unsafe historical turns/aliases at HTTP response boundaries after commits;
  keep internal reads, known-ID operations and termination usable.
- Follow [safety policy](../safety.md) for controlled taxonomy, deterministic support,
  alias remediation and demo limitations. No external moderation or certification claim.

## Phase 7 gamification rules

- Derive totals from XpEvent, levels from 50-XP steps and streaks from Madrid dates.
- Count positive practice-turn events, not XP divided by five or cached turn values.
- Persist accepted corrections/session completion before evaluating badge transitions.
- Reuse catalog synchronization in seed, administration and accepted reward writes.
- Preserve existing badge timestamp/source with upsert update: {}.
- Keep completionRewardXp a stable stored total; retries never issue another reward.
- Reconciliation is administrative, dry-run by default, owner-qualified locks on apply;
  no XP creation, provider calls, raw-text logging or retroactive completion bonuses.
- Inject ApplicationClock for deterministic time tests. GET endpoints remain read-only.
