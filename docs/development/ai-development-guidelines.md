# AI-Assisted Development Guidelines

Use AI development tools to accelerate implementation, but keep architectural control.

## Recommended workflow

1. Ask AI to implement small tasks.
2. Provide relevant docs as context.
3. Ask for reusable components.
4. Review generated code.
5. Refactor before moving to the next feature.
6. Keep tests and docs updated.

## Good prompts

- "Implement the module according to this interface."
- "Refactor this generated UI into reusable components."
- "Add tests for this domain service."
- "Do not connect external providers yet; use mock data."
- "Keep the app runnable after this change."

## Avoid

- Asking AI to build the entire app in one prompt.
- Accepting duplicated UI code across pages.
- Mixing product logic inside React components.
- Hardcoding API keys.
- Adding unnecessary libraries.
- Calling real AI providers from tests.
