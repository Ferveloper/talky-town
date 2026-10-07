# Phase 4 Backend Contracts

## Runtime and authentication

Configure private JWT_SECRET (at least 32 characters) in ignored .env; start PostgreSQL, apply existing migrations/seed, then run pnpm dev. Swagger: http://localhost:3001/docs; OpenAPI: http://localhost:3001/docs-json.

POST /auth/demo selects seeded adult from server-side DEMO_USER_EMAIL. No caller-selected adult or automatic seeding. Demo visitors intentionally share fictional profiles/history. Other accounts remain ownership-protected. DEMO_AUTH_ENABLED=false disables entry.

JWT: HS256, 7200 seconds, issuer talkytown-api, audience talkytown-demo. All domain routes except demo login require Authorization: Bearer token. No password, refresh tokens or child authentication.

## Routes

| Method/path                               | Success         | Contract                                                                       |
| ----------------------------------------- | --------------- | ------------------------------------------------------------------------------ |
| POST /auth/demo                           | 200             | Empty body; accessToken, tokenType, expiresIn, user                            |
| GET /auth/me                              | 200             | Adult id/displayAlias/role                                                     |
| GET /child-profiles                       | 200             | { items: owned profiles }                                                      |
| POST /child-profiles                      | 201             | alias, age, nativeLanguage, targetLanguage, learningLevel, avatarCode required |
| GET /child-profiles/:id                   | 200             | Owned profile                                                                  |
| GET /child-profiles/:id/missions          | 200             | { items: active age-eligible missions }                                        |
| GET /avatars                              | 200             | { items: active avatars }                                                      |
| POST /conversations/sessions              | 201; replay 200 | requestId, childProfileId, mode, optional missionCode; session/openingTurn     |
| GET /conversations/sessions/:id           | 200             | Owned session summary                                                          |
| GET /conversations/sessions/:id/turns     | 200             | cursor/limit query; { items, nextCursor }                                      |
| POST /conversations/sessions/:id/messages | 200             | requestId, message, optional inputMode                                         |
| POST /conversations/sessions/:id/end      | 200             | Empty body; idempotent summary                                                 |
| GET /child-profiles/:id/progress          | 200             | Derived progress, no transcript                                                |
| GET /ai-providers                         | 200             | activeProvider, capability/activation flags                                    |
| PUT /ai-providers/active                  | 200             | { providerType: "mock" }; cloud/local returns 422                              |

GET /health and GET /docs remain available.

## Validation and response boundaries

Profile alias: trimmed 2–24 Unicode letters/digits/spaces/hyphens/underscores, screened for safety. Age integer 5–12; ageBand derived. Languages currently es/en. learningLevel is starter/explorer/hero, mapped to Prisma level; never updated from XP. Active avatar required.

Guided mode requires eligible missionCode; free-talk forbids it. Sessions use profile avatar; avatarCode overrides rejected. Messages are trimmed text of 1–500 characters; inputMode defaults to text and accepts text/voice. Voice means client-transcribed text, no upload. requestId is UUID. Turn pagination defaults to 50/max 100; cursor must belong to session.

Unknown fields rejected. Error bodies contain code or validation code/fields/rules; no rejected values. Statuses: 400 invalid input/unsafe alias/cursor; 401 invalid auth; 404 missing/unowned resource or disabled demo; 409 conflicts/inactive session; 422 ineligible catalog/invalid provider/PROVIDER_NOT_IMPLEMENTED; 503 unavailable database/DEMO_SEED_REQUIRED.

Profile: id, alias, age/band, languages, learningLevel, nullable avatarCode, ledger xpTotal, cached streakDays. Session: IDs/codes, mode/status, missionProgress, ledger xpEarned, actual provider/model, ISO timestamps. Turn: ID/role/safe content, inputMode, correction, practice xpAwarded, ISO createdAt.

Message: childTurn (null for redirection), avatarTurn, operation xpAwarded, practicedVocabulary, newly awarded badge codes, coded safety flag, current session. Completion XP belongs to ledger/session, not practice turn summary.

