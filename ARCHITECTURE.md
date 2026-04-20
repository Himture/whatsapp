# Architecture

A short tour of how the pieces fit together. Read this once before diving into the code.

## The core idea

This app is a browser-first client for the WhatsApp Cloud API. Everything that matters happens in the user's browser:

- **WhatsApp API calls** go from the browser directly to `graph.facebook.com`. The server never proxies these requests, so your access token never leaves your machine.
- **Config storage** defaults to IndexedDB. If you opt into an account, it mirrors to Postgres.
- **Encryption** happens before writes. Tokens are AES-256-GCM encrypted at rest — client-side with Web Crypto for local mode, server-side with Node crypto for cloud mode.

The server exists for three optional things: authentication (Better Auth), cloud sync (server actions wrapping Drizzle queries), and the webhook receiver. All three are skippable for local use.

## Two modes

The `session-mode` context (`src/lib/session-mode.tsx`) tracks which mode the user is in:

| Mode | How you get there | Data store |
|------|------------------|------------|
| `local` | "Continue without account" button | IndexedDB via `LocalStore` |
| `authenticated` | Email/password or OAuth sign-in | Postgres via `RemoteStore` (server actions) |
| `none` | Signed out | — |

Mode is persisted in `localStorage` so the dashboard layout can decide what to do on page load. `useSyncExternalStore` with a server snapshot of `"loading"` prevents hydration mismatches from reading `localStorage` during SSR.

## The DataStore abstraction

`src/lib/datastore/types.ts` defines a `DataStore` interface with five methods: `getConfigs`, `createConfig`, `updateConfig`, `deleteConfig`, `setDefaultConfig`.

Two implementations:

