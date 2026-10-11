# TalkyTown safety policy — Phase 6

This document describes deterministic **demo-level guardrails** for Spanish-speaking
children aged 5–12 learning English. It is not a statement of legal compliance,
production readiness or comprehensive child-safety certification.

## Enforcement and sources

The existing API `SafetyService` owns policy for Mock, cloud and local conversations.
Strict AI envelope/JSON/Zod validation remains separate and precedes output screening.
Provider safety metadata cannot replace application enforcement.

Screening distinguishes child input, provider output and profile aliases. A child may
ask Luna "What is your name?" or "¿Cómo te llamas?". The avatar may introduce itself
with its trusted catalogue name. This does not permit asking for the child's real
name or repeating child identity/contact/location/school data. The fictional-name
exception covers only a catalogue introduction, not the rest of a response.

Detection normalizes Unicode, accents, case, format characters, apostrophes and
whitespace in memory. Accepted text retains its original form. Rules use reviewed
EN/ES phrases, contact patterns and narrow educational exceptions. For example,
"My mother uses a phone", "Can you address this question?", "I shoot a photo",
classroom counting, ordinary family affection and fictional adventures are allowed.
A fictional preface or educational label is never a general moderation bypass.

## Controlled taxonomy

Flagged decisions carry category, controlled reason, severity, action and an internal
response-template key. No decision includes a matched snippet or rejected text.

| Category              | Reason codes                                                                     | Severity/action                                                |
| --------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| personal-data         | contact-data, location-data, identity-data, digital-identity-data, photo-request | warning / redirect                                             |
| unsuitable-content    | unsuitable-topic, explicit-violence, aggressive-politics, bullying-or-insult     | warning / redirect; dangerous violence is critical             |
| relationship-boundary | romantic-interaction, dependency-manipulation, false-capability-claim            | warning / redirect                                             |
| wellbeing             | self-harm-risk, serious-distress, bullying-disclosure                            | critical for self-harm disclosure, otherwise warning / support |
| instruction-override  | instruction-override                                                             | warning / redirect                                             |
| provider-output       | unsafe-provider-output, provider-safety-flag                                     | underlying severity / redirect                                 |

Self-harm topics or harmful instructions without a child disclosure are redirected,
not treated as evidence that the child is personally distressed. Provider-generated
distress never establishes child distress. Existing persisted codes are not rewritten;
unknown historical reasons are returned as `legacy-safety-event`, never echoed verbatim.
Current generated output decisions retain the public `unsafe-provider-output` code.

Every generated textual field is screened: reply, correction original/corrected/
explanation, individual vocabulary suggestions and their joined text. Original
correction text is interpreted as child speech and must first match the screened
current message exactly. Highest-priority output detection determines severity.
All rejected output is discarded, including otherwise safe fields in that response.

## Responses and learning

Ordinary redirection is simple English for the existing age bands 5–7, 8–10 and
11–12. Ages 8–10 retain the previous standard redirection. Relationship responses
explain that the avatar is a pretend/virtual learning character and value real friends
and trusted adults.

Serious distress, self-harm disclosures and bullying disclosures receive deterministic
Spanish support. Responses acknowledge the disclosure and encourage a trusted adult;
immediate danger receives guidance to seek urgent help from a nearby adult. Young
children receive shorter sentences. These are not counselling or crisis-service
responses. The app never claims to contact parents/emergency services, provide human
moderation, monitor the child or promise confidentiality.

Blocked operations persist only a controlled avatar response and one coded SafetyEvent.
They create no child turn, correction, vocabulary practice, XP, badges or mission
advancement. This also applies immediately before mission completion. There is no
automated parental notification or human review queue.

## Provider, transaction and replay boundaries

1. Authenticate, enforce ownership, look up committed request replay and validate session status.
2. Screen child input **before runtime configuration resolution and inference**. A blocked
   disclosure remains respondable/auditable even if the pinned runtime is unusable.
3. For accepted input, resolve the pinned provider/model and filter unsafe historical
   turns before provider inference. No child alias/profile ID is sent to the provider.
4. Infer outside database transactions. Validate and screen all generated fields.
5. Persist a discriminated prepared operation: accepted, blocked-input or blocked-output.
   Neither blocked variant transports child text or provider output into persistence.
6. In a short transaction, retain ownership locks, status/snapshot checks, request
   deduplication and atomic writes. Operations that inferred also revalidate provider
   configuration. Stale snapshots retain the existing bounded retry behavior.
7. Review content-bearing responses **after the transaction commits**. Internal snapshot,
   replay lookup and termination reads are not disclosure guards.

