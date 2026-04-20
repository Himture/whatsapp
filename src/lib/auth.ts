import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { getDb } from "@/db";

async function deliverVerificationEmail(to: string, url: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
      to,
      subject: "Verify your email",
      text: `Confirm your email address to finish creating your account:\n\n${url}`,
    }),
  });
}

function createAuth() {
  // Fail fast if the session-signing secret is missing — otherwise Better Auth
  // falls back to an insecure default and session cookies become forgeable.
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "BETTER_AUTH_SECRET is not set. Generate one with `openssl rand -base64 32` and add it to your environment.",
    );
  }
  // Email verification is only enforced when an email provider is configured;
  // without one, requiring it would dead-end signup.
  const emailProviderConfigured = Boolean(process.env.RESEND_API_KEY);
  return betterAuth({
    database: drizzleAdapter(getDb(), { provider: "pg" }),
    secret,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      requireEmailVerification: emailProviderConfigured,
    },
    emailVerification: emailProviderConfigured
      ? {
          sendOnSignUp: true,
          sendVerificationEmail: async ({ user, url }) => {
            await deliverVerificationEmail(user.email, url);
          },
        }
      : undefined,
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID ?? "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        enabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID ?? "",
        clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
        enabled: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS
      ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",").map((o) => o.trim())
      : [],
    // Throttle credential endpoints to blunt brute-force / credential-stuffing.
    rateLimit: {
      enabled: true,
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60, max: 5 },
      },
    },
    plugins: [nextCookies()],
  });
}

type AuthInstance = ReturnType<typeof createAuth>;

let authInstance: AuthInstance | null = null;

export function getAuth(): AuthInstance {
  if (!authInstance) {
    authInstance = createAuth();
  }
  return authInstance;
}

type SessionData = AuthInstance["$Infer"]["Session"];

async function getOptionalSession(): Promise<SessionData | null> {
  return getAuth().api.getSession({ headers: await headers() });
}

async function requireSession(): Promise<SessionData> {
  const session = await getOptionalSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireUserId(): Promise<string> {
  const { user } = await requireSession();
  return user.id;
}
