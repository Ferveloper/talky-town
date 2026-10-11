# ADR 0011 — Contextual deterministic safety and disclosure boundaries

## Status

Accepted — Phase 6.

## Context

Phase 4/5 already screen conversations and persist atomic learning facts. Coarse
source-independent patterns miss distress/relationship risks and reject innocent
learning language. New policy can also flag previously accepted history and aliases.

## Decision

Extend existing SafetyService with reviewed EN/ES rules and explicit child-input,
provider-output and alias contexts. Allow trusted fictional avatar introductions,
never real child disclosures. Use controlled category/reason/severity/action codes.
Child distress gets deterministic age-adapted Spanish support; unsafe provider text
gets redirection and cannot establish that the child is distressed.

Accepted/blocked-input/blocked-output form a prepared-operation discriminated union.
Blocked variants contain no raw child/provider content. Input moderation precedes
runtime validation; valid blocked requests can be audited even when inference is
misconfigured. Retain ownership/status/snapshot/idempotency transaction checks.

Filter unsafe provider history without reclassifying previously accepted mission
evidence. Projected and transactional mission evaluation retain identical historical
semantics and persisted progression, including Animal Adventure's first-animal rule.

Enforce `SAFETY_REVIEW_REQUIRED` only at content-bearing response boundaries, after
commits where applicable. Do not guard internal snapshot/replay lookup or termination.
Unsafe historical aliases guard owned profile detail/list; known-ID operations remain
available. Document an authorized, owner-qualified alias-only database remediation.

## Consequences

No schema migration, new route, external moderation or provider architecture change.
Existing reason codes remain; new codes are additive. Historical content can become
unavailable without rewriting rows or reversing committed rewards. Finite rules are
demo safeguards, not production certification. See [safety policy](../../safety.md)
for limits, responses and administrative procedure.
