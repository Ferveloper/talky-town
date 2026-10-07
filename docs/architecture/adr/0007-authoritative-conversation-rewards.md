# ADR 0007 — Authoritative Rewards and Mission Evaluation

## Status

Accepted — Phase 4.

## Decision

Provider outputs have no XP/progress authority. Application awards 5 XP for safe Latin-letter practice, catalog completion reward once/session, First Talk and Animal Explorer from actual criteria.

MissionEvaluationService isolates reviewed three-step rules: 0 → 33 → 67 → 100. See backend contracts for exact steps. This deterministic MVP is not adaptive assessment.

PersistenceIds centralizes request-derived IDs without hashing child content. Provider calls remain outside transactions; openings deterministic. Short transactions lock child/adult selection, revalidate and atomically commit safe turns, vocabulary, ledger/caches, mission state and awards.

Progress aggregates authoritative records. Prisma ChildProfile.level is learner proficiency, exposed as learningLevel, never XP-derived. Streak remains cached; numeric gamification level is separate future work.

## Consequences

Schema/migrations unchanged. Replay/completion IDs prevent duplicates. Turn XP is presentation only. Three snapshot attempts bound conflicts. Vocabulary reflects observed child practice, not generated mastery. Other badge/streak work deferred.
