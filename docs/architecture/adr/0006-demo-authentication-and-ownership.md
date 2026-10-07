# ADR 0006 — Demo Authentication and Ownership

## Status

Accepted — Phase 4.

## Decision

Seeded adult login issues two-hour HS256 JWTs. Require explicit runtime JWT_SECRET of at least 32 characters; deterministic test secret belongs in test configuration. Verify issuer/audience/algorithm/expiry and adult existence.

Adult identity is server-derived. Profile/session/progress operations authorize ownership; writes recheck inside transactions. Unowned resources return 404. Demo visitors deliberately share fictional seeded adult, not private visitor accounts.

## Consequences

No password/refresh-token/auth-schema work. Application never generates runtime secret. Configured-secret tokens survive restart until expiry. Local setup requires private configuration; registration/revocation remains later work. Inputs cannot override owner/rewards.
