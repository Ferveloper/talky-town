# Phase 8 — Functional Child Frontend implementation report

Date: 11 October 2026. Branch: `feature/phase-8-child-frontend`. Starting HEAD:
`b0a120f2e986cd2cd36a6e3835c5d280e4aded32` for the original implementation. The final reliability correction starts from committed baseline `aa320e395a6126e4637049446de8569f621f78e6`; its changes remain uncommitted for review.

## Delivered behavior

The evaluator can use the browser to log into the shared demo, create a fictional
profile, choose Animal Adventure, receive a gentle correction, complete the
mission, view 45 XP and four badges, and inspect the same progress in the adult
panel. Requests use real Next.js Route Handlers, NestJS and PostgreSQL. Mock
requires no AI credentials. Login preserves the adult's selected provider.

The first real browser vertical slice was completed before rewards, adult
settings and final visual polish. Later acceptance added response-loss recovery,
provider pinning, safety, authentication, accessibility and five viewports.

## Implemented screens and API compatibility

All paths below are actual App Router pages. Private pages share a server-verified
adult layout. `/` exists only in `app/(public)/page.tsx`; the old root page was
removed. Stitch HTML was used as reference and refactored into reusable React UI.

| Screen / Stitch reference                 | Browser route                           | Existing NestJS contract used                                            |
| ----------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------ |
| Welcome / 01                              | `/`                                     | Public static content                                                    |
| Demo entry / 02                           | `/login`                                | `POST /auth/demo`, then `GET /auth/me`                                   |
| Profile selection / 03                    | `/profiles`                             | `GET /child-profiles`                                                    |
| Create profile and choose avatar / 04     | `/profiles/new`                         | `GET /avatars`, `POST /child-profiles`                                   |
| Child home / 05                           | `/child/:profileId`                     | Profile, progress and age-eligible missions GETs                         |
| Mission selection / 06                    | `/child/:profileId/missions`            | `GET /child-profiles/:id/missions`, `POST /conversations/sessions`       |
| Conversation and tablet variant / 07, 07b | `/child/:profileId/sessions/:sessionId` | Session GET, paginated turns GET, messages POST, end POST                |
| Gentle correction / 08                    | State inside conversation               | Returned turn correction; never synthesized by React                     |
| Session summary / 09                      | Conversation route plus `/summary`      | Session and progress GETs only                                           |
| Rewards / 10                              | `/child/:profileId/rewards`             | `ProgressResponse` and canonical seven-badge catalog                     |
| Adult overview / 11                       | `/adult`                                | Owned profiles and progress GETs                                         |
| Adult profile details                     | `/adult/profiles/:profileId`            | Profile/progress, vocabulary and ten recent sessions                     |
| AI settings / 12                          | `/adult/ai-settings`                    | Catalog GET, configuration PUT, active selection PUT, explicit test POST |
| Safety/privacy / 13                       | `/safety`                               | Public guidance consistent with Phase 6 policy                           |
| Microphone / 14                           | Disabled conversation control           | Honest Phase 9 placeholder; no audio APIs                                |
| AI failure / 15                           | Recovery state in conversation/settings | Controlled existing error codes and explicit retry                       |

Loading, empty, validation, unavailable backend, expired authentication, completed
and abandoned sessions, pending operations, deadline expiry and administrative
safety review have visible states. Avatar selection is available during creation;
there is no unsupported profile avatar edit control.

No production NestJS source, Prisma schema/migration, provider response schema,
mission evaluation, reward calculation or safety policy was changed. Shared
frontend types only name wrappers already returned by the API. Provider emotion
is not invented as a public response field: visual states reflect actual UI
operations. English proficiency and numerical game level remain distinct.

## Original implementation inventory

The original Phase 8 implementation covered 19 existing paths (including one removed page)
and 80 new files, including eight durable browser screenshots. The grouped
inventory below identifies the implementation and review entry points.

