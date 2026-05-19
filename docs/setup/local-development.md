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
docker compose up -d postgres
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## URLs

- Web: http://localhost:3000
- API: http://localhost:3001
- API docs: http://localhost:3001/docs
- Health: http://localhost:3001/health
