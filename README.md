# WhatsApp Cloud API Manager

A browser-based UI for the [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api). Works with zero setup — no database, no account, no backend. Every endpoint from the [official Postman collection](https://www.postman.com/meta/whatsapp-business-platform/) is wired up to a form.

## Why

The Cloud API is easy to use, but debugging it is not. Most people end up in Postman with 70+ saved requests and a cluttered environment. This is that, but built-in. Drop in your access token, pick a phone number ID, start sending messages.

Your tokens never leave your machine. API calls go from the browser directly to `graph.facebook.com`.

## Quick start

```bash
git clone https://github.com/yourusername/whatsapp.git
cd whatsapp
pnpm install
pnpm dev
```

Open `http://localhost:3000`, click **Continue without account**. You're in.

## Optional: cloud sync

If you want to sync configs across devices (or run this as a hosted service for a team), add a PostgreSQL database:

```bash
cp .env.example .env.local
# fill in DATABASE_URL, BETTER_AUTH_SECRET, ENCRYPTION_KEY
pnpm db:push
pnpm dev
```

Works with Neon, Supabase, Railway, or any Postgres. The connection string is the only thing that changes.

## What's covered

Every endpoint in the official Postman collection, organized into pages:

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

## Stack

- Next.js 16 (App Router, Turbopack)
- React 19
- Tailwind CSS v4
- Drizzle ORM + PostgreSQL (optional, for cloud sync)
- Better Auth (optional, for accounts)
- IndexedDB via [`idb`](https://github.com/jakearchibald/idb) (default storage)
- Web Crypto API for client-side AES-256-GCM encryption

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

User access tokens expire in 24 hours. For anything real, generate a [System User Access Token](https://developers.facebook.com/docs/whatsapp/business-management-api/get-started#access-tokens) from Business Manager.

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for how the pieces fit together — the DataStore abstraction, the session mode context, how local and cloud modes share the same UI.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
