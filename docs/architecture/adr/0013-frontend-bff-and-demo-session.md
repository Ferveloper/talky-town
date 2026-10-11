# ADR 0013 — Same-origin frontend BFF and shared demo session

## Status

Accepted — Phase 8, including the approved authentication, empty-body and privacy refinements.

## Decision

Keep Next.js 14 App Router and React 18. Explicit Route Handlers proxy only existing Nest endpoints. The browser calls /api on its own origin. The server holds the Nest JWT in a host-only, Path=/, HttpOnly, SameSite=Lax cookie with at most two hours of lifetime. Secure follows the configured HTTPS WEB_APP_ORIGIN, including production HTTP local tests. The cookie is never returned to client JavaScript. Nest verifies identity and ownership on every protected API call; the private layout also verifies /auth/me before rendering.

Every mutation requires exact configured Origin, X-TalkyTown-Request: 1 and application/json. Read streamed bodies with a 16 KiB bound. Login, logout, end and provider test accept no body or an empty JSON object. There is no arbitrary URL proxy, wildcard CORS or redirect forwarding. All private/BFF requests and responses use no-store; errors expose controlled codes, never rejected text, credentials or upstream error details.

Login only authenticates. Selecting/activating Mock is an explicit adult operation, never a login side effect. The isolated evaluator environment seeds Mock. Provider save, activation and live inference test remain separate. Existing sessions keep their pinned provider/model.

The shared adult and its fictional profiles are a controlled TFM demo, not private visitor accounts. Before unrestricted Phase 13 publication, isolate visitor accounts or restrict access. Logout clears the browser cookie and pending data, but does not revoke an issued Nest token. No new account or revocation architecture is introduced.

## Consequences

TALKYTOWN_API_URL and WEB_APP_ORIGIN are server configuration. No frontend API keys. Configurable BFF_READ_TIMEOUT_MS (10 seconds default) and BFF_OPERATION_TIMEOUT_MS (150 seconds default) accommodate existing local/cloud attempt deadlines. Deployment request limits must exceed the operation timeout; a shorter hosting timeout is an ambiguous result and must preserve replay identity. Abort of the proxy request does not prove that a backend commit failed.

Client components fetch typed live data after the authenticated layout. Loading, empty, retry and safe-read failure states are explicit. This avoids build-time backend availability requirements. Shared additions name list/start wrappers only; API wire contracts, Prisma schema, safety, missions, gamification and providers are unchanged.