| Area                         | Main files / directories                                                                                                                                          | Purpose                                                                                         |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Typed contracts              | `packages/shared/src/frontend-contracts.ts`, `src/index.ts`                                                                                                       | Existing profile/avatar/mission/start response wrappers                                         |
| BFF and authentication       | `apps/web/lib/server/{bff,auth}.ts`, `app/api/`                                                                                                                   | Explicit allowlisted routes, private cookie, server forwarding                                  |
| Browser client and recovery  | `apps/web/lib/{api,pending}.ts`, `components/safety/pending-retention.tsx`                                                                                        | Typed requests, coded errors, immutable pending operation and expiry                            |
| App Router                   | `apps/web/app/(public)/`, `app/(authenticated)/`, root layout/not-found                                                                                           | Public/private pages, loading/error boundaries and navigation                                   |
| UI and screens               | `apps/web/components/{ui,layout,profiles,conversation,gamification,parent,providers,safety}/`                                                                     | Reusable cards/buttons, complete connected flows                                                |
| Design assets                | `apps/web/app/globals.css`, `app/layout.tsx`, `public/avatars/{luna,max}.png`                                                                                     | Responsive Stitch-inspired design, local Quicksand, verified avatars                            |
| Frontend testing             | `apps/web/test/`, `vitest.config.ts`, `apps/web/e2e/`                                                                                                             | Actual Route Handlers, component recovery and real browser acceptance                           |
| Isolated test infrastructure | `scripts/{run-e2e.mjs,e2e-api.cjs,start-web.mjs,verify-avatar.mjs}`, `apps/api/test/helpers/browser-{fixtures,admin}.ts`                                          | Qualified fixtures, production server startup and asset verification                            |
| Dependencies/configuration   | Root/web package manifests, lockfile, `.env.example`, `.prettierignore`, `playwright.config.ts`, `.github/workflows/ci.yml`                                       | Runnable scripts, browser checks, generated-report formatting exclusions and Node 20/Linux jobs |
| Documentation                | README, scope, UX, structure, conventions, local setup, design system, `.design` screen inventory, ADRs 0013/0014, walkthrough, avatar provenance and this report | Actual behavior, decisions, limits and evaluator instructions                                   |

See [BFF ADR](../architecture/adr/0013-frontend-bff-and-demo-session.md),
[recovery ADR](../architecture/adr/0014-frontend-replay-and-celebrations.md),
[walkthrough](../setup/phase8-frontend-walkthrough.md) and
[avatar provenance](../design/phase8-avatar-provenance.md).

## Browser evidence

The main acceptance creates a fresh age-eight profile and sends `dog`,
`I likes dogs`, then `cat`. It verifies the returned `I like dogs` correction,
seven restored turns, one completed mission/session, 45 XP, level 1 and the
`first-talk`, `kind-corrector`, `animal-explorer`, `mission-complete` badges.
It also opens the rendered rewards gallery and adult dashboard/profile and
checks their stored XP. Reloading does not repeat reward celebrations.

The durable screenshots in [evidence/phase8](evidence/phase8/README.md) show the
actual fictional test journey and representative desktop/mobile layouts.
The complete local Playwright HTML report remains in the ignored
`playwright-report/` directory. CI uploads fictional-fixture reports for seven
days; browser traces are disabled.

Additional real browser checks cover:

- Abort the response after a committed start/message, then replay the exact UUID/body; no duplicate session or XP.
- End free talk with three accepted messages, lose the response, retry and retain exactly 25 XP; summary restoration is read-only.
- Block personal data and serious distress without a raw child bubble or learning rewards; render the backend's deterministic Spanish support text unchanged.
- Restore 51 historical turns across two pages; if the later page requires review, hide all history and retain the known-session end operation. A different profile cannot display that session.
- Reject an expired signed JWT, clear cookie/pending text, re-enter the demo and log out. A server-rendered auth redirect also clears pending browser data on login entry.
- Validate fictional alias input, keyboard focus, disabled voice, reduced motion, local assets, no horizontal page overflow and automated WCAG 2 A/AA axe checks.
- Save/test/activate providers independently. An existing Mock session stays Mock; a local session retains its pinned model after default-model changes. A real-adapter HTTP failure offers retry without switching providers. Tests use a controlled local HTTP server, never paid inference.

