# Phase 5 — Real Provider Walkthrough and Live Validation

Automated tests run a deterministic local HTTP fake. They prove adapter behavior
and persistence, not the quality/compatibility of a real model. The mandatory
real-runtime checks below passed on 2026-10-09; the acceptance checklist also
records the automated gates. This validates the recorded runtime/model configuration.

## Prepare TalkyTown

Follow local development setup, configure JWT_SECRET, start PostgreSQL, apply
existing migrations/seed and run `pnpm dev`. Open http://localhost:3001/docs.
Log in with POST /auth/demo and authorize its bearer token in Swagger.

For a local runtime bound to IPv4, configure `127.0.0.1` explicitly rather than
`localhost`. The safe transport pins one validated DNS address; `localhost` can
resolve to `::1` first while the runtime listens only on IPv4. The existing policy
already permits `127.0.0.1` on ports 11434 and 1234.

New installs select Mock and work without external keys. The seed preserves an
existing adult active provider on reruns; it does not reactivate Mock alongside
the real provider. Seed still replaces its demo history, so use a fresh fictional
child for manual provider validation.

## Option A — Ollama

Install/run Ollama independently. Pull an available instruction model compatible
with the machine, for example `ollama pull qwen2.5:3b`. Download requires network
and disk space; it is not part of automated tests. Use the exact installed tag.

Configure through Swagger:

```http
PUT /ai-providers/local-openai-compatible/config
Content-Type: application/json

{"baseUrl":"http://127.0.0.1:11434/v1","model":"qwen2.5:3b"}
```

