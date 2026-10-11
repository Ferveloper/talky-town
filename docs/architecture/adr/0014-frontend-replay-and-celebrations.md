# ADR 0014 — Immutable browser retries and bounded pending text

## Status

Accepted — Phase 8.

## Decision

Generate one UUID for each logical session start or message. Capture its body before POST and keep it immutable until an explicit retry resolves the operation. Do not append optimistic child bubbles. Only accepted backend child turns are rendered. Never infer rewards or mission completion from provider prose or from an HTTP timeout.

Keep one unresolved operation per verified adult/profile/session context in versioned sessionStorage keys. Other screens of the same adult preserve each independent operation. Clears and expiry callbacks must match both context and immutable request UUID; late responses cannot clear another operation. Migrate valid legacy records without renewing their original timestamp. Purge all foreign-adult records on verified identity changes. Messages have at most 500 characters. Retention is at most fifteen minutes, measured from the original attempt, never renewed by retries. Delete payload immediately on success, logout, authentication expiry or safety review. Login entry clears pending data as well, including server-rendered auth redirects that occur before a browser API response. Reject malformed, future-dated and incorrectly keyed records. Reading a different session or profile never deletes a valid operation. Logout and authentication expiry clear all operation keys and invalidate late UI updates. A root retention component sweeps idle tabs and navigation, and rechecks on visibility changes. Suspended/closed browsers cannot run timers: purge expired payload immediately on resume/reopen before offering retry.

At expiry, replace raw payload with an expired marker containing only owner/profile/session/time/request UUID, with no payload. Recover the backend history, close the previous conversation and start a new one. The start recovery screen exposes the backend's ten recent sessions, not a claim to list every session. Administrative help is needed for a missing older session. If storage is unavailable, keep the current operation in memory and explain that reload recovery is unavailable.

Restore every cursor page before enabling the composer. Deduplicate by turn ID and detect looping cursors. SAFETY_REVIEW_REQUIRED hides every loaded turn and clears pending text; known session metadata/end remain usable. Provider failures never select Mock automatically.

Write celebration markers before displaying XP/achievement/completion feedback. Message markers use adult/session/request UUID; badge markers use adult/profile/code; completion uses adult/session. Show earned message XP and badge unlocks as separate announcements: badges grant no additional XP. Restored totals have no animations. End completionRewardXp is already stored, never a new reward delta. If marker storage fails, suppress celebratory animation. Marker storage contains no child text and keeps at most 200 entries.

Session vocabulary receipts live only in React memory. Reloaded summaries show stored totals and link to profile vocabulary rather than pretending profile vocabulary belongs to one session. Full transcripts are never placed in localStorage or sessionStorage.

## Validation

Actual Route Handler tests verify cookie, CSRF, bodyless operations and controlled failures. Component tests verify pagination, duplicate send, immutable retry, safe history hiding and idle expiry. Real browser tests abort a response after route.fetch commits it, then retry through Next/Nest/PostgreSQL. Fake HTTP inference exercises the existing adapter without paid AI calls. Traces are disabled to avoid recording cookies and bodies; screenshot fixtures contain fictional demo data only.

## Ambiguous profile creation

Profile creation has no backend request UUID. On a network/timeout or invalid response, GET only the authenticated adult's profiles and compare the submitted alias, age, native/target language, learning level and avatar exactly. Offer explicit confirmation because an exact shared-demo match may predate the attempt. Never automatically select a match or repeat the POST. Preserve the immutable submitted snapshot in component memory only, and invalidate late lookups on navigation, identity changes or logout.
