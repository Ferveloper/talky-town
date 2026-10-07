# Development Conventions

## Language

- Use TypeScript everywhere.
- Use strict types.
- Avoid `any` unless explicitly justified.

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
