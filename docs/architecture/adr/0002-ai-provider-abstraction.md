# ADR 0002 — AI Provider Abstraction

## Status

Proposed

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