Ollama local does not normally require a key; leave AI_LOCAL_API_KEY blank.
See [Ollama compatibility documentation](https://docs.ollama.com/api/openai-compatibility).

## Option B — LM Studio

Load a suitable instruction model, enable its OpenAI-compatible server in the
Developer tab and use its exact model identifier. Configure
`http://127.0.0.1:1234/v1`. If runtime authentication is enabled, configure its
key in server `.env` as AI_LOCAL_API_KEY and restart TalkyTown.
See [LM Studio documentation](https://lmstudio.ai/docs/developer/openai-compat/structured-output).

## Option C — Cloud

Add the trusted HTTPS origin to `cloudOrigins` in the server policy, for example
`https://api.openai.com` for a compatible model/account. Put its key only in
AI_CLOUD_API_KEY and restart TalkyTown. Configure that adult's API-root URL/model
with PUT /ai-providers/openai-compatible-cloud/config. Do not paste keys into
Swagger. Manual cloud inference may incur the provider's normal charges.

Only authorize origins entrusted with this server-wide key. A single cloud
credential is shared by configurations using this runtime, not per adult.

## Option D — llama.cpp / llama-server

Use an installed llama-server and a chat/instruct GGUF stored outside the Git
repository. Check free disk/RAM before downloading. The successful configuration
recorded below uses Qwen3-4B-Instruct-2507 Q4_K_M and Intel Iris Xe Vulkan; choose
the device reported by `llama-server --list-devices` on your own machine.

```powershell
llama-server -m "<GGUF_PATH>" --host 127.0.0.1 --port 11434 `
  --alias talkytown-local -c 8192 -t 4 --parallel 1 `
  -ngl 99 --device Vulkan0 --cache-ram 0 --ctx-checkpoints 0 `
  --cache-type-k q4_0 --cache-type-v q4_0 --flash-attn on `
  --reasoning off --metrics --no-ui --log-disable
```

These runtime flags reduce memory use and enable the installed GPU. They do not
change TalkyTown's timeout, schema or URL policy. No generation grammar or injected
responses are used. Bind to IPv4 explicitly and configure:

```http
PUT /ai-providers/local-openai-compatible/config
Content-Type: application/json

{"baseUrl":"http://127.0.0.1:11434/v1","model":"talkytown-local"}
```

Leave AI_LOCAL_API_KEY blank unless the runtime requires authentication. Verify
`/v1/models` and a minimal `/v1/chat/completions` independently before TalkyTown's
mandatory `/test`. Wait for runtime `/health` to report `ok` after every restart.
Use aggregate `/metrics` counters to prove inference, replay and safety bypass
without recording prompts or responses. Stop owned server processes afterward.

See the [llama.cpp server documentation](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md),
[original Qwen model](https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507) and
[downloaded quantization](https://huggingface.co/bartowski/Qwen_Qwen3-4B-Instruct-2507-GGUF/blob/ae44f08e1392f39c0e474af10c3ff8355c8b6688/Qwen_Qwen3-4B-Instruct-2507-Q4_K_M.gguf).

## Verify usable execution

1. POST /ai-providers/:providerType/test, empty body. Require available=true.
   This performs inference, envelope parsing and strict schema validation. No
   generated text is returned or stored. Activation alone cannot verify a key.
2. PUT /ai-providers/active with the configured type.
3. Create a fictional age-9 profile with es/en, learningLevel=hero and avatar=luna.
4. Start Animal Adventure using a fresh request UUID. Check session provider/model.
5. Send `dog`, `I likes dogs`, `cat`, each with its own UUID. Check 33/67/100,
   completed status, 45 ledger XP and First Talk/Animal Explorer. Corrections are
   generated by the model and can vary; record observed pedagogical behavior.
6. Replay the final UUID. Verify unchanged turn/reward counts. Check progress.
7. Start another real free-talk session. Configure a different default model and
   activate Mock. Send a message in the existing session: it must still execute
   the original real provider/model. A new session must select Mock.
8. Attempt a URL change while that real session is active: expect 409 and aggregate
   activeSessionCount. End it and retry: completed/abandoned sessions cannot block.
9. Keep another real session open and stop its runtime. Send a safe message; expect
   controlled unavailable/timeout error and unchanged turns/XP. Restart the runtime
   and retry the same UUID successfully.
10. Send a synthetic unsafe example such as `my phone is 612 345 678`; verify no
    raw child turn, no reward and a controlled safe redirection. Use no real data.

The real-operation limiter allows five starts/minute/adult and one in flight.
Pause a minute between batches where needed; completed replays consume no slot.
The Mock choice affects new sessions; it never silently replaces a failed real
session. All provider generation remains outside database transactions.

## Real-runtime evidence — 2026-10-09

**PHASE 5 REAL-PROVIDER ACCEPTANCE: PASS** for the mandatory real-runtime checks.
All acceptance operations used the compiled API over HTTP with demo bearer auth.
Prisma reads were secondary evidence; cleanup removed only validation-owned data.
The initial working tree was clean on `develop` at `2e3df04` (`v0.4-ai-providers`).

| Field                      | Observed result                                                                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Machine                    | Windows 11 Pro 10.0.26200; Intel i5-1135G7, 4 cores/8 threads, 15.73 GiB RAM; Intel Iris Xe Vulkan                                                                                   |
| Runtime                    | Existing WinGet llama.cpp installation; llama-server 9354 (`9777256c3`), Clang 19.1.5, Windows x86_64                                                                                |
| Model                      | `Qwen_Qwen3-4B-Instruct-2507-Q4_K_M.gguf`, 2,497,280,736 bytes; downloaded quantization linked above, revision `ae44f08e1392f39c0e474af10c3ff8355c8b6688`                            |
| Runtime configuration      | Option D flags above; IPv4, port 11434, alias `talkytown-local`, context 8192; no local API key                                                                                      |
| Independent runtime        | `/v1/models` exposed alias; non-streaming Chat Completions returned one assistant message with string content and `finish_reason=stop`                                               |
| API / Swagger              | Compiled startup; `/health`, `/docs`, `/docs-json` returned 200; provider configuration/test routes present                                                                          |
| Configuration / activation | Configuration stayed inactive until PUT /active; no secret returned; activation generated no tokens; catalog selected local and reported configured/executable/activatable           |
| Complete `/test`           | HTTP 200, `available=true`, `latencyMs=20823`; 74 generated tokens; envelope, JSON extraction and current Zod schema validated; no generated content returned or persisted           |
| Fresh profile              | Fictional age-9 es/en profile, `learningLevel=hero`, Luna; Animal Adventure eligible                                                                                                 |
| Mission                    | `dog` → 33%, 5 XP, 13,985 ms; `I likes dogs` → 67%, 5 XP, 15,033 ms; `cat` → 100%, 35 XP, 22,357 ms; session completed                                                               |
| Derived progress           | 45 ledger XP; Animal Adventure completed; First Talk and Animal Explorer; `learningLevel=hero` unchanged                                                                             |
| Vocabulary                 | `dog`: practice 2/successful use 2; `cat`: practice 1/successful use 1                                                                                                               |
| Correction observation     | Model returned `{needed:false}` for the deliberate grammar error, in both mission and subsequent free talk; no correction was observed                                               |
| PostgreSQL metadata        | Completed mission persisted `aiProviderType=local-openai-compatible`, `aiModel=talkytown-local`, progress 100                                                                        |
| Final-UUID replay          | 45 XP, 7 turns and 4 XP events unchanged; vocabulary/badges unchanged; runtime token counters unchanged                                                                              |
| Provider/model pinning     | Existing session still executed local/original model after default model changed and Mock was activated; 63 new generated tokens; new session selected `mock / talkytown-mock`       |
| URL in use                 | 409 `PROVIDER_CONFIG_IN_USE`, `activeSessionCount=1`, no transcript; completed and abandoned local sessions allowed URL changes; URL restored                                        |
| Runtime down               | 503 `PROVIDER_UNAVAILABLE`; full before/after snapshots unchanged for turns, XP, vocabulary, badges, mission and cached profile totals; no Mock fallback                             |
| Same-UUID retry            | After identical runtime restart, failed UUID/message succeeded with local/original model, 33% and 5 XP; 55 new generated tokens                                                      |
| Input safety               | Fictional phone disclosure flagged; child turn null, 0 XP, unchanged mission/vocabulary; one controlled avatar turn and SafetyEvent; no raw input stored; runtime counters unchanged |
| Output safety              | Existing deterministic HTTP/PostgreSQL unsafe-output tests passed; no harmful live generation was solicited                                                                          |
| Cleanup                    | Validation profiles/sessions/turns/rewards/vocabulary/safety events removed; original adult provider configurations/selection restored; owned API/runtime processes stopped          |

Downloaded model SHA-256 was checked against the pinned repository metadata:
`2fde00ce69dd4899c70d020845e2638353015bba0fdf161b3eb965f2bca4464e`.
Model assets and temporary HTTP drivers/aggregate evidence were stored outside Git,
under the per-user `.cache/talkytown-phase5-validation` directory. No bearer tokens,
credentials or transcripts are included in this evidence.

## Initial failures and remaining observations

The first verified Qwen2.5-3B-Instruct Q4_K_M model produced conversational text
and separate JSON fragments; `/test` correctly returned 502
`PROVIDER_INVALID_RESPONSE` after its repair attempt. Qwen3-1.7B Q4_K_M passed
the synthetic test but did not consistently satisfy the mission response format.
Their validation database records and downloaded binaries were removed before the final run.
The successful 4B model was chosen after Windows released the previous model's
disk allocation. No parser weakening or provider code change was made.

CPU-only 4B inference exceeded the unchanged 60-second local timeout. Early
attempts also exposed Prisma P2028 transaction expiration and P1001 connection
failures while the machine was under memory pressure. PostgreSQL accepted
connections inside its container while host connections failed; restarting only
that container restored host connectivity. The compiled API was restarted with
the same database using a temporary IPv4 host override and an external diagnostic
preload that recorded exception names/codes only. `.env` was not edited. The final
Vulkan/KV-Q4 configuration completed all mandatory checks without these errors.

Docker Desktop initially failed to start because of stale Windows Unix sockets
and a retained WSL bootstrap process. Only its socket runtime directories were
renamed to backups and `docker-desktop` restarted; no factory reset, volume
deletion or application configuration reset was used. PostgreSQL remains healthy.

The first final database regression reported 18/19 because an existing safety test
searches `JSON.stringify([turns, safety])` for the phone prefix `612`, including IDs.
A generated session hash contained that substring; persisted content contained
only safe avatar prompts/redirections. The unchanged suite then passed 19/19.
This test assertion is nondeterministic and remains a follow-up: inspect content
and relevant safety fields rather than random identifiers. No test was changed
or skipped to obtain acceptance.

Model JSON compliance and correction quality are configuration-dependent. The
observed missing correction is a pedagogical limitation, not a successful
correction claim; correction was optional in this acceptance request. Domain XP,
badges and mission progression remained deterministic. A different model/runtime
configuration must repeat `/test` and the live walkthrough.

The 2026-10-07 check found no Ollama/LM Studio installation or listening local
runtime and did not claim live acceptance. This 2026-10-09 llama.cpp run supersedes
that pending gate. Baseline automated results and seed preservation are recorded
in the [acceptance checklist](../development/phase5-real-providers-checklist.md).
