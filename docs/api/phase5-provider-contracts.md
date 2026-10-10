# Phase 5 — Real OpenAI-Compatible Provider Contracts

Phase 5 extends the Phase 4 API. All existing resource paths, ownership rules,
request-ID persistence IDs, deterministic missions and server rewards remain.
Provider operations require an adult JWT. Configuration is always adult-scoped.

## Routes

| Route                                  | Body                                                                                       | Success                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| GET /ai-providers                      | None                                                                                       | Catalog, active selection and non-secret readiness    |
| PUT /ai-providers/active               | `{ "providerType": "mock\|openai-compatible-cloud\|local-openai-compatible" }` (one value) | Catalog; no inference                                 |
| PUT /ai-providers/:providerType/config | `{ "baseUrl": "http://localhost:11434/v1", "model": "qwen2.5:3b" }`                        | Normalized configuration; does not activate           |
| POST /ai-providers/:providerType/test  | Empty                                                                                      | `{ providerType, model, available: true, latencyMs }` |

Mock configuration is fixed and cannot be edited. Unknown types/fields and API
keys are rejected. Real configurations require a URL (maximum 2048 characters)
and an ASCII model identifier (maximum 200; letters, digits, `_ . : / -`).
The adapter appends `/chat/completions` to the configured API root; `/v1` is part
of the example root, not appended again.

Catalog entries contain `providerType`, nullable `baseUrl`/`model`, `active`,
`configured`, `credentialsConfigured`, optional `configurationError`,
`executable` and `activatable`. All three adapters are registered. `configured`
means metadata, server policy and required credential presence pass validation;
it does not establish network health or credential validity. The optional local
key can be absent while local is configured. Mock needs no credentials.

An invalid selection remains inspectable: `activeProvider` can be null and
`selectionError` reports missing/ambiguous/unknown selection. Invalid legacy
technical metadata is not echoed. Starting a session still fails explicitly.

Activation validates configuration and required cloud-key presence, never claims
the key works. Test or actual inference verifies upstream behavior. The test
executes the same adapter, validates the Chat Completions envelope, parses content
and applies the same strict Zod response schema. It performs no database writes,
returns no generated text and does not activate the provider.

## Pedagogical response boundary

Strict objects at every level:

```ts
type AiConversationResponse = {
  reply: string; // trimmed, 1–2000 characters
  correction?:
    | { needed: false }
    | {
        needed: true;
        corrected: string; // trimmed, 1–500
        original?: string; // 1–500; exact screened current message
        explanation?: string; // trimmed, 1–500
      };
  newVocabulary: string[]; // up to 30 trimmed items, each 1–80
  avatarEmotion: "happy" | "thinking" | "celebrating" | "encouraging";
  safety:
    | { flagged: false }
    | {
        flagged: true;
        reason: "personal-data-request" | "unsuitable-topic" | "instruction-override" | "other";
      };
};
```

`needed=false` rejects correction fields; `flagged=false` rejects `reason`.
Reward, badge, progress and persistence fields are rejected, never acted upon.
Vocabulary suggestions remain suggestions: persistence counts actual screened
child practice using existing canonical rules.

The envelope requires exactly one choice (`index=0`, `finish_reason=stop`),
assistant role and textual content. Tool/function calls, refusals, empty or
truncated output fail validation. Parse JSON directly or remove one outer JSON
code fence; do not extract objects from arbitrary prose. One fresh repair attempt
is permitted for invalid output, using the same runtime/model and screened input.
The malformed output is not fed back, stored or logged. A second invalid response
returns an error before any operation writes or rewards. Transport/auth/rate-limit
errors are not retried automatically.

Valid but unsafe pedagogical output is handled by existing SafetyService:
discard content/corrections/suggestions, store a controlled redirection and coded
safety metadata, award nothing. Blocked input never reaches inference.

## Session selection and transactions

