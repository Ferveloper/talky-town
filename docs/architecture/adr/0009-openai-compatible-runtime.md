# ADR 0009 — Shared OpenAI-Compatible Runtime and Safe Transport

## Status

Accepted — Phase 5. Live-runtime acceptance remains a separate pending gate.

## Decision

Extend existing AiProvider and Mock. Cloud/local reuse one Chat Completions adapter
in ai-core, using injected transport and native Node 20 fetch. Undici supplies
per-request validated DNS connection dispatch; it is not a vendor SDK.

DB stores adult selection/URL/model. Environment stores cloud/local keys only.
Non-secret administrator policy authorizes cloud HTTPS origins and local exact
hosts/ports/CIDRs. Reject unsafe addresses/URL components, redirects and DNS
rebinding; connect to validated addresses with normal TLS verification. Do not
send cloud keys to arbitrary public endpoints.

Compose child-tutor/age/proficiency/avatar/mode/objective prompts plus screened,
bounded history. Stored system turns cannot acquire instruction authority. Ask
for JSON; validate envelope and strict Zod discriminated response unions. Provider
output contains no reward/progress/persistence authority. One fresh repair, same
runtime/model, no malformed text feedback. Real failures return sanitized codes
before operation writes; never substitute Mock.

Provider test exercises inference/envelope/parser/schema, returns metadata only
and writes nothing. Activation checks required-key presence but cannot establish
credential/network validity. An in-memory per-process limiter bounds real calls;
no distributed or persisted coordination.

## Consequences

No migration/vendor SDK/advanced AI features. Canonical vocabulary, mission engine,
gamification and safety remain application-owned. Supported models must accept
non-streaming Chat Completions text/temperature/max_tokens requests and generate
the defined JSON contract. Automated tests need no Internet or paid accounts.
At least one real-runtime manual validation is required for final acceptance.
Pattern-based safety and generic model prompts do not guarantee production child
moderation; existing documented safety limits remain.
