# ADR 0001 — Use pnpm workspaces and Turborepo

## Status

Proposed

## Context

TalkyTown contains a frontend app, backend app and shared packages. The project needs a structure that is easy to run locally and clear for the Master's Final Project evaluation.

## Decision

Use a monorepo with pnpm workspaces and Turborepo.

## Consequences

- Apps and packages live in one repository.
- Shared types can be reused.
- Root scripts can run all tasks.
- The setup is more professional but slightly more complex than a single app.
