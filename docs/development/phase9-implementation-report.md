# Phase 9 Level 1 implementation and acceptance

## Scope

Native browser STT/TTS only, on `feature/phase-9-voice-mvp`. No commits, push, PR or tag authorized. No new schema/migrations, public conversation DTOs, LLM changes, audio endpoints, model containers, ML installations or cloud credentials.

## Implementation inventory

- `apps/web/lib/speech/`: contracts, read-only capability detection, native recognition/synthesis adapters, voice selection and document-level lifecycle coordination.
- `apps/web/components/conversation/`: input/output hooks, microphone/review and reply playback controls; existing screen integrates voice origin with its immutable pending flow.
- `apps/web/components/ui/talky.tsx`, `app/globals.css`: actual listening/speaking states, responsive controls and reduced motion.
- `apps/web/components/layout/app-shell.tsx`, `components/parent/{adult-screens,voice-preferences}.tsx`: adult-scoped memory-only processing choice; reset on logout/auth expiry/identity changes/remount.
- `apps/web/lib/pending.ts`: accepts text/voice only; retains original equality, isolation, expiry and tombstone behavior.
- `packages/shared/src/{index,safety-response-templates}.ts`, API `safety/{safety-rules,safety-responses}.ts`: exact catalogue/locale extraction only; unchanged moderation.
- API golden catalogue, confirmed-voice HTTP/PostgreSQL tests; web speech, conversation, preference and pending tests; Playwright speech fakes, shared text-journey fixture and five-viewport voice regressions.
- Public safety screen, README, scope, UX, structure, conventions, local setup, design, safety policy, ADR 0015 and evaluator walkthrough.

## Behavior and privacy

Local-only is fail-closed: actual processLocally support and available({langs, processLocally:true}) must prove an already-installed pack. Checks are read-only and precomputed; the button synchronously invokes native start. Missing/policy-blocked APIs or packs keep typing available. Browser-service mode requires informed adult selection, has no persistence and is not legal parental-consent verification. Shared-demo privacy limitations remain.

Capture phases are idle/cancelled → requesting permission → listening → stopping → transcribing → editable transcript, or failed. Confirmation and AI-pending/completion remain owned by the existing conversation operation. Bounds are 15-second startup, 30-second capture and 5-second finalization. Empty/interim text never sends; >500-character final text must be edited, not silently truncated. No extra voice XP.

Playback phases are voice loading/idle → preparing → actual speaking → ended/stopped/failed. Manual controls use safe returned avatar content and local language-matching voices. Exact restored support selects Spanish; unavailable Spanish stays readable. No autoplay or overlapping activity. Native generation guards and disposal cover hiding, unmount/navigation, logout/auth expiry and closure.

| Machine     | Exact application states                                                                            | Bounds                                                                                               |
| ----------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Recognition | idle, requesting-permission, listening, stopping, transcribing, transcript-ready, cancelled, failed | 15 s startup, 30 s capture, 5 s finalization; no automatic restart                                   |
| Synthesis   | loading-voices, idle, preparing, speaking, ended, stopped, failed                                   | Reload voice inventory after 3 s and on voiceschanged; 5 s playback startup, 180 s playback watchdog |

Stop finishes recognition for review; Discard aborts and erases the draft. The normal composer retains voice origin through edits and creates the request UUID only on confirmation. Native final transcripts over 500 characters must be shortened; >2000-character recognition is rejected. Hiding erases unconfirmed speech and preserves ordinary typed drafts. Language is en-US by default, explicitly switchable to es-ES, with no translation. Playback is disabled during capture; starting capture cancels playback. Speaking/listening avatar states follow actual native start events. Buttons/choice labels have large touch targets; reduced motion uses static indicators.

