# ADR 0010 — Session Provider and Model Pinning

## Status

Accepted — Phase 5.

## Context

Phase 4 wrote Mock metadata into sessions but checked adult active selection on
every message. A real adapter must not change halfway through a conversation.
Existing schema has provider/model snapshots but no URL/config revision snapshot.

## Decision

Resolve active adult configuration at session start; persist type and configured
model in existing fields. Resolve future messages by that type and pinned model,
including inactive configurations. New active selection/default model affects
only new sessions. Invalid/missing snapshots or configuration fail explicitly.

Block baseUrl changes only while owned sessions of that provider type are active.
Completed/abandoned sessions never block. Thus URLs stay stable during active
sessions without a migration. Provider/model IDs represent requested runtime
identifiers; externally repointed model aliases are outside version locking.

Adult-row locking serializes configuration and session start/commit. Revalidation
uses effective config ID/type/URL/pinned model, excluding active/default-model
changes. Session snapshot still controls stale conversation retries. DNS and
inference stay outside transactions; deterministic opening, centralized IDs,
idempotency, ledger authority and short atomic persistence are preserved.

## Consequences

Close active sessions to change endpoint. Credentials/policy are server runtime
settings and can fail explicitly after restart; they do not select providers.
Future endpoint revisions or full configuration snapshots need a separate ADR.
Seed reruns preserve adult active selection rather than creating a second active
Mock configuration; original fresh-demo behavior is unchanged.
