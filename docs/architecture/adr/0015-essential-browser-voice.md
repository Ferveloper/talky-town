# ADR 0015 — Reviewed browser voice and fail-closed processing

## Status

Accepted for Phase 9 Level 1, with the approved confirmed-text retention distinction.

## Decision

Keep speech independent of the conversation LLM. Native browser recognition produces an editable memory-only draft; explicit confirmation freezes the existing adult/profile/session, message, input mode, request UUID and original timestamp. Only then POST confirmed text through the existing BFF and NestJS safety/reward pipeline. Voice grants no additional rewards. The server replays request UUIDs but does not independently enforce identical message-body hashes; frontend payload identity remains mandatory.

Local-only is the default. Before enabling the microphone, perform read-only checks of the recognition constructor, real processLocally property and static available({ langs: [language], processLocally: true }). Only "available" permits local capture. Missing APIs, policy failures, downloadable/downloading/unavailable packs and check timeouts keep typing available. Never install packs or switch processing automatically. Precompute capability in effects; native start remains synchronous inside the explicit button interaction. Never probe permissions with getUserMedia.

The authenticated adult dashboard offers a separate, informed browser-service choice explaining possible vendor processing outside the device. This is not verified legal parental consent. Store only in React memory, isolated by authenticated identity. Clear on reload/layout remount, logout/auth expiry and identity changes. Internal navigation may preserve this choice. Shared demo accounts still do not establish visitor privacy or genuine adult verification.

Recognition is en-US by default with an explicit es-ES alternative, never translation. No automatic listening, submission or restart. Bound startup to 15 seconds, capture to 30 seconds and finalization to 5 seconds. Stop finalizes; Discard aborts. Ignore interim results, deduplicate final result indices, and require editing rather than truncating transcripts over 500 characters. Reject empty drafts. Disable capture while the composer contains a draft or a confirmed operation is unresolved.

Browser synthesis is manual Play/Replay/Stop. Only NestJS-returned avatar content can be spoken. Select installed local voices deterministically per avatar and language, without promising identical OS voices. Missing Spanish never selects English. A shared exact safety response catalogue carries presentation locale only; moderation remains in the API. Golden UTF-8 fixtures prove all previous text is unchanged. Sensitive replies never autoplay; no reply autoplays in Level 1.

Document-level coordination prevents overlapping speech activity. Recognition and playback have independent generations and dispose native handlers, timers and resources on navigation/unmount, page hiding, logout/auth expiry and closure. Listening/speaking states follow native start events, not button presses. Reduced motion uses static indicators.

## Storage and safety

TalkyTown never persists microphone audio, blobs or recordings. Unconfirmed recognition stays in transient application memory. Confirmed submitted text is an ordinary message: existing accepted-message PostgreSQL persistence and up to 15-minute scoped sessionStorage pending retention apply. No full browser transcript history, localStorage or IndexedDB speech data. Expiry removes text and preserves existing identifier-only tombstones; suspended tabs purge on resume. No automatic ambiguous retry or renewed deadline.

Backend child input, provider output, returned history, zero-reward blocking, accepted mission evidence and provider pinning are unchanged. Recognition can normalize grammar or miss disclosures, and synthesis can mispronounce text. This is an educational demo, not pronunciation assessment or certified child-audio processing.

## Validation and boundaries

Fake browser APIs drive deterministic unit/component and five-viewport Playwright tests. Core browser flows still use real Next/Nest/PostgreSQL/Mock. Real microphone/audio evidence must be recorded separately, including browser/OS/mode and limitations. No new Prisma schema, migrations, public conversation DTOs, audio endpoints, credentials, models, ML runtimes or speech SDKs. Optional Level 2 needs separate authorization and measurement; Kokoro ONNX and non-cloning Pocket TTS are candidates, not selected implementations.
