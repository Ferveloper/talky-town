# Development Conventions

## Language

- Use TypeScript everywhere.
- Use strict types.
- Avoid `any` unless explicitly justified.

## Naming

- Use kebab-case for files.
- Use PascalCase for React components and classes.
- Use camelCase for variables and functions.
- Use UPPER_SNAKE_CASE for environment constants.

## Commits

Recommended style:

```txt
feat: add child profile module
fix: handle mock provider fallback
docs: update local setup instructions
test: add gamification tests
refactor: extract provider adapter interface
```

## Branches

Suggested branches:

```txt
main
develop
feature/<short-description>
fix/<short-description>
docs/<short-description>
```

## Documentation

Update docs when:

- A new module is added.
- An architectural decision is made.
- A setup step changes.
- A provider is added.
- A safety rule changes.

## Testing

Do not call external AI providers in automated tests. Use mock providers.
