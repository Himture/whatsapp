# Security

## Reporting a vulnerability

If you find a security issue in this project, please email **security@himture.dev** with the details. Include reproduction steps and the affected version. We acknowledge within 48 hours and aim to patch critical issues within 7 days.

Please do not open a public GitHub issue for security reports.

## Supported versions

Security fixes are applied to the latest `main` branch. Tagged releases receive backports only for the most recent minor version.

## Threat model

This project is a browser-first client for the WhatsApp Cloud API. A few deliberate security properties:

- WhatsApp API calls go from the browser directly to `graph.facebook.com`. The server never proxies these. An attacker compromising our server cannot read your messages.
- Access tokens are encrypted at rest with AES-256-GCM. Browser-side with Web Crypto in local mode. Server-side with Node `crypto` in cloud mode.
- The incoming webhook receiver verifies `X-Hub-Signature-256` using your stored app secret when configured.

## What we consider in scope

- Authentication bypass
- Authorization flaws (one user reading another's data)
- Cross-site scripting, CSRF, SQL injection
- Sensitive data exposure in logs or error messages
- Webhook signature bypass
- Encryption key handling

## What is out of scope

- Vulnerabilities in third-party services (Meta, Vercel, Neon, Better Auth) — report those to the respective vendor
- Self-inflicted issues on self-hosted deployments (weak `ENCRYPTION_KEY`, exposed `DATABASE_URL`)
- Denial-of-service against a user's own WhatsApp account by sending too many messages
- Social engineering

## Hardening posture

Defensive measures shipped in the codebase:

- **Authentication** — Better Auth 1.6 with the `nextCookies()` plugin for correct RSC vs server-action cookie semantics. All session checks go through a single `requireUserId()` helper in `src/lib/auth.ts` so every server action's first line is unmistakable.
- **Authorization** — Every server action calls a typed ownership assertion from `src/lib/authz.ts` (`assertOwnsConfig`, `assertOwnsBroadcastRecipient`, etc.) before touching nested resources. There is no path that mutates user-owned data without an `eq(table.userId, userId)` filter or an explicit join through one.
- **Encryption at rest** — `accessToken` and `appSecret` are encrypted via AES-256-GCM. Server-side: Node `crypto` with a scrypt-derived key from `ENCRYPTION_KEY` (required to be at least 32 characters). Browser-side (local mode): Web Crypto with a per-install random key stored in IndexedDB. (A PBKDF2 passphrase-wrap of that key exists in `src/lib/crypto.ts` but is not yet surfaced in the UI.)
- **Webhook integrity** — `X-Hub-Signature-256` is verified using `timingSafeEqual` against the stored `appSecret`. **Without an app secret, all webhook side-effects (event storage, message ingestion, auto-reply dispatch) are skipped** — the endpoint still 200s so Meta's hub.challenge keeps working, but no untrusted data is persisted. The `hub.verify_token` GET handshake also uses `timingSafeEqual`.
- **Rate limiting** — Webhook POSTs are rate-limited per `configId` (200/min) via an in-memory token bucket in `src/lib/rate-limit.ts`. Payloads above 1 MiB are rejected with 413.
- **Input validation** — All server-action inputs and the webhook payload are parsed through Zod schemas in `src/lib/validation.ts` before reaching any DB query. UUIDs, hex colors, and E.164 phone numbers each have their own schema. ESLint `no-explicit-any` plus TypeScript strict mode means no untyped escape hatches.
- **HTTP security headers** — Set in `next.config.ts`: strict CSP (no `unsafe-eval`, frame-ancestors `'none'`, connect-src restricted to `graph.facebook.com` and `lookaside.fbsbx.com`), HSTS (2 years, includeSubDomains, preload), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, restrictive `Permissions-Policy`, `Cross-Origin-Opener-Policy: same-origin`.
- **CSRF / origin** — Server actions are protected by Next.js's built-in action-token CSRF defense. Better Auth's `trustedOrigins` is configurable via the `BETTER_AUTH_TRUSTED_ORIGINS` env var.
- **Output safety** — All user-controlled values are rendered through React JSX (escaped). The codebase contains zero `dangerouslySetInnerHTML`, `innerHTML`, or `eval`. The single user-controlled CSS value (`brandColor`) is hex-validated server-side and again on render.
- **Session cookies** — Better Auth defaults: HttpOnly, Secure (in production), SameSite=Lax. Sessions expire after 7 days with sliding refresh.
- **Error handling** — Server actions return generic error strings to clients; full error details only go to server logs. Webhook handler logs configId on errors but never request bodies.

### Known limitations

- **Rate limit is in-memory.** It survives within a warm serverless function but resets on cold start. For multi-region deployments at scale, swap `src/lib/rate-limit.ts` for an Upstash- or Redis-backed implementation; the function signature is stable.
- **Self-hosted misconfiguration.** A weak `ENCRYPTION_KEY` or exposed `DATABASE_URL` is the deployer's responsibility. Use long, randomly generated values (`openssl rand -hex 32` for both).
- **Browser-side accessToken.** In the zero-markup architecture the access token is decrypted in the browser to sign requests to Meta. A compromised browser extension with IndexedDB access can read it. Mitigation: use a System User Access Token scoped only to messaging.

## Disclosure

We publish a security advisory on GitHub after the issue is fixed and most users have received the update. Credit is given to the reporter unless anonymity is requested.