Start selects the adult's active configuration and writes its provider/model into
existing session fields. Opening turns remain deterministic. Messages resolve
the session's provider type and pinned model, irrespective of active selection
or a newly configured default model. Missing/invalid session configuration fails;
there is no substitution with Mock or backfill of missing session metadata.

The configured model identifier is pinned; aliases can still be changed by an
external runtime administrator. This is not model-weight/version locking.

URL updates return 409 only if owned sessions of that provider type have
`status=active`. Completed/abandoned sessions do not block. Optional
`activeSessionCount` is aggregate metadata only. Close active sessions before
changing their provider URL.

Configuration/activation lock the adult row. Session creation and persistence
share-lock that row; message persistence revalidates the session snapshot and
effective provider ID/type/URL/pinned model. Activation/default-model updates do
not invalidate pinned execution. DNS validation and inference happen outside
transactions. Existing replay, stale-snapshot retries, atomic writes and rollback
remain. Retrying a failed provider operation with the same requestId can succeed
later; a committed replay needs no provider call or additional reward.

## Server policy, credentials and limits

PostgreSQL holds selection, URL and model. Environment holds `AI_CLOUD_API_KEY`
and optional `AI_LOCAL_API_KEY`. No HTTP key fields or database credentials.
Non-secret policy is `config/ai-runtime-policy.json`; restart after editing it.

Cloud requires HTTPS and an exact administrator-authorized origin. Every resolved
IPv4/IPv6 address must be publicly routable. The cloud key is sent only to an
authorized origin; authorize only endpoints entrusted with that key and safe
practice text. Local requires exact authorized host, port and address CIDR.
Default local hosts are localhost/127.0.0.1/::1, ports 11434/1234, loopback CIDRs.
Additional LAN/Docker targets require administrator policy changes. Link-local,
multicast, unspecified and reserved addresses remain forbidden.

URL credentials, query/fragment, unexpected schemes and encoded path escapes are
rejected. Redirects are disabled. Resolve/validate before connection; Undici's
per-request dispatcher connects to the validated address with normal TLS checks.
No global dispatcher changes or implicit proxy use. DNS is rechecked on each call.

Defaults: cloud 30 seconds per attempt/60 total; local 60/120; response body 64 KiB
including stream byte accounting. Requests use native Node fetch, `stream=false`,
`temperature=0.2`, `max_tokens=512`, prompts requesting JSON. Native structured-output
extensions are not required. Models must support these Chat Completions fields;
incompatibility returns a controlled error, not capability guessing.

Real inference/tests share an in-memory per-process limiter: one in-flight
operation and five starts per minute per adult. Repair attempts belong to that
operation. Mock conversations/replays and blocked-input redirections do not use
it. A concurrent real request can receive 429; retry after the first commits to
obtain its idempotent replay. No Redis, persistence or cross-process coordination.

## Controlled errors

| HTTP | Code                                                                                 |
| ---- | ------------------------------------------------------------------------------------ |
| 400  | VALIDATION_ERROR                                                                     |
| 422  | PROVIDER_NOT_CONFIGURED, PROVIDER_CONFIGURATION_INVALID, PROVIDER_URL_NOT_ALLOWED    |
| 409  | PROVIDER_CONFIG_IN_USE, PROVIDER_CONFIGURATION_CHANGED                               |
| 429  | PROVIDER_OPERATION_RATE_LIMITED                                                      |
| 502  | PROVIDER_AUTHENTICATION_FAILED, PROVIDER_INVALID_RESPONSE, PROVIDER_REQUEST_REJECTED |
| 503  | PROVIDER_UNAVAILABLE, PROVIDER_RATE_LIMITED                                          |
| 504  | PROVIDER_TIMEOUT                                                                     |

JWT failures still use 401. Upstream authentication failures use 502. No raw
upstream body, child content, URL credentials or secret is returned or logged.
Real failures produce no operation writes and no XP. Valid Mock generation keeps
its Phase 4 controlled local response; provider tests use strict execution and
cannot conceal a Mock test failure with that response.

No streaming, Responses API, tools, agents, MCP, RAG, embeddings or audio features.