TalkyTown persists no audio, recordings, blobs, unconfirmed draft or complete browser transcript history. Confirmed submitted text follows existing ordinary PostgreSQL conversation persistence and at most 15-minute scoped sessionStorage pending retention. Original UUID/body/mode/context/time survive explicit replay. No backend identical-body hash guarantee is claimed. Suspended tabs recheck retention on resume.

## Automated evidence

Validated on Windows 11 Pro 10.0.26200 (build 26200), Node 24.19.0 and pnpm 9.15.0, on 2026-10-11/12. Test databases `talkytown_phase9_acceptance`, `talkytown_phase9_e2e` and `talkytown_phase9_manual` are isolated from the developer database. Existing migrations only; PostgreSQL 16 is healthy on local port 55432.

| Gate                                      | Result                                                                                                                                              |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frozen installation                       | Passed; no package or lockfile additions                                                                                                            |
| Prettier / lint / TypeScript              | Passed                                                                                                                                              |
| Prisma validation                         | Passed; unchanged schema                                                                                                                            |
| Existing migrations and seed verification | Passed: 1 adult, 2 profiles, 2 avatars, 4 missions, 7 badge definitions, 4 sessions, 22 turns, 14 XP events, 7 awarded badges, 6 vocabulary records |
| API unit/HTTP                             | 488 passed, 21 files                                                                                                                                |
| Shared                                    | 5 passed, 3 files                                                                                                                                   |
| AI core                                   | 41 passed, 6 files                                                                                                                                  |
| Web unit/components/BFF                   | 80 passed, 7 files                                                                                                                                  |
| Total unit/HTTP/component                 | **614 passed**, including 37 additional web tests                                                                                                   |
| PostgreSQL integration                    | **153 passed**; includes accepted voice replay and two blocked voice cases                                                                          |
| Production build                          | Passed for all four workspaces; final Next build compiled, checked types and generated pages                                                        |
| Desktop Playwright diagnostic             | 17 passed before final five-viewport run                                                                                                            |
| Complete five-viewport Playwright         | **81 passed, 4 intentional existing skips**, 85 scheduled, including all 30 new voice cases; 7.9 minutes                                            |

The 15 golden UTF-8 comparisons preserve every previous safety response string. Three additional catalogue tests preserve category/severity/template selection; existing 127 safety unit cases, 222 safety HTTP cases and safety PostgreSQL regressions remain green. Voice uses the existing server screening and rewards: blocked raw child text is absent, Spanish support stays exact, and XP/badges/vocabulary/mission state do not advance. Animal Adventure retains 45 XP and four badges. Lost responses after actual PostgreSQL commits preserve the original UUID, confirmed text, mode and timestamp across explicit retry; independent sessions keep separate pending operations. No provider is called for real in automated tests.

Speech fakes exercise real Next/Nest/PostgreSQL/Mock. Existing text journeys also use deterministic speech APIs. The first diagnostic run exposed a native speech crash in the bundled Chromium headless shell on this Windows host; installed desktop Chrome did not reproduce it. The suite now isolates native speech consistently, as required. Firefox native fallback evidence below is separate. The first build overlapped Prisma DLL use by database tests and hit a Windows file lock; sequential builds passed. Do not regenerate Prisma while a process uses that DLL.

The complete E2E run emitted one P2028 transaction-start timeout diagnostic while all 81 tests passed. The subsequent relevant 20-case and 10-case runs passed without that diagnostic. No backend timeout, schema or conversation persistence behavior was changed to conceal it.

All five projects check responsive layouts, keyboard access and reduced motion; axe checks use WCAG 2 A/AA tags. Fake success proves application behavior, not microphone permissions, recognition accuracy or audible playback. No external speech service or ML model is required by CI. The optional Firefox browser executable was downloaded only for native fallback verification.

After the final radio-layout and native-voice notice refinements, **20 existing interface/voice cases passed again across all five viewports** (2.7 minutes). These are reruns, not additional unique tests. Final production build, all 614 unit/HTTP/component tests, lint, typecheck and formatting also passed after those refinements. The unique automated acceptance count is 848 passed (614 + 153 + 81), with 4 intentional existing browser skips.