- **`LocalStore`** uses [`idb`](https://github.com/jakearchibald/idb) to talk to IndexedDB. It encrypts tokens with Web Crypto before writing and decrypts on read.
- **`RemoteStore`** wraps the server actions in `src/app/(dashboard)/settings/actions.ts`. Those actions check the session, encrypt with Node crypto, and hit Postgres via Drizzle.

Consumers never construct these directly. They call `getDataStore(mode)` from `src/lib/datastore/index.ts`, which returns a cached singleton for the current mode.

The `WhatsAppConfigProvider` in `src/hooks/use-whatsapp-config.tsx` reads the current mode, picks the right store, loads configs, and exposes them through React context. Every form in the dashboard consumes this context.

## Business feature stores

Beyond config management, the app has five domain stores in `src/lib/stores/`:

| Store | IndexedDB object stores | What it holds |
|-------|------------------------|---------------|
| `LocalContactStore` | contacts, contactLists, contactListMembers | Contacts and list segments |
| `LocalInboxStore` | webhookEvents, receivedMessages, messageStatuses | Incoming messages and delivery receipts |
| `LocalBroadcastStore` | broadcasts, broadcastRecipients | Bulk send campaigns and per-recipient state |
| `LocalScheduleStore` | scheduledMessages | Future-dated messages |
| `LocalFlowStore` | autoReplyRules | Keyword and trigger-based auto-reply rules |

Each store has a factory function (`getContactStore`, `getInboxStore`, etc.) in `src/lib/stores/index.ts`. The pattern mirrors the config DataStore — local or remote mode, same interface, consumers don't care which.

All five stores share a single IndexedDB database (`whatsapp-api-manager`, version 2). The upgrade function in `src/lib/stores/local/db.ts` handles both fresh installs and upgrades from version 1 (configs only).

> **Status note:** Today, only `DataStore` (configs) has both a local and a remote implementation. The five business stores listed above have local implementations only — the factory accepts a `_mode` arg for forward compatibility but always returns the local IndexedDB store. The corresponding server action files at `src/app/(dashboard)/{contacts,broadcasts,schedule,flows,inbox}/actions.ts` already exist and are fully authorized + Zod-validated; they're consumed today only by the webhook receiver (`findMatchingRule` in `flows/match.ts`). Wrapping them as `RemoteContactStore`, `RemoteBroadcastStore`, etc. is a deliberate next step — it changes the cloud-mode performance story (round-trips per query) and so is gated on customer demand.

## Encryption

Two implementations of the same algorithm:

- `src/lib/crypto.ts` — Web Crypto API (browser)
- `src/lib/encryption.ts` — Node `crypto` module (server)

Both use AES-256-GCM. Both produce the same `iv:authTag:ciphertext` hex format. Web Crypto appends the 16-byte auth tag to the ciphertext buffer — the implementation slices it off explicitly to match the server-side format.

Local mode auto-generates a 256-bit key and stores it in a separate IndexedDB database called `whatsapp-keyring`. (A PBKDF2 passphrase-wrap of that key, 600,000 iterations, is implemented in `crypto.ts` but is not yet wired into the UI.) Cloud mode derives its key from the `ENCRYPTION_KEY` env var via scrypt, requiring at least 32 characters.

## Lazy DB / Auth

`src/db/index.ts` exports `getDb()` — not a `db` constant. Calling it for the first time creates the connection pool; calling it without `DATABASE_URL` throws a clear error.

`src/lib/auth.ts` does the same thing with `getAuth()`.

This matters because local mode users don't have a database. If the DB connection were created at import time, the entire app would crash on start.

## Dashboard layout

`src/app/(dashboard)/layout.tsx` is a minimal wrapper. All the real logic lives in `src/components/dashboard/dashboard-shell.tsx`:

1. `SessionModeProvider` exposes the current mode (from localStorage via `useSyncExternalStore`).
2. `AuthGate` reads the mode:
   - `loading` → render nothing (waiting for hydration)
   - `local` → render children directly
   - `authenticated` → verify session via `AuthenticatedGate`, redirect if expired
   - `none` → redirect to `/login`
3. `WhatsAppConfigProvider` loads configs from whichever store matches the mode.
4. `Sidebar` + `Header` render the shell. `useSession()` only mounts inside `AuthenticatedGate` and `AuthenticatedEmail` — never in local mode, so the `/api/auth/get-session` endpoint is never called for local users.

## The WhatsApp client

`src/lib/whatsapp.ts` is a typed wrapper around `graph.facebook.com`. It's grouped by resource:

| Export | Coverage |
|--------|----------|
| `messagesApi` | Text, media, template, interactive, location, contacts, reaction, mark-read, products |
| `mediaApi` | Upload, retrieve URL, delete, download |
| `phoneNumbersApi` | List, get, request/verify codes, display name status |
| `businessProfileApi` | Get/update profile, upload picture |
| `registrationApi` | Register / deregister |
| `twoStepVerificationApi` | Set PIN |
| `wabaApi` | Shared WABAs, subscribe/unsubscribe, override callback URL, get templates |
| `templatesApi` | List, create, update, delete by name, get by ID |
| `analyticsApi` | Conversation analytics, phone number analytics |
| `paymentsApi` | Order details and status (SG + IN) |
| `complianceApi` | Get / add compliance info |
| `migrationApi` | Migrate phone numbers |

Every method returns `ApiCallResult<T>` with `ok`, `status`, `data`, and `duration`. Callers check `result.ok` — Meta's API sometimes returns a 200 status with an error body.

## Webhook receiver

`src/app/api/webhooks/[configId]/route.ts` receives events from Meta.

- **GET**: Handles Meta's hub challenge — verifies the `hub.verify_token` matches the config's stored `webhookVerifyToken`, returns `hub.challenge`.
- **POST**: Verifies `X-Hub-Signature-256` if `appSecret` is configured, then uses `after()` from `next/server` to process the payload after the 200 response is sent. Meta requires acknowledgement within 20 seconds; `after()` ensures processing completes even in serverless environments.

Processing pipeline (per payload):
1. Store raw event in `webhookEvent` for the event explorer.
2. Batch-deduplicate incoming message IDs with a single `inArray` query.
3. Build a `contactsByWaId` Map once (O(1) lookups per message sender).
4. Insert new `receivedMessage` rows.
5. Match against enabled `autoReplyRule` rows and send auto-replies via `sendAutoReply`.
6. Insert `messageStatus` rows for delivery receipts.

Each WhatsApp config gets a unique webhook URL: `/api/webhooks/{configId}`. The verify token is generated on config creation and shown in Settings with a copy button.

## Broadcast engine

Broadcasts run client-side for both local and cloud modes. The `BroadcastsPage` holds the send loop:

1. Fetch all pending/failed recipients for the broadcast.
2. For each recipient, dispatch either `messagesApi.sendText` or `messagesApi.sendTemplate` based on `broadcast.messageType`.
3. Update per-recipient status in the store after each send.
4. Wait `broadcast.rateLimitMs` between sends (default 100ms = 10 msg/s, configurable to 50/200/500ms).
5. Update broadcast aggregate counts in real time.
6. Support pause (cancel flag on a ref) and resume (re-run from pending/failed).

Rate options stay well under Meta's Cloud API throughput (~80 messages/second per number by default, upgradable to 1,000 on request). Conservative defaults protect phone number quality ratings.

## Request history

`src/hooks/use-request-history.tsx` stores the last 50 API calls in `localStorage` using lazy `useState` initialization. Entries are recorded manually by individual forms and surfaced on the History page. (The analytics page does not read this store — its delivery stats come solely from recorded message-status events.)

## Database schema

Eleven tables beyond the Better Auth tables:

| Table | Purpose |
|-------|---------|
| `whatsapp_config` | API credentials per user, with `webhookVerifyToken` and optional `appSecret` |
| `contact` | Contact records with tags, opt-out tracking, E.164 phone |
| `contact_list` | Named segments |
| `contact_list_member` | Junction table (composite PK) |
| `webhook_event` | Raw Meta webhook payloads |
| `received_message` | Parsed incoming messages, deduplicated by `waMessageId` |
| `message_status` | Delivery receipts (sent/delivered/read/failed) |
| `broadcast` | Campaign metadata, counters, rate limit setting |
| `broadcast_recipient` | Per-contact send state within a broadcast |
| `scheduled_message` | Future-dated message payloads |
| `auto_reply_rule` | Trigger/match/response rules, priority-ordered |

## Marketing site

`src/app/(marketing)/` — public-facing surface, server components where possible.

- `/` — local-first landing: hero + `FeatureGrid` + a "why local-first" section + an honest "inbound needs a deployed webhook" note
- `/pricing` — self-host (free) vs optional managed-hosting cards, plus FAQ
- `/privacy`, `/terms` — static content

`FeatureGrid` (`src/components/marketing/feature-grid.tsx`) is the only shared marketing component.

## Workspaces

`src/app/(dashboard)/workspaces/page.tsx` — grid of all configs with per-workspace stats (unread inbox, running broadcasts, 7-day event volume). Click a card to set it as the active config and route to the dashboard. Aggregate totals shown when more than one workspace exists.

Optional branding fields on `whatsapp_config`: `displayName` and `brandColor`, used by the workspace card and surfaced in Settings to tell numbers apart.

## Onboarding & polish features

- **Demo mode** — `src/lib/demo-seed.ts` seeds IndexedDB with fake contacts, conversations, broadcast, and auto-reply rules. "Try demo" button on login. `DemoBanner` at the top of dashboard shell; "Exit demo" clears and signs out.
- **First-run wizard** — `src/components/onboarding/first-run-wizard.tsx`. Five-step checklist on dashboard home. Auto-detects progress by reading configs/contacts/rules/messages. Dismissible.
- **Template gallery** — `src/lib/template-presets.ts` defines 10 Meta-approved templates. `TemplateGallery` component renders them above the create form; clicking fills the form.
- **Broadcast safety check** — `BroadcastSafetyCheck` modal blocks broadcasts over 100 recipients until user confirms. Runs E.164 validation, duplicate detection, send-time warning, cost estimate.
- **Webhook setup callout** — `WebhookSetupCallout` component with copy-buttons for URL and verify token. Reused in settings (inline) and one-time callouts (dismissible).
- **Analytics benchmarks** — `INDUSTRY_BENCHMARKS` constant feeds delivery/read rate reference values into the analytics KPI cards.

## What's planned but not yet built

- **Embedded Signup OAuth flow** — UI will replace manual token copy-paste. Requires Meta Tech Provider app approval first. Both paths will coexist: OAuth (recommended) and manual entry (power-user fallback).
- **Full workspace isolation** — current workspaces are a UX layer over the existing multi-config architecture. A future rewrite adds `workspaceId` to all 9 business tables, per-workspace user invites, and cross-workspace permission boundaries. Planned if full multi-tenant isolation becomes necessary.
- **DB retention cron** — managed hosting can prune old webhook events and broadcast history on a schedule (deployment-specific: Vercel Cron, Neon scheduled queries). Self-host keeps everything by default.