## Security and replay decisions

The BFF holds the JWT in a host-only, Path=/, HttpOnly, SameSite=Lax cookie with a
maximum two-hour lifetime and Secure when `WEB_APP_ORIGIN` uses HTTPS. It forwards
only explicit backend routes and returns private no-store responses. Mutations
require an exact Origin, `X-TalkyTown-Request: 1` and JSON content type. Bodies are
bounded to 16 KiB. Demo login, end, provider test and logout accept an empty body.
JWTs and API credentials are absent from frontend-visible storage and URLs.
Upstream failures expose controlled codes, not raw rejected content or secrets.

One unresolved start/message per context is stored in operation-scoped `sessionStorage` keys, with strict
adult/profile/session identity checks and a maximum fifteen-minute lifetime
from the original attempt. Retries do not extend it. Success, logout, login
entry/auth expiry remove all operations; safety review removes the affected context. Reading another profile/session preserves valid operations. Clears require the context and original UUID, including late asynchronous completions. No complete transcript
is persisted in browser storage. At the deadline, raw payload is replaced by
metadata; suspended/closed browsers purge on resume/reopen before offering retry,
because timers cannot execute while the browser process is stopped.

XP, badges, mission progress, level and streak come from the backend. Celebration
markers contain identifiers only; unavailable marker storage suppresses animation.
The `/end` completion reward is an already stored value. Summaries do not call
`/end`. Session vocabulary receipts are kept only in memory; after reload the
summary links to profile vocabulary instead of claiming session-specific history.

The default read timeout is 10 seconds and operation timeout 150 seconds, both
configurable for Route Handlers. Hosting runtimes/proxies must allow the chosen
duration. A timeout can occur after a commit and therefore never permits a new
UUID for the unresolved operation.

The demo adult and child/adult screens are a shared demonstration boundary,
not production parental authentication or visitor privacy isolation. Use only
fictional data. An unrestricted Phase 13 deployment must isolate visitor demo
accounts or restrict access. Logout removes the browser cookie; it does not add
server-side JWT revocation to the existing backend.

## Original implementation validation (superseded by final correction results below)

Final five-viewport Node 20/Linux matrix: **41 passed, 4 intentional skips**, zero failures or flakes. The final ownership/auth cleanup also passed a rebuilt Linux desktop regression run: **9 passed**. Its updated 22 frontend tests, lint, typechecking, build and formatting passed; the final Windows build and frontend tests passed as well.

| Gate                                            | Result                                                                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Dependency install                              | Passed on Windows; frozen-lockfile install passed on clean Node 20.20.2 / Debian Linux                                   |
| Root lint and TypeScript                        | Passed across all four packages                                                                                          |
| Unit/HTTP/component suite                       | 537 passed: API 469, AI core 41, shared 5, web 22                                                                        |
| PostgreSQL integration                          | 150 passed on Windows and Node 20/Linux; all five suites                                                                 |
| Prisma validation / deploy / seed / fingerprint | Passed on isolated regression databases with existing two migrations                                                     |
| Production build                                | All four packages passed on Windows and Node 20/Linux                                                                    |
| Formatting                                      | Passed on Windows and Node 20/Linux; generated reports are excluded                                                      |
| Browser matrix                                  | Full Windows and Node 20/Linux matrices: 41 passed, 4 intentional skips; final Linux desktop rerun: 9 passed             |
| Accessibility/layout                            | Zero axe WCAG 2 A/AA violations on 12 captured screens per viewport; keyboard, reduced-motion and overflow checks passed |

