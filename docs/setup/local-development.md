# Local Development

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker and Docker Compose
- Git

## Steps

```bash
pnpm install
cp .env.example .env
# Set JWT_SECRET to a private value of at least 32 characters before runtime startup.
docker compose up -d --wait postgres
pnpm db:migrate
pnpm db:seed
pnpm db:verify
pnpm dev
```

The Prisma scripts load `.env` first, then fill missing values from `.env.example`.
dotenv-cli keeps the first value, so local configuration takes precedence.
The example defaults match the included Docker Compose PostgreSQL service.

Runtime requires explicit JWT_SECRET; application never generates one. Generate a
private value locally using Node crypto.randomBytes(32).toString('hex'), then save
it in ignored .env. Tests inject their own deterministic secret. Never commit or
share runtime secrets. Database-selected Mock provider requires no paid AI keys;
AI_PROVIDER environment variable no longer selects or overrides adult settings.

Use [Phase 4 Swagger walkthrough](phase4-demo-walkthrough.md) for the functional
backend. Existing frontend screens remain mock-driven and are not API-integrated.

Compose binds PostgreSQL to `127.0.0.1:55432`, forwarding to container port 5432.
This avoids the native Windows PostgreSQL service on 5432. Host ports 5433/5434
were also occupied on the development machine. To override the default, set
`POSTGRES_PORT` in `.env` and use the same host port in `DATABASE_URL`. Existing
Phase 2 `.env` files must update the URL when switching to the Compose service.
Do not change or stop the unrelated Windows PostgreSQL service.
`--wait` waits for the PostgreSQL healthcheck before migrations. Without it, a
newly started container may still be initializing and Prisma can report P1001;
wait for it to become healthy and retry, without resetting data.
The healthcheck uses container TCP explicitly, avoiding the temporary Unix socket
used during first-time PostgreSQL initialization.

## Database Development

`pnpm db:migrate` deploys the committed migration history. After intentionally
editing the schema, use `pnpm db:migrate:dev --name <short-name>` to create and
apply a new migration with a shadow database. Never rewrite an applied migration.
Review SQL before sharing it; custom CHECK constraints live in migration SQL.
No reset is needed for the Phase 2 to Phase 3 upgrade.

The Phase 3 migration converts mission age ranges before dropping `ageBand` and
intentionally removes the raw safety `inputSnippet` column. Back up meaningful
data first. Invalid custom mission ranges cause an atomic migration failure and
must be corrected in the old schema before retrying through Prisma's documented
failed-migration recovery process.

To check repeatable demo data and PostgreSQL constraints:

```bash
pnpm db:validate
pnpm db:seed
pnpm db:verify
pnpm db:seed
pnpm db:verify
pnpm test:db
```

Verification reports counts and a fingerprint, not child messages. Both hashes
must match without concurrent writes. IDs and historical timestamps remain stable;
catalog/profile `updatedAt` may change. Existing non-demo records are not removed.
The seed updates named demo profiles/catalog rows, so use a local demo database.
The default unit suite (`pnpm test`) needs neither PostgreSQL nor API keys.

PostgreSQL must be reachable via `DATABASE_URL`. On Windows, start Docker Desktop
before running Compose. A sandbox may lack access to Docker's named pipe or Prisma's
native migration engine; run the same commands in your normal terminal when denied.

## URLs

- Web: http://localhost:3000
- API: http://localhost:3001
- API docs: http://localhost:3001/docs
- Health: http://localhost:3001/health