## Real-device evidence

Read-only native browser probes on this Windows host used clean headless contexts against the production app, with no speech API overrides, microphone starts, audio capture or pack installation:

| Browser                            | Actual recognition capability                                                | Local pack result en-US / es-ES | Local synthesis voices                                                        |
| ---------------------------------- | ---------------------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------- |
| Chrome 154.0.8037.99               | Constructor, actual processLocally property and static available API present | downloadable / downloadable     | Microsoft Helena, Laura and Pablo, all es-ES; no local English voice observed |
| Edge 155.0.4283.45                 | Constructor, actual processLocally property and static available API present | unavailable / unavailable       | Same three es-ES local voices; no local English voice observed                |
| Firefox 150.0.2 (Playwright build) | No recognition constructor                                                   | Unsupported                     | API present, no voices returned in this headless context                      |

Both Chromium browsers correctly require text or an informed adult browser-service choice. Constructor support does not establish remote-service success. English replies currently use readable fallback on this host; Spanish support can use the observed installed voices. Voice inventory can differ between contexts and devices.

**Native unsupported-browser verification passed:** Firefox 150.0.2 entered the real demo, created fictional `FirefoxVoice`, started free talk, displayed a disabled microphone, submitted typed `dog` and received the ordinary child/avatar conversation with 5 XP. This was an automated native-browser smoke with real Next/Nest/PostgreSQL/Mock and no speech fakes, not a human microphone/audio test.

**Human supported-browser evidence (2026-10-12):** the user reported that actual STT works well in both English and Spanish in Chrome and confirmed explicitly selecting **Permitir servicio del navegador** in Adultos. They reported English playback unavailable with the local-voice notice, matching the observed browser inventory. Installed browser version on this host is 154.0.8037.99; the user identified Chrome without independently reporting its version. The report combines that installed/probed version with the separately attributed human observations rather than claiming a human version inspection.

**Human audible output acceptance passed.** A server-screened Spanish response was prepared in fictional profile `VozAudio`, with zero XP and an enabled manual playback control verified against native Chrome. The user confirmed audible Spanish, working Replay and Stop, and cancellation on navigation to **Mi rincón**. They described the voice quality as low; this is subjective listening evidence, not a measured pronunciation or latency benchmark. English output remains the verified readable fallback for this browser inventory. These human audio observations are distinct from the native read-only probes and fake events. The production app remains available at http://localhost:3000 with an isolated fictional demo database. No audio was recorded/uploaded/persisted by TalkyTown.

The required minimum of real supported desktop speech input/output and actual unsupported-browser text fallback is satisfied. Full capture/edit/confirmation, permission failures, time bounds, Spanish safety, immutable replay, tab hiding, logout/auth expiry and session closure are covered by deterministic application regressions. The human did not separately report each of those additional manual steps; those must not be represented as human-tested.

A read-only Windows registry inventory found a legacy Zira English token, while both browsers exposed only Spanish voices and the OneCore list was Spanish. The browser inventory governs capability; an OS token alone does not establish a usable browser voice. The walkthrough links Microsoft's explicit optional OS voice installation path. No OS voice pack, registry entry or system setting was changed.

## Known limitations and readiness

Recognition may normalize errors or miss disclosures. Voices vary by OS; no pronunciation assessment or certified child-audio handling. Local pack verification is experimental and remote processing can fail. This host has an observed local STT pack gap and no English local voice exposed by the browser. Browser-service STT works in the user's English/Spanish smoke; its vendor/network dependence remains. Spanish output works, but its perceived quality is low. Browser voice coverage and TTS quality are concrete follow-up concerns; neither establishes that a proposed model is superior without measurement.