Viewports are Chromium desktop 1440×900, tablet 768×1024, landscape tablet
1024×768, mobile 390×844 and small mobile 360×800. The single provider integration
scenario runs on desktop and is deliberately skipped in the other four projects;
provider settings still receives responsive and axe checks in every project.
Linux used the full test suite with worker count limited for the local container.
GitHub Actions is configured for Node 20/Ubuntu with its own PostgreSQL service;
no remote workflow was triggered because the branch was not pushed.

Browser fixtures use separate local databases ending in `_e2e`, a unique
test-owned adult, blank real AI keys and real production Next/Nest processes.
Cleanup deletes only that adult's fixtures. The developer database was not reset.
PostgreSQL regressions require a seeded database: an initial unseeded run failed
that prerequisite; migration/seed/verification followed by the complete rerun
passed all 150 cases.

## Visual limitations and remaining work

- Stitch fidelity is interpreted in reusable components, not a pixel-for-pixel HTML export. The incomplete profile-selector PNG was reconstructed from its HTML and neighboring designs.
- Luna's supplied source has an opaque white background. Max is a dedicated verified transparent fox explorer. Mission emoji rendering varies by OS. Avatar states use lightweight CSS; speech and speaking/listening animation remain Phase 9 work.
- Responsive evidence uses Chromium emulation. Real touch devices, Firefox/Safari and a manual screen-reader review remain additional validation, not claimed certification.
- The adult API returns at most ten recent sessions. There is no complete session enumeration or advanced educational analytics. Unsafe aliases/history use the existing documented administrative recovery.
- Live paid cloud/Ollama/LM Studio validation was not performed. Automated tests exercise deterministic Mock and the real HTTP adapter against a local controlled server. The pre-existing Phase 5 live-runtime evidence gate remains separate.
- Phase 13 must address the shared demo access boundary and hosting request limits before unrestricted publication. Production child-safety certification, private adult accounts, refresh tokens and voice are outside Phase 8.

The reported `v0.6-gamification` tag is absent both locally and from origin's tag
refs, verified again on 11 October. No tag was created or changed. No commit,
push or pull request was performed. A Phase 8 release/tag can be reviewed after
these uncommitted changes are accepted; this report does not create one.

## Final reliability correction

Baseline reproduction executed the actual pending.ts from aa320e3: after storing session A and reading the home start context, homeReadDeletedA=true and retryA=null. The corrected unit tests preserve A across home, profile and session reads; clear/expiry requires context plus UUID, and retries cannot change body or original retention timestamp. All keys are swept, including legacy migration, and foreign adult identities are purged.

Component regressions cover late A completion while B remains pending, logout during an in-flight response, separate XP/badge announcements with replay suppression, six exact profile-attribute comparisons, uniqueness errors and late profile lookups. Profile recovery reads only owned profiles and requires explicit confirmation without repeating POST.

Real browser regressions commit then abort the message response, navigate through home and rewards, return and reload, and replay the identical UUID/body with one accepted child turn and one 5-XP award. A second regression starts A and B, delays A's committed response while B loses its response, and verifies B's exact replay with one child turn/5 XP per session. Profile creation commits in PostgreSQL then loses its response; the adult explicitly confirms the owned exact match, with one POST and one profile.

### Correction inventory (14 files: 11 modified, 3 added)

- apps/web/lib/pending.ts; apps/web/lib/use-operation-scope.ts
- apps/web/components/safety/pending-retention.tsx; apps/web/components/layout/app-shell.tsx
- apps/web/components/conversation/conversation-screen.tsx; apps/web/components/profiles/screens.tsx
- apps/web/test/pending.test.ts; apps/web/test/conversation.test.tsx; apps/web/test/profile-recovery.test.tsx
- apps/web/e2e/child-reliability.spec.ts; apps/web/e2e/profile-recovery.spec.ts
- docs/architecture/adr/0014-frontend-replay-and-celebrations.md; docs/setup/phase8-frontend-walkthrough.md; this report

