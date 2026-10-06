# ADR 0003 — Child Safety First

## Status

Proposed

## Context

TalkyTown is designed for children aged 5 to 12. The app must be safe, privacy-aware and age-appropriate.

## Decision

Treat child safety as a core architectural concern, not as a final prompt-only detail.

## Consequences

- Avoid collecting personal data.
- Use aliases.
- Add safety guardrails.
- Avoid storing raw audio by default.
- Keep parent settings separate from the child experience.
- Include tests for safety-related behavior.
