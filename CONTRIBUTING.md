# Contributing

## Setup

Clone the repo and install:

```bash
pnpm install
pnpm dev
```

That's it. The app runs in local mode without any database. Data lives in IndexedDB. Use the "Continue without account" button on login.

If you want to work on the cloud sync path:

```bash
cp .env.example .env.local
# fill in DATABASE_URL, BETTER_AUTH_SECRET, ENCRYPTION_KEY
pnpm db:push
pnpm dev
```

## Before you commit

```bash
pnpm typecheck
pnpm lint
```

Both must pass. No `any`, no unused vars, no `eslint-disable`, no `@ts-ignore`. Fix the root cause instead.

## Pull requests

Keep PRs focused. One concern per PR. If you're changing the design system or adding a new API surface, open an issue first so we can align on approach before you write code.

## Where things live

| Path | Purpose |
|------|---------|
| `src/app/(auth)` | Login, signup, "continue without account" |
| `src/app/(dashboard)` | All authenticated pages |
| `src/components/ui` | Design system primitives |
| `src/components/whatsapp` | WhatsApp-specific forms and views |
| `src/db` | Drizzle schema, lazy DB connection |
| `src/lib/datastore` | `DataStore` interface, `LocalStore` (IndexedDB) and `RemoteStore` (Postgres) |
| `src/lib/crypto.ts` | Web Crypto AES-256-GCM (browser) |
| `src/lib/encryption.ts` | Node crypto AES-256-GCM (server) |
| `src/lib/whatsapp.ts` | Typed client for graph.facebook.com |
| `src/lib/session-mode.tsx` | Local vs authenticated mode context |

See [ARCHITECTURE.md](ARCHITECTURE.md) for how these pieces fit together.
