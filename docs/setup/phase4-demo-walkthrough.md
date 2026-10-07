# Phase 4 Swagger Demo

## Setup

```bash
pnpm install
cp .env.example .env
# Set private JWT_SECRET of at least 32 characters in .env.
docker compose up -d --wait postgres
pnpm db:migrate
pnpm db:seed
pnpm db:verify
pnpm dev
```

PowerShell supports Copy-Item .env.example .env. Generate a private value locally with Node crypto.randomBytes(32).toString('hex'); never commit/share it. Open http://localhost:3001/docs. Frontend remains existing mock screens.

## Complete slice

1. POST /auth/demo with empty body; copy accessToken into Swagger Authorize bearer field.
2. GET /auth/me, /avatars, /ai-providers. PUT /ai-providers/active with providerType mock.
3. POST /child-profiles using unique fictional alias:

```json
{
  "alias": "MVP Explorer",
  "age": 9,
  "nativeLanguage": "es",
  "targetLanguage": "en",
  "learningLevel": "explorer",
  "avatarCode": "luna"
}
```

4. GET /child-profiles/:id/missions. POST /conversations/sessions:

```json
{
  "requestId": "00000000-0000-4000-8000-000000000001",
  "childProfileId": "<profile ID>",
  "mode": "guided-mission",
  "missionCode": "animal-adventure"
}
```

5. POST three messages to returned session ID, distinct UUID requestIds: dog, I likes dogs, cat. Optional inputMode voice demonstrates already-transcribed text.
6. Observe progress 33/67/100, second-turn correction, 45 session XP (15 practice + 30 completion), First Talk/Animal Explorer for fresh profile.
7. Replay final requestId: no duplicate turns/rewards/vocabulary.
8. GET session/turns/profile progress; learningLevel stays explorer. POST end remains completed without extra XP.

## Safety/configuration checks

Use a new active session for synthetic contact-data message. Redirection has null childTurn and zero XP; retry cannot duplicate SafetyEvent. Cloud/local activation returns 422 PROVIDER_NOT_IMPLEMENTED without changing Mock selection.

Missing secret causes explicit startup failure. Seed dates are May 2026; cached streak is historical. Use fresh fictional profile to observe new awards.

## Verification

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:db
pnpm build
```

Default tests need neither PostgreSQL nor external AI. Database tests use migrated local/demo PostgreSQL, test-owned records and existing Phase 3 rerun suite. No reset.