### Final acceptance results

Final acceptance passes on Windows (Node 24.19.0) and Debian Linux (Node 20.20.2), using pnpm 9.15.0. Both matrices exercise the corrected source; SHA-256 comparisons verified identical pending, conversation and browser regression files. The production backend, Prisma schema, AI core and shared contracts have no correction diff.

| Gate                             | Windows                                                             | Node 20 / Linux                                                     |
| -------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Unit / HTTP / component tests    | 558 passed                                                          | 558 passed                                                          |
| Web breakdown                    | BFF 11; pending 12; conversation 8; profile recovery 12             | Same 43 passed                                                      |
| Backend / packages breakdown     | API 469; AI core 41; shared 5                                       | Same 515 passed                                                     |
| PostgreSQL integration           | 150 passed                                                          | 150 passed                                                          |
| PostgreSQL suites                | Safety 122; gamification 8; real-provider 8; functional 7; domain 5 | Same five suites passed                                             |
| Five-viewport browser acceptance | 51 passed, 4 intentional skips; 4.8 minutes                         | 51 passed, 4 intentional skips; 3.8 minutes                         |
| Lint / typecheck / formatting    | Passed                                                              | Passed                                                              |
| Prisma validation                | Passed                                                              | Passed; existing migration deploy, seed and fingerprint also passed |
| Production build                 | All four packages passed                                            | All four packages passed                                            |
| Installation                     | Existing installed workspace                                        | Frozen-lockfile install passed                                      |

The four intentional skips are the existing non-desktop provider adapter scenario. All five projects exercise the journey, response-loss/navigation replay, two-session isolation, profile recovery, safety, auth expiry, logout and responsive/accessibility checks. Animal Adventure remains 45 XP and exactly four badges. Axe reports zero WCAG 2 A/AA violations on the twelve existing screens per viewport and the new profile-recovery panel. The final matrices have zero failures and no automatic retries. Provider pinning and shared-demo privacy remain verified.

Validation used real Next/Nest production servers, deterministic Mock or the controlled HTTP provider, blank real AI keys, and only test-owned adults/profiles. Linux browser acceptance ultimately used a dedicated PostgreSQL 16.14 container with a temporary memory-backed data directory and loopback port 55433. It applied the existing two migrations to talkytown_reliability_e2e; no schema or production timeout was changed. PostgreSQL integration tests also passed against the regular isolated disk-backed regression database. The developer database was never reset.

Earlier runs are recorded rather than hidden: Windows browser setup under concurrent validation produced 46 passes / 5 failures / 4 skips, followed by a complete rebuilt serialized 51-pass run. Linux's shared PostgreSQL instance produced 50 passes / 1 failure and then 49 passes / 2 failures, with four skips each; logs showed Prisma P2028 five-second transaction expiration in different operations. A complete dedicated-database matrix then passed 51 / 4 skips. An initial Windows build also encountered Prisma DLL EPERM while database tests were running; serialization resolved it. These infrastructure retries changed neither NestJS functionality nor transaction limits.

Final local evidence remains in ignored .temp/phase8-reliability-unit-final.log, phase8-reliability-db-windows.log, phase8-reliability-e2e-final.log, phase8-reliability-linux-final.log and phase8-reliability-linux-e2e-dedicated.log. The Windows HTML report is playwright-report/index.html; the copied final Linux HTML report is .temp/phase8-linux-final-browser-report/index.html. Earlier failed Linux HTML reports are retained separately. Temporary validation containers were removed after exporting evidence.

Correction changes remain uncommitted on aa320e395a6126e4637049446de8569f621f78e6. No commit, push, PR or tag was performed. The three reliability issues are corrected and all requested final gates pass: PHASE 8 READY FOR PR.
