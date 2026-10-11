# Phase 7 gamification contracts

All existing endpoints, authentication, ownership checks, safety boundaries and
provider pinning remain in place. No migrations or new HTTP routes. Shared types
live in `packages/shared/src/api-contracts.ts` and `conversation-contracts.ts`.

The generated OpenAPI document is available at `/docs-json` with version `0.7.0`.
`attachResponseContracts()` is the single source for response schemas after
`SwaggerModule.createDocument()`. `ApiChildProfile`, `ApiProgress` and
`ApiEndSession` include the complete response fields, required lists and nullable
timestamps. `ApiLevelProgress` and `ApiBadgeCatalogItem` define the nested Phase 7
fields. Regression tests request the final JSON document and resolve its references.

## Ledger, levels and practice

`XpEvent` is authoritative for profile/session totals. `ChildProfile.xpTotal`,
`ConversationSession.xpEarned` and `ChildProfile.streakDays` are rebuildable caches.
Numeric `gamificationLevel = floor(xpTotal / 50) + 1`; no upper cap. Proficiency
`learningLevel` remains `starter | explorer | hero` and is never changed by XP.

Accepted Latin-script practice still grants 5 XP; numeric/noise turns grant zero.
Positive `practice-turn` events count as accepted practice, including legacy fixture
amounts of 1, 2 or 10. Completion events never count as practice. A badge grants no XP.
Provider vocabulary suggestions still do not control persistence or rewards.

Streaks count distinct Europe/Madrid dates, not elapsed 24-hour periods. Today or
yesterday keeps the latest consecutive run; a longer gap returns zero. Future
calendar dates are ignored. Reads capture an injected clock once per response.
Historical three-day badge awards survive an expired current streak.

## Badge catalog

| Code             | Unlock criterion                                                       |
| ---------------- | ---------------------------------------------------------------------- |
| first-talk       | First accepted practice event                                          |
| brave-speaker    | Ten accepted practice events across sessions                           |
| animal-explorer  | Completed Animal Adventure guided session, progress 100                |
| mission-complete | Any completed guided session, progress 100                             |
| three-day-streak | Any three consecutive Madrid practice dates                            |
| kind-corrector   | Accepted practice event linked to a genuine persisted child correction |
| mission-hero     | Three completed guided sessions, progress 100; repeats count           |

Kind Corrector recognizes receiving a correction, not successful application in a
later turn. NFKC normalization, trimming and collapsed whitespace exclude no-op
corrections. Case or punctuation corrections can qualify. Runtime linkage uses
the existing operation-derived child-turn ID and verifies the session/profile.
Known demo event IDs link to their fixture turns; unknown legacy linkage is
reported by event ID during reconciliation and does not prove a correction.

All seven definitions have `xpRequired: null` and explicit criterion descriptions.
`pnpm gamification:catalog` synchronizes definitions without creating demo users.
Seed, reconciliation apply and accepted reward transactions share this mechanism.
Catalog failure rolls back live rewards; missing definitions cannot silently skip
an expected award. Existing awards retain their IDs, timestamps and provenance.
Live awards evaluate newly crossed criteria. Historical missing awards require
explicit reconciliation. Existing historical evidence is not reclassified by safety.

## Additive API fields

Profile create/list/detail: `gamificationLevel: number`, with current derived XP/streak.

Progress retains `completedSessions`, distinct `completedMissionCount`/codes,
existing earned `badges`, vocabulary and the ten most recent sessions. It adds:

```json
{
  "xpTotal": 55,
  "learningLevel": "hero",
  "gamificationLevel": 2,
  "streakDays": 0,
  "levelProgress": { "xpIntoLevel": 5, "xpToNextLevel": 45, "xpPerLevel": 50 },
  "practiceTimezone": "Europe/Madrid",
  "badgeCatalog": [
    {
      "code": "first-talk",
      "title": "First Talk",
      "description": "Send your first accepted practice message.",
      "icon": "message-circle",
      "unlocked": true,
      "awardedAt": "2026-05-16T12:00:00.001Z"
    }
  ]
}
```

The example shortens `badgeCatalog`; actual responses include all seven in canonical
order. Locked entries use `unlocked: false`, `awardedAt: null`. GET never installs a
catalog, updates caches or awards a badge. `lastPracticedAt` comes from the latest
positive practice ledger event, not avatar turns or cached turn XP.

## Completion and Phase 8 celebration behavior

`POST /conversations/sessions/:id/end` returns `EndSessionResponse`, extending the
existing session fields with `completionRewardXp`. This is the total completion
reward already recorded for the session, not XP newly granted by this request.

- Active free talk completes after one accepted practice event; zero events abandons it.
- Three or more accepted events grant 10 XP on active close, reason `free-talk-completed`.
- Guided completion retains existing mission XP granted by the completing message.
- Repeated/concurrent end calls return stable reward totals and create no further XP.
- Abandoned guided and already terminal historical free talk receive no new bonus.

The existing child lock and deterministic completion ID protect the complete
transaction. A failed reward insert leaves the session active and all caches intact.
Message replay still returns its stored `xpAwarded` and `awardedBadges`; those fields
also require client deduplication by session plus request ID.

Phase 8 must record completion celebrations by session ID, including guided
completion first observed in a message. An end response reporting that guided
reward must not celebrate it again. Repeated end responses must never be treated
as reward deltas. Refresh progress after accepted messages/end and render server
totals, level, badge catalog and streak; never calculate eligibility in the client.
