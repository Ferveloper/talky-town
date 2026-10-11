# TalkyTown design system

The Phase 8 frontend uses Tailwind and the existing shadcn-style Button/CVA:
cream #fff9f0, sky #40c4ff, yellow #ffcc33, green #88cc44 and dark text #333333.
Primary interactive controls use dark blue #00668a with white text for contrast;
bright blue is a decorative accent.
Large rounded controls and friendly town cards support the child flow. Adult
screens should favor clear summaries and restrained decoration. Voice failures
must retain a usable text path. Phase 8 exposes text only; microphone is disabled.

Local Quicksand 500/600/700, 24px card corners, 32px buttons, at least 48px touch
targets, visible focus, live operation feedback and reduced-motion CSS support
desktop, tablet and 360/390px mobile screens. Adult views use simple data tables.
Mission pictograms are OS emoji. Luna's source has an opaque white background;
Max is a dedicated transparent fox explorer. See [asset provenance](phase8-avatar-provenance.md).

For Phase 8, render server-provided gamificationLevel separately from English
learningLevel. Present level progress as XP into the next 50-XP step; an exact
boundary begins at zero with 50 remaining. Use canonical badge title, icon and
criterion description for locked and unlocked cards. Kind Corrector celebrates
receiving help, not a claimed later successful correction. Explain streaks as
Madrid calendar practice days, with gentle encouragement after gaps.

Keep rewards secondary to learning. Avoid pressure, competitive rankings and
celebrations repeated on retry. Track message celebrations by session/request ID
and completion celebrations by session ID; completionRewardXp is a stored total.
See [Phase 7 API contract](../api/phase7-gamification-contracts.md).

## Phase 9 speech controls

Retain the cream/sky/green palette, rounded cards and at least 48px interaction targets. Microphone activation, Stop/Discard, transcript confirmation and manual Listen/Replay/Stop have visible labels. Listening uses an amber ring/timer; speaking uses a subtle avatar motion only after actual playback starts. Reduced motion replaces animation with a static ring. Controls wrap on 360px screens. The taller voice composer follows normal page flow on mobile so it cannot cover the avatar reply or playback controls. Missing speech uses calm readable guidance and keeps typing available. English/Spanish language labels are explicit; no sensitive response autoplays.
