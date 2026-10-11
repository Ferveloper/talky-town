# ADR 0012 — Derived levels, Madrid streaks and event-based achievements

## Status

Accepted — Phase 7, including the approved catalog, response and seed refinements.

## Decision

XpEvent remains authoritative. Numeric gamification level is `floor(total XP / 50) + 1`;
ChildProfile.level / learningLevel remains English proficiency. Derive active streaks
from positive practice-turn events using Europe/Madrid calendar dates and an injected
ApplicationClock. Cached streaks describe the last rebuild; reads calculate current
values without writes. Today or yesterday preserves the consecutive run; older practice
returns zero. Historical streak achievements survive inactivity.

Seven canonical badges use event criteria, not XP thresholds. Their nullable xpRequired
is null. A small idempotent catalog synchronizer is shared by the independent catalog
command, demo seed, accepted reward writes and reconciliation. Missing definitions must
be repaired or fail the transaction, never silently suppress an expected award.
Kind Corrector means receiving a genuine persisted correction, not proving a later
successful application. Catalog descriptions state the actual unlock criteria.

Keep existing free-talk completion after one accepted practice event. Closing an active
free-talk session with at least three such events grants ten completion XP once, under
the existing child lock and deterministic completion ID. Guided rewards remain unchanged.
The additive end response field completionRewardXp is the total completion reward
already recorded for that session, including on replay. Phase 8 must deduplicate
completion celebrations by session ID and must not interpret this field as a request delta.

Demo history and XP remain fixed. Seed creates fixture awards with their intended
historical timestamps but never overwrites an existing award's timestamp or provenance.
Verification distinguishes demo-owned awards from runtime/reconciliation awards.
Reconciliation defaults to dry run; apply synchronizes the catalog, repairs caches and
adds supported missing historical awards without creating XP or invoking providers.

## Consequences

No Prisma migrations, frontend implementation or provider architecture changes.
Accepted operations atomically store correction/session facts before evaluating badges.
Evaluate through the avatar/mission-end timestamp, one millisecond after the child
event, so a mission crossing Madrid midnight still unlocks its completion badges.
Award timestamps use the supporting event/termination timestamp.
Blocked operations and failed cloud/local inference do not advance gamification.
The existing selected-Mock safe local fallback remains an explicit compatibility exception.
Historical evidence is not reclassified by current safety rules. New metadata contains
only IDs, codes, counts and timestamps, never child/provider text.
