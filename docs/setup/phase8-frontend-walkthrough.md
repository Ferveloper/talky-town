# Phase 8 — Functional frontend walkthrough

## Prepare the controlled demo

Follow [local development](local-development.md), migrate and seed, then run pnpm dev. Open http://localhost:3000. Use fictional data only: the demo adult, profiles and progress are shared between visitors. Before unrestricted public deployment, restrict demo access or isolate accounts.

Login does not activate Mock. For a deterministic evaluation, use a separate demo database seeded with a fresh adult and Mock, or explicitly select Mock in Adultos → Configurar IA → Activar para nuevas conversaciones. This selection affects all new sessions for the shared adult, and leaves open sessions pinned.

## Demonstrate learning

1. Enter the demo as an adult and create a fresh profile with an invented alias, age 8, Español → Inglés and Luna.
2. Open Animal Adventure. Send dog, I likes dogs, then cat.
3. Observe the real correction I like dogs and mission progress 33%, 67%, 100%.
4. The conversation earns 45 XP: three practice events of 5 XP and one completion event of 30 XP.
5. Open the summary and Mis recompensas. The fresh profile has level 1, 45 XP into its next 50-XP step, four earned badges and a one-day Madrid streak.
6. Reload the conversation: all seven turns restore; historical rewards do not celebrate again.
7. Review the profile in Adultos: English proficiency is separate from game level; vocabulary counters and at most ten recent sessions come from the backend.

Try a free conversation with three accepted words and close it explicitly: it earns 15 practice XP plus 10 completion XP once. Ending a guided mission early abandons it without completion XP. Reloading a summary never ends a session.

## Demonstrate recovery and safety

Only accepted child messages appear as bubbles. Failed requests retain one UUID/body for an explicit retry, including after reload when sessionStorage is available. A lost response can represent a committed write. Text expires after fifteen minutes; recover history and close the old conversation before starting another. Keep the tab open when browser storage is unavailable.

Use the existing [safety policy](../safety.md). Unsafe child input and provider output produce controlled redirection/support, no raw child bubble or learning reward. A historical safe-read error hides the entire loaded history; an administrator must perform the documented recovery. Do not promise automated parent alerts or safety certification.

The microphone is a disabled Phase 9 placeholder. There is no audio permission request, recording, recognition or speech synthesis.

## Provider settings

Guardar configuración only saves URL/model. Activar para nuevas conversaciones selects the provider. Probar runs actual inference/schema validation, may consume resources and never stores learning or changes selection. Configuration completeness, credentials presence and last explicit availability test are distinct states. localhost refers to NestJS, and the runtime allowlist is server-owned. Keys are set only on the server.

## Run isolated browser acceptance

Create a separate database once (do not reset talkytown):

```powershell
docker exec talkytown-postgres createdb -U talkytown talkytown_e2e
$env:E2E_DATABASE_URL='postgresql://talkytown:talkytown@localhost:55432/talkytown_e2e?schema=public'
pnpm exec playwright install chromium
pnpm e2e
```

On Bash, prefix E2E_DATABASE_URL to pnpm e2e. The runner rejects non-loopback hosts or database names without \_e2e, applies migrations, creates a uniquely owned demo adult, builds all packages, starts real production Next/Nest on 3100/3101, and cleans only that adult's fixtures. Ports must be free. E2E_SKIP_BUILD=1 is for a known current build only. Use --project=desktop for a targeted run.

The scripted provider test binds 127.0.0.1:1234. It fails if the port is occupied and never connects to an existing LLM. Real keys are blank. Browser traces are off; screenshots and HTML reports use fictional test fixtures. GitHub Actions uses Node 20/Linux and its own PostgreSQL service.
