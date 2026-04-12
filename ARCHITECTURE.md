# Architecture

A short tour of how the pieces fit together. Read this once before diving into the code.

## The core idea

This app is a browser-first client for the WhatsApp Cloud API. Everything that matters happens in the user's browser:

- **WhatsApp API calls** go from the browser directly to `graph.facebook.com`. The server never proxies these requests, so your access token never leaves your machine.
- **Config storage** defaults to IndexedDB. If you opt into an account, it mirrors to Postgres.
- **Encryption** happens before writes. Tokens are AES-256-GCM encrypted at rest — client-side with Web Crypto for local mode, server-side with Node crypto for cloud mode.

The server exists for two optional things: authentication (Better Auth) and cloud sync (a handful of server actions that wrap Drizzle queries). Both are skippable.

## Two modes

The `session-mode` context (`src/lib/session-mode.tsx`) tracks which mode the user is in:

| Mode | How you get there | Data store |
|------|------------------|------------|
| `local` | "Continue without account" button | IndexedDB via `LocalStore` |
| `authenticated` | Email/password or OAuth sign-in | Postgres via `RemoteStore` (server actions) |
| `none` | Signed out | — |

Mode is persisted in `localStorage` so the dashboard layout can decide what to do on page load.

## The DataStore abstraction

`src/lib/datastore/types.ts` defines a `DataStore` interface with five methods: `getConfigs`, `createConfig`, `updateConfig`, `deleteConfig`, `setDefaultConfig`.

Two implementations:

- **`LocalStore`** uses [`idb`](https://github.com/jakearchibald/idb) to talk to IndexedDB. It encrypts tokens with Web Crypto before writing and decrypts on read.
- **`RemoteStore`** wraps the server actions in `src/app/(dashboard)/settings/actions.ts`. Those actions check the session, encrypt with Node crypto, and hit Postgres via Drizzle.

Consumers never construct these directly. They call `getDataStore(mode)` from `src/lib/datastore/index.ts`, which returns a cached singleton for the current mode.

The `WhatsAppConfigProvider` in `src/hooks/use-whatsapp-config.tsx` reads the current mode, picks the right store, loads configs, and exposes them through React context. Every form in the dashboard consumes this context.

## Encryption

Two implementations of the same algorithm:

- `src/lib/crypto.ts` — Web Crypto API (browser)
- `src/lib/encryption.ts` — Node `crypto` module (server)

Both use AES-256-GCM. Both produce the same `iv:authTag:ciphertext` hex format, so a value encrypted on one side can't be decrypted on the other (different keys) but the format is consistent for debugging.

Local mode auto-generates a 256-bit key and stores it in a separate IndexedDB database called `whatsapp-keyring`. Users can optionally switch to a passphrase-derived key (PBKDF2, 600,000 iterations). Cloud mode derives its key from the `ENCRYPTION_KEY` env var via scrypt.

## Lazy DB / Auth

`src/db/index.ts` exports `getDb()` — not a `db` constant. Calling it for the first time creates the connection pool; calling it without `DATABASE_URL` throws a clear error.

`src/lib/auth.ts` does the same thing with `getAuth()`.

This matters because local mode users don't have a database. If the DB connection were created at import time, the entire app would crash on start.

## Dashboard layout

`src/app/(dashboard)/layout.tsx` is a minimal wrapper. All the real logic lives in `src/components/dashboard/dashboard-shell.tsx`:

1. `SessionModeProvider` exposes the current mode (from localStorage).
2. `AuthGate` reads the mode:
   - `local` → render children
   - `authenticated` → verify session via Better Auth's `useSession`, redirect if expired
   - `none` → redirect to `/login`
3. `WhatsAppConfigProvider` loads configs from whichever store matches the mode.
4. `Sidebar` + `Header` render the shell.

## The WhatsApp client

`src/lib/whatsapp.ts` is a typed wrapper around `graph.facebook.com`. It's grouped by resource (`messagesApi`, `mediaApi`, `phoneNumbersApi`, etc.) and every method returns an `ApiCallResult<T>` with `ok`, `status`, `data`, and `duration`.

Callers check `result.ok` — not `result.status`. Meta's API sometimes returns a 200 with an error body.

## Request history

`src/hooks/use-request-history.tsx` stores the last 50 API calls in `localStorage` and exposes them to the history page. Entries are recorded manually by individual forms today. Future work: wrap `graphFetch` to record everything automatically.

## What's not here

- No server-side WhatsApp API proxy.
- No background sync job. Cloud sync is manual (button in Settings).
- No webhook receiver. The `/webhooks` page is currently informational only — adding a receiver for incoming messages is the next major feature.
