# ADR 0004 - Derived Learning Progress

## Status

Accepted - Phase 3

## Context

The parent dashboard needs XP, completed missions, awards, vocabulary and practice
history. A separate LearningProgress aggregate would duplicate records already
owned by the domain and could drift after retries or partial updates.

## Decision

Do not add a LearningProgress Prisma model in the MVP. Build progress queries from
ChildProfile, ConversationSession, XpEvent, ChildBadge and VocabularyItem.
XpEvent is the XP source of truth; awards and vocabulary have explicit persistent
records. Keep the existing ChildProfile `level`, `xpTotal`, `streakDays` and session
`xpEarned` as basic/rebuildable cached values, not another progress table.

## Consequences

- The dashboard can use actual seeded practice history rather than unrelated mocks.
- XP writes must update ledger and cached totals transactionally and be idempotent.
- Read services must aggregate and authorize child-owned records; no CRUD/dashboard
  API is implemented in this phase.
- Reward thresholds and timezone-aware streak calculation remain separate future work.
- If measured query cost eventually warrants a read projection, document its owner,
  refresh rules and rebuild process in a new ADR before adding it.

See [domain model](../domain-model.md) for invariants and cache semantics.
