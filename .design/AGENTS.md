# TalkyTown — AI Development Rules

TalkyTown is a child-friendly AI language learning web app for children aged 5 to 12.

## Product principles

- The child experience must be playful, safe and simple.
- The parent experience must be clean and trustworthy.
- Do not create dark, corporate or dense interfaces.
- Use large rounded buttons, cards and accessible spacing.
- The app must support a demo mode without external AI keys.
- Do not ask children for personal data.
- Always provide fallback if voice or AI fails.

## Frontend stack

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui where useful
- Framer Motion for simple animations

## Implementation rules

- Use `docs/design/stitch/screens` as visual reference.
- Do not copy generated HTML directly without refactoring.
- Prefer reusable components.
- Keep screens thin.
- Keep business logic outside React components when possible.
- Use mock data first, then connect API.
- Do not hardcode secrets.
- Ensure responsive layout for desktop and tablet.

## Visual language

- Warm background: `#fff9f0`.
- Primary sky blue: `#40c4ff`.
- Accent yellow: `#ffcc33`.
- Success green: `#88cc44`.
- Rounded cards and large buttons.
- Friendly, safe, playful town/adventure theme.

## Screen references

Start with these screens:

1. `docs/design/stitch/screens/05-child-home.png`
2. `docs/design/stitch/screens/06-mission-selection.png`
3. `docs/design/stitch/screens/07-conversation-desktop.png`
4. `docs/design/stitch/screens/09-session-summary.png`
5. `docs/design/stitch/screens/11-parent-dashboard.png`