Level 2 remains separately authorized. Kokoro-82M ONNX and Pocket TTS without cloning remain candidates whose selection requires measured pronunciation, short-utterance quality, resource usage, English/Spanish coverage, text adherence and latency. No candidate or cloud provider was installed. The milestone/tag proposal remains `Phase 9 — Essential Voice MVP` / `v0.8-voice-mvp`; no release operation has been performed.

Final mobile review identified a tall sticky composer overlapping the reply at 360 px. The composer now uses normal vertical flow on mobile, and the existing five-viewport accessibility journey additionally checks that the playback button actually receives pointer input. The final production build, lint, typecheck and formatting passed; **10 relevant visual/accessibility and voice Animal Adventure cases passed again across all five viewports** (1.8 minutes). Final 360 px imagery was inspected and shows the full avatar reply/playback control without composer overlap. These are existing cases rerun, not additional unique tests.

**Readiness: PHASE 9 LEVEL 1 READY FOR PR.** All mandatory Level 1 acceptance gates pass with the documented native-browser limitations. No commit, push, PR or tag has been created. Level 2 remains separately authorized.

## Exact changed-file inventory

52 files (28 modified, 24 new); no dependency, lockfile, schema, migration, BFF endpoint or public DTO changes.

- `.github/workflows/ci.yml`
- `apps/api/src/safety/safety-responses.ts`
- `apps/api/src/safety/safety-rules.ts`
- `apps/api/test/functional-backend.database-spec.ts`
- `apps/api/test/functional-backend.e2e-spec.ts`
- `apps/api/test/phase6-safety-golden.ts`
- `apps/api/test/safety-catalogue.spec.ts`
- `apps/api/test/safety.database-spec.ts`
- `apps/web/app/globals.css`
- `apps/web/components/conversation/conversation-screen.tsx`
- `apps/web/components/conversation/microphone-control.tsx`
- `apps/web/components/conversation/speech-output-controls.tsx`
- `apps/web/components/conversation/use-speech-input.ts`
- `apps/web/components/conversation/use-speech-output.ts`
- `apps/web/components/layout/app-shell.tsx`
- `apps/web/components/parent/adult-screens.tsx`
- `apps/web/components/parent/voice-preferences.tsx`
- `apps/web/components/safety/public-screens.tsx`
- `apps/web/components/ui/talky.tsx`
- `apps/web/e2e/child-journey.spec.ts`
- `apps/web/e2e/child-reliability.spec.ts`
- `apps/web/e2e/profile-recovery.spec.ts`
- `apps/web/e2e/provider-settings.spec.ts`
- `apps/web/e2e/speech-fakes.ts`
- `apps/web/e2e/speech-test.ts`
- `apps/web/e2e/visual-accessibility.spec.ts`
- `apps/web/e2e/voice.spec.ts`
- `apps/web/lib/pending.ts`
- `apps/web/lib/speech/browser-recognition.ts`
- `apps/web/lib/speech/browser-synthesis.ts`
- `apps/web/lib/speech/capabilities.ts`
- `apps/web/lib/speech/contracts.ts`
- `apps/web/lib/speech/coordinator.ts`
- `apps/web/lib/speech/voice-selection.ts`
- `apps/web/test/pending.test.ts`
- `apps/web/test/speech-fakes.ts`
- `apps/web/test/speech.test.tsx`
- `apps/web/test/voice-conversation.test.tsx`
- `apps/web/test/voice-preferences.test.tsx`
- `docs/architecture/adr/0015-essential-browser-voice.md`
- `docs/design/design-system.md`
- `docs/development/conventions.md`
- `docs/development/phase9-implementation-report.md`
- `docs/development/project-structure.md`
- `docs/product-scope.md`
- `docs/safety.md`
- `docs/setup/local-development.md`
- `docs/setup/phase9-voice-walkthrough.md`
- `docs/ux-flow.md`
- `packages/shared/src/index.ts`
- `packages/shared/src/safety-response-templates.ts`
- `README.md`