Progress: childProfileId, learningLevel, cached streakDays, ledger xpTotal, completedSessions, distinct completedMissionCount/codes, explicit awards, observed vocabulary counters/times, lastPracticedAt, ten recent session summaries. No transcript or AI mastery score.

## Idempotency and transactions

PersistenceIds exclusively derives IDs from resource/request identities, never child text. Start scoped to adult/profile/requestId; conflicting mode/mission reuse returns REQUEST_ID_CONFLICT. Message scoped to session/requestId; first committed request wins, even if repeated text differs. Replay returns stored safe operation plus current session summary.

Deterministic opening prompts need no provider call. Provider generation happens outside transactions. Short persistence transactions lock child and adult selection, revalidate snapshot/configuration, then atomically commit safe turns, coded safety, vocabulary, ledger/caches, mission progress and awards. Up to three snapshot attempts, then CONCURRENT_UPDATE. End/completion cannot award twice.

## Provider selection

Adult-scoped AiProviderConfig is the sole selected-provider authority. Environment defines runtime capabilities, never selection; legacy AI_PROVIDER has no selection effect. Only Mock / talkytown-mock registered. Selected configuration requires null baseUrl and null/talkytown-mock model.

Missing, ambiguous, invalid or unsupported selection fails explicitly. PUT can repair selection by activating Mock transactionally. Cloud/local activation returns 422 PROVIDER_NOT_IMPLEMENTED without writes. No secret fields in responses or database.

Valid Mock generation failure/timeout/malformed response produces controlled local practice response, not adapter substitution. Unsafe output instead redirects without rewards.

## Deterministic MVP mission engine

MissionEvaluationService isolates mission-rules. One step per accepted message: **0 → 33 → 67 → 100**. This is deterministic MVP behavior, not final adaptive assessment.

| Mission           | Step 1                      | Step 2                                          | Step 3                                        |
| ----------------- | --------------------------- | ----------------------------------------------- | --------------------------------------------- |
| Meet a New Friend | hello/hi/hey                | preference + animal/ice cream/space/games/sport | bye/goodbye/see you                           |
| Animal Adventure  | approved animal             | animal + like/likes/favorite/favourite          | animal different from first recognized animal |
| Ice Cream Shop    | ice cream + want/can I have | vanilla/chocolate/strawberry                    | thank you/thanks                              |
| Space Explorer    | star/moon/planet/rocket     | space object + color                            | fly/go/see/explore                            |

Reviewed normalized word boundaries and animal plurals apply. Off-topic safe attempts earn practice XP without advancement. Final step closes session. Ending incomplete guided session abandons it; accepted free talk completes on end.

## Rewards and vocabulary

Safe Latin-letter attempt: 5 XP, including corrections. Completion: catalog reward once/session (seeded 25/30/40/50). First Talk requires accepted practice; Animal Explorer requires completed Animal Adventure. xpRequired alone cannot establish criteria.

Vocabulary: hello, hi, goodbye, bye; dog, cat, bird, rabbit, fish, lion, tiger, elephant; ice cream, vanilla, chocolate, strawberry; star, moon, planet, rocket; red, blue, green, yellow, white, black; fly, go, see, explore.

Count each canonical term once/child turn. Corrected turns count practice without successful use. Avatar text/provider suggestions never count. Other badges, numeric gamification level and streak recalculation deferred. learningLevel permanently represents proficiency.

## Safety limitations

Mandatory English/Spanish patterns screen personal/contact/location/school disclosure, unsuitable topics and instruction overrides. Blocked input bypasses provider, never stored/hashed as child turn. Persist controlled redirection and coded metadata only. Screen output/corrections/suggestions and omit unsafe legacy context in memory.

No child-body, token, rejected-value or raw provider-error logs. No audio storage. Patterns cannot identify every real name, coded disclosure, obfuscation or unsafe context. No production moderation certification, historical cleanup or retention job claimed.
