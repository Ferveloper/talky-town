# TalkyTown design system

The current web shell uses Tailwind and shadcn-style components: cream background,
sky-blue primary, warm yellow secondary, mint accents and dark readable text.
Large rounded controls and friendly town cards support the child flow. Adult
screens should favor clear summaries and restrained decoration. Voice failures
must retain a usable text path. Phase 7 changes no frontend code.

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
