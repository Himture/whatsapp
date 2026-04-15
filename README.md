# WhatsApp Cloud API Manager

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE) [![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org) [![React](https://img.shields.io/badge/React-19-blue)](https://react.dev) [![TS Strict](https://img.shields.io/badge/TS-strict-blue)](https://www.typescriptlang.org)

A browser-first tool for the [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api). Zero setup required — no database, no account, no backend needed to start. Every endpoint from the [official Postman collection](https://www.postman.com/meta/whatsapp-business-platform/) is wired up, plus a full business feature suite: inbox, contacts, broadcasts, templates, flows, analytics, and more.

**For developers:** one-binary, local-first WhatsApp tool. No DB, no accounts, no telemetry. Every Cloud API endpoint behind a typed client. Self-host or build on it — MIT.

**For users:** zero per-message markup. Messages go from your browser straight to `graph.facebook.com` — your tokens never leave your machine, and we never see (or charge for) a single message.

## Why

The Cloud API is powerful but the tooling around it is not. Most people bounce between Postman, a spreadsheet of contacts, a separate broadcast tool, and a dashboard they barely understand. This replaces all of it — and unlike every other WhatsApp platform, it charges nothing per message.

## Quick start

```bash
git clone https://github.com/anthropics/whatsapp-api-manager.git
cd whatsapp-api-manager
pnpm install
pnpm dev
```

Open `http://localhost:3000`, click **Continue without account**. You're in. Everything runs locally — configs in IndexedDB, tokens encrypted with Web Crypto.

## Optional: cloud sync

To sync configs and data across devices, or to run this as a hosted service for a team:

```bash
cp .env.example .env.local
# fill in DATABASE_URL, BETTER_AUTH_SECRET, ENCRYPTION_KEY
pnpm db:push
pnpm dev
```

Works with Neon, Supabase, Railway, or any Postgres. The connection string is the only thing that changes.

## What's covered

### Business features

| Page | What it does |
|------|--------------|
| Workspaces | Agency home — grid of all WhatsApp configs with per-workspace stats, click to switch |
| Inbox | Receive messages via webhook, conversation threads, inline reply (with optimistic updates) |
| Contacts | Add, import CSV, tag, manage opt-outs, create lists/segments |
| Broadcasts | Bulk send to contacts or lists, configurable rate limiting, pause/resume, pre-send safety check |
| Templates | List, create, preview, delete; 10 pre-built presets for common use cases |
| Flows | Auto-reply rules — keyword match, greeting, first message, any message |
| Schedule | Queue messages for future delivery |
| Analytics | Delivery rates with industry benchmarks, broadcast performance, daily volume charts |
| QR Codes | Generate click-to-chat QR codes with optional pre-filled message |

### API explorer

Every endpoint in the official Postman collection:

| Page | What it does |
|------|--------------|
| Messages | Text, media, templates, interactive, location, contacts, reactions, products |
| Media | Upload, retrieve URL, delete, download |
| Phone Numbers | List, verify, request codes, display name status |
| Business Profile | View, update, upload profile picture |
| Registration | Register / deregister a phone number |
| Two-Step Verification | Set verification PIN |
| WABAs | List shared accounts, manage subscriptions, override callback URL |
| Payments | Order details and order status (SG + IN) |
| Compliance | India-based compliance info |
| Migration | Migrate from on-premises |
| History | Browse recent requests with full request/response |

Every page links to the official WhatsApp docs and the Postman collection for cross-reference.

## Webhook setup

To use the inbox, analytics, and auto-reply features, point your WhatsApp webhook to:

```
https://your-domain.com/api/webhooks/{configId}
```

Your verify token and callback URL are shown in Settings next to each configuration. The webhook receiver verifies `X-Hub-Signature-256` if you store your app secret.

## Stack

- Next.js 16 (App Router, Turbopack)
- React 19
- Tailwind CSS v4
- Drizzle ORM + PostgreSQL (optional, for cloud sync)
- Better Auth (optional, for accounts)
- IndexedDB via [`idb`](https://github.com/jakearchibald/idb) (default storage)
- Web Crypto API for client-side AES-256-GCM encryption
- recharts (analytics charts, dynamically imported)

## Environment variables

All optional — the app runs without any of these. Needed only if you enable cloud sync.

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Session signing key — generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Application base URL (e.g. `http://localhost:3000`) |
| `ENCRYPTION_KEY` | Server-side token encryption key — generate with `openssl rand -hex 32` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth (optional) |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth (optional) |

## Docker

```bash
docker compose up                              # Local dev with Postgres
docker build -t whatsapp-manager .             # Production image
docker run -p 3000:3000 --env-file .env.local whatsapp-manager
```

## Getting your credentials from Meta

1. Create an app at [developers.facebook.com](https://developers.facebook.com)
2. Add the WhatsApp product
3. Go to **WhatsApp → Getting Started** — copy the Access Token, Phone Number ID, and WABA ID
4. Paste them into the Settings page

User access tokens expire in 24 hours. For production use, generate a [System User Access Token](https://developers.facebook.com/docs/whatsapp/business-management-api/get-started#access-tokens) from Business Manager.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for how the pieces fit together — the DataStore abstraction, domain stores, session mode context, webhook receiver, and broadcast engine.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
