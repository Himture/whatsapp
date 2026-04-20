import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Pages that don't require any session. Everything else (the dashboard + API
// explorer routes) is gated below. Local mode has no server session, so a
// client-set `session-mode=local` cookie is an accepted signal too.
const PUBLIC_PATHS = new Set(["/", "/login", "/signup", "/pricing", "/privacy", "/terms"]);

function buildCsp(nonce: string, isDev: boolean): string {
  return [
    "default-src 'self'",
    // nonce + strict-dynamic: modern browsers enforce the nonce and ignore the
    // 'unsafe-inline'/https: fallback (kept only for legacy browsers that don't
    // support strict-dynamic). Dev adds 'unsafe-eval' for React's dev tooling.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' https:${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.whatsapp.net https://pps.whatsapp.net https://scontent.whatsapp.net",
    "font-src 'self' data:",
    `connect-src 'self' https://graph.facebook.com https://lookaside.fbsbx.com${isDev ? " ws: http://localhost:* http://127.0.0.1:*" : ""}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

export function middleware(request: NextRequest): NextResponse {
  const isDev = process.env.NODE_ENV !== "production";
  const { pathname } = request.nextUrl;

  // Route guard — keep unauthenticated visitors out of app pages. Skip API routes
  // (each already enforces requireUserId) and the public marketing/auth pages.
  const isPublic = PUBLIC_PATHS.has(pathname) || pathname.startsWith("/api");
  if (!isPublic) {
    const localMode = request.cookies.get("session-mode")?.value === "local";
    const hasSession = Boolean(getSessionCookie(request));
    if (!localMode && !hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // Per-request CSP nonce. crypto.getRandomValues + btoa are available on the edge
  // runtime (Buffer is not, reliably).
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const nonce = btoa(binary);
  const csp = buildCsp(nonce, isDev);

  // Set CSP on the request headers so Next.js can read the nonce and stamp it onto
  // its own framework scripts, and on the response so the browser enforces it.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Run on everything except Next internals and static asset files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
