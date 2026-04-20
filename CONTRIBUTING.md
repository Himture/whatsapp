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
| `src/app/(marketing)` | Public landing, pricing, privacy, terms |
| `src/app/(auth)` | Login, signup, "continue without account", demo mode entry |
| `src/app/(dashboard)` | All authenticated pages including `/workspaces`, inbox, broadcasts, analytics |
| `src/app/api/webhooks/[configId]` | Webhook receiver for Meta (GET challenge + POST with `after()`) |
| `src/components/ui` | Design system primitives (Button, Card, Input, Dropdown, Badge, Tabs) |
| `src/components/marketing` | Landing-page building blocks (FeatureGrid) |
| `src/components/dashboard` | Sidebar, header, dashboard shell (with DemoBanner, AuthGate) |
| `src/components/onboarding` | First-run wizard |
| `src/components/whatsapp` | WhatsApp-specific forms, TemplateGallery, WebhookSetupCallout, BroadcastSafetyCheck, DemoBanner |
| `src/db` | Drizzle schema, lazy DB connection (`getDb()`) |
| `src/lib/datastore` | Configs only — `DataStore` interface, `LocalStore` (IndexedDB) and `RemoteStore` (Postgres) |
| `src/lib/stores/local` | Domain stores for contacts, inbox, broadcasts, schedule, flows — all IndexedDB |
| `src/lib/crypto.ts` | Web Crypto AES-256-GCM (browser) |
| `src/lib/encryption.ts` | Node crypto AES-256-GCM (server) |
| `src/lib/whatsapp.ts` | Typed client for graph.facebook.com (messagesApi, templatesApi, analyticsApi, etc.) |
| `src/lib/session-mode.tsx` | Local vs authenticated mode context via `useSyncExternalStore` |
| `src/lib/template-presets.ts` | 10 Meta-approved template starters |
| `src/lib/demo-seed.ts` | Seeded fake data for demo mode |
| `src/hooks/use-local-storage.tsx` | `useSyncExternalStore`-based storage reads (avoids setState-in-effect) |

## Agent instructions

See [AGENTS.md](AGENTS.md) for hard rules, architecture constraints, and Next.js 16.2 conventions used here. Linked from there: [ARCHITECTURE.md](ARCHITECTURE.md), [SECURITY.md](SECURITY.md), [MIGRATION.md](MIGRATION.md).
