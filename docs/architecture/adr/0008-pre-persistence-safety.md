# ADR 0008 — Mandatory Pre-Persistence Safety

## Status

Accepted — Phase 4.

## Decision

Screen input before provider; screen reply/corrections/vocabulary before persistence. Rejected input is never stored or hashed. Persist only controlled redirection and coded SafetyEvent metadata.

Screen legacy context in memory. Validation excludes rejected values; error filter emits codes without raw logs. Screen aliases. Voice is transcribed text; no audio storage.

Adult-scoped AiProviderConfig determines selection. Only Mock runtime registered. Invalid/unsupported selection fails explicitly; cloud/local activation returns 422 without writes. Environment cannot override selection.

## Consequences

Safety cannot be disabled. Deterministic English/Spanish patterns have coverage limits; no production certification, historical redaction or retention job claimed. Valid Mock generation failure uses controlled local response; unsafe output earns nothing. Configuration failure never masquerades as Mock execution.

## Phase 5 extension

ADR 0009 adds real runtimes without changing these safety boundaries. Strict Zod
response parsing precedes SafetyService. Invalid real output may be regenerated
once; failure writes nothing and never selects Mock. Provider/model are pinned by
ADR 0010. Safe history alone leaves the process; no aliases/IDs or unsafe input.