Provider-history filtering must **not** reclassify previously accepted mission evidence.
Both projected and transactional mission evaluation use the existing accepted child
turns and persisted progression. Animal Adventure's final step depends on its first
accepted animal. Removing that evidence could change rewards or prevent completion.
Tests prove newly unsafe historical content stays out of provider requests while
mission progress and exactly-once completion rewards remain consistent. No historical
XP or progress is recalculated by Phase 6.

Provider/model pinning, URL policy, secrets, limiter and real-provider errors remain
Phase 5 behavior. Real failures never select Mock. The provider test endpoint establishes
envelope/schema usability, not child-safety certification or pedagogical quality.
Mock retains its existing controlled response for its own generation failure; this
does not recover or conceal a failure of a selected cloud/local runtime.

## Historical response protection and alias recovery

Detectable unsafe historical content causes `409 SAFETY_REVIEW_REQUIRED` at:

- Transcript pages containing unsafe turns/corrections.
- Committed message replay containing unsafe returned content.
- Session-start opening-turn replay containing unsafe content.
- Profile detail or an owned profile list containing a detectable unsafe alias.

The response contains only the controlled error code. A single affected alias makes
that adult's profile list unavailable; profiles are not silently omitted or renamed.
Other adults' lists and ownership errors remain isolated. Known-ID session creation,
messages, session metadata, mission catalog access, progress and termination remain
functional because these responses do not reveal the alias. Safe new operations can
continue with filtered provider history.

Response review does not undo a committed operation or create a second reward. Retrying
an unsafe historical replay returns the same controlled error until remediation; it
does not regenerate provider content. Phase 6 does not migrate/redact historical turns.

### Administrative remediation for an unsafe historical alias

No new profile-management HTTP route is added. An authorized database administrator
can repair a specific alias using this procedure:

1. Establish the adult and profile IDs through authorized records. Do not dump aliases,
   transcripts or database backups into normal logs, issues or Git.
2. Choose a unique, child-safe alias of 2–24 trimmed characters using the existing
   Unicode letters/digits/spaces/hyphens/underscores contract. Validate it with the
   current alias-context SafetyService before updating. Do not request a real name.
3. Bind the profile ID, adult ID and replacement alias as database parameters. In one
   transaction, lock the matching row by **both IDs** and verify exactly one match:

   ```sql
   BEGIN;
   SELECT "id" FROM "ChildProfile"
   WHERE "id" = $1 AND "userId" = $2 FOR UPDATE;
   UPDATE "ChildProfile" SET "alias" = $3, "updatedAt" = NOW()
   WHERE "id" = $1 AND "userId" = $2 RETURNING "id";
   COMMIT;
   ```

   `$1/$2/$3` denote bound parameters in the administrator's SQL client. Roll back
   on zero/multiple matches, failed validation or an alias uniqueness conflict. Never
   concatenate submitted values into SQL. Return/log IDs and operation status only.

4. Recheck the authenticated profile detail/list. If the list still returns 409, another
   owned alias may require separate review. Verify sessions, XP, vocabulary and badges
   were unchanged. Do not delete the profile, reset progress or disable guardrails.

## Data, logging and limitations

SafetyEvent stores only coded metadata and references; rejected input/output is neither
stored nor hashed. Validation hides values and unknown property names. The application
does not log request bodies, rejected text, credentials or raw provider errors. Historical
unsafe rows are an existing-data exposure concern, not retroactively erased by read guards.

Voice remains client-transcribed text. Audio upload/STT/raw audio retention are not
implemented. The guardrail and raw-audio environment placeholders are not disable switches.

Remaining limitations:

- Finite bilingual rules miss novel paraphrases, obfuscation, other languages and context.
  False positives remain possible despite reviewed educational regression fixtures.
- Arbitrary real names cannot reliably be distinguished from harmless aliases. Creation
  and read guards reject detectable identifiers, not every possible identifying name.
- Age-adapted prompts and strict JSON do not guarantee teaching/correction quality.
  Preserve Phase 5's documented real-model correction limitations.
- No external moderation, emergency escalation, human monitoring, retention job or
  historical redaction system is supplied. Professional review and production privacy/
  retention decisions remain future work.
- Application guarantees do not control upstream provider retention/logging or external
  reverse-proxy infrastructure. Configure those separately before production use.

See [ADR 0011](architecture/adr/0011-contextual-safety-policy.md) and the
[Phase 6 acceptance checklist](development/phase6-child-safety-checklist.md).
