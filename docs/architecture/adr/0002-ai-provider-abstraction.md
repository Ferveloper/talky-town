# ADR 0002 — AI Provider Abstraction

## Status

Accepted — implemented progressively through Phase 5.

## Context

TalkyTown must support popular cloud AI providers and local alternatives such as Ollama or LM Studio through OpenAI-compatible APIs. The MVP must also work without API keys.

## Decision

Create a provider-agnostic AI layer in `packages/ai-core`.

Initial providers:

- Mock provider.
- Cloud OpenAI-compatible provider.
- Local OpenAI-compatible provider.

## Consequences

- The app can run in demo mode without cost.
- Tests can be deterministic.
- Provider-specific code remains isolated.
- Conversation logic should not depend directly on a vendor SDK.

Phase 5 uses one cloud/local Chat Completions adapter, injected transport, native
fetch and strict runtime response validation. See ADR 0009/0010 for safe transport,
configuration authority and session pinning. Mock/interface remain available.
