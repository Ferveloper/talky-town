# ADR 0005 - Child Data Minimization

## Status

Accepted - Phase 3

## Context

TalkyTown serves children aged 5-12. Demonstrable progress and safety diagnostics do
not require personal identifiers, raw audio, unsafe message excerpts or provider secrets.

## Decision

- Children use aliases, integer ages and language preferences; no full names,
  birth dates, child emails, school details, addresses, photos or contact information.
  Sofia and Leo are fictional demo aliases. The demo email belongs to an adult account.
- AiProviderConfig stores non-secret provider metadata only. Credentials belong in
  server-side environment/secret storage, never the database or frontend.
- Do not persist raw audio by default. Future voice input may produce screened text;
  raw recording storage requires a separate justified decision.
- SafetyEvent stores category/action/reason codes and severity, not raw child input.
  Phase 3 intentionally drops `inputSnippet`; legacy records use `legacy`/`unknown`
  metadata rather than invented classifications.
- ConversationTurn may retain safe practice text and gentle corrections. Future
  conversation services must screen/redact input before persistence, including
  corrected text and explanations. Schema changes alone do not implement filtering.
- Keep child-owned data deletable through cascading profile relationships. Safety
  metadata may survive with null references; retention limits must be defined before
  non-demo use. Do not echo child content in routine verification logs.

## Consequences

- Debugging relies on minimal structured metadata instead of raw unsafe transcripts.
- The mock demo and tests require no API keys or real child information.
- The migration is intentionally irreversible for stored safety snippets; backups
  containing older raw data need an appropriate retention/deletion policy.
- Legacy `reason` strings and previously stored turns require review before a real
  deployment. No automatic historical redaction is claimed.
- Authorization, safety enforcement and retention jobs remain for subsequent phases;
  this is not a production privacy/compliance certification.

See [child safety first](0003-child-safety-first.md) and
[domain model](../domain-model.md).
